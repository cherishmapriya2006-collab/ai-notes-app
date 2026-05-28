import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, User, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await signup(form.name, form.email, form.password);
      toast.success("Account created!");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Glow Pad</h1>
        </div>
        <h2 className="text-xl font-semibold mb-1">Create your account</h2>
        <p className="text-slate-400 mb-6">Free forever. Your notes stay encrypted.</p>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input className="input pl-10" placeholder="Full name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input className="input pl-10" type="email" placeholder="Email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input className="input pl-10" type="password" placeholder="Password (min 6 chars)"
              value={form.password} minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
</motion.div>
    </div>
  );
}
