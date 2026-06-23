import React, { useState, useEffect } from "react";
import {
  Package, Clock, CheckCircle, Info, Check, X as XIcon,
  Loader2, Eye, Calendar, IndianRupee, Download, MessageSquare,
  Save, BadgeCheck, AlertCircle, XCircle, Pencil, Search, Filter,
  ChevronLeft, ChevronRight, Plus, Minus, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import { getGstBreakdown } from "../../utils/gst";

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

  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<Record<string, boolean>>({});
  const [catalogue, setCatalogue] = useState<any>(null);
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Selectors for adding a product config
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedWidthId, setSelectedWidthId] = useState("");
  const [selectedLengthId, setSelectedLengthId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");

  useEffect(() => { 
    fetchOrders(); 
    fetchDealers(); 
    fetchCatalogueAndDiscounts();
  }, []);
  // Reset prev page when filters change
  useEffect(() => { setPrevPage(1); }, [filterDate, filterDealer, filterStatus]);

  const fetchCatalogueAndDiscounts = async () => {
    try {
      const headers = { "Authorization": `Bearer ${localStorage.getItem("token")}` };
      const [catRes, discRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/products/catalogue`),
        fetch(`${BACKEND_URL}/api/discounts/active`, { headers })
      ]);
      if (catRes.ok) setCatalogue(await catRes.json());
      if (discRes.ok) setActiveDiscounts(await discRes.json());
    } catch (e) {
      console.error(e);
    }
  };

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

  const handleEditOrder = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (!details) return;

    setEditingOrder(details);
    
    // Set current items
    setEditItems(details.items.map((item: any) => ({
      priceId: item.priceId,
      quantity: item.quantity,
      productName: item.productName,
      variantName: item.variantName,
      width: item.width,
      length: item.length,
      type: item.type,
      unitPrice: item.unitPrice,
      category: item.category,
      gstRate: item.category === 'Mulch Film' ? 18 : 5
    })));

    // Set currently checked discounts
    const currentDiscounts: Record<string, boolean> = {};
    if (Array.isArray(details.appliedDiscounts)) {
      details.appliedDiscounts.forEach((d: any) => {
        currentDiscounts[d.id] = true;
      });
    }
    setSelectedDiscounts(currentDiscounts);

    // Reset selectors
    setSelectedProductId("");
    setSelectedVariantId("");
    setSelectedWidthId("");
    setSelectedLengthId("");
    setSelectedTypeId("");
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);

    const totals = getModalTotals();

    try {
      const payload = {
        items: editItems.map(i => ({ priceId: i.priceId, quantity: i.quantity })),
        subtotalAmount: totals.baseSubtotal,
        discountAmount: totals.totalDiscountAmount,
        taxAmount: totals.totalGstAmount,
        totalAmount: totals.finalTotal,
        appliedDiscounts: totals.appliedDiscountsRecord
      };

      const res = await fetch(`${BACKEND_URL}/api/orders/${editingOrder.id}/admin-edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to save changes");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving changes");
    } finally {
      setSavingEdit(false);
    }
  };

  const updateEditItemQty = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: newQty } : item));
  };

  const removeEditItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addProductToOrder = () => {
    if (!catalogue) return;
    const matchingPrice = catalogue.prices.find((p: any) => 
      p.variantId === selectedVariantId && 
      p.widthId === selectedWidthId && 
      p.lengthId === selectedLengthId && 
      p.typeId === selectedTypeId
    );
    if (!matchingPrice) {
      alert("No price found for this configuration.");
      return;
    }

    const product = catalogue.products.find((p: any) => p.id === selectedProductId);
    const variant = catalogue.variants.find((v: any) => v.id === selectedVariantId);
    const width = catalogue.widths.find((w: any) => w.id === selectedWidthId);
    const length = catalogue.lengths.find((l: any) => l.id === selectedLengthId);
    const type = catalogue.types.find((t: any) => t.id === selectedTypeId);

    // Check if item already exists in editItems
    const exists = editItems.some(i => i.priceId === matchingPrice.id);
    if (exists) {
      alert("Product configuration already in order. You can adjust its quantity.");
      return;
    }

    setEditItems(prev => [...prev, {
      priceId: matchingPrice.id,
      quantity: 1,
      productName: product?.name || "Unknown",
      variantName: variant?.name || "Unknown",
      width: width?.label || "Unknown",
      length: length?.label || "Unknown",
      type: type?.name || "Unknown",
      unitPrice: matchingPrice.price,
      category: product?.category || "Unknown",
      gstRate: product?.gstRate || (product?.category === 'Mulch Film' ? 18 : 5)
    }]);

    // Reset selections
    setSelectedProductId("");
    setSelectedVariantId("");
    setSelectedWidthId("");
    setSelectedLengthId("");
    setSelectedTypeId("");
  };

  const getModalTotals = () => {
    const baseSubtotal = editItems.reduce((sum, item) => sum + getGstBreakdown(item.unitPrice, item.category, item.quantity, item.gstRate).basePrice, 0);
    const totalGstAmount = editItems.reduce((sum, item) => sum + getGstBreakdown(item.unitPrice, item.category, item.quantity, item.gstRate).gstAmount, 0);
    const initialTotal = editItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    let currentTotal = initialTotal;
    const appliedDiscountsRecord: any[] = [];
    
    const dealerState = editingOrder?.dealerKyc?.state?.trim().toLowerCase();
    const eligibleDiscounts = activeDiscounts.filter(d => {
      if (!d.state || d.state.trim() === '' || d.state.trim().toLowerCase() === 'all') {
        return true;
      }
      return dealerState ? d.state.trim().toLowerCase() === dealerState : false;
    });

    eligibleDiscounts.forEach(disc => {
      let eligible = false;
      if (disc.conditionType === 'min_invoice_value') {
        eligible = initialTotal >= (disc.conditionValue || 0);
      } else {
        eligible = true;
      }

      if (eligible && selectedDiscounts[disc.id]) {
        const discAmt = currentTotal * (disc.percentage / 100);
        currentTotal -= discAmt;
        appliedDiscountsRecord.push({
          id: disc.id,
          name: disc.name,
          percentage: disc.percentage,
          amount: discAmt
        });
      }
    });

    const finalTotal = Math.round(currentTotal);
    const totalDiscountAmount = initialTotal - finalTotal;

    return {
      baseSubtotal,
      totalGstAmount,
      finalTotal,
      totalDiscountAmount,
      appliedDiscountsRecord,
      eligibleDiscounts
    };
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
            {order.status === "Pending" && (
              <button onClick={() => handleEditOrder(order.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all">
                <Pencil size={13} /> Edit Order
              </button>
            )}
            <button onClick={() => handleDownloadInvoice(order.id)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
              <Download size={13} /> Invoice
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const availableWidths = catalogue && selectedVariantId ? catalogue.widths.filter((w: any) =>
    catalogue.prices.some((p: any) => p.variantId === selectedVariantId && p.widthId === w.id)
  ) : [];

  const availableLengths = catalogue && selectedVariantId && selectedWidthId ? catalogue.lengths.filter((l: any) =>
    catalogue.prices.some((p: any) =>
      p.variantId === selectedVariantId &&
      p.widthId === selectedWidthId &&
      p.lengthId === l.id
    )
  ) : [];

  const availableTypes = catalogue && selectedVariantId && selectedWidthId && selectedLengthId ? catalogue.types.filter((t: any) =>
    catalogue.prices.some((p: any) =>
      p.variantId === selectedVariantId &&
      p.widthId === selectedWidthId &&
      p.lengthId === selectedLengthId &&
      p.typeId === t.id
    )
  ) : [];

  const matchingPrice = (catalogue && selectedVariantId && selectedWidthId && selectedLengthId && selectedTypeId)
    ? catalogue.prices.find((p: any) => 
        p.variantId === selectedVariantId && 
        p.widthId === selectedWidthId && 
        p.lengthId === selectedLengthId && 
        p.typeId === selectedTypeId
      )
    : null;

  const totals = getModalTotals();

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

      {/* ── Edit Order Modal ── */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                <div>
                  <h3 className="text-2xl font-black">Edit Pending Order</h3>
                  <p className="text-sm font-bold text-blue-200 mt-0.5">
                    #ORD-{editingOrder.id.slice(0, 8).toUpperCase()} · Dealer: {dealers.find(d => d.id === editingOrder.dealerId)?.name || editingOrder.dealerId}
                  </p>
                </div>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-2 text-blue-200 hover:bg-blue-800 rounded-xl transition-colors"
                >
                  <XIcon size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ── Items List ── */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</h4>
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-900 text-white">
                          <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Product</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Spec</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Qty</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Unit Price</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editItems.map((item, idx) => (
                          <tr key={`${item.priceId}-${idx}`} className="bg-white hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-400">{item.variantName}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                              {item.width} · {item.length} · {item.type}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateEditItemQty(idx, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-40 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-black text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateEditItemQty(idx, item.quantity + 1)}
                                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">₹{item.unitPrice}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">₹{item.quantity * item.unitPrice}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeEditItem(idx)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {editItems.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium">
                              No items in order. Please add products below.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Add Product Section ── */}
                <div className="bg-gray-50/80 border border-gray-200/60 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    <h5 className="text-xs font-black text-gray-700 uppercase tracking-widest">Add Product Configuration</h5>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {/* Product */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</label>
                      <select
                        value={selectedProductId}
                        onChange={e => {
                          setSelectedProductId(e.target.value);
                          setSelectedVariantId("");
                          setSelectedWidthId("");
                          setSelectedLengthId("");
                          setSelectedTypeId("");
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 bg-white"
                      >
                        <option value="">Select...</option>
                        {catalogue?.products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variant</label>
                      <select
                        value={selectedVariantId}
                        disabled={!selectedProductId}
                        onChange={e => {
                          setSelectedVariantId(e.target.value);
                          setSelectedWidthId("");
                          setSelectedLengthId("");
                          setSelectedTypeId("");
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Select...</option>
                        {catalogue?.variants
                          .filter((v: any) => v.productId === selectedProductId)
                          .map((v: any) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                      </select>
                    </div>

                    {/* Width */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Width</label>
                      <select
                        value={selectedWidthId}
                        disabled={!selectedVariantId}
                        onChange={e => {
                          setSelectedWidthId(e.target.value);
                          setSelectedLengthId("");
                          setSelectedTypeId("");
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Select...</option>
                        {availableWidths.map((w: any) => (
                          <option key={w.id} value={w.id}>{w.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Length */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Length</label>
                      <select
                        value={selectedLengthId}
                        disabled={!selectedWidthId}
                        onChange={e => {
                          setSelectedLengthId(e.target.value);
                          setSelectedTypeId("");
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Select...</option>
                        {availableLengths.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                      <select
                        value={selectedTypeId}
                        disabled={!selectedLengthId}
                        onChange={e => {
                          setSelectedTypeId(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">Select...</option>
                        {availableTypes.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {matchingPrice ? (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xl">
                          Unit Price: ₹{matchingPrice.price}
                        </span>
                      ) : selectedTypeId ? (
                        <span className="text-xs font-bold text-rose-500">
                          Configuration pricing not found.
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={addProductToOrder}
                      disabled={!matchingPrice}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>

                {/* ── Discounts & Offers Section ── */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Discounts & Offers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {totals.eligibleDiscounts.map((disc: any) => {
                      const initialTotal = editItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                      const satisfiesCondition = disc.conditionType === 'min_invoice_value' ? initialTotal >= (disc.conditionValue || 0) : true;
                      const isChecked = !!selectedDiscounts[disc.id];

                      return (
                        <label
                          key={disc.id}
                          className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                            !satisfiesCondition
                              ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                              : isChecked
                              ? "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked && satisfiesCondition}
                            disabled={!satisfiesCondition}
                            onChange={e => {
                              setSelectedDiscounts(prev => ({
                                ...prev,
                                [disc.id]: e.target.checked
                              }));
                            }}
                            className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              {disc.name}
                              <span className="inline-block text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                                {disc.percentage}% Off
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                              {disc.conditionType === 'min_invoice_value' 
                                ? `Min invoice value: ₹${disc.conditionValue}` 
                                : 'Eligible discount'}
                            </p>
                            {!satisfiesCondition && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1">
                                Required min order value: ₹{disc.conditionValue} (Current: ₹{initialTotal})
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                    {totals.eligibleDiscounts.length === 0 && (
                      <div className="col-span-2 text-center py-4 bg-gray-50 border border-gray-200 border-dashed rounded-2xl text-xs font-medium text-gray-400">
                        No active discounts found for dealer's state ({editingOrder?.dealerKyc?.state || "N/A"}).
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Totals Summary ── */}
                <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-3 shadow-lg shadow-gray-900/10">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Live Order Summary</h4>
                  <div className="space-y-2 text-sm font-medium">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal (Excl. Tax)</span>
                      <span>₹{totals.baseSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>GST Tax Amount</span>
                      <span>₹{totals.totalGstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Gross Total (Incl. Tax)</span>
                      <span>₹{(totals.baseSubtotal + totals.totalGstAmount).toFixed(2)}</span>
                    </div>
                    
                    {totals.appliedDiscountsRecord.length > 0 && (
                      <div className="border-t border-gray-800/80 pt-2 space-y-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied Discounts</span>
                        {totals.appliedDiscountsRecord.map((d: any) => (
                          <div key={d.id} className="flex justify-between text-emerald-400 text-xs font-bold">
                            <span>{d.name} ({d.percentage}%)</span>
                            <span>- ₹{d.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-gray-800 pt-2 flex justify-between items-baseline">
                      <span className="font-black text-lg">Grand Total</span>
                      <span className="font-black text-2xl text-emerald-400">₹{totals.finalTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Modal Actions ── */}
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || editItems.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-xl transition-colors text-sm"
                >
                  {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
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
