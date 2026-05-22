// ============================================================
// Hermes Chat — Avatar Component
// Renders a circular avatar with an optional image, a text
// fallback (initials), and an online-status indicator dot.
// ============================================================

import React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

interface AvatarProps {
  /** Image URL. If provided, the image is shown; otherwise initials are used. */
  src?: string;
  /** Fallback text shown when src is missing (usually initials). */
  alt?: string;
  /** Whether to show the online status dot (green). Default false. */
  online?: boolean;
  /** Size in pixels. Default 40. */
  size?: number;
  /** Optional extra className for the wrapper. */
  className?: string;
}

/**
 * Extracts up to two initials from a name string (e.g. "Hermes Bot" → "HB").
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${'00000'.slice(c.length)}${c}`;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  online = false,
  size = 40,
  className = '',
}) => {
  return (
    <Box
      className={`relative inline-flex flex-shrink-0 ${className}`}
      sx={{ width: size, height: size }}
    >
      <MuiAvatar
        src={src}
        alt={alt}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          bgcolor: src ? undefined : stringToColor(alt || '?'),
        }}
      >
        {!src ? getInitials(alt || '?') : undefined}
      </MuiAvatar>

      {online && (
        <Box
          className="absolute rounded-full border-2 border-white dark:border-gray-800"
          sx={{
            width: size * 0.3,
            height: size * 0.3,
            bgcolor: '#4caf50',
            bottom: 0,
            right: 0,
          }}
        />
      )}
    </Box>
  );
};

export default Avatar;
