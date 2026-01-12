import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";

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
    <div className="w-full max-w-md mx-auto space-y-6 p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center">{t('auth.resetPassword')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t('auth.enterEmail')}
            className="w-full border rounded-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 md:py-3 rounded-lg disabled:opacity-50 transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {loading ? t('auth.sending') : t('auth.sendResetLink')}
        </button>
      </form>

      <div className="text-center">
        <Link 
          to="/login" 
          className="text-sm text-primary hover:underline focus:outline-none focus:underline"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
