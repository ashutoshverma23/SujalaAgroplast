import { 
  UserCircle, 
  PackageSearch,
  ShoppingCart,
  PackageCheck,
  Bell,
  LogOut,
  Sprout
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

export default function DealerSidebar({
  page,
  setPage,
}: {
  page: DealerPage;
  setPage: (p: DealerPage) => void;
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-72 bg-emerald-900 text-white flex flex-col h-screen shadow-2xl relative z-20">
      <div className="p-8 flex items-center gap-3 border-b border-emerald-800/50">
        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
          <Sprout size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">SUJALA</h1>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Dealer Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
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
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-emerald-800/50">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-emerald-400 font-bold text-sm hover:bg-emerald-800/50 hover:text-red-400 transition-all duration-300">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
