import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SkillBadge from './SkillBadge';

/**
 * ProviderCard Component
 * Displays provider profile information in a card format
 */
const ProviderCard = ({ provider, showFullDetails = false, onSelect }) => {
  const { t } = useTranslation();
  const {
    user_id,
    user_full_name,
    user_email,
    headline,
    bio,
    skills = [],
    hourly_rate,
    location,
    verified,
    ai_profile_score,
    avatar,
  } = provider;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={user_full_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {user_full_name?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Name and headline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user_full_name}
            </h3>
            {verified && (
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0"
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
          
          {headline && (
            <p className="text-sm text-gray-600 mt-1">{headline}</p>
          )}

          {location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Hourly Rate */}
        {hourly_rate && (
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-gray-900">${hourly_rate}</p>
            <p className="text-xs text-gray-500">{t('perHour')}</p>
          </div>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className={`text-gray-700 mb-4 ${!showFullDetails && 'line-clamp-2'}`}>
          {bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, showFullDetails ? undefined : 5).map((skill) => (
              <SkillBadge key={skill.id || skill.name} skill={skill} size="sm" />
            ))}
            {!showFullDetails && skills.length > 5 && (
              <span className="text-sm text-gray-500">+{skills.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Profile Score */}
      {ai_profile_score > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Profile Completeness</span>
            <span className="font-medium text-gray-900">{ai_profile_score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${ai_profile_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link
          to={`/profiles/${user_id}`}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
        >
          View Profile
        </Link>
        {onSelect && (
          <button
            onClick={() => onSelect(provider)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
};

ProviderCard.propTypes = {
  provider: PropTypes.shape({
    user_id: PropTypes.number.isRequired,
    user_full_name: PropTypes.string.isRequired,
    user_email: PropTypes.string,
    headline: PropTypes.string,
    bio: PropTypes.string,
    skills: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string.isRequired,
        category: PropTypes.string,
      })
    ),
    hourly_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.string,
    verified: PropTypes.bool,
    ai_profile_score: PropTypes.number,
    avatar: PropTypes.string,
  }).isRequired,
  showFullDetails: PropTypes.bool,
  onSelect: PropTypes.func,
};

export default ProviderCard;
