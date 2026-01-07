/**
 * ReviewSummary Component
 * Display aggregated review statistics with rating distribution
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp } from 'lucide-react';
import StarRating from './StarRating';
import reviewService from '@/services/review.service';

export default function ReviewSummary({ userId, className = '' }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await reviewService.getReviewSummary(userId);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching review summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchSummary();
    }
  }, [userId]);
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-48 ${className}`} />
    );
  }
  
  if (!summary || summary.total_reviews === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center ${className}`}>
        <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-400">
          {t('reviews.no_reviews', 'No reviews yet')}
        </p>
      </div>
    );
  }
  
  const { average_rating, total_reviews, rating_distribution } = summary;
  
  // Calculate percentage for each rating
  const getPercentage = (count) => {
    return total_reviews > 0 ? (count / total_reviews) * 100 : 0;
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('reviews.summary.title', 'Reviews & Ratings')}
        </h3>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('reviews.summary.excellent', 'Excellent')}
          </span>
        </div>
      </div>
      
      {/* Average Rating Section */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {average_rating.toFixed(1)}
          </div>
          <StarRating rating={Math.round(average_rating)} size="md" interactive={false} />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('reviews.summary.based_on', '{{count}} reviews', { count: total_reviews })}
          </p>
        </div>
        
        {/* Rating Distribution Bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = rating_distribution[rating] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
                
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Quality Indicators */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {rating_distribution[5] || 0}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t('reviews.summary.five_star', '5-Star')}
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round((average_rating / 5) * 100)}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t('reviews.summary.satisfaction', 'Satisfaction')}
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {((rating_distribution[5] || 0) + (rating_distribution[4] || 0))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {t('reviews.summary.positive', 'Positive')}
          </p>
        </div>
      </div>
    </div>
  );
}
