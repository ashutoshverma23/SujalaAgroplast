import React, { useState, useEffect } from "react";
import {
  Calendar, Package, Clock, CheckCircle, Truck, IndianRupee,
  Loader2, Info, X, Eye, Download, FileText, Receipt,
  MessageSquare, Save, BadgeCheck, AlertCircle, XCircle, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';
import { generateInvoicePDF } from "../../utils/pdfGenerator";

// ── Status helpers ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Pending:    { color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200", icon: <Clock size={16} className="text-orange-500" /> },
  Processing: { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",   icon: <Package size={16} className="text-blue-500" /> },
  Dispatched: { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200", icon: <Truck size={16} className="text-purple-500" /> },
  Delivered:  { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",icon: <CheckCircle size={16} className="text-emerald-500" /> },
  Cancelled:  { color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",   icon: <XCircle size={16} className="text-rose-500" /> },
};

const paymentConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Approved:                { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <BadgeCheck size={14} className="text-emerald-600" /> },
  Pending:                 { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    icon: <AlertCircle size={14} className="text-rose-500" /> },
  "Paid (Waiting Approval)": { color: "text-blue-700",  bg: "bg-blue-50",    border: "border-blue-200",   icon: <Clock size={14} className="text-blue-500" /> },
  Rejected:                { color: "text-gray-700",    bg: "bg-gray-100",   border: "border-gray-200",   icon: <XCircle size={14} className="text-gray-500" /> },
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
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-emerald-600" />
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Payment Terms</span>
        </div>
        {saved && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
          >
            <CheckCircle size={10} /> Saved
          </motion.span>
        )}
      </div>

      {!editing && !order.paymentTerms && !text ? (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all text-sm font-medium"
        >
          <Pencil size={14} />
          Add payment terms (e.g. Payment on delivery, Cash, Credit...)
        </button>
      ) : !editing && order.paymentTerms ? (
        <div
          className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors group"
          onClick={() => setEditing(true)}
        >
          <p className="text-sm font-semibold text-gray-700 flex-1">{order.paymentTerms}</p>
          <Pencil size={14} className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5 transition-colors" />
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="e.g. Payment on delivery, Advance payment via UPI, Cash, Credit 30 days..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none text-sm font-medium text-gray-700 bg-white resize-none transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setText(order.paymentTerms || ""); setEditing(false); }}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-black rounded-lg transition-all shadow-sm"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Order Status Badge ─────────────────────────────────────────────────────
const StatusBadge = ({ status, type = "order" }: { status: string; type?: "order" | "payment" }) => {
  const cfg = type === "payment" ? paymentConfig[status] : statusConfig[status];
  if (!cfg) return <span className="text-xs font-bold text-gray-500">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      {status}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder]   = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder]   = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [paymentRef, setPaymentRef]   = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editItems,    setEditItems]    = useState<any[]>([]);
  const [savingEdit,   setSavingEdit]   = useState(false);

  useEffect(() => { fetchOrders(); }, []);

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

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingPayment(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ paymentReference: paymentRef })
      });
      if (res.ok) { setSelectedOrder(null); setPaymentRef(""); fetchOrders(); }
      else alert("Failed to mark as paid");
    } catch (e) { console.error(e); }
    finally { setSavingPayment(false); }
  };

  const handleViewDetails = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setViewingOrder(details);
  };

  const handleOpenInvoice = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setInvoiceOrder(details);
  };

  const handleEditOrder = async (order: any) => {
    const details = await fetchOrderDetails(order.id);
    if (details) { setEditingOrder(details); setEditItems(details.items.map((item: any) => ({ ...item }))); }
  };

  const handleEditItemChange = (idx: number, field: string, value: any) =>
    setEditItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleRemoveEditItem = (idx: number) =>
    setEditItems(items => items.filter((_, i) => i !== idx));

  const handleSaveEditOrder = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      const payload = { items: editItems.map(item => ({ id: item.id, priceId: item.priceId, quantity: Number(item.quantity) })) };
      const res = await fetch(`${BACKEND_URL}/api/orders/${editingOrder.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) { setEditingOrder(null); setEditItems([]); fetchOrders(); }
      else alert("Failed to update order");
    } catch { alert("Error updating order"); }
    finally { setSavingEdit(false); }
  };

  const handleUpdatePaymentTerms = async (orderId: string, paymentTerms: string) => {
    const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/payment-terms`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ paymentTerms })
    });
    if (res.ok) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, paymentTerms } : o));
      if (viewingOrder?.id === orderId) setViewingOrder({ ...viewingOrder, paymentTerms });
    }
  };

  // ── Order Card ─────────────────────────────────────────────────────────
  const OrderCard = ({ order }: { order: any }) => {
    const sCfg = statusConfig[order.status] ?? statusConfig["Pending"];

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-[1.75rem] overflow-hidden shadow-sm hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
      >
        {/* Card header strip */}
        <div className={`h-1.5 w-full ${sCfg.bg.replace("50", "400").replace("bg-", "bg-")}`}
          style={{ background: order.status === "Delivered" ? "#10b981" : order.status === "Dispatched" ? "#a855f7" : order.status === "Processing" ? "#3b82f6" : "#f97316" }}
        />

        <div className="p-5">
          {/* Top row: ID + badges */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
              <h4 className="font-black text-gray-900 text-lg leading-none">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
              <p className="text-xs font-semibold text-gray-400 mt-1.5 flex items-center gap-1.5">
                <Calendar size={11} />
                {new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} type="order" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
          </div>

          {/* Payment Terms */}
          <PaymentTermsEditor order={order} onSave={handleUpdatePaymentTerms} />

          {/* Payment reference */}
          {order.paymentReference && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <FileText size={12} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 font-medium">Ref:</span>
              <span className="text-xs font-black text-gray-700 truncate">{order.paymentReference}</span>
            </div>
          )}

          {/* Pending payment alert */}
          {order.paymentStatus === 'Pending' && (
            <div className="mt-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-3">
              <Info className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-rose-800 font-bold">Payment required to process this order.</p>
                <p className="text-[10px] text-rose-500 mt-0.5">Pay via Bank Transfer or UPI to Sujala Agro.</p>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="mt-2 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-lg hover:bg-rose-700 transition-colors"
                >
                  I have made the payment →
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleViewDetails(order.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors"
            >
              <Eye size={13} /> Details
            </button>
            <button
              onClick={() => handleOpenInvoice(order.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors"
            >
              <Receipt size={13} /> Invoice
            </button>
            {order.status === 'Pending' && (
              <button
                onClick={() => handleEditOrder(order)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Orders</h2>
          <p className="text-gray-500 font-medium mt-1">Track and manage your orders</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{orders.length} Total</span>
        </div>
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-300" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">No orders yet</h4>
          <p className="text-gray-400 mt-2 text-sm">Add products to cart and place your first order.</p>
        </div>
      )}

      {/* ── Edit Order Modal ── */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-500">
                <div>
                  <h3 className="text-xl font-black text-white">Edit Order</h3>
                  <p className="text-blue-200 text-sm font-medium mt-0.5">ORD-{editingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setEditingOrder(null)} className="p-2 text-blue-200 hover:bg-blue-700 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
                {editItems.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No items in order.</p>
                ) : editItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.variantName} · {item.width} · {item.length} · {item.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Qty</label>
                      <input
                        type="number" min={1} value={item.quantity}
                        onChange={e => handleEditItemChange(idx, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm font-black text-gray-900 text-center outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveEditItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button onClick={() => setEditingOrder(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button
                  disabled={savingEdit || editItems.length === 0}
                  onClick={handleSaveEditOrder}
                  className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingEdit && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-700 to-emerald-500">
                <div>
                  <h3 className="text-xl font-black text-white">Submit Payment</h3>
                  <p className="text-emerald-200 text-sm font-medium mt-0.5">ORD-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-emerald-200 hover:bg-emerald-700 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="p-5 bg-emerald-50 border-b border-emerald-100">
                <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-3">Bank Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank</p>
                    <p className="font-bold text-gray-900 mt-0.5">HDFC Bank</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</p>
                    <p className="font-bold text-gray-900 mt-0.5">50200000123456</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">IFSC</p>
                    <p className="font-bold text-gray-900 mt-0.5">HDFC0001234</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI</p>
                    <p className="font-bold text-gray-900 mt-0.5">sujala@hdfcbank</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">Transaction ID / UTR Number</label>
                  <input
                    type="text" required value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900"
                    placeholder="e.g. UTR1234567890"
                  />
                  <p className="text-xs text-gray-400 mt-2">Admin will verify and approve your order manually.</p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit" disabled={savingPayment}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    {savingPayment && <Loader2 size={16} className="animate-spin" />}
                    Submit Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <button onClick={() => setViewingOrder(null)} className="p-2 text-gray-400 hover:bg-gray-700 rounded-xl transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Status</p>
                    <StatusBadge status={viewingOrder.status} type="order" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</p>
                    <StatusBadge status={viewingOrder.paymentStatus} type="payment" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" />
                      {new Date(viewingOrder.orderDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                {/* Payment terms display */}
                {viewingOrder.paymentTerms && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <MessageSquare size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Payment Terms</p>
                      <p className="text-sm font-semibold text-amber-900">{viewingOrder.paymentTerms}</p>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package size={16} className="text-emerald-500" /> Ordered Items
                  </h4>
                  <div className="rounded-2xl border border-gray-100 overflow-hidden">
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
                        {viewingOrder.items.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-400">{item.variantName}</p>
                            </td>
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

                {/* Transaction ref */}
                {viewingOrder.paymentReference && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <FileText size={16} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-0.5">Transaction Reference</p>
                      <p className="font-black text-emerald-900">{viewingOrder.paymentReference}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-2xl font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                    <IndianRupee size={20} />
                    {viewingOrder.totalAmount || viewingOrder.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0)}
                  </p>
                </div>
                <button
                  onClick={() => { setViewingOrder(null); handleOpenInvoice(viewingOrder.id); }}
                  className="px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Receipt size={18} /> View Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Invoice Modal ── */}
      <AnimatePresence>
        {invoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-700 rounded-xl"><Receipt size={20} className="text-white" /></div>
                  <div>
                    <h3 className="text-xl font-black text-white">Invoice</h3>
                    <p className="text-xs font-bold text-emerald-300">ORD-{invoiceOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setInvoiceOrder(null)} className="p-2 text-emerald-300 hover:bg-emerald-700 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-gray-900">SUJALA AGRO INDUSTRIES</p>
                    <p className="text-sm text-gray-500 font-medium">Quality Mulching Solutions</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Invoice Details</p>
                    <p className="text-sm font-bold text-gray-700">Date: {new Date(invoiceOrder.orderDate).toLocaleDateString('en-GB')}</p>
                    <p className="text-sm font-bold text-gray-700">Status: <span className="text-emerald-600">{invoiceOrder.status}</span></p>
                    <p className="text-sm font-bold text-gray-700">Payment: <span className={invoiceOrder.paymentStatus === 'Approved' ? 'text-emerald-600' : invoiceOrder.paymentStatus === 'Pending' ? 'text-rose-500' : 'text-blue-600'}>{invoiceOrder.paymentStatus}</span></p>
                  </div>
                </div>
                {invoiceOrder.paymentTerms && (
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm bg-amber-50">
                    <MessageSquare size={14} className="text-amber-500" />
                    <span className="font-bold text-gray-500">Payment Terms:</span>
                    <span className="font-semibold text-gray-700">{invoiceOrder.paymentTerms}</span>
                  </div>
                )}
                {invoiceOrder.paymentReference && (
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-emerald-500" />
                    <span className="font-bold text-gray-500">Transaction Ref:</span>
                    <span className="font-black text-gray-900">{invoiceOrder.paymentReference}</span>
                  </div>
                )}
                <div className="p-6">
                  <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Order Items</h4>
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-emerald-900 text-white">
                          <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wider">Product</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Spec</th>
                          <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wider">Qty</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Unit</th>
                          <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceOrder.items.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3"><p className="font-bold text-gray-900">{item.productName}</p><p className="text-xs text-gray-500">{item.variantName}</p></td>
                            <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.width} · {item.length} · {item.type}</td>
                            <td className="px-4 py-3 text-center font-black text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">₹{item.unitPrice}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">₹{item.quantity * item.unitPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-900 rounded-2xl">
                    <p className="font-black text-emerald-200 text-sm uppercase tracking-widest">Grand Total</p>
                    <p className="text-2xl font-black text-white flex items-center gap-1">
                      <IndianRupee size={20} />
                      {invoiceOrder.totalAmount || invoiceOrder.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0)}
                    </p>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-4 italic">This is a computer generated invoice.</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setInvoiceOrder(null)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Close</button>
                <button
                  onClick={() => generateInvoicePDF(invoiceOrder)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                >
                  <Download size={18} /> Download PDF
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
              <p className="font-bold text-gray-900">Loading details...</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
