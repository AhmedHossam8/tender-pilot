import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProfileService from '../../services/profile.service';
import SkillBadge from '../../components/profile/SkillBadge';
import { toast } from 'sonner';
import ReviewSummary from '../../components/reviews/ReviewSummary';
import ReviewList from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';
import reviewService from '../../services/review.service';
import { useAuthStore } from '../../contexts/authStore';

/**
 * PublicProfilePage
 * View public profile of any user
 */
const PublicProfilePage = () => {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // about, reviews

  useEffect(() => {
    loadProfile();
    loadReviews();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const profileRes = await ProfileService.getPublicProfile(userId);
      setProfile(profileRes.data);

      // Load stats based on user type
      const userType = profileRes.data.user_type;
      if (userType === 'provider' || userType === 'both') {
        const statsRes = await ProfileService.getProviderStats(userId);
        setStats(statsRes.data);
      } else if (userType === 'client') {
        const statsRes = await ProfileService.getClientStats(userId);
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await reviewService.getReviews({ reviewee: userId });
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const handleReviewSuccess = (newReview) => {
    setReviews([newReview, ...reviews]);
    setShowReviewForm(false);
    toast.success('Review submitted successfully!');
  };
  
  const isOwnProfile = user?.id === parseInt(userId);
  const canLeaveReview = user && !isOwnProfile;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
        </div>
      </div>
    );
  }

  const isProvider = profile.user_type === 'provider' || profile.user_type === 'both';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.user_full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-100">
                  {profile.user_full_name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Name and Verification */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.user_full_name}
                </h1>
                {profile.verified && (
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    title="Verified"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {profile.headline && (
                <p className="text-gray-600">{profile.headline}</p>
              )}
            </div>

            {/* Location */}
            {profile.location && (
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{profile.location}</span>
              </div>
            )}

            {/* Hourly Rate */}
            {isProvider && profile.hourly_rate && (
              <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  ${profile.hourly_rate}
                </p>
                <p className="text-sm text-gray-600">per hour</p>
              </div>
            )}

            {/* Profile Score */}
            {profile.ai_profile_score > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Profile Completeness</span>
                  <span className="font-medium text-gray-900">
                    {profile.ai_profile_score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${profile.ai_profile_score}%` }}
                  />
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <SkillBadge key={lang} skill={lang} variant="gray" size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Link */}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('about')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>
          
          {/* About Tab */}
          {activeTab === 'about' && (
            <>
              {/* Bio */}
              {profile.bio && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <SkillBadge key={skill.id} skill={skill} />
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              {stats && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {isProvider ? (
                      <>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.completed_projects}
                          </p>
                          <p className="text-sm text-gray-600">Completed Projects</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.active_bids}
                          </p>
                          <p className="text-sm text-gray-600">Active Bids</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.total_services}
                          </p>
                          <p className="text-sm text-gray-600">Services Offered</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.posted_projects}
                          </p>
                          <p className="text-sm text-gray-600">Posted Projects</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.active_projects}
                          </p>
                          <p className="text-sm text-gray-600">Active Projects</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">
                            {stats.total_bookings}
                          </p>
                          <p className="text-sm text-gray-600">Total Bookings</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <>
              {/* Review Summary */}
              <ReviewSummary userId={userId} />
              
              {/* Leave Review Button */}
              {canLeaveReview && !showReviewForm && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              )}
              
              {/* Review Form */}
              {showReviewForm && (
                <ReviewForm
                  revieweeId={parseInt(userId)}
                  revieweeName={profile.user_full_name}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}
              
              {/* Reviews List */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Reviews</h2>
                <ReviewList reviews={reviews} loading={reviewsLoading} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
