import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/sidebar/AdminSidebar";
import Dashboard from "../pages/admin/Dashboard";
import AdminOrders from "../pages/admin/Orders";
import Users from "../pages/admin/Users";
import Stores from "../pages/admin/Stores";
import Farmers from "../pages/admin/Farmers";
import Notifications from "../pages/admin/Notifications";
import Catalogue from "../pages/admin/Catalogue";
import { Search, UserCircle, Bell, Menu, X, Sprout, LayoutDashboard, Users as UsersIcon, Store, UserRound, PackageSearch, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export type AdminPage =
  | "DASHBOARD"
  | "ORDERS"
  | "USERS"
  | "STORES"
  | "FARMERS"
  | "CATALOGUE"
  | "NOTIFICATIONS";

const menuItems: { label: string; key: AdminPage; icon: any }[] = [
  { label: "Dashboard", key: "DASHBOARD", icon: LayoutDashboard },
  { label: "Orders", key: "ORDERS", icon: PackageSearch },
  { label: "Product Catalogue", key: "CATALOGUE", icon: PackageSearch },
  { label: "User Management", key: "USERS", icon: UsersIcon },
  { label: "Store Details", key: "STORES", icon: Store },
  { label: "Farmer Details", key: "FARMERS", icon: UserRound },
  { label: "Notifications", key: "NOTIFICATIONS", icon: Bell },
];

export default function AdminLayout() {
  const [page, setPage] = useState<AdminPage>(() => {
    return (localStorage.getItem("adminPage") as AdminPage) || "DASHBOARD";
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("adminPage", page);
  }, [page]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/notifications", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: any) => n.isRead === 'false' || n.isRead === false).length);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const navigate_ = navigate;
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate_("/");
  };

  const handleNav = (p: AdminPage) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const pageLabel = page.charAt(0) + page.slice(1).toLowerCase().replace("_", " ");

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar page={page} setPage={setPage} />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden w-72 bg-emerald-900 text-white flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 flex items-center justify-between border-b border-emerald-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <Sprout size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black leading-none">SUJALA</h1>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Admin Portal</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-emerald-400 hover:bg-emerald-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Nav */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = page === item.key;
                  return (
                    <motion.button
                      key={item.key}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleNav(item.key)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 relative ${
                        isActive
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "text-emerald-300/70 hover:bg-emerald-800/50 hover:text-white"
                      }`}
                    >
                      <item.icon size={20} className={isActive ? "text-white" : "text-emerald-500/50"} />
                      <span className="font-bold text-sm">{item.label}</span>
                    </motion.button>
                  );
                })}
              </nav>

              <div className="p-5 border-t border-emerald-800/50">
                <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-emerald-400 font-bold text-sm hover:bg-emerald-800/50 hover:text-red-400 transition-all">
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-10 relative z-10 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <h2 className="text-lg md:text-2xl font-black text-emerald-900 tracking-tight truncate">
              {pageLabel}
            </h2>

            <div className="relative hidden md:block ml-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button
              onClick={() => setPage("NOTIFICATIONS")}
              className="relative p-2.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
            >
              <Bell size={18} className="text-gray-500 group-hover:text-emerald-600 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">Jaydeep Singh</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Master Admin</p>
            </div>
            <button className="p-1 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors">
              <UserCircle size={36} className="text-emerald-600" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-10">
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