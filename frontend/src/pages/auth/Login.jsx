import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);

    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(form);
            toast.success(t("auth.success.welcome"));
            navigate("/app", { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.detail || t("auth.errors.invalidCredentials"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <h1 className="text-3xl font-extrabold text-center text-gray-800">
                    {t("auth.login")}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            placeholder={t("auth.email")}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder={t("auth.password")}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t("auth.loggingIn") : t("auth.login")}
                    </button>
                </form>

                <div className="text-sm text-center space-y-2 text-gray-600">
                    <Link to="/forgot-password" className="text-primary hover:underline">
                        {t("auth.forgotPassword")}
                    </Link>

                    <p>
                        {t("auth.noAccount")}{" "}
                        <Link to="/register" className="text-primary font-medium hover:underline">
                            {t("auth.register")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
