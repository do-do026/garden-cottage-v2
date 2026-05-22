// ============================================================
// Hermes Chat — InfoCard Component
// Renders a general-purpose info card with title, optional
// image, and body text. Body text is sanitised via DOMPurify
// against the ALLOWED_HTML_TAGS whitelist.
// ============================================================

import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DOMPurify from 'dompurify';
import { ALLOWED_HTML_TAGS } from '@shared/constants';

interface InfoCardProps {
  data: { title: string; body: string; imageUrl?: string };
}

const InfoCard: React.FC<InfoCardProps> = ({ data }) => {
  const { title, body, imageUrl } = data;

  const sanitizedBody = useMemo(() => {
    return DOMPurify.sanitize(body, {
      ALLOWED_TAGS: [...ALLOWED_HTML_TAGS],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [body]);

  return (
    <Card
      sx={{
        maxWidth: 450,
        borderRadius: 3,
        boxShadow: 3,
        overflow: 'hidden',
      }}
    >
      {/* Optional header image */}
      {imageUrl && (
        <CardMedia
          component="img"
          height="180"
          image={imageUrl}
          alt={title}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent>
        {/* Title */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="h6" component="span" fontSize="1.5rem">
            ℹ️
          </Typography>
          <Typography variant="h6" component="h3" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {/* Sanitised HTML body */}
        <Box
          className="info-card-body"
          component="div"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          sx={{
            color: 'text.primary',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            '& a': { color: 'primary.main', textDecoration: 'underline' },
            '& ul, & ol': { paddingLeft: '1.5rem', margin: '0.25rem 0' },
            '& li': { marginBottom: '0.15rem' },
            '& p': { margin: '0.25rem 0' },
            '& h3, & h4': { fontWeight: 600, margin: '0.5rem 0 0.25rem' },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default InfoCard;
