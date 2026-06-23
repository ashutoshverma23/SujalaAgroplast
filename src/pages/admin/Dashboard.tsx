import { 
  Store, 
  UserRound, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  MapPin,
  Map,
  BadgeCent,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Trash2,
  Download,
  Edit3,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BACKEND_URL } from '../../config';

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

// ── Mini Pagination ────────────────────────────────────────────────────────
const MiniPagination = ({
  total,
  page,
  perPage,
  onPage,
}: {
  total: number;
  page: number;
  perPage: number;
  onPage: (p: number) => void;
}) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
      <p className="text-xs font-bold text-gray-400">
        {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                p === page
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Hot Selling Products ───────────────────────────────────────────────────
const PRODUCTS_PER_PAGE = 10;

const HotSellingProducts = () => {
  const [activeTab, setActiveTab] = useState<"STATE" | "DEALER">("STATE");
  const [selectedState, setSelectedState]   = useState<string>("ALL");
  const [selectedDealer, setSelectedDealer] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [stateProducts,  setStateProducts]  = useState<any[]>([]);
  const [dealerProducts, setDealerProducts] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/analytics/hot-selling`, {
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

  // Reset page when tab or filter changes
  useEffect(() => { setPage(1); }, [activeTab, selectedState, selectedDealer]);

  const uniqueStates  = Array.from(new Set(stateProducts.map(p => p.state)));
  const uniqueDealers = Array.from(new Set(dealerProducts.map(p => p.dealer)));

  const filteredData = activeTab === "STATE"
    ? (selectedState  === "ALL" ? stateProducts  : stateProducts.filter(p => p.state  === selectedState))
    : (selectedDealer === "ALL" ? dealerProducts : dealerProducts.filter(p => p.dealer === selectedDealer));

  // Enrich: parse revenue, compute avg/unit and bar width relative to the top earner
  const parsedData = filteredData.map(item => {
    const rev = typeof item.revenue === "number"
      ? item.revenue
      : parseFloat(String(item.revenue).replace(/[₹,]/g, "")) || 0;
    const units = Number(item.sales) || 1;
    const avgPerUnit = Math.round(rev / units);
    return { ...item, _rev: rev, _avgPerUnit: avgPerUnit };
  });

  const maxRevenue = parsedData.reduce((m, d) => Math.max(m, d._rev), 0);

  const enrichedData = parsedData.map(d => ({
    ...d,
    _barPct: maxRevenue > 0 ? Math.round((d._rev / maxRevenue) * 100) : 0,
  }));

  // Pagination
  const pagedData  = enrichedData.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

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
              <Map size={16} /> State-wise
            </button>
            <button
              onClick={() => setActiveTab("DEALER")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "DEALER"
                  ? "bg-white text-emerald-700 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store size={16} /> Dealer-wise
            </button>
          </div>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-3">
          {activeTab === "STATE" ? (
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium outline-none"
            >
              <option value="ALL">All States</option>
              {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          ) : (
            <select
              value={selectedDealer}
              onChange={e => setSelectedDealer(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-medium outline-none"
            >
              <option value="ALL">All Dealers</option>
              {uniqueDealers.map(dealer => <option key={dealer} value={dealer}>{dealer}</option>)}
            </select>
          )}
          {enrichedData.length > 0 && (
            <span className="text-xs font-bold text-gray-400 ml-auto">
              {enrichedData.length} product{enrichedData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeTab === "STATE" ? selectedState : selectedDealer}-${page}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {pagedData.length > 0 ? (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 pb-2 border-b border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right hidden sm:block">Units Sold</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</span>
                </div>

                {pagedData.map((item, idx) => {
                  const rank = (page - 1) * PRODUCTS_PER_PAGE + idx + 1;
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
                    >
                      {/* Product info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <Package size={18} />
                          </div>
                          {rank <= 3 && (
                            <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${
                              rank === 1 ? "bg-yellow-400 text-yellow-900"
                              : rank === 2 ? "bg-gray-300 text-gray-700"
                              : "bg-orange-300 text-orange-900"
                            }`}>
                              {rank}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-gray-900 truncate text-sm">{item.name}</h5>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mt-0.5">
                            {activeTab === "STATE" ? <MapPin size={10} /> : <Store size={10} />}
                            <span className="uppercase tracking-wide truncate">{(item as any).state || (item as any).dealer}</span>
                          </div>
                        </div>
                      </div>

                      {/* Units */}
                      <div className="text-right hidden sm:block">
                        <p className="font-bold text-gray-700 text-sm">{item.sales}</p>
                        <p className="text-[10px] text-gray-400 font-medium">units</p>
                      </div>

                      {/* Revenue */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{typeof item.revenue === "number" ? `₹${item.revenue.toLocaleString("en-IN")}` : item.revenue}</p>
                        <p className="text-[10px] text-gray-400 font-medium">revenue</p>
                      </div>


                    </div>
                  );
                })}

                <MiniPagination
                  total={enrichedData.length}
                  page={page}
                  perPage={PRODUCTS_PER_PAGE}
                  onPage={setPage}
                />
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 font-medium">
                No data found for the selected filter.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPl, setSelectedPl] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingPl, setSavingPl] = useState(false);

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const fetchPriceLists = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/price-lists`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setPriceLists(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (!selectedPl && !pdfFile) {
      alert("Please select a PDF file to upload");
      return;
    }

    setSavingPl(true);
    try {
      let pdfBase64 = "";
      if (pdfFile) {
        pdfBase64 = await toBase64(pdfFile);
      }

      const method = selectedPl ? "PUT" : "POST";
      const url = selectedPl ? `${BACKEND_URL}/api/price-lists/${selectedPl.id}` : `${BACKEND_URL}/api/price-lists`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ title, pdfBase64 })
      });

      if (res.ok) {
        setTitle("");
        setPdfFile(null);
        setSelectedPl(null);
        setModalOpen(false);
        fetchPriceLists();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to save price list");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving price list");
    } finally {
      setSavingPl(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this price list?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/price-lists/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        fetchPriceLists();
      } else {
        alert("Failed to delete price list");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting price list");
    }
  };

  const openEdit = (pl: any) => {
    setSelectedPl(pl);
    setTitle(pl.title);
    setPdfFile(null);
    setModalOpen(true);
  };

  const openCreate = () => {
    setSelectedPl(null);
    setTitle("");
    setPdfFile(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Number of Dealers" value="142" icon={Store}     trend={8.5}  color="bg-blue-50 text-blue-600"     />
        <StatsCard title="Registered Farmers" value="8,920" icon={UserRound} trend={12.1} color="bg-orange-50 text-orange-600" />
        <StatsCard title="Total Products"     value="58"    icon={Package}   trend={4.2}  color="bg-emerald-50 text-emerald-600" />
        <StatsCard title="Monthly Revenue"    value="₹4.2M" icon={BadgeCent}  trend={14.2} color="bg-purple-50 text-purple-600"  />
      </div>

      {/* ── Price Lists Manager Section ── */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="text-emerald-600" size={24} /> Price Lists
            </h3>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wide">
              Manage product price lists shown to dealers
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-700/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Upload Price List
          </button>
        </div>

        {loadingLists ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
          </div>
        ) : priceLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priceLists.map((pl: any) => (
              <motion.div
                key={pl.id}
                whileHover={{ y: -2 }}
                className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-gray-900 text-sm truncate">{pl.title}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {new Date(pl.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={`${BACKEND_URL}${pl.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                    title="View PDF"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => openEdit(pl)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Edit/Update"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(pl.id)}
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50/40 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
            <p className="text-sm font-semibold text-gray-400">No price lists uploaded yet.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* ── Price List Upload/Edit Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
                <div>
                  <h3 className="text-lg font-black">{selectedPl ? "Update Price List" : "Upload Price List"}</h3>
                  <p className="text-emerald-300 text-xs font-semibold mt-0.5">Provide details and select PDF file</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 bg-emerald-700/50 text-emerald-200 hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-700 block mb-1.5 uppercase tracking-wide">
                    Price List Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sujala Agro Price List 2026"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-700 block mb-1.5 uppercase tracking-wide">
                    PDF File
                  </label>
                  {selectedPl && !pdfFile && (
                    <div className="mb-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold text-emerald-800">
                      <span className="truncate">Current: View existing file</span>
                      <a
                        href={`${BACKEND_URL}${selectedPl.pdfUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex-shrink-0"
                      >
                        Download PDF
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    required={!selectedPl}
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer border border-gray-200 p-2 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-xs"
                    disabled={savingPl}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPl}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 text-xs"
                  >
                    {savingPl && <Loader2 size={14} className="animate-spin" />}
                    {selectedPl ? "Update" : "Upload"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;