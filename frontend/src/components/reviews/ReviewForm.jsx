/**
 * ReviewForm Component
 * Form for submitting reviews with star rating and comment
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import StarRating from './StarRating';
import reviewService from '@/services/review.service';

export default function ReviewForm({
  revieweeId,
  revieweeName,
  projectId = null,
  bookingId = null,
  onSuccess = null,
  onCancel = null
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error(t('reviews.errors.rating_required', 'Please select a rating'));
      return;
    }
    
    if (comment.trim().length < 10) {
      toast.error(t('reviews.errors.comment_too_short', 'Please write at least 10 characters'));
      return;
    }
    
    setLoading(true);
    
    try {
      const reviewData = {
        reviewee: revieweeId,
        rating,
        comment: comment.trim(),
        is_public: isPublic
      };
      
      if (projectId) {
        reviewData.project = projectId;
      }
      if (bookingId) {
        reviewData.booking = bookingId;
      }
      
      const newReview = await reviewService.createReview(reviewData);
      
      toast.success(t('reviews.success.created', 'Review submitted successfully!'));
      
      // Reset form
      setRating(0);
      setComment('');
      setIsPublic(true);
      
      if (onSuccess) {
        onSuccess(newReview);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMsg = error.response?.data?.detail ||
        error.response?.data?.error ||
        t('reviews.errors.submit_failed', 'Failed to submit review');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        {t('reviews.form.title', 'Write a Review for {{name}}', { name: revieweeName })}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('reviews.form.rating', 'Rating')} <span className="text-red-500">*</span>
          </label>
          <StarRating
            rating={rating}
            onChange={setRating}
            size="lg"
            interactive={!loading}
          />
        </div>
        
        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('reviews.form.comment', 'Your Review')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('reviews.form.comment_placeholder', 'Share your experience working with this person...')}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
            required
            minLength={10}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {comment.length} / 500 {t('common.characters', 'characters')}
          </p>
        </div>
        
        {/* Public/Private Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                     focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="is_public" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {t('reviews.form.make_public', 'Make this review public')}
          </label>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            {loading ? t('common.submitting', 'Submitting...') : t('reviews.form.submit', 'Submit Review')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                       rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
