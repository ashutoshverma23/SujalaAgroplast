import { useState } from "react";
import Sidebar, { type DealerPage } from "../components/sidebar/DealerSidebar";
import Profile from "../pages/dealer/Profile";
import Products from "../pages/dealer/Products";
import Orders from "../pages/dealer/Orders";
import Cart from "../pages/dealer/Cart";
import Notifications from "../pages/dealer/Notifications";
import { UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DealerLayout() {
  const [page, setPage] = useState<DealerPage>("PROFILE");

  const renderPage = () => {
    switch (page) {
      case "PROFILE": return <Profile />;
      case "PRODUCTS": return <Products />;
      case "CART": return <Cart setPage={setPage} />;
      case "ORDERS": return <Orders />;
      case "NOTIFICATIONS": return <Notifications />;
      default: return <Profile />;
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Dealer</p>
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