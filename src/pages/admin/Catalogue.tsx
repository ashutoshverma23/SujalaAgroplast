import { useState, useEffect } from "react";
import { Loader2, Edit3, Save, X } from "lucide-react";
import { BACKEND_URL } from '../../config';

/**
 * For each product we derive the exact set of widths / lengths / types
 * that actually have prices, so we never render empty columns.
 *
 * Products whose only width is "N/A" (valueMm === 0) hide the Width column.
 * Products with only one type hide the type sub-header row.
 */

const ProductTable = ({ product, allVariants, allWidths, allLengths, allTypes, allPrices, onRefresh }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState("ALL");

  const variants = allVariants.filter((v: any) => v.productId === product.id);

  // ── Derive the exact dimensions used by this product ─────────────────────
  const productPrices = allPrices.filter((p: any) =>
    variants.some((v: any) => v.id === p.variantId)
  );

  const usedWidthIds  = new Set(productPrices.map((p: any) => p.widthId));
  const usedLengthIds = new Set(productPrices.map((p: any) => p.lengthId));
  const usedTypeIds   = new Set(productPrices.map((p: any) => p.typeId));

  const activeWidths  = allWidths.filter((w: any) => usedWidthIds.has(w.id)).sort((a: any, b: any) => a.valueMm - b.valueMm);
  const activeLengths = allLengths.filter((l: any) => usedLengthIds.has(l.id)).sort((a: any, b: any) => a.valueM - b.valueM);
  const activeTypes   = allTypes.filter((t: any) => usedTypeIds.has(t.id));

  // Width column is pointless when the only width is N/A (valueMm === 0)
  const showWidthCol  = !(activeWidths.length === 1 && activeWidths[0].valueMm === 0);
  // Type sub-header row is pointless when there is only one type
  const showTypeRow   = activeTypes.length > 1;

  const getPrice = (variantId: string, widthId: string, lengthId: string, typeId: string) => {
    const p = productPrices.find(
      (p: any) =>
        p.variantId === variantId &&
        p.widthId   === widthId   &&
        p.lengthId  === lengthId  &&
        p.typeId    === typeId
    );
    return p ? p.price : null;
  };

  const makeKey = (vId: string, wId: string, lId: string, tId: string) =>
    `${vId}|${wId}|${lId}|${tId}`;

  const handlePriceChange = (vId: string, wId: string, lId: string, tId: string, value: string) => {
    const key    = makeKey(vId, wId, lId, tId);
    const parsed = parseInt(value);
    setEditedPrices(prev => ({ ...prev, [key]: isNaN(parsed) ? 0 : parsed }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updates = Object.entries(editedPrices).map(([key, price]) => {
      const [variantId, widthId, lengthId, typeId] = key.split("|");
      return { variantId, widthId, lengthId, typeId, price };
    });

    if (updates.length === 0) { setIsEditing(false); setIsSaving(false); return; }

    try {
      const res = await fetch(`${BACKEND_URL}/api/products/catalogue`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) { setEditedPrices({}); setIsEditing(false); onRefresh(); }
      else { const err = await res.json(); console.error("Failed to save:", err.message); }
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const filteredVariants = activeFilter === "ALL"
    ? variants
    : variants.filter((v: any) => v.id === activeFilter);

  if (variants.length === 0 || productPrices.length === 0) return null;

  // When width is hidden, we use the single N/A width's id for lookups
  const singleWidthId = !showWidthCol ? activeWidths[0]?.id : null;

  // Column count for the type-span header
  const typeColCount = showTypeRow ? activeTypes.length : 1;

  let srNo = 1;

  return (
    <div className="space-y-4 mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{product.name}</h3>
          <p className="text-gray-500 font-medium mt-1">{product.category} pricing matrix.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">All Variants</option>
            {variants.map((v: any) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
            >
              <Edit3 size={18} /><span>Edit Prices</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setIsEditing(false); setEditedPrices({}); }} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all">
                <X size={18} /><span>Cancel</span>
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-sm">
            <thead>
              <tr className="bg-emerald-900 text-white">
                <th rowSpan={showTypeRow ? 2 : 1} className="border border-emerald-800 px-4 py-3 font-black text-xs uppercase tracking-widest w-16">Sr.No.</th>
                <th rowSpan={showTypeRow ? 2 : 1} className="border border-emerald-800 px-4 py-3 font-black text-xs uppercase tracking-widest min-w-[150px]">Variant</th>
                {showWidthCol && (
                  <th rowSpan={showTypeRow ? 2 : 1} className="border border-emerald-800 px-4 py-3 font-black text-xs uppercase tracking-widest min-w-[180px]">Width</th>
                )}
                {activeLengths.map((len: any) => (
                  <th
                    key={len.id}
                    colSpan={typeColCount}
                    className="border border-emerald-800 px-4 py-3 font-black text-xs uppercase tracking-widest"
                  >
                    {len.label}
                  </th>
                ))}
              </tr>
              {showTypeRow && (
                <tr className="bg-emerald-800 text-emerald-100">
                  {activeLengths.map((len: any) =>
                    activeTypes.map((type: any) => (
                      <th key={`${len.id}-${type.id}`} className="border border-emerald-700/50 px-3 py-2 font-bold text-[10px] uppercase tracking-wider">
                        {type.name}
                      </th>
                    ))
                  )}
                </tr>
              )}
            </thead>
            <tbody className="bg-white">
              {filteredVariants.map((variant: any, vIdx: number) => {
                // Which widths does this variant actually use?
                const variantPrices = productPrices.filter((p: any) => p.variantId === variant.id);
                const variantWidthIds = new Set(variantPrices.map((p: any) => p.widthId));
                const rowWidths = showWidthCol
                  ? activeWidths.filter((w: any) => variantWidthIds.has(w.id))
                  : [{ id: singleWidthId }]; // single N/A width, hidden

                if (rowWidths.length === 0) return null;

                return rowWidths.map((width: any, wIdx: number) => {
                  const isFirstRow = wIdx === 0;
                  const rowClass   = vIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50";

                  return (
                    <tr key={`${variant.id}-${width.id}`} className={`hover:bg-emerald-50/50 transition-colors ${rowClass}`}>
                      <td className="border border-gray-200 px-2 py-2 font-medium text-gray-500">{srNo++}</td>

                      {isFirstRow && (
                        <td
                          rowSpan={rowWidths.length}
                          className="border border-gray-200 px-4 py-2 font-black text-emerald-800 bg-emerald-50/30 text-lg"
                        >
                          {variant.name}
                        </td>
                      )}

                      {showWidthCol && (
                        <td className="border border-gray-200 px-4 py-2 font-bold text-gray-700 text-left">
                          {width.label}
                        </td>
                      )}

                      {activeLengths.map((len: any) => {
                        const typesToRender = showTypeRow ? activeTypes : activeTypes; // always iterate types
                        return typesToRender.map((type: any) => {
                          const lookupWidthId = showWidthCol ? width.id : singleWidthId;
                          const original = getPrice(variant.id, lookupWidthId, len.id, type.id);
                          const key = makeKey(variant.id, lookupWidthId!, len.id, type.id);
                          const current = editedPrices[key] !== undefined ? editedPrices[key] : original;

                          return (
                            <td key={`${len.id}-${type.id}`} className="border border-gray-200 px-2 py-2 font-medium text-gray-900">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={current ?? ""}
                                  onChange={(e) => handlePriceChange(variant.id, lookupWidthId!, len.id, type.id, e.target.value)}
                                  className="w-20 px-1 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-emerald-700 bg-white"
                                />
                              ) : (
                                current != null ? `₹${current}` : <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        });
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Catalogue = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/products/catalogue`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!data) return <div>Failed to load catalogue data.</div>;

  const { products, variants, widths, lengths, types, prices } = data;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Product Catalogue</h2>
        <p className="text-gray-500 font-medium mt-1">Manage complete pricing matrix for all products.</p>
      </div>

      <div>
        {products?.map((product: any) => (
          <ProductTable
            key={product.id}
            product={product}
            allVariants={variants}
            allWidths={widths}
            allLengths={lengths}
            allTypes={types}
            allPrices={prices}
            onRefresh={fetchData}
          />
        ))}
      </div>
    </div>
  );
};

export default Catalogue;
