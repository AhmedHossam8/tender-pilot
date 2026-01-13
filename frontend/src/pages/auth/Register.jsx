import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    user_type: "client", // default to client
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // clear field error on change
    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await register(form);
      toast.success(t('auth.success.accountCreated'));
      navigate("/app", { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        setErrors(data);
      } else {
        toast.error(t('auth.errors.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    {
      value: "client",
      label: t('auth.userType.client'),
      description: t('auth.userType.clientDesc'),
      icon: "👤",
    },
    {
      value: "provider",
      label: t('auth.userType.provider'),
      description: t('auth.userType.providerDesc'),
      icon: "💼",
    },
    {
      value: "both",
      label: t('auth.userType.both'),
      description: t('auth.userType.bothDesc'),
      icon: "🤝",
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 p-1">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">{t('auth.createAccount')}</h1>
        <p className="text-sm text-slate-300">
          {t('auth.createAccountSubtitle', 'Join as a client or provider to get started.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Type Selection */}
        <div>
          <Label className="mb-2 block">
            {t('auth.userType.title')}
          </Label>
          <div className="grid grid-cols-1 gap-3">
            {userTypes.map((type) => (
              <label
                key={type.value}
                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  form.user_type === type.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <input
                  type="radio"
                  name="user_type"
                  value={type.value}
                  checked={form.user_type === type.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white">{type.label}</div>
                    <div className="text-sm text-slate-300 mt-1">{type.description}</div>
                  </div>
                  {form.user_type === type.value && (
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </label>
            ))}
          </div>
          {errors.user_type && (
            <p className="text-sm text-red-400 mt-1">{errors.user_type[0]}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Input
            id="full_name"
            name="full_name"
            placeholder={t('auth.fullName')}
            className="pt-2 pb-2"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          {errors.full_name && (
            <p className="text-sm text-red-400 mt-1">{errors.full_name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('auth.email')}
            className="pt-2 pb-2"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-400 mt-1">{errors.email[0]}</p>
          )}
        </div>

        {/* Password with Reveal */}
        <div className="space-y-2 relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t('auth.password')}
            className="pt-2 pb-2 pr-10"
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
          {errors.password && (
            <p className="text-sm text-red-400 mt-1">{errors.password[0]}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? t('auth.registering') : t('auth.register')}
        </Button>
      </form>

      <p className="text-sm text-center text-slate-300">
        {t('auth.alreadyHaveAccount')}{" "}
        <Link to="/login" className="text-blue-300 underline hover:no-underline focus:outline-none">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
