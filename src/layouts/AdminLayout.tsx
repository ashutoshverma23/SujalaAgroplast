import { useState } from "react";
import Sidebar from "../components/sidebar/AdminSidebar";
import Dashboard from "../pages/admin/Dashboard";
import AdminOrders from "../pages/admin/Orders";
import Users from "../pages/admin/Users";
import Stores from "../pages/admin/Stores";
import Farmers from "../pages/admin/Farmers";
import Notifications from "../pages/admin/Notifications";
import Catalogue from "../pages/admin/Catalogue";
import { Search, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type AdminPage =
  | "DASHBOARD"
  | "ORDERS"
  | "USERS"
  | "STORES"
  | "FARMERS"
  | "CATALOGUE"
  | "NOTIFICATIONS";

export default function AdminLayout() {
  const [page, setPage] = useState<AdminPage>("DASHBOARD");

  const renderPage = () => {
    switch (page) {
      case "DASHBOARD": return <Dashboard />;
      case "ORDERS": return <AdminOrders />;
      case "USERS": return <Users />;
      case "STORES": return <Stores />;
      case "FARMERS": return <Farmers />;
      case "CATALOGUE": return <Catalogue />;
      case "NOTIFICATIONS": return <Notifications />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar page={page} setPage={setPage} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 relative z-10">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-2xl font-black text-emerald-900 tracking-tight">
              {page.charAt(0) + page.slice(1).toLowerCase().replace("_", " ")}
            </h2>
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search analytics, users..." 
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Jaydeep Singh</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Master Admin</p>
            </div>
            <button className="p-1 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors">
              <UserCircle size={40} className="text-emerald-600" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "circOut" }}
              className="max-w-7xl mx-auto"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}