import { useState, useEffect } from "react";
import { Search, Loader2, ShoppingCart, CheckCircle, PackageSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';

/**
 * ProductCard dynamically derives which selectors to show:
 *  - Width selector hidden when the only width is N/A (valueMm === 0)
 *  - Type selector hidden when there is only one type available
 * This keeps the UI clean for Rain Pipe / Drip products vs Mulch Film.
 */
const ProductCard = ({ product, allVariants, allWidths, allLengths, allTypes, allPrices, onCartChange, onAddToCartSuccess }: any) => {
  const variants = allVariants.filter((v: any) => v.productId === product.id);

  // ── Derive per-product active dimensions ───────────────────────────────
  const productPrices = allPrices.filter((p: any) =>
    variants.some((v: any) => v.id === p.variantId)
  );
  const usedWidthIds = new Set(productPrices.map((p: any) => p.widthId));
  const usedTypeIds  = new Set(productPrices.map((p: any) => p.typeId));

  const productWidths = allWidths.filter((w: any) => usedWidthIds.has(w.id));
  const productTypes  = allTypes.filter((t: any) => usedTypeIds.has(t.id));

  // Hide Width selector when only N/A (valueMm === 0) exists
  const showWidth = !(productWidths.length === 1 && productWidths[0].valueMm === 0);
  // Hide Type selector when only one type exists
  const showType  = productTypes.length > 1;

  // The single fixed IDs when a selector is hidden
  const fixedWidthId = !showWidth ? productWidths[0]?.id : null;
  const fixedTypeId  = !showType  ? productTypes[0]?.id  : null;

  // ── State ──────────────────────────────────────────────────────────────
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? "");
  const [widthId,   setWidthId]   = useState<string>("");
  const [lengthId,  setLengthId]  = useState<string>("");
  const [typeId,    setTypeId]    = useState<string>("");
  const [quantity,  setQuantity]  = useState<number>(1);
  const [added,     setAdded]     = useState(false);

  // ── Cascading filter logic ─────────────────────────────────────────────
  const availablePrices = allPrices.filter((p: any) => p.variantId === variantId);

  // Width
  const availableWidths = showWidth
    ? allWidths.filter((w: any) => availablePrices.some((p: any) => p.widthId === w.id))
    : [];

  useEffect(() => {
    if (!showWidth) {
      setWidthId(fixedWidthId ?? "");
      return;
    }
    if (availableWidths.length > 0 && !availableWidths.find((w: any) => w.id === widthId)) {
      setWidthId(availableWidths[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const effectiveWidthId = showWidth ? widthId : fixedWidthId;

  // Length
  const availablePricesForWidth = availablePrices.filter((p: any) => p.widthId === effectiveWidthId);
  const availableLengths = allLengths.filter((l: any) =>
    availablePricesForWidth.some((p: any) => p.lengthId === l.id)
  );

  useEffect(() => {
    if (availableLengths.length > 0 && !availableLengths.find((l: any) => l.id === lengthId)) {
      setLengthId(availableLengths[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveWidthId, availableLengths.map((l: any) => l.id).join()]);

  // Type
  const availablePricesForLength = availablePricesForWidth.filter((p: any) => p.lengthId === lengthId);
  const availableTypes = showType
    ? allTypes.filter((t: any) => availablePricesForLength.some((p: any) => p.typeId === t.id))
    : [];

  useEffect(() => {
    if (!showType) {
      setTypeId(fixedTypeId ?? "");
      return;
    }
    if (availableTypes.length > 0 && !availableTypes.find((t: any) => t.id === typeId)) {
      setTypeId(availableTypes[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengthId]);

  const effectiveTypeId = showType ? typeId : fixedTypeId;
  const finalPrice = availablePricesForLength.find((p: any) => p.typeId === effectiveTypeId);

  // ── Add to cart ────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!finalPrice || quantity < 1) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ priceId: finalPrice.id, quantity })
      });
      if (res.ok) {
        setAdded(true);
        onAddToCartSuccess?.(product.name, quantity);
        setQuantity(1);
        onCartChange?.(); // immediately refresh badge count in header
        setTimeout(() => setAdded(false), 2000);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to add to cart");
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
        <h3 className="text-xl font-black text-emerald-900 relative z-10 leading-tight">{product.name}</h3>
        <p className="text-xs text-emerald-600/80 font-medium relative z-10 mt-1 uppercase tracking-widest">{product.category}</p>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Variant */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Variant</label>
          <select
            value={variantId}
            onChange={e => setVariantId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 transition-shadow"
          >
            {variants.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {/* Width — only shown when product has meaningful width options */}
        {showWidth && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Width</label>
            <select
              value={widthId}
              onChange={e => setWidthId(e.target.value)}
              disabled={availableWidths.length === 0}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow"
            >
              {availableWidths.map((w: any) => <option key={w.id} value={w.id}>{w.label}</option>)}
              {availableWidths.length === 0 && <option value="">N/A</option>}
            </select>
          </div>
        )}

        {/* Length */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Length</label>
          <select
            value={lengthId}
            onChange={e => setLengthId(e.target.value)}
            disabled={availableLengths.length === 0}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow"
          >
            {availableLengths.map((l: any) => <option key={l.id} value={l.id}>{l.label}</option>)}
            {availableLengths.length === 0 && <option value="">N/A</option>}
          </select>
        </div>

        {/* Type — only shown when product has multiple types (e.g. PLAIN vs HOLE PUNCH) */}
        {showType && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Film Type</label>
            <select
              value={typeId}
              onChange={e => setTypeId(e.target.value)}
              disabled={availableTypes.length === 0}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-800 disabled:opacity-50 transition-shadow"
            >
              {availableTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              {availableTypes.length === 0 && <option value="">N/A</option>}
            </select>
          </div>
        )}

        {/* Price + Quantity + Button */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unit Price</p>
              {finalPrice ? (
                <p className="text-3xl font-black text-emerald-600">₹{finalPrice.price}</p>
              ) : (
                <p className="text-lg font-bold text-gray-400">Select options</p>
              )}
            </div>
            <div className="w-24">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Qty</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                disabled={!finalPrice}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-center outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-black text-gray-900 disabled:opacity-50 transition-shadow"
              />
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!finalPrice || added}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-base transition-all duration-300 ${
              added         ? "bg-emerald-100 text-emerald-700" :
              !finalPrice   ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
              "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5"
            }`}
          >
            {added ? <CheckCircle size={20} /> : <ShoppingCart size={20} />}
            <span>{added ? "Added to Cart" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Products({ onCartChange }: { onCartChange?: () => void }) {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [alert, setAlert]     = useState<{productName: string, quantity: number} | null>(null);

  const handleAddToCartSuccess = (productName: string, quantity: number) => {
    setAlert({ productName, quantity });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products/catalogue`)
      .then(res => res.json())
      .then(result => { setData(result); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;
  }

  const { products, variants, lengths, widths, types, prices } = data;
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group products by category for a cleaner layout
  const categories = [...new Set(filteredProducts.map((p: any) => p.category))] as string[];

  return (
    <div className="space-y-10">
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or category..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="col-span-full py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageSearch size={32} className="text-gray-400" />
          </div>
          <h4 className="text-xl font-bold text-gray-900">No products found</h4>
          <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
        </div>
      ) : (
        categories.map(category => {
          const catProducts = filteredProducts.filter((p: any) => p.category === category);
          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-lg font-black text-gray-700 uppercase tracking-widest">{category}</h3>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{catProducts.length} products</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {catProducts.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    allVariants={variants}
                    allWidths={widths}
                    allLengths={lengths}
                    allTypes={types}
                    allPrices={prices}
                    onCartChange={onCartChange}
                    onAddToCartSuccess={handleAddToCartSuccess}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Floating Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-4"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="font-black text-lg">Added to Cart!</p>
              <p className="text-emerald-100 font-medium text-sm">
                {alert.quantity}x {alert.productName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
