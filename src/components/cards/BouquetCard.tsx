// ============================================================
// Hermes Chat — BouquetCard Component
// Displays a floral bouquet card with title, material chips,
// and an optional personal note. Uses MUI Card.
// ============================================================

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

interface BouquetCardProps {
  data: { title: string; materials: string[]; note?: string };
}

/** Pleasant colour palette for material chips. */
const CHIP_COLORS: string[] = [
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ff9800',
];

const BouquetCard: React.FC<BouquetCardProps> = ({ data }) => {
  const { title, materials, note } = data;

  return (
    <Card
      sx={{
        maxWidth: 400,
        borderRadius: 3,
        boxShadow: 3,
        background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8f5e9 100%)',
      }}
    >
      <CardContent>
        {/* Header with floral emoji */}
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Typography variant="h6" component="span" fontSize="1.75rem">
            💐
          </Typography>
          <Typography variant="h6" component="h3" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {/* Material chips */}
        <Box display="flex" flexWrap="wrap" gap={0.75} mb={note ? 1.5 : 0}>
          {materials.map((material, idx) => (
            <Chip
              key={idx}
              label={material}
              size="small"
              sx={{
                backgroundColor: CHIP_COLORS[idx % CHIP_COLORS.length],
                color: '#fff',
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

        {/* Optional personal note */}
        {note && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic', mt: 0.5 }}
          >
            📝 {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BouquetCard;
