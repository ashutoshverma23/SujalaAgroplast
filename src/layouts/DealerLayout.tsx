import { useState, useEffect } from "react";
import Profile from "../pages/dealer/Profile";
import Products from "../pages/dealer/Products";
import Orders from "../pages/dealer/Orders";
import Cart from "../pages/dealer/Cart";
import Notifications from "../pages/dealer/Notifications";
import { UserCircle, Menu, X, Sprout, UserCircle as UserCircleIcon, PackageSearch, ShoppingCart, PackageCheck, Bell, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from '../config';

type DealerPage = "PROFILE" | "PRODUCTS" | "CART" | "ORDERS" | "NOTIFICATIONS";

const menuItems: { label: string; key: DealerPage; icon: any }[] = [
  { label: "My Profile", key: "PROFILE", icon: UserCircleIcon },
  { label: "Products", key: "PRODUCTS", icon: PackageSearch },
  { label: "Shopping Cart", key: "CART", icon: ShoppingCart },
  { label: "My Orders", key: "ORDERS", icon: PackageCheck },
  { label: "Notifications", key: "NOTIFICATIONS", icon: Bell },
];

export default function DealerLayout() {
  const [page, setPage] = useState<DealerPage>(() => {
    return (localStorage.getItem("dealerPage") as DealerPage) || "PROFILE";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("dealerPage", page);
  }, [page]);
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch cart count on mount, on page change, and every 30 s
  const fetchCartCount = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCartCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {}
  };

  const fetchNotifCount = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((n: any) => n.isRead === 'false').length;
        setNotifCount(unread);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCartCount();
    fetchNotifCount();
    const id = setInterval(() => {
      fetchCartCount();
      fetchNotifCount();
    }, 30000);
    return () => clearInterval(id);
  }, [page]); // re-run when navigating (e.g. after checkout empties cart)

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleNav = (p: DealerPage) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case "PROFILE": return <Profile />;
      case "PRODUCTS": return <Products onCartChange={fetchCartCount} />;
      case "CART": return <Cart setPage={setPage} />;
      case "ORDERS": return <Orders />;
      case "NOTIFICATIONS": return <Notifications />;
      default: return <Profile />;
    }
  };

  const pageLabel = page.charAt(0) + page.slice(1).toLowerCase().replace("_", " ");

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0 w-72 bg-emerald-900 text-white flex-col shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-emerald-800/50">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <Sprout size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">SUJALA</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Dealer Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = page === item.key;
            return (
              <motion.button
                key={item.key}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-emerald-300/70 hover:bg-emerald-800/50 hover:text-white"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-white" : "text-emerald-500/50 group-hover:text-emerald-400"} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div layoutId="dealer-active-pill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                )}
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
              <div className="p-6 flex items-center justify-between border-b border-emerald-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <Sprout size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black leading-none">SUJALA</h1>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Dealer Portal</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-emerald-400 hover:bg-emerald-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
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
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Cart icon with item count badge */}
            <button
              onClick={() => setPage("CART")}
              className="relative p-2.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              title="Shopping Cart"
            >
              <ShoppingCart size={18} className="text-gray-500 group-hover:text-emerald-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Notification icon */}
            <button
              onClick={() => setPage("NOTIFICATIONS")}
              className="relative p-2.5 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
              title="Notifications"
            >
              <Bell size={18} className="text-gray-500 group-hover:text-emerald-600 transition-colors" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-red-500/30">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            <div 
              className="text-right hidden sm:block cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setPage("PROFILE")}
            >
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Dealer</p>
            </div>
            <button 
              onClick={() => setPage("PROFILE")}
              className="p-1 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors"
              title="My Profile"
            >
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