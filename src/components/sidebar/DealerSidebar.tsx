import { 
  UserCircle, 
  PackageSearch,
  ShoppingCart,
  PackageCheck,
  Bell,
  LogOut,
  Sprout,
  X,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export type DealerPage = 
  | "PROFILE"
  | "PRODUCTS"
  | "CART"
  | "ORDERS"
  | "NOTIFICATIONS";

const menuItems: { label: string; key: DealerPage; icon: any }[] = [
  { label: "My Profile", key: "PROFILE", icon: UserCircle },
  { label: "Products", key: "PRODUCTS", icon: PackageSearch },
  { label: "Shopping Cart", key: "CART", icon: ShoppingCart },
  { label: "My Orders", key: "ORDERS", icon: PackageCheck },
  { label: "Notifications", key: "NOTIFICATIONS", icon: Bell },
];

function SidebarContent({
  page,
  setPage,
  onClose,
}: {
  page: DealerPage;
  setPage: (p: DealerPage) => void;
  onClose?: () => void;
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleNav = (key: DealerPage) => {
    setPage(key);
    onClose?.();
  };

  return (
    <div className="w-72 bg-emerald-900 text-white flex flex-col h-full shadow-2xl">
      <div className="p-6 flex items-center justify-between border-b border-emerald-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <Sprout size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">SUJALA</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Dealer Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-emerald-400 hover:bg-emerald-800 rounded-xl transition-colors lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = page === item.key;
          return (
            <motion.button
              key={item.key}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNav(item.key)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                isActive 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-emerald-300/70 hover:bg-emerald-800/50 hover:text-white"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-emerald-500/50 group-hover:text-emerald-400"} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="dealer-active-pill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-emerald-800/50">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-emerald-400 font-bold text-sm hover:bg-emerald-800/50 hover:text-red-400 transition-all duration-300">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default function DealerSidebar({
  page,
  setPage,
}: {
  page: DealerPage;
  setPage: (p: DealerPage) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <SidebarContent page={page} setPage={setPage} />
      </div>

      {/* Mobile hamburger trigger — rendered in layout header via export */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <SidebarContent page={page} setPage={setPage} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile trigger button — only visible on small screens, rendered inline */}
      <button
        id="dealer-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        className="hidden"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    </>
  );
}

// Separate export for the mobile trigger so DealerLayout can place it in the header
export function DealerMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 transition-all"
      aria-label="Open menu"
    >
      <Menu size={22} />
    </button>
  );
}
