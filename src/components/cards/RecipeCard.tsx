// ============================================================
// Hermes Chat — RecipeCard Component
// Displays a recipe with title, duration, compact ingredients
// list, and numbered steps in a clean MUI Card layout.
// ============================================================

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

interface RecipeCardProps {
  data: { title: string; ingredients: string[]; steps: string[]; duration: string };
}

const RecipeCard: React.FC<RecipeCardProps> = ({ data }) => {
  const { title, ingredients, steps, duration } = data;

  return (
    <Card
      sx={{
        maxWidth: 420,
        borderRadius: 3,
        boxShadow: 3,
        bgcolor: '#fffefc',
      }}
    >
      <CardContent>
        {/* Header: title + duration chip */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="span" fontSize="1.5rem">
              🍳
            </Typography>
            <Typography variant="h6" component="h3" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Chip
            icon={<span>⏱️</span>}
            label={duration}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500, borderColor: 'primary.main', color: 'primary.main' }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Ingredients */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          🛒 Ingredients
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1.5}>
          {ingredients.map((ingredient, idx) => (
            <Chip
              key={idx}
              label={ingredient}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Steps */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          📋 Steps
        </Typography>
        <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
          {steps.map((step, idx) => (
            <Typography
              key={idx}
              component="li"
              variant="body2"
              color="text.primary"
              sx={{ mb: 0.5, lineHeight: 1.5 }}
            >
              {step}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
