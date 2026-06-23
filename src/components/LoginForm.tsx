import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "../constants/Role";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { BACKEND_URL } from '../config';

export default function LoginForm({ role, onSwitchToRegister }: { role: Role, onSwitchToRegister: () => void }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Success
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate based on role
      if (role === "ADMIN") navigate("/admin");
      else if (role === "DEALER") navigate("/dealer");
      else if (role === "STAFF") navigate("/staff");
      else if (role === "ORGANIZATION") navigate("/org");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleLogin}>
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100">
          {error}
        </div>
      )}
      
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
            className="w-full px-4 py-3 border border-emerald-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200"
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
            className="w-full pl-4 pr-12 py-3 border border-emerald-100 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200"
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

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center">
          <input id="remember" type="checkbox" className="w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500" />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-500">Remember me</label>
        </div>
        <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Forgot?</a>
      </div>

      <motion.button
        key={role}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-xl mt-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all duration-200 disabled:opacity-70"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        <span>{loading ? "Signing in..." : `Login as ${role}`}</span>
      </motion.button>

      {role !== "ADMIN" && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={onSwitchToRegister}
              className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-2"
            >
              Request Access
            </button>
          </p>
        </div>
      )}
    </form>
  );
}