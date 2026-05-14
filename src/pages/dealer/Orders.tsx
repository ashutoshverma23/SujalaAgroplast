import { useState, useEffect } from "react";
import { Calendar, Package, Clock, CheckCircle, Truck, IndianRupee, Loader2, Info, X, Eye, Download, FileText, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingPayment(true);

    try {
      const res = await fetch(`http://localhost:3000/api/orders/${selectedOrder.id}/mark-paid`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ paymentReference: paymentRef })
      });

      if (res.ok) {
        setSelectedOrder(null);
        setPaymentRef("");
        fetchOrders();
      } else {
        alert("Failed to mark as paid");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPayment(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    setFetchingDetails(true);
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingDetails(false);
    }
    return null;
  };

  const handleViewDetails = async (orderId: number) => {
    const details = await fetchOrderDetails(orderId);
    if (details) {
      setViewingOrder(details);
    }
  };

  const handleOpenInvoice = async (orderId: number) => {
    const details = await fetchOrderDetails(orderId);
    if (details) setInvoiceOrder(details);
  };

  const handleDownloadInvoice = (details: any) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [16, 185, 129];

    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SUJALA AGRO INDUSTRIES", 20, 50);
    doc.text("Quality Mulching Solutions", 20, 55);
    doc.text(`Order ID: ORD-${details.id.slice(0, 8).toUpperCase()}`, 140, 50);
    doc.text(`Date: ${new Date(details.orderDate).toLocaleDateString('en-GB')}`, 140, 55);
    doc.text(`Status: ${details.status}`, 140, 60);

    doc.setDrawColor(229, 231, 235);
    doc.line(20, 70, 190, 70);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Information", 20, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Status: ${details.paymentStatus}`, 20, 90);
    doc.text(`Transaction ID: ${details.paymentReference || 'N/A'}`, 20, 95);

    const tableData = details.items.map((item: any) => [
      `${item.productName} - ${item.variantName}`,
      `${item.width} x ${item.length}`,
      item.type,
      item.quantity,
      `INR ${item.unitPrice}`,
      `INR ${item.quantity * item.unitPrice}`
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Product Details', 'Size', 'Type', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 150;
    const total = details.totalAmount || details.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: INR ${total}`, 190, finalY + 15, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(156, 163, 175);
    doc.text("This is a computer generated invoice.", 105, 280, { align: "center" });

    doc.save(`Invoice_ORD_${details.id.slice(0, 8).toUpperCase()}.pdf`);
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

  const OrderCard = ({ order }: { order: any }) => (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group relative">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gray-50">
            <StatusIcon status={order.status} />
          </div>
          <div>
            <h4 className="font-black text-gray-900 text-lg">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
            <p className="text-sm font-bold text-gray-400 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              {new Date(order.orderDate).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block ${
            order.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
            order.status === "Dispatched" ? "bg-purple-100 text-purple-700" :
            order.status === "Processing" ? "bg-blue-100 text-blue-700" :
            "bg-orange-100 text-orange-700"
          }`}>
            {order.status}
          </span>
          <div className="mt-2 text-xs font-bold text-gray-500 uppercase">
            Pay: <span className={
              order.paymentStatus === 'Approved' ? 'text-emerald-600' :
              order.paymentStatus === 'Pending' ? 'text-rose-500' : 'text-blue-600'
            }>{order.paymentStatus}</span>
          </div>
        </div>
      </div>
      
      {order.paymentStatus === 'Pending' && (
        <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
          <div className="flex items-start gap-3">
            <Info className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm text-rose-800 font-medium">Payment is required to process this order.</p>
              <p className="text-xs text-rose-600 mt-1">Please pay using Bank Transfer or UPI to Sujala Agro.</p>
              <button 
                onClick={() => setSelectedOrder(order)}
                className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-rose-700 transition-colors"
              >
                I have made the payment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-3">
        {order.paymentReference && (
          <p className="text-xs text-gray-400 font-medium truncate w-full mb-1">Ref: {order.paymentReference}</p>
        )}
        <button 
          onClick={() => handleViewDetails(order.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
        >
          <Eye size={14} />
          View Details
        </button>
        <button 
          onClick={() => handleOpenInvoice(order.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
        >
          <Receipt size={14} />
          Invoice
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Your Orders</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">No orders found</h4>
          <p className="text-gray-500 mt-2">You haven't placed any orders yet.</p>
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Submit Payment Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <h4 className="font-bold text-gray-700 mb-2">Payment Instructions</h4>
                <p className="text-sm text-gray-600 mb-1">Bank: HDFC Bank</p>
                <p className="text-sm text-gray-600 mb-1">A/C: 50200000123456</p>
                <p className="text-sm text-gray-600 mb-3">IFSC: HDFC0001234</p>
                <p className="text-sm text-gray-600 font-bold border-t border-gray-200 pt-2">Or UPI: sujala@hdfcbank</p>
              </div>

              <form onSubmit={handleMarkPaid} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Transaction ID / UTR Number</label>
                  <input type="text" required value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. UTR1234567890" />
                  <p className="text-xs text-gray-400 mt-2">Admin will verify this reference manually and approve your order.</p>
                </div>
                
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={savingPayment} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                    {savingPayment && <Loader2 size={16} className="animate-spin" />}
                    Submit Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">Order Details</h3>
                  <p className="text-sm font-bold text-gray-400">#ORD-{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button onClick={() => setViewingOrder(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status & Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={viewingOrder.status} />
                      <span className="font-bold text-gray-900">{viewingOrder.status}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                    <span className={`font-bold ${
                      viewingOrder.paymentStatus === 'Approved' ? 'text-emerald-600' :
                      viewingOrder.paymentStatus === 'Pending' ? 'text-rose-500' : 'text-blue-600'
                    }`}>{viewingOrder.paymentStatus}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                    <span className="font-bold text-gray-900">
                      {new Date(viewingOrder.orderDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-emerald-500" />
                    Ordered Items
                  </h4>
                  <div className="space-y-3">
                    {viewingOrder.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Package size={24} />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900">{item.productName}</h5>
                            <p className="text-xs text-gray-500 font-medium">
                              {item.variantName} • {item.width} • {item.length} • {item.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">Qty: {item.quantity}</p>
                          <p className="text-xs text-emerald-600 font-bold">₹{item.unitPrice} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Reference */}
                {viewingOrder.paymentReference && (
                  <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      Transaction Details
                    </h4>
                    <p className="text-lg font-black text-emerald-900">{viewingOrder.paymentReference}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-medium italic">Submitted for verification</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-2xl font-black text-emerald-600 flex items-center gap-1 justify-end">
                    <IndianRupee size={20} />
                    {viewingOrder.totalAmount || viewingOrder.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0)}
                  </p>
                </div>
                <button 
                  onClick={() => { setViewingOrder(null); handleOpenInvoice(viewingOrder.id); }}
                  className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Receipt size={20} />
                  View Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Invoice Modal */}
      <AnimatePresence>
        {invoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* Invoice Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-700 rounded-xl">
                    <Receipt size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Invoice</h3>
                    <p className="text-xs font-bold text-emerald-300">ORD-{invoiceOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setInvoiceOrder(null)} className="p-2 text-emerald-300 hover:bg-emerald-700 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Invoice Body */}
              <div className="flex-1 overflow-y-auto">
                {/* Company + Order Info */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="text-lg font-black text-gray-900">SUJALA AGRO INDUSTRIES</p>
                    <p className="text-sm text-gray-500 font-medium">Quality Mulching Solutions</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Invoice Details</p>
                    <p className="text-sm font-bold text-gray-700">Date: {new Date(invoiceOrder.orderDate).toLocaleDateString('en-GB')}</p>
                    <p className="text-sm font-bold text-gray-700">Status: <span className="text-emerald-600">{invoiceOrder.status}</span></p>
                    <p className="text-sm font-bold text-gray-700">Payment: <span className={invoiceOrder.paymentStatus === 'Approved' ? 'text-emerald-600' : invoiceOrder.paymentStatus === 'Pending' ? 'text-rose-500' : 'text-blue-600'}>{invoiceOrder.paymentStatus}</span></p>
                  </div>
                </div>

                {/* Payment Reference */}
                {invoiceOrder.paymentReference && (
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-sm">
                    <FileText size={14} className="text-emerald-500" />
                    <span className="font-bold text-gray-500">Transaction Ref:</span>
                    <span className="font-black text-gray-900">{invoiceOrder.paymentReference}</span>
                  </div>
                )}

                {/* Items Table */}
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

                {/* Total */}
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

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setInvoiceOrder(null)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Close
                </button>
                <button
                  onClick={() => handleDownloadInvoice(invoiceOrder)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Loader for fetching details */}
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
