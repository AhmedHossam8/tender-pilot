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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
