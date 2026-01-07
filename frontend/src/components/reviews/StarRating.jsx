/**
 * StarRating Component
 * Reusable star rating input/display with interactive and read-only modes
 */
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  onChange = null,
  size = 'md',
  showCount = false,
  count = 0,
  interactive = true,
  className = ''
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const isInteractive = interactive && onChange !== null;
  const displayRating = hoverRating || rating;
  
  // Size configurations
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const starSize = sizeClasses[size] || sizeClasses.md;
  
  const handleClick = (value) => {
    if (isInteractive && onChange) {
      onChange(value);
    }
  };
  
  const handleMouseEnter = (value) => {
    if (isInteractive) {
      setHoverRating(value);
    }
  };
  
  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0);
    }
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={!isInteractive}
            className={`
              ${isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              transition-transform duration-150
              ${!isInteractive && 'pointer-events-none'}
            `}
            aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
          >
            <Star
              className={`
                ${starSize}
                ${value <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300 dark:text-gray-600'
                }
                transition-colors duration-150
              `}
            />
          </button>
        ))}
      </div>
      
      {showCount && count > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          ({count})
        </span>
      )}
      
      {isInteractive && displayRating > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {displayRating}/5
        </span>
      )}
    </div>
  );
}
