import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable skeleton components for loading states
 */

export const CardSkeleton = ({ className }) => (
  <div className={cn("bg-white rounded-lg shadow-md p-6 animate-pulse", className)}>
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

export const StatCardSkeleton = ({ className }) => (
  <div className={cn("bg-white rounded-lg shadow-md p-6 animate-pulse", className)}>
    <div className="flex items-center justify-between mb-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export const ListItemSkeleton = ({ count = 3, className }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export const RecommendationSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="border-l-4 border-purple-400 bg-purple-50 rounded-lg p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="h-4 bg-purple-200 rounded w-2/3"></div>
          <div className="h-4 bg-purple-200 rounded w-16"></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-purple-200 rounded w-full"></div>
          <div className="h-3 bg-purple-200 rounded w-5/6"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-3 bg-purple-200 rounded w-24"></div>
          <div className="h-3 bg-purple-200 rounded w-32"></div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-6 py-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Content Sections */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardSkeleton>
        <ListItemSkeleton count={3} />
      </CardSkeleton>
      <CardSkeleton>
        <ListItemSkeleton count={3} />
      </CardSkeleton>
    </div>
  </div>
);

export const AIAnalyticsSkeleton = () => (
  <div className="space-y-6">
    {/* Header Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts and Metrics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6 h-64 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-full bg-gray-100 rounded"></div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 h-64 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-full bg-gray-100 rounded"></div>
      </div>
    </div>
  </div>
);
