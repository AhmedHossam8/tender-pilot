import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../contexts/authStore';
import ProfileService from '../../services/profile.service';
import SkillBadge from '../../components/profile/SkillBadge';
import { toast } from 'sonner';

/**
 * EditProfilePage
 * Page for editing current user's profile
 */
const EditProfilePage = () => {
  const { user, userType, profile, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [formData, setFormData] = useState({
    bio: '',
    headline: '',
    hourly_rate: '',
    location: '',
    portfolio_url: '',
    languages: [],
  });
  const [newLanguage, setNewLanguage] = useState('');

  // Load profile data and skills
  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      // Load available skills
      const skillsRes = await ProfileService.getSkills();
      setSkills(skillsRes.data);

      // Load current profile
      if (profile) {
        setFormData({
          bio: profile.bio || '',
          headline: profile.headline || '',
          hourly_rate: profile.hourly_rate || '',
          location: profile.location || '',
          portfolio_url: profile.portfolio_url || '',
          languages: profile.languages || [],
        });
        setSelectedSkills(profile.skills || []);
      } else {
        // Fetch profile if not in store
        const profileRes = await ProfileService.getMyProfile();
        setFormData({
          bio: profileRes.data.bio || '',
          headline: profileRes.data.headline || '',
          hourly_rate: profileRes.data.hourly_rate || '',
          location: profileRes.data.location || '',
          portfolio_url: profileRes.data.portfolio_url || '',
          languages: profileRes.data.languages || [],
        });
        setSelectedSkills(profileRes.data.skills || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSkillToggle = (skill) => {
    const isSelected = selectedSkills.some((s) => s.id === skill.id);
    if (isSelected) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        skill_ids: selectedSkills.map((s) => s.id),
      };

      const response = await ProfileService.updateMyProfile(payload);
      updateProfile(response.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isProvider = userType === 'provider' || userType === 'both';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Headline
            </label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleInputChange}
              placeholder="e.g., Full-Stack Developer | React & Node.js Expert"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio / About Me
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell clients about yourself, your experience, and what makes you unique..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills ({selectedSkills.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedSkills.some((s) => s.id === skill.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Selected:</span>
                {selectedSkills.map((skill) => (
                  <SkillBadge
                    key={skill.id}
                    skill={skill}
                    size="sm"
                    onRemove={() => handleSkillToggle(skill)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hourly Rate (for providers) */}
          {isProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (USD)
              </label>
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., San Francisco, USA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                placeholder="e.g., English"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang) => (
                <SkillBadge
                  key={lang}
                  skill={lang}
                  variant="gray"
                  size="sm"
                  onRemove={() => handleRemoveLanguage(lang)}
                />
              ))}
            </div>
          </div>

          {/* Portfolio URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio / Website URL
            </label>
            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleInputChange}
              placeholder="https://yourportfolio.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
