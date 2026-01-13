import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MapPin } from 'lucide-react';
import { Badge, Button } from '../ui';
import SkillBadge from './SkillBadge';
import StarRating from './StarRating';

const ProviderCard = ({ provider, showFullDetails = false, onSelect }) => {
  const { t } = useTranslation();
  const {
    user_id,
    user_full_name,
    headline,
    bio,
    skills = [],
    hourly_rate,
    location,
    verified,
    ai_profile_score,
    avatar,
  } = provider;

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-card border border-muted rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

        {/* Name and Headline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {user_full_name}
            </h3>
            {verified && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t('verified', 'Verified')}
              </Badge>
            )}
          </div>
          {headline && (
            <p className="text-sm text-muted-foreground mt-1">{headline}</p>
          )}
          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{location}</span>
            </div>
          )}
        </div>

        {/* Hourly Rate */}
        {hourly_rate && (
          <div className="text-right flex-shrink-0 mt-2 sm:mt-0">
            <p className="text-2xl font-bold text-foreground">${hourly_rate}</p>
            <p className="text-xs text-muted-foreground">{t('perHour')}</p>
          </div>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className={`text-muted-foreground mb-4 ${!showFullDetails ? 'line-clamp-2' : ''}`}>
          {bio}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.slice(0, showFullDetails ? undefined : 5).map((skill) => (
            <SkillBadge key={skill.id || skill.name} skill={skill} size="sm" />
          ))}
          {!showFullDetails && skills.length > 5 && (
            <span className="text-sm text-muted-foreground">+{skills.length - 5} more</span>
          )}
        </div>
      )}

      {/* Profile Completeness */}
      {typeof ai_profile_score === 'number' && ai_profile_score > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('profile.completeness.title', 'Profile Completeness')}</span>
            <span className="font-medium text-foreground">{ai_profile_score}%</span>
          </div>
          <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${getScoreColor(ai_profile_score)}`}
              style={{ width: `${ai_profile_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button
          as={Link}
          to={`/profiles/${user_id}`}
          className="flex-1 text-center"
        >
          {t('viewProfile', 'View Profile')}
        </Button>

        {onSelect && (
          <Button
            variant="outline"
            onClick={() => onSelect(provider)}
            className="flex-1"
          >
            {t('select', 'Select')}
          </Button>
        )}
      </div>
    </div>
  );
};

ProviderCard.propTypes = {
  provider: PropTypes.shape({
    user_id: PropTypes.number.isRequired,
    user_full_name: PropTypes.string.isRequired,
    headline: PropTypes.string,
    bio: PropTypes.string,
    skills: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string.isRequired,
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
