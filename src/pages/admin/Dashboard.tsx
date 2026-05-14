import { 
  Store, 
  UserRound, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  MapPin,
  Map,
  BadgeCent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const StatsCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? "text-emerald-500" : "text-rose-500"}`}>
        {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
    </div>
  </motion.div>
);

const HotSellingProducts = () => {
  const [activeTab, setActiveTab] = useState<"STATE" | "DEALER">("STATE");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDealer, setSelectedDealer] = useState<string>("ALL");

  const [stateProducts, setStateProducts] = useState<any[]>([]);
  const [dealerProducts, setDealerProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/orders/analytics/hot-selling", {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStateProducts(data.stateProducts);
          setDealerProducts(data.dealerProducts);
        }
      } catch (err) {
        console.error("Failed to fetch hot selling products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueStates = Array.from(new Set(stateProducts.map(p => p.state)));
  const uniqueDealers = Array.from(new Set(dealerProducts.map(p => p.dealer)));

  const currentData = activeTab === "STATE" 
    ? (selectedState === "ALL" ? stateProducts : stateProducts.filter(p => p.state === selectedState))
    : (selectedDealer === "ALL" ? dealerProducts : dealerProducts.filter(p => p.dealer === selectedDealer));

  return (
    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-8 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900">Hot Selling Products</h4>
            <p className="text-sm text-gray-500 font-medium mt-1">Top performing items across regions.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center p-1 bg-gray-50 rounded-xl border border-gray-100">
            <button
              onClick={() => setActiveTab("STATE")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "STATE" 
                  ? "bg-white text-emerald-700 shadow-sm border border-gray-100" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Map size={16} />
              State-wise
            </button>
            <button
              onClick={() => setActiveTab("DEALER")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "DEALER" 
                  ? "bg-white text-emerald-700 shadow-sm border border-gray-100" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store size={16} />
              Dealer-wise
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center">
          {activeTab === "STATE" ? (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium outline-none"
            >
              <option value="ALL">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium outline-none"
            >
              <option value="ALL">All Dealers</option>
              {uniqueDealers.map(dealer => (
                <option key={dealer} value={dealer}>{dealer}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${activeTab === 'STATE' ? selectedState : selectedDealer}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {currentData.length > 0 ? currentData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Package size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">{item.name}</h5>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-1">
                        {activeTab === "STATE" ? <MapPin size={12} /> : <Store size={12} />}
                        <span className="uppercase tracking-wider">{(item as any).state || (item as any).dealer}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 text-right">
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Volume</p>
                      <p className="font-bold text-gray-700">{item.sales} Units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Revenue</p>
                      <p className="font-bold text-gray-900">{item.revenue}</p>
                    </div>
                    <div className={`flex items-center justify-end w-16 text-sm font-bold ${item.trend > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {item.trend > 0 ? "+" : ""}{item.trend}%
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500 font-medium">
                  No data found for the selected filter.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Number of Dealers" 
          value="142" 
          icon={Store} 
          trend={8.5} 
          color="bg-blue-50 text-blue-600" 
        />
        <StatsCard 
          title="Registered Farmers" 
          value="8,920" 
          icon={UserRound} 
          trend={12.1} 
          color="bg-orange-50 text-orange-600" 
        />
        <StatsCard 
          title="Total Products" 
          value="58" 
          icon={Package} 
          trend={4.2} 
          color="bg-emerald-50 text-emerald-600" 
        />
        <StatsCard 
          title="Monthly Revenue" 
          value="₹4.2M" 
          icon={BadgeCent} 
          trend={14.2} 
          color="bg-purple-50 text-purple-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hot Selling Products replacing the pipeline visual */}
        <HotSellingProducts />
        
        <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-900/20 flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-bold">Quick Insights</h4>
            <p className="text-emerald-400 text-sm mt-2 font-medium">Dealer activity has increased by 20% this week in the Southern region.</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Top Store</p>
              <p className="text-lg font-bold mt-1">GreenField Agro, Hubli</p>
            </div>
            <button className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-all">
              View Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;