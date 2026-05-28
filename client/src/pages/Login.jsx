import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!form.email) nextErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email";
    if (!form.password) nextErrors.password = "Password is required";
    else if (form.password.length < 6) nextErrors.password = "Min 6 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password, remember);
      toast.success("Welcome back!");
      nav(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-violet-600/30 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-indigo-600/30 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass rounded-3xl p-8 w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Glow Pad</h1>
        </div>

        <h2 className="text-2xl font-semibold mb-1">Welcome back</h2>
        <p className="text-slate-400 mb-6 text-sm">Sign in to continue to your workspace.</p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                className={`input pl-10 ${errors.email ? "border-red-400/60 focus:ring-red-500/50" : ""}`}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                className={`input pl-10 pr-11 ${errors.password ? "border-red-400/60 focus:ring-red-500/50" : ""}`}
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-white transition"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-500"
              />
              Remember me
            </label>
          </div>

          <button className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-violet-300 hover:text-violet-200 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}