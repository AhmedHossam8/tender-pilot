import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

/**
 * DashboardCard Component (UI library version)
 * Reusable card for displaying statistics and metrics
 */
const DashboardCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection = 'up',
  color = 'blue',
  onClick
}) => {
  // Define trend colors based on theme
  const trendColor = trendDirection === 'up' ? 'text-green-300' : 'text-red-300';

  const iconBgClass = {
    blue: 'bg-blue-500/20 text-blue-300',
    green: 'bg-green-500/20 text-green-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    purple: 'bg-purple-500/20 text-purple-300',
    red: 'bg-red-500/20 text-red-300',
    indigo: 'bg-indigo-500/20 text-indigo-300',
  }[color] || 'bg-blue-500/20 text-blue-300';

  const TrendIcon = () => {
    if (!trend) return null;

    return trendDirection === 'up' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  };

  return (
    <Card
      onClick={onClick}
      className={`hover:shadow-lg transition-shadow cursor-pointer`}
    >
      <CardContent className="flex items-start justify-between gap-4">
        {/* Left Section */}
        <div className="flex-1">
          <p className="text-md font-medium mt-5 text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-gray-400">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}

        {trend && (
          <div
            className={`flex items-center gap-2 mt-2 px-2 py-1 rounded-full text-sm font-medium ${
              trendDirection === 'up'
                ? 'bg-green-500/10 text-green-300'
                : 'bg-red-500/10 text-red-300'
            }`}
          >
            <TrendIcon />
            <span className={trendColor}>{trend}</span>
          </div>
        )}
        </div>

        {/* Right Icon */}
        {icon && <div className={`p-3 rounded-lg ${iconBgClass}`}>{icon}</div>}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
