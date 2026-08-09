import { Standard } from '@typebot.io/react';

export function TypebotStandardEmbed({ typebot, apiHost = 'https://typebot.io' }) {
  return (
    <Standard
      typebot={typebot}
      apiHost={apiHost}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
