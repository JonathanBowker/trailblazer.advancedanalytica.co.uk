import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

type EnvReader = (name: string) => string;

type SubmittedArtifact = {
  uri?: string;
  bucket?: string;
  key?: string;
};

type SubmissionNotificationParams = {
  getEnvValue: EnvReader;
  manifest: Record<string, unknown>;
  submission: Record<string, unknown>;
  submittedArtifact?: SubmittedArtifact | null;
  flowRunId?: string;
  statusUrl?: string;
};

type SubmissionNotificationResult = {
  status: 'sent' | 'skipped' | 'failed';
  message: string;
  messageId?: string;
  recipients?: string[];
  reason?: string;
};

const defaultRecipients = ['jonathan@advancedanalytica.co.uk', 'claire.wadham@advancedanalytica.co.uk'];

function truthy(value: string) {
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function parseEmailList(value: string) {
  return value
    .split(/[,\s;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getNestedString(source: Record<string, unknown>, ...path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current.trim() : '';
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlLink(url: string, label = url) {
  const safeUrl = htmlEscape(url);
  return `<a href="${safeUrl}" style="color:#14b8a6;text-decoration:underline;text-underline-offset:3px;">${htmlEscape(label)}</a>`;
}

function buildPublicStatusUrl(statusUrl: string, getEnvValue: EnvReader) {
  if (!statusUrl) return '';
  if (/^https?:\/\//i.test(statusUrl)) return statusUrl;

  const base =
    getEnvValue('PREFECT_TRIGGER_PUBLIC_URL') ||
    getEnvValue('PREFECT_TRIGGER_API_URL') ||
    getEnvValue('PUBLIC_PREFECT_TRIGGER_API_URL');
  return base ? `${base.replace(/\/+$/, '')}/${statusUrl.replace(/^\/+/, '')}` : statusUrl;
}

function buildPrefectRunLogsUrl(flowRunId: string, statusUrl: string, getEnvValue: EnvReader) {
  if (!flowRunId) return buildPublicStatusUrl(statusUrl, getEnvValue);

  const explicitBase =
    getEnvValue('PREFECT_UI_PUBLIC_URL') ||
    getEnvValue('PUBLIC_PREFECT_UI_URL') ||
    getEnvValue('PREFECT_PUBLIC_URL');
  const triggerBase =
    getEnvValue('PREFECT_TRIGGER_PUBLIC_URL') ||
    getEnvValue('PREFECT_TRIGGER_API_URL') ||
    getEnvValue('PUBLIC_PREFECT_TRIGGER_API_URL');
  const base = explicitBase || derivePrefectUiBase(triggerBase);

  if (!base) return buildPublicStatusUrl(statusUrl, getEnvValue);
  return `${base.replace(/\/+$/, '')}/v2/runs/flow-run/${encodeURIComponent(flowRunId)}?tab=Logs`;
}

function derivePrefectUiBase(triggerBase: string) {
  if (!triggerBase) return '';

  try {
    const parsed = new URL(triggerBase);
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    if (parsed.port === '8080') parsed.port = '4200';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function renderAaSubmissionHtml({
  submitterName,
  submitterEmail,
  company,
  fileName,
  storageUri,
  flowRunId,
  statusUrl,
}: {
  submitterName: string;
  submitterEmail: string;
  company: string;
  fileName: string;
  storageUri: string;
  flowRunId: string;
  statusUrl: string;
}) {
  const rows = [
    ['Person', `${submitterName}${submitterEmail ? ` <${submitterEmail}>` : ''}`],
    ['Company', company],
    ['File', fileName],
    ...(storageUri ? [['Bucket link', storageUri]] : []),
    ...(flowRunId ? [['Prefect flow run', flowRunId]] : []),
    ...(statusUrl ? [['Prefect logs', statusUrl]] : []),
  ];

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 0 18px;">
            <tr>
              <td style="font-size:26px;line-height:1.1;color:#17213a;font-weight:800;letter-spacing:-0.02em;">Advanced Analytica</td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#0b0e14;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:38px 38px 30px;text-align:left;">
                <div style="margin:0 0 18px;font-size:12px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:#14b8a6;font-weight:800;">Document received</div>
                <h1 style="margin:0 0 16px;font-size:32px;line-height:1.12;color:#ffffff;font-weight:850;letter-spacing:-0.02em;">A new document is ready for processing.</h1>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#b8c4d6;">The submitted asset has been uploaded to the submitted-artifacts bucket and queued for the compliance workflow.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
                  ${rows
                    .map(([label, value]) => {
                      const renderedValue = label === 'Prefect logs' && statusUrl
                        ? htmlLink(statusUrl, 'Open Prefect logs')
                        : label === 'Bucket link'
                          ? `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;overflow-wrap:anywhere;">${htmlEscape(value)}</span>`
                          : htmlEscape(value);
                      return `<tr>
                        <th align="left" style="width:150px;padding:13px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#7dd3fc;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:0.08em;">${htmlEscape(label)}</th>
                        <td style="padding:13px 14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#eef2ff;font-size:14px;line-height:1.45;overflow-wrap:anywhere;">${renderedValue}</td>
                      </tr>`;
                    })
                    .join('')}
                </table>

                ${statusUrl ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
                  <tr>
                    <td bgcolor="#14b8a6" style="border-radius:12px;background:#14b8a6;">
                      <a href="${htmlEscape(statusUrl)}" style="display:inline-block;padding:14px 22px;font-size:15px;line-height:1.2;font-weight:800;color:#041014;text-decoration:none;">Open Prefect logs</a>
                    </td>
                  </tr>
                </table>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendSubmissionReceivedNotification(
  params: SubmissionNotificationParams,
): Promise<SubmissionNotificationResult> {
  const { getEnvValue } = params;
  const enabledValue = getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_ENABLED');
  if (enabledValue && !truthy(enabledValue)) {
    return { status: 'skipped', message: 'Received notification email is disabled.', reason: 'disabled' };
  }

  const fromEmail =
    getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_FROM') ||
    getEnvValue('DISNEY_RESULT_EMAIL_FROM') ||
    '';
  const accessKeyId =
    getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_AWS_ACCESS_KEY_ID') ||
    getEnvValue('DISNEY_RESULT_EMAIL_AWS_ACCESS_KEY_ID') ||
    getEnvValue('AWS_ACCESS_KEY_ID');
  const secretAccessKey =
    getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_AWS_SECRET_ACCESS_KEY') ||
    getEnvValue('DISNEY_RESULT_EMAIL_AWS_SECRET_ACCESS_KEY') ||
    getEnvValue('AWS_SECRET_ACCESS_KEY');

  if (!fromEmail || !accessKeyId || !secretAccessKey) {
    return {
      status: 'skipped',
      message: 'Received notification email skipped because SES sender or credentials are not configured.',
      reason: 'not_configured',
    };
  }

  const recipients =
    parseEmailList(getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_RECIPIENTS')).length > 0
      ? parseEmailList(getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_RECIPIENTS'))
      : defaultRecipients;
  const cc = parseEmailList(getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_CC'));
  const region =
    getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_AWS_REGION') ||
    getEnvValue('DISNEY_RESULT_EMAIL_AWS_REGION') ||
    getEnvValue('AWS_SES_REGION') ||
    getEnvValue('AWS_REGION') ||
    'eu-west-2';
  const fromName =
    getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_FROM_NAME') ||
    getEnvValue('DISNEY_RESULT_EMAIL_FROM_NAME') ||
    'Advanced Analytica';

  const submitterName =
    getNestedString(params.submission, 'user', 'name') ||
    getNestedString(params.manifest, 'result_recipient', 'display_name') ||
    'Unknown submitter';
  const submitterEmail =
    getNestedString(params.submission, 'user', 'email') ||
    getNestedString(params.manifest, 'result_recipient', 'email');
  const company =
    getNestedString(params.submission, 'user', 'company') ||
    getNestedString(params.manifest, 'partner', 'name') ||
    getNestedString(params.manifest, 'account_slug') ||
    'Unknown company';
  const fileName =
    getNestedString(params.submission, 'file', 'original_name') ||
    getNestedString(params.manifest, 'source_asset', 'original_name') ||
    'Unknown file';
  const storageUri = params.submittedArtifact?.uri || '';
  const statusUrl = buildPrefectRunLogsUrl(params.flowRunId || '', params.statusUrl || '', getEnvValue);
  const subject = `Document ready for processing: ${fileName}`;

  const textLines = [
    'A new document has been uploaded to the submitted-artifacts bucket and is ready for processing.',
    '',
    `Person: ${submitterName}${submitterEmail ? ` <${submitterEmail}>` : ''}`,
    `Company: ${company}`,
    `File: ${fileName}`,
  ];
  if (storageUri) textLines.push(`Bucket link: ${storageUri}`);
  if (params.flowRunId) textLines.push(`Prefect flow run: ${params.flowRunId}`);
  if (statusUrl) textLines.push(`Prefect logs: ${statusUrl}`);
  const textBody = `${textLines.join('\n')}\n`;

  const htmlBody = renderAaSubmissionHtml({
    submitterName,
    submitterEmail,
    company,
    fileName,
    storageUri,
    flowRunId: params.flowRunId || '',
    statusUrl,
  });

  try {
    const client = new SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken: getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_AWS_SESSION_TOKEN') || getEnvValue('AWS_SESSION_TOKEN') || undefined,
      },
    });
    const response = await client.send(
      new SendEmailCommand({
        FromEmailAddress: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        Destination: {
          ToAddresses: recipients,
          CcAddresses: cc,
        },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: textBody, Charset: 'UTF-8' },
              Html: { Data: htmlBody, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );

    return {
      status: 'sent',
      message: 'Received notification email sent.',
      messageId: response.MessageId,
      recipients: [...recipients, ...cc],
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Received notification email failed.',
      recipients: [...recipients, ...cc],
    };
  }
}
