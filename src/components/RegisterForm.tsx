import { useState } from "react";
import type { Role } from "../constants/Role";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { BACKEND_URL } from '../config';

export default function RegisterForm({ role, onSwitchToLogin }: { role: Role, onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Request submitted successfully! Please wait for admin approval.");
      // Optional: Clear form
      setName("");
      setMobile("");
      setPassword("");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
          {success}
        </div>
      )}

      <div className="group">
        <label className="text-sm font-semibold text-emerald-800 ml-1 mb-1 block">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-emerald-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200"
          placeholder="Enter your full name"
        />
      </div>

      <div className="group">
        <AnimatePresence mode="wait">
          <motion.label
            key={`label-${role}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="text-sm font-semibold text-emerald-800 ml-1 mb-1 block"
          >
            {role === "DEALER" ? "Mobile Number" : "Mobile / Username"}
          </motion.label>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.input
            key={`input-${role}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            className="w-full px-4 py-2 border border-emerald-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200"
            placeholder={
              role === "DEALER" ? "Enter mobile number" : "Enter registered mobile"
            }
          />
        </AnimatePresence>
      </div>

      <div className="group">
        <label className="text-sm font-semibold text-emerald-800 ml-1 mb-1 block">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-4 pr-12 py-2 border border-emerald-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <motion.button
        key={role}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-xl mt-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all duration-200 disabled:opacity-70"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        <span>{loading ? "Submitting..." : `Request ${role} Access`}</span>
      </motion.button>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button 
            type="button" 
            onClick={onSwitchToLogin}
            className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-2"
          >
            Login here
          </button>
        </p>
      </div>
    </form>
  );
}
