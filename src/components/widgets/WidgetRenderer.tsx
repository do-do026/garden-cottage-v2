// ============================================================
// Hermes Chat — WidgetRenderer Component
// Dispatcher that reads message.metadata.widget.template and
// routes to the correct widget component. Currently only
// supports 'poll', but extensible for future widget types.
// ============================================================

import React from 'react';
import Typography from '@mui/material/Typography';
import PollWidget from './PollWidget';
import type { Message, WidgetTemplate } from '@shared/types';

interface WidgetRendererProps {
  message: Message;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ message }) => {
  const widgetMeta = message.metadata.widget;
  if (!widgetMeta) {
    return (
      <Typography variant="body2" color="error">
        ⚠️ Missing widget metadata
      </Typography>
    );
  }

  const template = widgetMeta.template as WidgetTemplate;

  switch (template) {
    case 'poll':
      return <PollWidget message={message} />;

    default:
      return (
        <Typography variant="body2" color="text.secondary">
          🧩 Unknown widget template: {template}
        </Typography>
      );
  }
};

export default WidgetRenderer;
