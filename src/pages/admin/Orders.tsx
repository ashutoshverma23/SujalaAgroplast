import React, { useState, useEffect } from "react";
import {
  Package, Clock, CheckCircle, Info, Check, X as XIcon,
  Loader2, Eye, Calendar, IndianRupee, Download, MessageSquare,
  Save, BadgeCheck, AlertCircle, XCircle, Pencil, Search, Filter,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';
import { generateInvoicePDF } from "../../utils/pdfGenerator";

// ── Status helpers ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  Pending:    { color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  Processing: { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  Dispatched: { color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200"  },
  Delivered:  { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Cancelled:  { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

const paymentConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Approved:                  { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <BadgeCheck size={13} /> },
  Pending:                   { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: <AlertCircle size={13} /> },
  "Paid (Waiting Approval)": { color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   icon: <Clock size={13} /> },
  Rejected:                  { color: "text-gray-600",    bg: "bg-gray-100",   border: "border-gray-200",   icon: <XCircle size={13} /> },
};

const statusAccent: Record<string, string> = {
  Pending:    "#f97316",
  Processing: "#3b82f6",
  Dispatched: "#a855f7",
  Delivered:  "#10b981",
  Cancelled:  "#f43f5e",
};

const StatusBadge = ({ status, type = "order" }: { status: string; type?: "order" | "payment" }) => {
  const cfg = type === "payment"
    ? paymentConfig[status]
    : (() => { const c = statusConfig[status]; return c ? { ...c, icon: null } : null; })();
  if (!cfg) return <span className="text-xs font-bold text-gray-500">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {(cfg as any).icon}
      {status}
    </span>
  );
};

// ── Pagination component ───────────────────────────────────────────────────
const Pagination = ({
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
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
      <p className="text-xs font-bold text-gray-400">
        Showing <span className="text-gray-700">{Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)}</span> of <span className="text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                p === page
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Payment Terms Editor ───────────────────────────────────────────────────
const PaymentTermsEditor = ({
  order,
  onSave,
}: {
  order: any;
  onSave: (id: string, text: string) => Promise<void>;
}) => {
  const [text,    setText]    = useState(order.paymentTerms || "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [editing, setEditing] = useState(false);

  const isDirty = text !== (order.paymentTerms || "");

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    await onSave(order.id, text);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={12} className="text-emerald-600" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payment Terms</span>
        </div>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full"
          >
            <CheckCircle size={9} /> Saved
          </motion.span>
        )}
      </div>

      {!editing && !order.paymentTerms && !text ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/40 transition-all text-xs font-medium"
        >
          <Pencil size={12} /> Add payment terms...
        </button>
      ) : !editing && order.paymentTerms ? (
        <div
          onClick={() => setEditing(true)}
          className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-emerald-300 transition-colors group"
        >
          <p className="text-xs font-semibold text-gray-700 flex-1 truncate">{order.paymentTerms}</p>
          <Pencil size={11} className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="e.g. Payment on delivery, Cash, Credit 30 days..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium text-gray-700 bg-white resize-none transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setText(order.paymentTerms || ""); setEditing(false); }}
              className="px-2.5 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-[10px] font-black rounded-lg transition-all"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const PREV_PER_PAGE = 10;

export default function AdminOrders() {
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [dealers, setDealers] = useState<any[]>([]);
  const [filterDate,   setFilterDate]   = useState("");
  const [filterDealer, setFilterDealer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [prevPage, setPrevPage] = useState(1);

  useEffect(() => { fetchOrders(); fetchDealers(); }, []);
  // Reset prev page when filters change
  useEffect(() => { setPrevPage(1); }, [filterDate, filterDealer, filterStatus]);

  const fetchDealers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDealers(data.filter((u: any) => u.role === "DEALER"));
      }
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setFetchingDetails(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) return await res.json();
    } catch (e) { console.error(e); }
    finally { setFetchingDetails(false); }
    return null;
  };

  const handleViewDetails = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setViewingOrder(details);
  };

  const handleUpdatePayment = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/payment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (res.ok) {
        fetchOrders();
        if (viewingOrder?.id === orderId) {
          const details = await fetchOrderDetails(orderId);
          if (details) setViewingOrder(details);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
        if (viewingOrder?.id === orderId) {
          const details = await fetchOrderDetails(orderId);
          if (details) setViewingOrder(details);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdatePaymentTerms = async (orderId: string, paymentTerms: string) => {
    const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/payment-terms`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ paymentTerms })
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentTerms } : o));
      if (viewingOrder?.id === orderId) setViewingOrder((v: any) => ({ ...v, paymentTerms }));
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) generateInvoicePDF(details);
  };

  // ── Date helpers ────────────────────────────────────────────────────────
  const todayStr = new Date().toLocaleDateString("en-CA");
  const isToday  = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-CA") === todayStr;

  // ── Filters ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    if (filterDate   && new Date(order.orderDate).toLocaleDateString("en-CA") !== filterDate) return false;
    if (filterDealer && order.dealerId !== filterDealer) return false;
    if (filterStatus && order.status  !== filterStatus) return false;
    return true;
  });

  const todaysOrders        = filteredOrders.filter(o =>  isToday(o.orderDate));
  const allPreviousOrders   = filteredOrders.filter(o => !isToday(o.orderDate));
  const prevTotalPages      = Math.ceil(allPreviousOrders.length / PREV_PER_PAGE);
  const paginatedPrevOrders = allPreviousOrders.slice((prevPage - 1) * PREV_PER_PAGE, prevPage * PREV_PER_PAGE);
  const hasFilters          = filterDate || filterDealer || filterStatus;

  // ── Summary counts (from all orders, unfiltered) ─────────────────────
  const counts = {
    today:   orders.filter(o => isToday(o.orderDate)).length,
    pending: orders.filter(o => o.paymentStatus === "Pending").length,
    waiting: orders.filter(o => o.paymentStatus === "Paid (Waiting Approval)").length,
    total:   orders.length,
  };

  // ── Order Row (closure gives access to all handlers) ─────────────────
  const OrderRow = ({ order }: { order: any }) => {
    const sCfg       = statusConfig[order.status];
    const dealerName = dealers.find(d => d.id === order.dealerId)?.name || "Unknown";

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <div className="h-1 w-full" style={{ background: statusAccent[order.status] ?? "#e5e7eb" }} />

        <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-5 items-start">
          {/* Col 1 */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="font-black text-gray-900 text-lg">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
              <StatusBadge status={order.status} type="order" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(order.orderDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-full">
                {dealerName}
              </span>
              {order.totalAmount && (
                <span className="flex items-center gap-0.5 font-black text-gray-700">
                  <IndianRupee size={12} />{order.totalAmount}
                </span>
              )}
            </div>
            {order.paymentReference && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Info size={12} className="text-blue-400" />
                Ref: <span className="font-black text-gray-700">{order.paymentReference}</span>
              </div>
            )}
            <PaymentTermsEditor order={order} onSave={handleUpdatePaymentTerms} />
            {order.paymentStatus === "Paid (Waiting Approval)" && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={14} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs font-bold text-blue-700 flex-1">Payment submitted — awaiting approval</p>
                <button onClick={() => handleUpdatePayment(order.id, "Approved")}
                  className="flex items-center gap-1 text-[10px] font-black text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors">
                  <Check size={12} /> Approve
                </button>
                <button onClick={() => handleUpdatePayment(order.id, "Rejected")}
                  className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-colors">
                  <XIcon size={12} /> Reject
                </button>
              </div>
            )}
          </div>

          {/* Col 2: Status select */}
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Status</label>
            <select
              value={order.status}
              onChange={e => handleUpdateStatus(order.id, e.target.value)}
              className={`px-3 py-2.5 border rounded-xl outline-none text-sm font-black bg-white focus:ring-2 focus:ring-emerald-500 transition-all ${sCfg ? `${sCfg.border} ${sCfg.color}` : "border-gray-200 text-gray-700"}`}
            >
              {["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Col 3: Actions */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            <button onClick={() => handleViewDetails(order.id)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all">
              <Eye size={13} /> View Details
            </button>
            <button onClick={() => handleDownloadInvoice(order.id)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
              <Download size={13} /> Invoice
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h2>
          <p className="text-gray-500 font-medium mt-1">Approve payments and update order statuses</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-emerald-600 px-4 py-2.5 rounded-2xl text-center shadow-lg shadow-emerald-500/20">
            <p className="text-2xl font-black text-white">{counts.today}</p>
            <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Today</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-2xl text-center">
            <p className="text-2xl font-black text-orange-600">{counts.pending}</p>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Pending Pay</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-2xl text-center">
            <p className="text-2xl font-black text-blue-600">{counts.waiting}</p>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Awaiting Approval</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl text-center">
            <p className="text-2xl font-black text-gray-700">{counts.total}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">All Orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Filters</span>
          {hasFilters && (
            <button
              onClick={() => { setFilterDate(""); setFilterDealer(""); setFilterStatus(""); }}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
            >
              <XCircle size={12} /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Dealer</label>
            <select value={filterDealer} onChange={e => setFilterDealer(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 bg-white">
              <option value="">All Dealers</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.mobile})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Order Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 bg-white">
              <option value="">All Statuses</option>
              {["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <p className="text-xs text-gray-400 font-medium mt-3">
            Showing <span className="font-black text-gray-700">{filteredOrders.length}</span> of {orders.length} orders
          </p>
        )}
      </div>

      {/* Order List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-10">

          {/* ── TODAY'S ORDERS — always all shown ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-md shadow-emerald-500/20">
                <span className="text-sm font-black uppercase tracking-widest">Today's Orders</span>
                <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">{todaysOrders.length}</span>
              </div>
              <div className="flex-1 h-px bg-emerald-100" />
              <span className="text-xs font-bold text-gray-400">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            {todaysOrders.length === 0 ? (
              <div className="flex items-center gap-4 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={22} className="text-emerald-300" />
                </div>
                <div>
                  <p className="font-bold text-gray-600">No orders today</p>
                  <p className="text-xs text-gray-400 mt-0.5">New orders placed today will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysOrders.map(order => <OrderRow key={order.id} order={order} />)}
              </div>
            )}
          </div>

          {/* ── PREVIOUS ORDERS — paginated 10 per page ── */}
          {allPreviousOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2.5 bg-gray-700 text-white px-4 py-2 rounded-2xl">
                  <span className="text-sm font-black uppercase tracking-widest">Previous Orders</span>
                  <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">{allPreviousOrders.length}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-gray-400">
                  Page {prevPage} of {prevTotalPages}
                </span>
              </div>
              <div className="space-y-4">
                {paginatedPrevOrders.map(order => <OrderRow key={order.id} order={order} />)}
              </div>
              <Pagination
                total={allPreviousOrders.length}
                page={prevPage}
                perPage={PREV_PER_PAGE}
                onPage={p => { setPrevPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-300" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">
            {hasFilters ? "No orders match your filters" : "No orders found"}
          </h4>
          <p className="text-gray-400 mt-2 text-sm">
            {hasFilters ? "Try adjusting your filter criteria." : "Orders will appear here once dealers place them."}
          </p>
        </div>
      )}

      {/* ── Order Details Modal ── */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-700">
                <div>
                  <h3 className="text-2xl font-black text-white">Order Details</h3>
                  <p className="text-sm font-bold text-gray-400 mt-0.5">#ORD-{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 text-gray-400 hover:bg-gray-700 rounded-xl transition-colors"><XIcon size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Order Status", content: <StatusBadge status={viewingOrder.status} type="order" />, cls: "bg-gray-50 border-gray-100" },
                    { label: "Payment", content: <StatusBadge status={viewingOrder.paymentStatus} type="payment" />, cls: "bg-gray-50 border-gray-100" },
                    { label: "Date", content: <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Calendar size={13} className="text-emerald-500" />{new Date(viewingOrder.orderDate).toLocaleDateString("en-GB")}</p>, cls: "bg-gray-50 border-gray-100" },
                    { label: "Total", content: <p className="font-black text-emerald-700 text-lg flex items-center gap-0.5"><IndianRupee size={15} />{viewingOrder.totalAmount || viewingOrder.items?.reduce((a: number, i: any) => a + i.quantity * i.unitPrice, 0)}</p>, cls: "bg-emerald-50 border-emerald-100" },
                  ].map(({ label, content, cls }) => (
                    <div key={label} className={`p-4 rounded-2xl border ${cls}`}>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                      {content}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest w-20">Dealer</span>
                    <span className="font-bold text-gray-700">{dealers.find(d => d.id === viewingOrder.dealerId)?.name || viewingOrder.dealerId}</span>
                  </div>
                  {viewingOrder.paymentReference && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest w-20">Ref</span>
                      <span className="font-black text-gray-900">{viewingOrder.paymentReference}</span>
                    </div>
                  )}
                  {viewingOrder.paymentTerms && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest w-20 pt-0.5">Terms</span>
                      <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg text-xs flex-1">{viewingOrder.paymentTerms}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Ordered Items</h4>
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-900 text-white">
                          <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Product</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Spec</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Qty</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Unit</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingOrder.items?.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3"><p className="font-bold text-gray-900">{item.productName}</p><p className="text-xs text-gray-400">{item.variantName}</p></td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{item.width} · {item.length} · {item.type}</td>
                            <td className="px-4 py-3 text-center font-black text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">₹{item.unitPrice}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">₹{item.quantity * item.unitPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {viewingOrder.paymentStatus === "Paid (Waiting Approval)" && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Info size={16} /> Payment awaiting your approval</p>
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdatePayment(viewingOrder.id, "Approved")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm">
                        <Check size={16} /> Approve Payment
                      </button>
                      <button onClick={() => handleUpdatePayment(viewingOrder.id, "Rejected")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors text-sm">
                        <XIcon size={16} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Status:</label>
                  <select value={viewingOrder.status} onChange={e => handleUpdateStatus(viewingOrder.id, e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 bg-white">
                    {["Pending", "Processing", "Dispatched", "Delivered", "Cancelled"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDownloadInvoice(viewingOrder.id)}
                    className="flex items-center gap-2 px-5 py-2.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-xl transition-all">
                    <Download size={16} /> Invoice
                  </button>
                  <button onClick={() => setViewingOrder(null)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global loader */}
      <AnimatePresence>
        {fetchingDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4">
              <Loader2 size={40} className="text-emerald-500 animate-spin" />
              <p className="font-bold text-gray-900">Loading order details...</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
