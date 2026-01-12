import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(form);
            toast.success(t('auth.success.welcome'));
            navigate("/app", { replace: true });
        } catch (err) {
            toast.error(
                err?.response?.data?.detail || t('auth.errors.invalidCredentials')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">{t('auth.login')}</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    name="email"
                    placeholder={t('auth.email')}
                    className="w-full border rounded px-3 py-2"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder={t('auth.password')}
                    className="w-full border rounded px-3 py-2"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2 rounded disabled:opacity-50"
                >
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                </button>
            </form>

            <div className="text-sm text-center space-y-2">
                <Link to="/forgot-password" className="text-primary underline">
                    {t('auth.forgotPassword')}
                </Link>

                <p>
                    {t('auth.noAccount')}{" "}
                    <Link to="/register" className="text-primary underline">
                        {t('auth.register')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
