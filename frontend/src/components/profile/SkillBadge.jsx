import React from 'react';
import { Badge } from '../ui';
import { X } from 'lucide-react';

/**
 * SkillBadge Component
 * Displays a skill tag/badge with optional remove button
 */
const SkillBadge = ({ skill, variant = 'default', size = 'md', onRemove }) => {
  // Map custom variants to ui Badge variants
  const variantMap = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    info: 'info',
    gray: 'secondary',
  };

  return (
    <Badge
      variant={variantMap[variant] || 'default'}
      size={size}
      className="inline-flex items-center gap-1 transition-all"
    >
      <span>{typeof skill === 'string' ? skill : skill?.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/10 dark:hover:bg-white/20 transition-colors"
          aria-label="Remove skill"
        >
          <X className="w-3 h-3 text-white/80" />
        </button>
      )}
    </Badge>
  );
};

export default SkillBadge;
