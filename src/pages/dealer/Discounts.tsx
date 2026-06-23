import { useState, useEffect } from "react";
import { Loader2, Calendar, Percent, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { BACKEND_URL } from "../../config";

export default function DealerDiscounts() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem("token")}` };
      
      // Fetch KYC to get state
      const kycRes = await fetch(`${BACKEND_URL}/api/users/me/kyc`, { headers });
      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setKyc(kycData);
      }

      // Fetch active discounts (which will be filtered by state on backend)
      const discountRes = await fetch(`${BACKEND_URL}/api/discounts/active`, { headers });
      if (discountRes.ok) {
        setDiscounts(await discountRes.json());
      }
    } catch (e) {
      console.error("Error loading discounts page data:", e);
    } finally {
      setLoading(false);
    }
  };

  const isNewDiscount = (createdAt: string) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 15;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  } as const;

  return (
    <div className="space-y-8 mb-12">
      {/* State banner */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 md:p-5 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/10">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Your Registered State</h3>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{kyc?.state || "Not Registered in KYC"}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold text-emerald-700/80">Showing active offers and discounts targeted for you.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
        </div>
      ) : discounts.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {discounts.map((d) => {
            const hasNewTag = isNewDiscount(d.createdAt);
            return (
              <motion.div
                key={d.id}
                variants={itemVariants}
                className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Floating sequence pill */}
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-900 font-black text-xs rounded-xl border border-emerald-100">
                    #{d.sequence}
                  </span>
                  
                  {hasNewTag && (
                    <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md shadow-rose-500/20">
                      NEW
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-grow">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-emerald-600 text-4xl leading-none">{d.percentage}%</span>
                    <span className="text-sm font-black text-emerald-900 uppercase tracking-wider">OFF</span>
                  </div>

                  <div>
                    <h4 className="font-black text-gray-800 text-lg leading-tight">{d.name}</h4>
                    <p className="text-xs font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
                      <Calendar size={12} />
                      Added on {new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-50 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-bold">Condition:</span>
                      <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                        {d.conditionType === "manual_selection" ? "Automatically Applied" : `Orders >= ₹${d.conditionValue?.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-bold">Target State:</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {d.state || "All States"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-16 text-center shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Percent size={32} className="text-gray-300" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">No active offers</h4>
          <p className="text-gray-400 mt-2 text-sm">There are currently no active state-wise or global offers configured for you. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
