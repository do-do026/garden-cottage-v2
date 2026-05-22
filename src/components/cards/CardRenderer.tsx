// ============================================================
// Hermes Chat — CardRenderer Component
// Dispatcher that reads message.metadata.card.template and
// message.metadata.card.data, then routes to the correct
// card component (BouquetCard, RecipeCard, TaskCard, InfoCard).
// ============================================================

import React from 'react';
import Typography from '@mui/material/Typography';
import BouquetCard from './BouquetCard';
import RecipeCard from './RecipeCard';
import TaskCard from './TaskCard';
import InfoCard from './InfoCard';
import type { Message, CardTemplate, BouquetCardData, RecipeCardData, TaskCardData, InfoCardData } from '@shared/types';

interface CardRendererProps {
  message: Message;
}

const CardRenderer: React.FC<CardRendererProps> = ({ message }) => {
  const cardMeta = message.metadata.card;
  if (!cardMeta) {
    return (
      <Typography variant="body2" color="error">
        ⚠️ Missing card metadata
      </Typography>
    );
  }

  const template = cardMeta.template as CardTemplate;
  const data = cardMeta.data;

  switch (template) {
    case 'bouquet':
      return <BouquetCard data={data as unknown as BouquetCardData} />;

    case 'recipe':
      return <RecipeCard data={data as unknown as RecipeCardData} />;

    case 'task':
      return <TaskCard data={data as unknown as TaskCardData} />;

    case 'info':
      return <InfoCard data={data as unknown as InfoCardData} />;

    default:
      return (
        <Typography variant="body2" color="text.secondary">
          📋 Unknown card template: {template}
        </Typography>
      );
  }
};

export default CardRenderer;
