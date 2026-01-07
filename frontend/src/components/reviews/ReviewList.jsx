/**
 * ReviewList Component
 * Display list of reviews with responses, sentiment badges, and actions
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Flag, MessageCircle, Sparkles, ThumbsUp } from 'lucide-react';
import StarRating from './StarRating';
import reviewService from '@/services/review.service';
import { useAuthStore } from '@/contexts/authStore';

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
      if (onSuccess) onSuccess(response);
    } catch (error) {
      toast.error(error.response?.data?.error || t('reviews.errors.response_failed', 'Failed to post response'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-3 pl-12 space-y-3">
      {showSuggestion && aiSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{aiSuggestion}</p>
              <button
                onClick={handleUseSuggestion}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('reviews.response.use_suggestion', 'Use This Response')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder={t('reviews.response.placeholder', 'Write your response...')}
          rows={3}
          disabled={loading}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:opacity-50"
          required
          minLength={10}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGetSuggestion}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 
                     text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30
                     disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('reviews.response.get_ai_help', 'AI Help')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('common.posting', 'Posting...') : t('reviews.response.post', 'Post Response')}
          </button>
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
    if (window.confirm(t('reviews.flag.confirm', 'Are you sure you want to flag this review for moderation?'))) {
      try {
        await reviewService.flagReview(review.id);
        toast.success(t('reviews.flag.success', 'Review flagged for moderation'));
      } catch (error) {
        toast.error(t('reviews.flag.error', 'Failed to flag review'));
      }
    }
  };
  
  const getSentimentBadge = () => {
    if (!review.ai_sentiment_label) return null;
    
    const badges = {
      positive: { color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: ThumbsUp },
      neutral: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: MessageCircle },
      negative: { color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: Flag }
    };
    
    const badge = badges[review.ai_sentiment_label];
    if (!badge) return null;
    
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {t(`reviews.sentiment.${review.ai_sentiment_label}`, review.ai_sentiment_label)}
      </span>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <img
            src={review.reviewer_avatar || '/default-avatar.png'}
            alt={review.reviewer_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{review.reviewer_name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" interactive={false} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
              {getSentimentBadge()}
            </div>
          </div>
        </div>
        
        {!isReviewee && (
          <button
            onClick={handleFlag}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title={t('reviews.flag.title', 'Flag for moderation')}
          >
            <Flag className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Review Content */}
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
        {review.comment}
      </p>
      
      {/* Response Section */}
      {review.response && (
        <div className="mt-3 pl-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {review.response.responder_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(review.response.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {review.response.response_text}
          </p>
        </div>
      )}
      
      {/* Response Button/Form */}
      {canRespond && !showResponseForm && (
        <button
          onClick={() => setShowResponseForm(true)}
          className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          {t('reviews.response.button', 'Respond')}
        </button>
      )}
      
      {showResponseForm && (
        <ReviewResponseForm
          review={review}
          onSuccess={(response) => {
            setShowResponseForm(false);
            if (onResponse) onResponse(review.id, response);
          }}
        />
      )}
    </div>
  );
}

export default function ReviewList({ reviews = [], loading = false }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [reviewList, setReviewList] = useState(reviews);
  
  // Update when reviews prop changes
  useState(() => {
    setReviewList(reviews);
  }, [reviews]);
  
  const handleResponse = (reviewId, response) => {
    setReviewList(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, response }
          : review
      )
    );
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-32" />
        ))}
      </div>
    );
  }
  
  if (reviewList.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          {t('reviews.empty', 'No reviews yet')}
        </p>
      </div>
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
