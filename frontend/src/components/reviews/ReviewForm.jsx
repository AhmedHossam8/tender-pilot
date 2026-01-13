import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import StarRating from './StarRating';
import reviewService from '@/services/review.service';
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea, Badge } from '../ui';

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
        is_public: isPublic,
        ...(projectId && { project: projectId }),
        ...(bookingId && { booking: bookingId }),
      };

      const newReview = await reviewService.createReview(reviewData);
      toast.success(t('reviews.success.created', 'Review submitted successfully!'));

      // Reset form
      setRating(0);
      setComment('');
      setIsPublic(true);

      onSuccess?.(newReview);
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
    <Card className="bg-card border border-white/10 rounded-lg">
      <CardHeader>
        <CardTitle className="text-white">
          {t('reviews.form.title', 'Write a Review for {{name}}', { name: revieweeName })}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {t('reviews.form.rating', 'Rating')} <span className="text-red-500">*</span>
          </label>
          <StarRating rating={rating} onChange={setRating} size="lg" interactive={!loading} />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-white mb-2">
            {t('reviews.form.comment', 'Your Review')} <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t(
              'reviews.form.comment_placeholder',
              'Share your experience working with this person...'
            )}
            disabled={loading}
          />
          <p className="mt-1 text-xs text-white/70">
            {comment.length} / 500 {t('common.characters', 'characters')}
          </p>
        </div>

        {/* Public/Private Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border border-white/20 bg-white/5 text-primary focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="is_public" className="text-sm text-white">
            {t('reviews.form.make_public', 'Make this review public')}
          </label>
          <Badge variant="secondary">{isPublic ? t('common.public') : t('common.private')}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? t('common.submitting', 'Submitting...') : t('reviews.form.submit', 'Submit Review')}
          </Button>

          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
