import { useState, useRef, useEffect } from "react";
import { type Role, ROLES } from "../constants/Role";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, UserCircle } from "lucide-react";

export default function RoleSelector({
  role,
  setRole,
}: {
  role: Role;
  setRole: (r: Role) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-6 relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-emerald-800 ml-1 mb-2">
        Select Access Level
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 border border-emerald-100 rounded-2xl bg-white shadow-sm hover:border-emerald-300 transition-all duration-300 outline-none group ${
          isOpen ? "ring-4 ring-emerald-500/10 border-emerald-500" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
            <UserCircle size={18} className="text-emerald-600" />
          </div>
          <span className="font-semibold text-gray-700 tracking-wide">{role}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "circOut" }}
        >
          <ChevronDown size={20} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-2xl shadow-2xl shadow-emerald-200/50 overflow-hidden py-1"
          >
            {ROLES.map((r) => (
              <motion.button
                key={r}
                whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setRole(r);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                  role === r ? "text-emerald-700 bg-emerald-50/50" : "text-gray-600 hover:text-emerald-600"
                }`}
              >
                <span className="tracking-wide">{r}</span>
                {role === r && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-600 bg-emerald-100 p-0.5 rounded-full"
                  >
                    <Check size={14} strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}