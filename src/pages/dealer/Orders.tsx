import React, { useState, useEffect } from "react";
import {
  Calendar, Package, Clock, CheckCircle, Truck, IndianRupee,
  Loader2, Info, X, Download, FileText, Receipt,
  MessageSquare, BadgeCheck, AlertCircle, XCircle, Pencil,
  ChevronLeft, ChevronRight
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function Orders({ setPage }: { setPage: (page: any) => void }) {
  const [pageNum, setPageNum] = useState(1);
  const ORDERS_PER_PAGE = 10;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder]   = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [paymentRef, setPaymentRef]   = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [orderToRestore, setOrderToRestore] = useState<any>(null);
  const [restoringOrder, setRestoringOrder] = useState(false);

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

  const handleOpenInvoice = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setInvoiceOrder(details);
  };

  const handleEditOrder = (order: any) => {
    setOrderToRestore(order);
  };

  const confirmRestoreOrder = async () => {
    if (!orderToRestore) return;
    setRestoringOrder(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderToRestore.id}/restore-to-cart`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setOrderToRestore(null);
        setPage("CART");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to restore order to cart");
      }
    } catch (e) {
      console.error(e);
      alert("Error restoring order to cart");
    } finally {
      setRestoringOrder(false);
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
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</span>
                <StatusBadge status={order.status} type="order" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</span>
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {order.paymentTerms && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-emerald-600" />
                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Payment Terms</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">{order.paymentTerms}</p>
            </div>
          )}

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {orders.slice((pageNum - 1) * ORDERS_PER_PAGE, pageNum * ORDERS_PER_PAGE).map(order => <OrderCard key={order.id} order={order} />)}
          </div>
          <Pagination
            total={orders.length}
            page={pageNum}
            perPage={ORDERS_PER_PAGE}
            onPage={(p) => { setPageNum(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
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

      {/* ── Restore Order / Edit Confirmation Modal ── */}
      <AnimatePresence>
        {orderToRestore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-amber-600 to-amber-500">
                <div>
                  <h3 className="text-xl font-black text-white">Edit Order</h3>
                  <p className="text-amber-100 text-sm font-medium mt-0.5">ORD-{orderToRestore.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setOrderToRestore(null)} className="p-2 text-amber-100 hover:bg-amber-700 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
                  <AlertCircle className="flex-shrink-0 mt-0.5 text-amber-600" size={20} />
                  <div>
                    <p className="font-bold text-sm">Important Notice</p>
                    <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                      Editing this order will cancel the pending order and restore all its items back to your shopping cart where you can modify quantities, add products, or check updated discounts.
                    </p>
                    <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                      Any items currently in your shopping cart will be cleared.
                    </p>
                  </div>
                </div>
                
                <p className="text-sm font-semibold text-gray-600">
                  Are you sure you want to proceed to the shopping cart to modify this order?
                </p>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setOrderToRestore(null)} 
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={restoringOrder}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={restoringOrder}
                  onClick={confirmRestoreOrder}
                  className="px-6 py-2.5 bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-all flex items-center gap-2"
                >
                  {restoringOrder && <Loader2 size={16} className="animate-spin" />}
                  Confirm & Edit
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
