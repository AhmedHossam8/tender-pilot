import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

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
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold text-white">
                    {t("auth.login")}
                </h1>
                <p className="text-sm text-slate-300">
                    {t("auth.loginSubtitle", "Sign in to access your dashboard and projects.")}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder={t("auth.email")}
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="space-y-2 relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={t("auth.password")}
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 -translate-y-1/2 text-slate-300 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? t("auth.loggingIn") : t("auth.login")}
                </Button>
            </form>

            <div className="text-sm text-center space-y-2 text-slate-300">
                <Link to="/forgot-password" className="text-blue-300 hover:underline">
                    {t("auth.forgotPassword")}
                </Link>

                <p>
                    {t("auth.noAccount")}{" "}
                    <Link to="/register" className="text-blue-300 font-medium hover:underline">
                        {t("auth.register")}
                    </Link>
                </p>
            </div>
        </div>
    );
}
