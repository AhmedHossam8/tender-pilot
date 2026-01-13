import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

/** Skeleton blocks with theme-aware colors */
const skeletonBase = "animate-pulse bg-muted rounded";

export const CardSkeleton = ({ className }) => (
  <Card className={cn("p-6", className)}>
    <CardContent className="space-y-4">
      <div className={cn(skeletonBase, "h-4 w-1/4")}></div>
      <div className="space-y-2">
        <div className={cn(skeletonBase, "h-3 w-full")}></div>
        <div className={cn(skeletonBase, "h-3 w-5/6")}></div>
      </div>
    </CardContent>
  </Card>
);

export const StatCardSkeleton = ({ className }) => (
  <Card className={cn("p-6", className)}>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className={cn(skeletonBase, "h-4 w-1/3")}></div>
        <div className={cn(skeletonBase, "h-8 w-8 rounded-full")}></div>
      </div>
      <div className={cn(skeletonBase, "h-8 w-1/2 mb-1")}></div>
      <div className={cn(skeletonBase, "h-3 w-2/3")}></div>
    </CardContent>
  </Card>
);

export const ListItemSkeleton = ({ count = 3, className }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="p-4">
        <CardContent className="space-y-3">
          <div className="flex justify-between items-start mb-3">
            <div className={cn(skeletonBase, "h-4 w-1/2")}></div>
            <div className={cn(skeletonBase, "h-4 w-1/6")}></div>
          </div>
          <div className="space-y-2 mb-3">
            <div className={cn(skeletonBase, "h-3 w-full")}></div>
            <div className={cn(skeletonBase, "h-3 w-4/5")}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(skeletonBase, "h-6 w-16")}></div>
            <div className={cn(skeletonBase, "h-6 w-16")}></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <table className="min-w-full divide-y divide-muted">
        <thead className="bg-muted/20">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className={cn(skeletonBase, "h-4 w-3/4")}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-muted">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className={cn(skeletonBase, "h-3 w-full")}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
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
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-6 h-64">
          <CardContent className="space-y-4">
            <div className={cn(skeletonBase, "h-4 w-1/3")}></div>
            <div className={cn(skeletonBase, "h-full w-full")}></div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Skeleton for recommendation lists (used on provider dashboard)
export const RecommendationSkeleton = ({ count = 3 }) => (
  <ListItemSkeleton count={count} />
);
