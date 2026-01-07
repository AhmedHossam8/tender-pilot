import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    user_type: "client", // NEW: default to client
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      toast.success("Account created successfully");
      navigate("/", { replace: true });
    } catch (err) {
      const data = err?.response?.data;

      if (data && typeof data === "object") {
        setErrors(data);
      } else {
        toast.error("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const userTypes = [
    {
      value: "client",
      label: "Client",
      description: "I want to hire services or post projects",
      icon: "👤",
    },
    {
      value: "provider",
      label: "Service Provider",
      description: "I want to offer my services and bid on projects",
      icon: "💼",
    },
    {
      value: "both",
      label: "Both",
      description: "I want to hire and offer services",
      icon: "🤝",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I want to join as
          </label>
          <div className="grid grid-cols-1 gap-3">
            {userTypes.map((type) => (
              <label
                key={type.value}
                className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  form.user_type === type.value
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
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
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {type.description}
                    </div>
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
            <p className="text-sm text-red-500 mt-1">
              {errors.user_type[0]}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <input
            name="full_name"
            placeholder="Full name"
            className="w-full border rounded px-3 py-2"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          {errors.full_name && (
            <p className="text-sm text-red-500 mt-1">
              {errors.full_name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">
              {errors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password[0]}
            </p>
          )}
        </div>

        <button
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>

      <p className="text-sm text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline">
          Login
        </Link>
      </p>
    </div>
  );
}
