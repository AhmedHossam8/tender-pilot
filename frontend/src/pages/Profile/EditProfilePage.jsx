import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/contexts/authStore";
import ProfileService from "@/services/profile.service";
import SkillBadge from "@/components/profile/SkillBadge";
import ProfileCompletenessWidget from "@/components/profile/ProfileCompletenessWidget";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Textarea,
  Badge,
} from "@/components/ui";

const EditProfilePage = () => {
  const { t } = useTranslation();
  const { userType, profile, updateProfile } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [newLanguage, setNewLanguage] = useState("");

  const [formData, setFormData] = useState({
    bio: "",
    headline: "",
    hourly_rate: "",
    location: "",
    portfolio_url: "",
    languages: [],
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const skillsRes = await ProfileService.getSkills();
      setSkills(Array.isArray(skillsRes.data) ? skillsRes.data : []);

      const data = profile ?? (await ProfileService.getMyProfile()).data;

      setFormData({
        bio: data.bio || "",
        headline: data.headline || "",
        hourly_rate: data.hourly_rate || "",
        location: data.location || "",
        portfolio_url: data.portfolio_url || "",
        languages: data.languages || [],
      });

      setSelectedSkills(data.skills || []);
    } catch {
      toast.error(t("profile.errors.loadFailed"));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.some((s) => s.id === skill.id)
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, skill]
    );
  };

  const handleAddLanguage = () => {
    if (newLanguage && !formData.languages.includes(newLanguage)) {
      setFormData((p) => ({
        ...p,
        languages: [...p.languages, newLanguage],
      }));
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (lang) => {
    setFormData((p) => ({
      ...p,
      languages: p.languages.filter((l) => l !== lang),
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
      const res = await ProfileService.updateMyProfile(payload);
      updateProfile(res.data);
      toast.success(t("profile.success.updated"));
    } catch {
      toast.error(t("profile.errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const isProvider = userType === "provider" || userType === "both";

  return (
    <div className="min-h-screen bg-[#101825] text-gray-300 px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-1">
          <ProfileCompletenessWidget
            score={profile?.ai_profile_score || 0}
            profile={profile}
            showSuggestions
          />
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                {t("profile.editProfile")}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">

                <Input
                  placeholder={t("profile.professionalHeadline")}
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                  className="text-gray-400"
                />

                <Textarea
                  placeholder={t("profile.bio")}
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                />

                {/* Skills */}
                <div>
                  <p className="text-sm mb-2 text-gray-300">
                    {t("profile.skills")} ({selectedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                    {skills.map((skill) => {
                      const active = selectedSkills.some((s) => s.id === skill.id);
                      return (
                        <Badge
                          key={skill.id}
                          onClick={() => handleSkillToggle(skill)}
                          className={`cursor-pointer ${active
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600"
                            }`}
                        >
                          {skill.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {isProvider && (
                  <Input
                    type="number"
                    placeholder={t("profile.hourlyRate")}
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                  />
                )}

                <Input
                  placeholder={t("profile.location")}
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />

                {/* Languages */}
                <div>
                  <p className="text-sm mb-2">{t("profile.languages")}</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder={t("profile.languagePlaceholder")}
                    />
                    <Button type="button" onClick={handleAddLanguage}>
                      {t("common.add")}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="secondary"
                        onClick={() => handleRemoveLanguage(lang)}
                        className="cursor-pointer"
                      >
                        {lang} ✕
                      </Badge>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder={t("profile.portfolioUrl")}
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t("profile.saving") : t("profile.saveProfile")}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
