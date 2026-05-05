import { useState, useEffect } from "react";
import { Search, Loader2, ShoppingCart, CheckCircle, PackageSearch } from "lucide-react";

const ProductCard = ({ product, allVariants, allWidths, allLengths, allTypes, allPrices }: any) => {
  const variants = allVariants.filter((v: any) => v.productId === product.id);
  
  const [variantId, setVariantId] = useState<number>(variants[0]?.id || "");
  const [widthId, setWidthId] = useState<number | "">("");
  const [lengthId, setLengthId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);

  // Available options
  const availablePrices = allPrices.filter((p: any) => p.variantId === variantId);
  const availableWidths = allWidths.filter((w: any) => availablePrices.some((p: any) => p.widthId === w.id));
  
  useEffect(() => {
    if (availableWidths.length > 0 && !availableWidths.find((w:any) => w.id === widthId)) {
      setWidthId(availableWidths[0].id);
    }
  }, [variantId, availableWidths]);

  const availablePricesForWidth = availablePrices.filter((p: any) => p.widthId === widthId);
  const availableLengths = allLengths.filter((l: any) => availablePricesForWidth.some((p: any) => p.lengthId === l.id));

  useEffect(() => {
    if (availableLengths.length > 0 && !availableLengths.find((l:any) => l.id === lengthId)) {
      setLengthId(availableLengths[0].id);
    }
  }, [widthId, availableLengths]);

  const availablePricesForLength = availablePricesForWidth.filter((p: any) => p.lengthId === lengthId);
  const availableTypes = allTypes.filter((t: any) => availablePricesForLength.some((p: any) => p.typeId === t.id));

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.find((t:any) => t.id === typeId)) {
      setTypeId(availableTypes[0].id);
    }
  }, [lengthId, availableTypes]);

  const finalPrice = availablePricesForLength.find((p: any) => p.typeId === typeId);

  const handleAddToCart = async () => {
    if (!finalPrice || quantity < 1) return;
    
    try {
      const res = await fetch("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ priceId: finalPrice.id, quantity })
      });

      if (res.ok) {
        setAdded(true);
        // Reset quantity for adding more of the same or another variant
        setQuantity(1);
        setTimeout(() => setAdded(false), 2000);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to add to cart");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding to cart");
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 border-b border-gray-100 relative">
        <PackageSearch className="absolute right-4 top-4 text-emerald-200 w-16 h-16 opacity-50" />
        <h3 className="text-2xl font-black text-emerald-900 relative z-10">{product.name}</h3>
        <p className="text-sm text-emerald-600/80 font-medium relative z-10 mt-1">Configure your order</p>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-5">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Product Variant</label>
          <select value={variantId} onChange={e => setVariantId(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 transition-shadow">
            {variants.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Width</label>
            <select value={widthId} onChange={e => setWidthId(Number(e.target.value))} disabled={availableWidths.length === 0} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow">
              {availableWidths.map((w: any) => <option key={w.id} value={w.id}>{w.label}</option>)}
              {availableWidths.length === 0 && <option value="">N/A</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Length</label>
            <select value={lengthId} onChange={e => setLengthId(Number(e.target.value))} disabled={availableLengths.length === 0} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow">
              {availableLengths.map((l: any) => <option key={l.id} value={l.id}>{l.label}</option>)}
              {availableLengths.length === 0 && <option value="">N/A</option>}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Film Type</label>
          <select value={typeId} onChange={e => setTypeId(Number(e.target.value))} disabled={availableTypes.length === 0} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow">
            {availableTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            {availableTypes.length === 0 && <option value="">N/A</option>}
          </select>
        </div>
        
        <div className="mt-auto pt-5 border-t border-gray-100">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unit Price</p>
              {finalPrice ? (
                <p className="text-3xl font-black text-emerald-600">₹{finalPrice.price}</p>
              ) : (
                <p className="text-lg font-bold text-gray-400">Not Available</p>
              )}
            </div>
            <div className="w-24">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Qty</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} disabled={!finalPrice} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-black text-gray-900 disabled:opacity-50 transition-shadow" />
            </div>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={!finalPrice || added}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-lg transition-all duration-300 ${
              added ? 'bg-emerald-100 text-emerald-700' : 
              !finalPrice ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5'
            }`}
          >
            {added ? <CheckCircle size={22} /> : <ShoppingCart size={22} />}
            <span>{added ? 'Added to Cart' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Products() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCatalogue = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/products/catalogue");
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;
  }

  const { products, variants, lengths, widths, types, prices } = data;
  
  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Product Catalogue</h2>
          <p className="text-gray-500 font-medium mt-1">Configure and add products to your cart</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product: any) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            allVariants={variants} 
            allWidths={widths} 
            allLengths={lengths} 
            allTypes={types} 
            allPrices={prices} 
          />
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageSearch size={32} className="text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">No products found</h4>
            <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
