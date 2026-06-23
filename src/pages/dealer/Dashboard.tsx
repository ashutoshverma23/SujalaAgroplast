import { useState, useEffect } from "react";
import { 
  Loader2, LayoutDashboard, Calendar, Clock, BadgeCheck, 
  TrendingUp, ShoppingBag, History, PhoneCall, Copy, Check, X,
  MapPin, Landmark, Smartphone, ChevronRight, FileText, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from "../../config";

interface DashboardProps {
  setPage: (page: any) => void;
}

export default function Dashboard({ setPage }: DashboardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"pending" | "payments" | "received">("pending");
  const [graphPeriod, setGraphPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [priceLists, setPriceLists] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem("token")}` };
      
      // Fetch user profile
      const userRes = await fetch(`${BACKEND_URL}/api/users/me`, { headers });
      if (userRes.ok) {
        setUser(await userRes.json());
      }

      // Fetch orders
      const ordersRes = await fetch(`${BACKEND_URL}/api/orders`, { headers });
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }

      // Fetch price lists
      const plRes = await fetch(`${BACKEND_URL}/api/price-lists`, { headers });
      if (plRes.ok) {
        setPriceLists(await plRes.json());
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Metrics computations ───────────────────────────────────────────────────
  const getMemberSince = () => {
    if (!user?.createdAt) return "N/A";
    return new Date(user.createdAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  const getTimeSinceLastOrder = () => {
    if (orders.length === 0) return "No orders yet";
    const dates = orders.map(o => new Date(o.orderDate).getTime());
    const latestTime = Math.max(...dates);
    const diffMs = new Date().getTime() - latestTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    return `${diffMonths} months ago`;
  };

  // ── Filtered tabs calculations ─────────────────────────────────────────────
  const pendingOrders = orders.filter(
    o => o.status === "Pending" || o.status === "Processing" || o.status === "Dispatched"
  );
  const pendingPayments = orders.filter(o => o.paymentStatus === "Pending");
  const successfullyReceived = orders.filter(o => o.status === "Delivered");

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending": return pendingOrders;
      case "payments": return pendingPayments;
      case "received": return successfullyReceived;
      default: return [];
    }
  };

  // ── SVG Growth Chart calculations ──────────────────────────────────────────
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const getMonthlyData = () => {
    const now = new Date();
    const last6: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        label: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        value: 0
      });
    }

    orders.forEach(o => {
      if (o.status === "Delivered" || o.paymentStatus === "Approved") {
        const oDate = new Date(o.orderDate);
        const amount = o.totalAmount || 0;
        last6.forEach(m => {
          if (oDate.getMonth() === m.monthIndex && oDate.getFullYear() === m.year) {
            m.value += amount;
          }
        });
      }
    });

    return last6;
  };

  const getYearlyData = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    const yearly = years.map(y => ({
      year: y,
      label: `${y}`,
      value: 0
    }));

    orders.forEach(o => {
      if (o.status === "Delivered" || o.paymentStatus === "Approved") {
        const oDate = new Date(o.orderDate);
        const amount = o.totalAmount || 0;
        const year = oDate.getFullYear();
        yearly.forEach(y => {
          if (year === y.year) {
            y.value += amount;
          }
        });
      }
    });

    return yearly;
  };

  const graphData = graphPeriod === "monthly" ? getMonthlyData() : getYearlyData();
  const maxRevenue = Math.max(...graphData.map(d => d.value), 10000);

  return (
    <div className="space-y-8 mb-12">
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : (
        <>
          {/* ── Top Metrics Bar ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Status Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BadgeCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-black text-gray-900 text-lg">Active Dealer</span>
                </div>
              </div>
            </div>

            {/* Member Since Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Since</p>
                <p className="font-black text-gray-900 text-lg mt-1">{getMemberSince()}</p>
              </div>
            </div>

            {/* Time Since Last Order Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Order Placed</p>
                <p className="font-black text-gray-900 text-lg mt-1">{getTimeSinceLastOrder()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left/Middle Column: SVG Graph and Tabs ── */}
            <div className="lg:col-span-2 space-y-8">
              {/* Growth Snapshot Card */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">Growth Snapshot</h3>
                      <p className="text-xs font-semibold text-gray-400">Order revenue trends (Delivered/Approved)</p>
                    </div>
                  </div>
                  <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setGraphPeriod("monthly")}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                        graphPeriod === "monthly"
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setGraphPeriod("yearly")}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                        graphPeriod === "yearly"
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* Custom SVG Chart */}
                <div className="relative h-60 w-full bg-gray-50/50 rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
                  {maxRevenue <= 10000 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400">
                      No order revenue data available yet
                    </div>
                  ) : null}

                  {/* Render Chart */}
                  <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const yVal = 20 + ratio * 120;
                      return (
                        <line
                          key={idx}
                          x1="40"
                          y1={yVal}
                          x2="480"
                          y2={yVal}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Render Bars (for Monthly) */}
                    {graphPeriod === "monthly" &&
                      graphData.map((d, idx) => {
                        const barWidth = 24;
                        const colWidth = 440 / 6;
                        const x = 40 + idx * colWidth + colWidth / 2 - barWidth / 2;
                        const height = (d.value / maxRevenue) * 120;
                        const y = 140 - height;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={Math.max(height, 2)}
                              rx="4"
                              fill="url(#barGradient)"
                              className="transition-all duration-500 hover:opacity-100"
                            />
                            {/* Hover tooltip amount */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 6}
                              textAnchor="middle"
                              fill="#047857"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {d.value > 0 ? `₹${(d.value / 1000).toFixed(0)}k` : ""}
                            </text>
                          </g>
                        );
                      })}

                    {/* Render Line/Area (for Yearly) */}
                    {graphPeriod === "yearly" && (() => {
                      const points = graphData.map((d, idx) => {
                        const colWidth = 440 / (graphData.length - 1 || 1);
                        const x = 40 + idx * colWidth;
                        const height = (d.value / maxRevenue) * 120;
                        const y = 140 - height;
                        return { x, y, value: d.value };
                      });

                      const pathD = points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                      }, "");

                      const areaD = points.length > 0 
                        ? `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z` 
                        : "";

                      return (
                        <g>
                          {/* Area Under Line */}
                          {areaD && <path d={areaD} fill="url(#areaGradient)" />}
                          {/* Smooth Line */}
                          {pathD && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )}
                          {/* Data points */}
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                              <text
                                x={p.x}
                                y={p.y - 8}
                                textAnchor="middle"
                                fill="#2563eb"
                                fontSize="9"
                                fontWeight="bold"
                              >
                                {p.value > 0 ? `₹${(p.value / 1000).toFixed(0)}k` : ""}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>

                  {/* X Axis Labels */}
                  <div className="flex justify-between pl-[40px] pr-[20px] text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    {graphData.map((d, idx) => (
                      <span key={idx} className="w-12 text-center truncate">
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Tabs Section */}
              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                  <h3 className="font-black text-gray-900 text-lg">Order Status Tracking</h3>
                  
                  {/* Tab list */}
                  <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-2xl flex-wrap">
                    {[
                      { key: "pending", label: "Pending Orders", count: pendingOrders.length },
                      { key: "payments", label: "Pending Payments", count: pendingPayments.length },
                      { key: "received", label: "Received", count: successfullyReceived.length },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black rounded-xl transition-all ${
                          activeTab === tab.key
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content Display */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {getFilteredOrders().length > 0 ? (
                    getFilteredOrders().map(order => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-50 bg-gray-50/20 hover:bg-gray-50/50 rounded-2xl transition-colors group"
                      >
                        <div className="space-y-1">
                          <h4 className="font-black text-gray-900 text-sm">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
                          <p className="text-xs text-gray-400 font-semibold">
                            Placed on {new Date(order.orderDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {order.paymentTerms && (
                            <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg inline-block">
                              Terms: {order.paymentTerms}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-bold text-gray-400">Total Amount</p>
                            <p className="text-sm font-black text-emerald-600 mt-0.5">₹{order.totalAmount?.toLocaleString()}</p>
                          </div>
                          
                          {/* Badges */}
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              order.status === 'Pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {order.status}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              order.paymentStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              order.paymentStatus === 'Pending' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              Pay: {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 font-medium text-sm">
                      No orders in this section yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column: Quick Actions & Contact Info ── */}
            <div className="space-y-8">
              {/* Quick Actions Panel */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-5">
                <h3 className="font-black text-gray-900 text-lg">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setPage("PRODUCTS")}
                    className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/10 transition-all font-black text-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={18} />
                      <span>Place New Order</span>
                    </div>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setPage("ORDERS")}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700 hover:text-emerald-700 rounded-2xl transition-all font-bold text-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <History size={18} />
                      <span>Order History</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform group-hover:text-emerald-600" />
                  </button>

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700 hover:text-emerald-700 rounded-2xl transition-all font-bold text-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <PhoneCall size={18} />
                      <span>Contact Us & Billing Details</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform group-hover:text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Download Price Lists Panel */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">Download Price Lists</h3>
                    <p className="text-[10px] font-semibold text-gray-400">Download official product price list PDFs</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {priceLists.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold text-center py-4">No price lists uploaded yet.</p>
                  ) : (
                    priceLists.map((pl: any) => (
                      <a
                        key={pl.id}
                        href={`${BACKEND_URL}${pl.pdfUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/30 text-gray-700 hover:text-emerald-700 rounded-xl transition-all font-bold text-xs group"
                      >
                        <span className="truncate pr-2">{pl.title}</span>
                        <Download size={14} className="text-gray-400 group-hover:text-emerald-600 flex-shrink-0" />
                      </a>
                    ))
                  )}
                </div>
              </div>

              {/* Helpful tips panel */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <LayoutDashboard size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                  <h4 className="font-black text-emerald-300 uppercase tracking-widest text-xs">Payment Information</h4>
                  <h3 className="font-black text-lg leading-tight">Need to approve a pending payment?</h3>
                  <p className="text-xs text-emerald-100/80 leading-relaxed font-semibold">
                    Submit your transaction ID or UTR in the order history, and the admin will verify it. Once confirmed, your pending payments will automatically reduce.
                  </p>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    View Bank Account Info →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Contact & Billing Details Modal ── */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
                <div className="flex items-center gap-2.5">
                  <PhoneCall size={20} className="text-emerald-300" />
                  <div>
                    <h3 className="font-black text-lg leading-none">Contact & Billing</h3>
                    <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1">Sujala Agro Industries</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-1.5 bg-emerald-700/50 text-emerald-200 hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Details Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Contact numbers */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Smartphone size={12} className="text-emerald-600" /> Phone Numbers
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Support Line 1</p>
                      <p className="font-bold text-gray-800 mt-1">+91 9876543210</p>
                      <button 
                        onClick={() => copyToClipboard("+91 9876543210", "tel1")}
                        className="absolute right-2 top-2 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "tel1" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Support Line 2</p>
                      <p className="font-bold text-gray-800 mt-1">+91 9876543211</p>
                      <button 
                        onClick={() => copyToClipboard("+91 9876543211", "tel2")}
                        className="absolute right-2 top-2 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "tel2" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Office address */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-600" /> Office Address
                  </h4>
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 relative text-sm">
                    <p className="font-bold text-gray-800 leading-relaxed">
                      Sujala Agro Industries,<br />
                      Gat No. 123, Nashik-Pune Highway,<br />
                      Dist Nashik, Maharashtra - 422003, India.
                    </p>
                    <button 
                      onClick={() => copyToClipboard("Sujala Agro Industries, Gat No. 123, Nashik-Pune Highway, Dist Nashik, Maharashtra - 422003, India.", "addr")}
                      className="absolute right-3 top-3 p-1.5 text-gray-300 hover:text-emerald-600 transition-colors"
                    >
                      {copiedField === "addr" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Landmark size={12} className="text-emerald-600" /> Official Bank Account Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Bank Name</p>
                      <p className="font-bold text-gray-800 mt-1">HDFC Bank</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Account Name</p>
                      <p className="font-bold text-gray-800 mt-1">Sujala Agro Industries</p>
                      <button 
                        onClick={() => copyToClipboard("Sujala Agro Industries", "accname")}
                        className="absolute right-2 top-2 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "accname" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group col-span-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Account Number</p>
                      <p className="font-bold text-gray-800 mt-1">50200000123456</p>
                      <button 
                        onClick={() => copyToClipboard("50200000123456", "accno")}
                        className="absolute right-3 top-3 p-1.5 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "accno" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">IFSC Code</p>
                      <p className="font-bold text-gray-800 mt-1">HDFC0001234</p>
                      <button 
                        onClick={() => copyToClipboard("HDFC0001234", "ifsc")}
                        className="absolute right-2 top-2 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "ifsc" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                      <p className="text-[9px] font-black text-gray-400 uppercase">UPI ID</p>
                      <p className="font-bold text-gray-800 mt-1">sujala@hdfcbank</p>
                      <button 
                        onClick={() => copyToClipboard("sujala@hdfcbank", "upi")}
                        className="absolute right-2 top-2 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                      >
                        {copiedField === "upi" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}