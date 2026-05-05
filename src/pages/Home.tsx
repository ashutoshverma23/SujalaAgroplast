import { useState } from "react";
import RoleSelector from "../components/Role";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import type { Role } from "../constants/Role";
import { motion } from "framer-motion";
import { Sprout, Leaf, ShieldCheck, TrendingUp } from "lucide-react";
import Footer from "../components/Footer";
// import { div } from "framer-motion/client";

export default function Home() {
  const [role, setRole] = useState<Role>("ADMIN");
  const [isLogin, setIsLogin] = useState(true);

  // If role changes to ADMIN, always show Login form
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === "ADMIN") {
      setIsLogin(true);
    }
  };

  return (
    <div>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        
        {/* Left Side: Brand & Value Prop */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left space-y-8 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 text-emerald-700 rounded-full text-sm font-bold tracking-wide mb-2">
            <Sprout size={16} />
            <span>ESTABLISHED 1998</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-black text-emerald-900 leading-[1.1] tracking-tight">
              Sujala <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">
                Agro Plasts
              </span>
            </h1>
            <p className="text-xl text-emerald-800/70 font-medium max-w-md mx-auto lg:mx-0">
              Pioneering sustainable irrigation and plastic solutions for the future of global agriculture.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-4">
            {[
              { icon: Leaf, label: "Eco Friendly", color: "bg-green-100 text-green-600" },
              { icon: ShieldCheck, label: "ISO Certified", color: "bg-emerald-100 text-emerald-600" },
              { icon: TrendingUp, label: "Max Yield", color: "bg-lime-100 text-lime-600" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center lg:items-start gap-2"
              >
                <div className={`p-2.5 sm:p-3 rounded-2xl ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <span className="text-sm font-bold text-emerald-900/60 uppercase tracking-tighter">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(16,185,129,0.15)] rounded-[2.5rem] p-10 border border-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
            
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome back
                </h2>
                <p className="text-gray-500 mt-2 font-medium">Select your portal to sign in</p>
              </div>

              <RoleSelector role={role} setRole={handleRoleChange} />

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-bold tracking-[0.2em]">{isLogin ? "Authentication" : "Registration"}</span>
                </div>
              </div>

              {isLogin ? (
                <LoginForm role={role} onSwitchToRegister={() => setIsLogin(false)} />
              ) : (
                <RegisterForm role={role} onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </div>
          </div>

          
        </motion.div>

      </div>
      </div>
          <Footer/>
    </div>
  );
}