/**
 * AI Loading Indicator Component
 * 
 * Shows a loading animation while AI processes requests.
 * Provides user feedback during AI operations.
 * 
 * Features:
 * - Animated AI brain icon
 * - Customizable message
 * - Pulsing animation
 * - Different sizes
 * 
 * Usage:
 * <AILoadingIndicator message="Analyzing your bid..." size="medium" />
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const AILoadingIndicator = ({ 
  message, 
  size = 'medium',
  showIcon = true 
}) => {
  const { t } = useTranslation();
  const defaultMessage = t('aiIsThinking');
  /**
   * Get size-specific classes.
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'py-2',
          icon: 'w-6 h-6',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'py-8',
          icon: 'w-16 h-16',
          text: 'text-lg'
        };
      default: // medium
        return {
          container: 'py-4',
          icon: 'w-12 h-12',
          text: 'text-base'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses.container}`}>
      {showIcon && (
        <div className="relative mb-3">
          {/* Pulsing Circle Background */}
          <div className={`absolute inset-0 ${sizeClasses.icon} bg-purple-200 rounded-full animate-ping opacity-75`}></div>
          
          {/* AI Brain Icon */}
          <div className={`relative ${sizeClasses.icon} bg-purple-600 rounded-full flex items-center justify-center animate-pulse`}>
            <svg 
              className="w-2/3 h-2/3 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        </div>
      )}

      {/* Loading Text */}
      <p className={`${sizeClasses.text} text-purple-700 font-medium`}>
        {message || defaultMessage}
      </p>

      {/* Animated Dots */}
      <div className="flex gap-1 mt-2">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

export default AILoadingIndicator;
