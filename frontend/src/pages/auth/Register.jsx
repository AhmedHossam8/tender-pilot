import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/contexts/authStore";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(form);
      toast.success("Account created successfully");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full name"
          className="w-full border rounded px-3 py-2"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          value={form.password}
          onChange={handleChange}
          required
        />

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
