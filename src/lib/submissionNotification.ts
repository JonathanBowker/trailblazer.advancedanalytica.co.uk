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
  messageIds?: string[];
  recipients?: string[];
  reason?: string;
};

const defaultRecipients = ['jonathan@advancedanalytica.co.uk', 'claire.wadham@advancedanalytica.co.uk'];
const defaultPrefectLinkRecipients = ['jonathan@advancedanalytica.co.uk'];

function truthy(value: string) {
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function parseEmailList(value: string) {
  return value
    .split(/[,\s;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueEmailList(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
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
  return `<a href="${safeUrl}" style="color:#ed1b2f;text-decoration:underline;text-underline-offset:3px;">${htmlEscape(label)}</a>`;
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
  submittedAt,
  storageUri,
  flowRunId,
  statusUrl,
}: {
  submitterName: string;
  submitterEmail: string;
  company: string;
  fileName: string;
  submittedAt: string;
  storageUri: string;
  flowRunId: string;
  statusUrl: string;
}) {
  const rows = [
    ['Person', `${submitterName}${submitterEmail ? ` <${submitterEmail}>` : ''}`],
    ['Company', company],
    ['File', fileName],
    ...(submittedAt ? [['Submitted', submittedAt]] : []),
    ...(storageUri ? [['Bucket link', storageUri]] : []),
    ...(flowRunId && statusUrl ? [['Prefect flow run', flowRunId]] : []),
    ...(statusUrl ? [['Status', statusUrl]] : []),
  ];

  const rowHtml = rows
    .map(([label, value]) => {
      const renderedValue = label === 'Status' && statusUrl
        ? htmlLink(statusUrl, 'Open Prefect logs')
        : htmlEscape(value);
      return `<tr>
        <th style="padding:10px 12px;text-align:left;color:#475569;border-bottom:1px solid #e2e8f0;width:150px;">${htmlEscape(label)}</th>
        <td style="padding:10px 12px;color:#0f172a;border-bottom:1px solid #e2e8f0;word-break:break-word;">${renderedValue}</td>
      </tr>`;
    })
    .join('');
  const statusButton = statusUrl
    ? `<p style="margin:24px 0 0;">
        <a href="${htmlEscape(statusUrl)}" style="display:inline-block;background:#ed1b2f;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">Open Prefect logs</a>
      </p>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="background:#ed1b2f;padding:22px 26px;color:#fff;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Advanced Analytica</p>
                <h1 style="margin:0;font-size:24px;line-height:1.2;">Document queued for processing</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 26px;">
                <p style="margin:0 0 18px;color:#334155;line-height:1.6;">A new document has been uploaded to the submitted-artifacts bucket and is ready for processing.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;">
                  ${rowHtml}
                </table>
                ${statusButton}
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
  const allRecipients = uniqueEmailList([...recipients, ...cc]);
  const prefectLinkRecipients =
    parseEmailList(getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_PREFECT_LINK_RECIPIENTS')).length > 0
      ? parseEmailList(getEnvValue('TRAILBLAZER_RECEIVED_EMAIL_PREFECT_LINK_RECIPIENTS'))
      : defaultPrefectLinkRecipients;
  const prefectLinkRecipientSet = new Set(prefectLinkRecipients);
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
  const submittedAt =
    getNestedString(params.submission, 'submitted_at') ||
    getNestedString(params.manifest, 'submitted_at');
  const storageUri = params.submittedArtifact?.uri || '';
  const prefectLogsUrl = buildPrefectRunLogsUrl(params.flowRunId || '', params.statusUrl || '', getEnvValue);
  const subject = `Document ready for processing: ${fileName}`;

  const buildTextBody = (includePrefectLink: boolean) => {
    const textLines = [
    'A new document has been uploaded to the submitted-artifacts bucket and is ready for processing.',
    '',
    `Person: ${submitterName}${submitterEmail ? ` <${submitterEmail}>` : ''}`,
    `Company: ${company}`,
    `File: ${fileName}`,
    ];
    if (submittedAt) textLines.push(`Submitted: ${submittedAt}`);
    if (storageUri) textLines.push(`Bucket link: ${storageUri}`);
    if (includePrefectLink && params.flowRunId) textLines.push(`Prefect flow run: ${params.flowRunId}`);
    if (includePrefectLink && prefectLogsUrl) textLines.push(`Status: ${prefectLogsUrl}`);
    return `${textLines.join('\n')}\n`;
  };

  const buildHtmlBody = (includePrefectLink: boolean) => renderAaSubmissionHtml({
    submitterName,
    submitterEmail,
    company,
    fileName,
    submittedAt,
    storageUri,
    flowRunId: includePrefectLink ? params.flowRunId || '' : '',
    statusUrl: includePrefectLink ? prefectLogsUrl : '',
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

    const messageIds: string[] = [];
    for (const recipient of allRecipients) {
      const includePrefectLink = prefectLinkRecipientSet.has(recipient);
      const response = await client.send(
        new SendEmailCommand({
          FromEmailAddress: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
          Destination: {
            ToAddresses: [recipient],
          },
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Text: { Data: buildTextBody(includePrefectLink), Charset: 'UTF-8' },
                Html: { Data: buildHtmlBody(includePrefectLink), Charset: 'UTF-8' },
              },
            },
          },
        }),
      );
      if (response.MessageId) messageIds.push(response.MessageId);
    }

    return {
      status: 'sent',
      message: 'Received notification email sent.',
      messageId: messageIds[0],
      messageIds,
      recipients: allRecipients,
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Received notification email failed.',
      recipients: allRecipients,
    };
  }
}
