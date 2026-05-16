import { useState, useEffect } from "react";
import { Loader2, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import type { DealerPage } from "../../components/sidebar/DealerSidebar";
import { BACKEND_URL } from '../../config';

export default function Cart({ setPage }: { setPage: (p: DealerPage) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("Failed to fetch cart:", data);
        setItems([]);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (id: number, newQty: number) => {
    if (newQty < 1) {
      removeItem(id);
      return;
    }
    // Optimistic update
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    
    try {
      await fetch(`${BACKEND_URL}/api/cart/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ quantity: newQty })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const removeItem = async (id: number) => {
    setItems(items.filter(i => i.id !== id));
    try {
      await fetch(`${BACKEND_URL}/api/cart/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setItems([]);
        setPage("ORDERS");
      } else {
        alert("Failed to place order.");
      }
    } catch (e) {
      console.error(e);
      alert("Error placing order.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h2>
        <p className="text-gray-500 font-medium mt-1">Review your items before checkout</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any products to your cart yet.</p>
          <button 
            onClick={() => setPage("PRODUCTS")}
            className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto"
          >
            Browse Products <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                    <ShoppingBag size={28} className="text-emerald-500/50" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-black text-gray-900 truncate">{item.productName}</h4>
                    <p className="text-sm font-bold text-gray-500 mt-0.5 truncate">{item.variantName}</p>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">{item.widthLabel} • {item.lengthLabel} • {item.typeName}</p>
                  </div>
                </div>

                {/* Price + Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-emerald-600">₹{item.unitPrice}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit Price</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-white rounded-xl text-gray-500 transition-colors">
                      <Minus size={15} />
                    </button>
                    <span className="w-7 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-white rounded-xl text-gray-500 transition-colors">
                      <Plus size={15} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 sticky top-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-gray-500 font-medium">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="text-gray-900 font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500 font-medium">
                  <span>Shipping</span>
                  <span className="text-gray-900 font-bold">Calculated later</span>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-black">Total Amount</span>
                  <span className="text-3xl font-black text-emerald-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={handleCheckout} 
                disabled={checkingOut}
                className="w-full py-4 bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {checkingOut ? <Loader2 className="animate-spin" size={20} /> : "Checkout Now"} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
