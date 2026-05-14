import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Truck, Info, Check, X as XIcon, Loader2, Eye, Calendar, IndianRupee, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [dealers, setDealers] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDealer, setFilterDealer] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDealers(data.filter((u: any) => u.role === 'DEALER'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/orders", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    setFetchingDetails(true);
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingDetails(false);
    }
    return null;
  };

  const handleViewDetails = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setViewingOrder(details);
  };

  const handleUpdatePayment = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/payment-status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (res.ok) {
        fetchOrders();
        // Refresh viewing order if open
        if (viewingOrder?.id === orderId) {
          const details = await fetchOrderDetails(orderId);
          if (details) setViewingOrder(details);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
        if (viewingOrder?.id === orderId) {
          const details = await fetchOrderDetails(orderId);
          if (details) setViewingOrder(details);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "Pending": return <Clock className="text-orange-500" size={20} />;
      case "Processing": return <Package className="text-blue-500" size={20} />;
      case "Dispatched": return <Truck className="text-purple-500" size={20} />;
      case "Delivered": return <CheckCircle className="text-emerald-500" size={20} />;
      default: return <Package className="text-gray-500" size={20} />;
    }
  };

  const paymentBadge = (status: string) => {
    if (status === "Approved") return "bg-emerald-100 text-emerald-700";
    if (status === "Rejected") return "bg-rose-100 text-rose-700";
    if (status === "Paid (Waiting Approval)") return "bg-blue-100 text-blue-700";
    return "bg-orange-100 text-orange-700";
  };

  const filteredOrders = orders.filter(order => {
    let match = true;
    if (filterDate) {
      const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
      if (orderDate !== filterDate) match = false;
    }
    if (filterDealer) {
      if (order.dealerId !== filterDealer) match = false;
    }
    return match;
  });

  const handleDownloadInvoice = async (orderId: string) => {
    const details = await fetchOrderDetails(orderId);
    if (!details) return;

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text("Sujala Agro Plasts - INVOICE", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Order ID: ORD-${details.id.slice(0, 8).toUpperCase()}`, 14, 34);
    doc.text(`Order Date: ${new Date(details.orderDate).toLocaleDateString('en-GB')}`, 14, 40);
    doc.text(`Order Status: ${details.status}`, 14, 46);
    doc.text(`Payment Status: ${details.paymentStatus}`, 14, 52);
    
    doc.text(`Dealer ID: ${details.dealerId}`, 14, 62);

    const tableData = details.items?.map((item: any) => [
      `${item.productName}\n${item.variantName}`,
      `${item.width} • ${item.length} • ${item.type}`,
      item.quantity,
      `Rs ${item.unitPrice}`,
      `Rs ${item.quantity * item.unitPrice}`
    ]) || [];

    autoTable(doc, {
      startY: 70,
      head: [['Product', 'Specification', 'Quantity', 'Unit Price', 'Total Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [6, 78, 59] }, // emerald-900
      styles: { fontSize: 10, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;
    const totalAmount = details.totalAmount || details.items?.reduce((acc: number, i: any) => acc + i.quantity * i.unitPrice, 0);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: Rs ${totalAmount}`, 14, finalY + 12);
    
    doc.save(`Invoice_ORD-${details.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h3>
          <p className="text-gray-500 font-medium mt-1">Approve payments and update order statuses.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 bg-white transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Filter by Dealer</label>
          <select
            value={filterDealer}
            onChange={(e) => setFilterDealer(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-gray-700 bg-white transition-all"
          >
            <option value="">All Dealers</option>
            {dealers.map(dealer => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name} ({dealer.mobile})
              </option>
            ))}
          </select>
        </div>
        {(filterDate || filterDealer) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilterDate(""); setFilterDealer(""); }}
              className="px-4 py-2 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-colors text-sm font-bold h-[42px]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Left: Order Info */}
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50">
                    <StatusIcon status={order.status} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
                    <p className="text-sm font-bold text-gray-400 mt-1">
                      {new Date(order.orderDate).toLocaleDateString('en-GB')}
                    </p>
                    <p className="text-xs font-mono font-bold text-gray-400 mt-1 bg-gray-50 px-2 py-0.5 rounded-lg" title={order.dealerId}>
                      Dealer: {order.dealerId.slice(0, 8).toUpperCase()}...
                    </p>
                  </div>
                </div>

                {/* Middle: Payment Info */}
                <div className="flex-1 md:px-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Status</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full ${paymentBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.paymentReference && (
                    <p className="text-sm font-medium text-gray-600 mt-3 flex items-center gap-2">
                      <Info size={14} className="text-blue-500" /> Ref: {order.paymentReference}
                    </p>
                  )}
                  {order.paymentStatus === 'Paid (Waiting Approval)' && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleUpdatePayment(order.id, 'Approved')} className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleUpdatePayment(order.id, 'Rejected')} className="flex items-center gap-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-colors">
                        <XIcon size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Order Status + Actions */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Status</p>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 bg-gray-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleViewDetails(order.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <Download size={14} />
                      Invoice
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">No orders found</h4>
          <p className="text-gray-500 mt-2">There are no orders in the system.</p>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-900">
                <div>
                  <h3 className="text-2xl font-black text-white">Order Details</h3>
                  <p className="text-sm font-bold text-emerald-300 mt-0.5">#ORD-{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 text-emerald-300 hover:bg-emerald-700 rounded-full transition-colors">
                  <XIcon size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Status</p>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={viewingOrder.status} />
                      <span className="font-bold text-gray-900 text-sm">{viewingOrder.status}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${paymentBadge(viewingOrder.paymentStatus)}`}>
                      {viewingOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</p>
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                      <Calendar size={14} className="text-emerald-500" />
                      {new Date(viewingOrder.orderDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total</p>
                    <div className="flex items-center gap-1 font-black text-emerald-700 text-lg">
                      <IndianRupee size={16} />
                      {viewingOrder.totalAmount || viewingOrder.items?.reduce((acc: number, i: any) => acc + i.quantity * i.unitPrice, 0)}
                    </div>
                  </div>
                </div>

                {/* Dealer + Payment Ref */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-sm">
                  <p className="font-bold text-gray-500">Dealer ID: <span className="font-mono text-gray-900">{viewingOrder.dealerId}</span></p>
                  {viewingOrder.paymentReference && (
                    <p className="font-bold text-gray-500">Transaction Ref: <span className="font-black text-gray-900">{viewingOrder.paymentReference}</span></p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Ordered Items</h4>
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
                        {viewingOrder.items?.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-left">
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-500">{item.variantName}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.width} • {item.length} • {item.type}</td>
                            <td className="px-4 py-3 text-center font-black text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-700">₹{item.unitPrice}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">₹{item.quantity * item.unitPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions inside modal */}
                {viewingOrder.paymentStatus === 'Paid (Waiting Approval)' && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Info size={16} /> Payment awaiting your approval
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdatePayment(viewingOrder.id, 'Approved')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Check size={16} /> Approve Payment
                      </button>
                      <button
                        onClick={() => handleUpdatePayment(viewingOrder.id, 'Rejected')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors text-sm"
                      >
                        <XIcon size={16} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Update Status:</label>
                  <select
                    value={viewingOrder.status}
                    onChange={(e) => handleUpdateStatus(viewingOrder.id, e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDownloadInvoice(viewingOrder.id)} className="flex items-center gap-2 px-6 py-2.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-xl transition-all">
                    <Download size={16} /> Download Invoice
                  </button>
                  <button onClick={() => setViewingOrder(null)} className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Loader */}
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
