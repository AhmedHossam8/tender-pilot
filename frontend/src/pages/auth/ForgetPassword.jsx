import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      toast.success(t('auth.success.resetSent'));
    } catch (err) {
      toast.error(t('auth.errors.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-1">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('auth.resetPassword')}</h1>
        <p className="text-sm text-slate-300">
          {t('auth.resetPasswordSubtitle', 'Enter your email to receive a password reset link.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="block text-sm font-medium">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t('auth.enterEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? t('auth.sending') : t('auth.sendResetLink')}
        </Button>
      </form>

      <div className="text-center">
        <Link 
          to="/login" 
          className="text-sm text-blue-300 hover:underline focus:outline-none focus:underline"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
