import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Flag, MessageCircle, Sparkles, ThumbsUp } from 'lucide-react';
import StarRating from './StarRating';
import reviewService from '@/services/review.service';
import { useAuthStore } from '@/contexts/authStore';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Textarea } from '../ui';

function ReviewResponseForm({ review, onSuccess }) {
  const { t } = useTranslation();
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const handleGetSuggestion = async () => {
    setLoading(true);
    try {
      const { suggested_response } = await reviewService.getSuggestedResponse(review.id);
      setAiSuggestion(suggested_response);
      setShowSuggestion(true);
    } catch (error) {
      toast.error(t('reviews.errors.suggestion_failed', 'Failed to get AI suggestion'));
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = () => {
    setResponseText(aiSuggestion);
    setShowSuggestion(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (responseText.trim().length < 10) {
      toast.error(t('reviews.errors.response_too_short', 'Response must be at least 10 characters'));
      return;
    }

    setLoading(true);
    try {
      const response = await reviewService.respondToReview(review.id, responseText.trim());
      toast.success(t('reviews.success.response_created', 'Response posted successfully!'));
      onSuccess?.(response);
      setResponseText('');
    } catch (error) {
      toast.error(error.response?.data?.error || t('reviews.errors.response_failed', 'Failed to post response'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pl-12 space-y-3">
      {showSuggestion && aiSuggestion && (
        <Card className="bg-primary/10 border border-primary p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-white mb-2">{aiSuggestion}</p>
              <Button variant="link" size="sm" onClick={handleUseSuggestion}>
                {t('reviews.response.use_suggestion', 'Use This Response')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder={t('reviews.response.placeholder', 'Write your response...')}
          rows={3}
          disabled={loading}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetSuggestion}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            {t('reviews.response.get_ai_help', 'AI Help')}
          </Button>

          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? t('common.posting', 'Posting...') : t('reviews.response.post', 'Post Response')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ReviewItem({ review, currentUserId, onResponse }) {
  const { t } = useTranslation();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const isReviewee = currentUserId === review.reviewee;
  const canRespond = isReviewee && !review.response;

  const handleFlag = async () => {
    if (window.confirm(t('reviews.flag.confirm', 'Are you sure you want to flag this review?'))) {
      try {
        await reviewService.flagReview(review.id);
        toast.success(t('reviews.flag.success', 'Review flagged for moderation'));
      } catch {
        toast.error(t('reviews.flag.error', 'Failed to flag review'));
      }
    }
  };

  const getSentimentBadge = () => {
    if (!review.ai_sentiment_label) return null;

    const badges = {
      positive: { color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: ThumbsUp },
      neutral: { color: 'bg-muted/10 text-muted-foreground', icon: MessageCircle },
      negative: { color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: Flag }
    };

    const badge = badges[review.ai_sentiment_label];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <Badge className={badge.color} size="sm">
        <div className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {t(`reviews.sentiment.${review.ai_sentiment_label}`, review.ai_sentiment_label)}
        </div>
      </Badge>
    );
  };

  return (
    <Card className="bg-card border border-white/10">
      <CardHeader className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <img
            src={review.reviewer_avatar || '/default-avatar.png'}
            alt={review.reviewer_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <CardTitle className="text-white font-medium">{review.reviewer_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" interactive={false} />
              <span className="text-xs text-white/70">{new Date(review.created_at).toLocaleDateString()}</span>
              {getSentimentBadge()}
            </div>
          </div>
        </div>

        {!isReviewee && (
          <Button variant="icon" onClick={handleFlag} title={t('reviews.flag.title', 'Flag review')}>
            <Flag className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-white text-sm leading-relaxed mb-3">{review.comment}</p>

        {/* Response */}
        {review.response && (
          <Card className="bg-muted/5 p-3 pl-12">
            <div className="flex items-start gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm">{review.response.responder_name}</p>
                <p className="text-xs text-white/70">{new Date(review.response.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-white text-sm leading-relaxed">{review.response.response_text}</p>
          </Card>
        )}

        {/* Respond Button/Form */}
        {canRespond && !showResponseForm && (
          <Button
            variant="link"
            size="sm"
            className="mt-3 flex items-center gap-1 text-primary"
            onClick={() => setShowResponseForm(true)}
          >
            <MessageCircle className="w-4 h-4" />
            {t('reviews.response.button', 'Respond')}
          </Button>
        )}

        {showResponseForm && (
          <ReviewResponseForm
            review={review}
            onSuccess={(response) => {
              setShowResponseForm(false);
              onResponse?.(review.id, response);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function ReviewList({ reviews = [], loading = false }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [reviewList, setReviewList] = useState(reviews);

  useEffect(() => setReviewList(reviews), [reviews]);

  const handleResponse = (reviewId, response) => {
    setReviewList(prev => prev.map(r => (r.id === reviewId ? { ...r, response } : r)));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse bg-card border border-white/10 h-32" />
        ))}
      </div>
    );
  }

  if (reviewList.length === 0) {
    return (
      <Card className="text-center py-12 bg-card border border-white/10">
        <MessageCircle className="w-12 h-12 text-white/50 mx-auto mb-3" />
        <p className="text-white/70">{t('reviews.empty', 'No reviews yet')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviewList.map(review => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={user?.id}
          onResponse={handleResponse}
        />
      ))}
    </div>
  );
}
