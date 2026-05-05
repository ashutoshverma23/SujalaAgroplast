import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Truck, Info, Check, X as XIcon, Loader2 } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpdatePayment = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/payment-status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ paymentStatus: status })
      });
      if (res.ok) fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchOrders();
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h3>
          <p className="text-gray-500 font-medium mt-1">Approve payments and update order statuses.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left Side: Order Info */}
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50">
                    <StatusIcon status={order.status} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg">ORD-{order.id.slice(0, 8).toUpperCase()}</h4>
                    <p className="text-sm font-bold text-gray-400 mt-1">
                      {new Date(order.orderDate).toLocaleDateString()}
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
                    <span className={`text-sm font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      order.paymentStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                      order.paymentStatus === "Rejected" ? "bg-rose-100 text-rose-700" :
                      order.paymentStatus === "Paid (Waiting Approval)" ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
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

                {/* Right: Order Status */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
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
    </div>
  );
}
