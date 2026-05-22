// ============================================================
// Hermes Chat — Badge Component
// Thin wrapper over MUI Badge for unread-message counts and
// status indicators.
// ============================================================

import React from 'react';
import MuiBadge from '@mui/material/Badge';

interface BadgeProps {
  /** The content displayed inside the badge (usually a number). */
  count: number;
  /** Whether to show the badge when count is zero. Default false. */
  showZero?: boolean;
  /** Maximum value to display before showing "{max}+". Default 99. */
  max?: number;
  /** The element to which the badge is attached. */
  children: React.ReactNode;
  /** Optional class name on the wrapper. */
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  showZero = false,
  max = 99,
  children,
  className = '',
}) => {
  return (
    <MuiBadge
      badgeContent={count}
      color="primary"
      max={max}
      invisible={!showZero && count === 0}
      className={className}
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.7rem',
          height: 18,
          minWidth: 18,
          padding: '0 4px',
        },
      }}
    >
      {children}
    </MuiBadge>
  );
};

export default Badge;
