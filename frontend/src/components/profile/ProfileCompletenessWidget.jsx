import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ProfileCompletenessWidget({
  score = 0,
  profile = null,
  showSuggestions = true,
  className = "",
}) {
  const { t } = useTranslation();

  /* ---------------- Status ---------------- */
  const getStatus = () => {
    if (score >= 90)
      return {
        label: t("profile.completeness.excellent", "Excellent"),
        badge: "success",
        icon: CheckCircle2,
      };
    if (score >= 70)
      return {
        label: t("profile.completeness.good", "Good"),
        badge: "primary",
        icon: CheckCircle2,
      };
    if (score >= 50)
      return {
        label: t("profile.completeness.fair", "Fair"),
        badge: "warning",
        icon: AlertCircle,
      };
    return {
      label: t("profile.completeness.poor", "Incomplete"),
      badge: "destructive",
      icon: AlertCircle,
    };
  };

  const status = getStatus();

  /* ---------------- Suggestions ---------------- */
  const getSuggestions = () => {
    if (!profile || !showSuggestions) return [];

    const s = [];

    if (!profile.bio || profile.bio.length < 50)
      s.push({ text: t("profile.suggestions.add_bio"), points: 15 });
    if (!profile.headline)
      s.push({ text: t("profile.suggestions.add_headline"), points: 10 });
    if (!profile.skills || profile.skills.length < 3)
      s.push({ text: t("profile.suggestions.add_skills"), points: 20 });
    if (!profile.avatar)
      s.push({ text: t("profile.suggestions.add_avatar"), points: 15 });
    if (!profile.location)
      s.push({ text: t("profile.suggestions.add_location"), points: 10 });
    if (!profile.languages || profile.languages.length === 0)
      s.push({ text: t("profile.suggestions.add_languages"), points: 10 });

    if (profile.user_type === "provider" || profile.user_type === "both") {
      if (!profile.hourly_rate)
        s.push({ text: t("profile.suggestions.add_rate"), points: 10 });
      if (!profile.portfolio_url)
        s.push({ text: t("profile.suggestions.add_portfolio"), points: 10 });
    }

    return s.slice(0, 3);
  };

  const suggestions = getSuggestions();

  /* ---------------- Progress Color ---------------- */
  const progressColor =
    score >= 90
      ? "bg-green-500"
      : score >= 70
        ? "bg-primary"
        : score >= 50
          ? "bg-yellow-500"
          : "bg-destructive";

  return (
    <Card className={cn("bg-[#101825] border-white/10", className)}>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {t("profile.completeness.title", "Profile Completeness")}
          </h3>

          <Badge variant={status.badge} className="flex items-center gap-1">
            <status.icon className="w-4 h-4" />
            {status.label}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">
              {t("profile.completeness.progress", "Completion")}
            </span>
            <span className="text-2xl font-bold text-white">{score}%</span>
          </div>

          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressColor
              )}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <TrendingUp className="w-4 h-4" />
              {t("profile.completeness.improve", "Ways to Improve")}
            </div>

            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    +{s.points}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{s.text}</p>
              </div>
            ))}

            {score < 100 && (
              <p className="text-xs text-slate-400">
                {t(
                  "profile.completeness.benefit",
                  "A complete profile gets 3x more visibility!"
                )}
              </p>
            )}
          </div>
        )}

        {/* Perfect */}
        {score === 100 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-sm font-medium text-green-300">
                {t(
                  "profile.completeness.perfect",
                  "Your profile is 100% complete! Great job!"
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
