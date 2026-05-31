import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2, Save, X, Info } from "lucide-react";
import { BACKEND_URL } from "../../config";

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/discounts`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        setDiscounts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount: any) => {
    setEditingId(discount.id);
    setFormData({ ...discount });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingId === "NEW" ? "POST" : "PUT";
      const url = editingId === "NEW" ? `${BACKEND_URL}/api/discounts` : `${BACKEND_URL}/api/discounts/${editingId}`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchDiscounts();
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/discounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) fetchDiscounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNew = () => {
    setEditingId("NEW");
    setFormData({ name: "", percentage: 0, conditionType: "manual_selection", conditionValue: 0, sequence: 0, isActive: true });
  };

  return (
    <div className="space-y-8 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Discounts</h2>
          <p className="text-gray-500 font-medium mt-1">Manage compounding discount rules applied at checkout.</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={editingId === "NEW"}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          <Plus size={18} /> Add New Discount
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-blue-900">How Compounding works</h4>
          <p className="text-xs font-medium text-blue-800/80 mt-1">
            Discounts are applied on the total (after GST) in the order of their <b>Sequence</b> number. 
            For example: Base 100,000 → Sequence 1 (2%) = 98,000 → Sequence 2 (2%) = 96,040.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : (
        <>
          {/* Mobile View: Card Layout */}
          <div className="md:hidden space-y-4">
            {editingId === "NEW" && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                <form onSubmit={handleSave} className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">New Discount</h3>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sequence</label>
                    <input type="number" name="sequence" value={formData.sequence || 0} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Name</label>
                    <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" placeholder="e.g. Transport Discount" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Percentage (%)</label>
                    <input type="number" step="0.01" name="percentage" value={formData.percentage || 0} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Condition</label>
                    <select name="conditionType" value={formData.conditionType || "manual_selection"} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-xs">
                      <option value="manual_selection">Manual Selection</option>
                      <option value="min_invoice_value">Min. Invoice Value</option>
                    </select>
                    {formData.conditionType === "min_invoice_value" && (
                      <input type="number" name="conditionValue" value={formData.conditionValue || 0} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm mt-2" placeholder="Min value e.g. 200000" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-2 justify-end">
                    <button type="button" onClick={handleCancel} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl bg-white"><X size={18} /> Cancel</button>
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {discounts.map(d => (
              editingId === d.id ? (
                <div key={d.id} className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                  <form onSubmit={handleSave} className="space-y-4">
                    <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Edit Discount</h3>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sequence</label>
                      <input type="number" name="sequence" value={formData.sequence} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Percentage (%)</label>
                      <input type="number" step="0.01" name="percentage" value={formData.percentage} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Condition</label>
                      <select name="conditionType" value={formData.conditionType} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-xs">
                        <option value="manual_selection">Manual Selection</option>
                        <option value="min_invoice_value">Min. Invoice Value</option>
                      </select>
                      {formData.conditionType === "min_invoice_value" && (
                        <input type="number" name="conditionValue" value={formData.conditionValue || 0} onChange={handleChange} className="w-full border rounded-xl p-2.5 bg-white text-sm mt-2" placeholder="e.g. 200000" />
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <input type="checkbox" id={`isActive-mob-${d.id}`} name="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                        <label htmlFor={`isActive-mob-${d.id}`} className="text-xs font-bold text-gray-700">Active</label>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 justify-end">
                      <button type="button" onClick={handleCancel} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-xl bg-white"><X size={18} /> Cancel</button>
                      <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div key={d.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-900 font-black text-xs rounded-lg border border-emerald-100">
                        {d.sequence}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(d)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{d.name}</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-black text-emerald-600 text-xl">{d.percentage}%</span>
                      <span className="text-xs text-gray-500 font-medium">discount</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-600">
                    <span className="font-bold uppercase tracking-widest text-[9px] text-gray-400">Condition</span>
                    <span className="font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg">
                      {d.conditionType === "manual_selection" ? "Manual Select" : `>= ₹${d.conditionValue?.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )
            ))}

            {discounts.length === 0 && editingId !== "NEW" && (
              <div className="p-8 text-center text-gray-500 font-medium bg-white border border-gray-200 rounded-2xl">
                No discounts configured. Add a new discount to get started.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white">
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Sequence</th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Name</th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Percentage</th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Condition</th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editingId === "NEW" && (
                  <tr className="bg-emerald-50/50">
                    <td colSpan={6} className="p-6">
                      <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sequence</label>
                          <input type="number" name="sequence" value={formData.sequence || 0} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Name</label>
                          <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="w-full border rounded-lg p-2" placeholder="e.g. Transport Discount" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Percentage (%)</label>
                          <input type="number" step="0.01" name="percentage" value={formData.percentage || 0} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Condition</label>
                          <select name="conditionType" value={formData.conditionType || "manual_selection"} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs">
                            <option value="manual_selection">Manual Selection</option>
                            <option value="min_invoice_value">Min. Invoice Value</option>
                          </select>
                          {formData.conditionType === "min_invoice_value" && (
                            <input type="number" name="conditionValue" value={formData.conditionValue || 0} onChange={handleChange} className="w-full border rounded-lg p-2 mt-2" placeholder="Min value e.g. 200000" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 pb-1 justify-end">
                          <button type="button" onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"><X size={18} /></button>
                          <button type="submit" disabled={isSaving} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
                {discounts.map(d => (
                  editingId === d.id ? (
                    <tr key={d.id} className="bg-emerald-50/50">
                      <td colSpan={6} className="p-6 border-b border-emerald-100">
                        <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sequence</label>
                            <input type="number" name="sequence" value={formData.sequence} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Percentage (%)</label>
                            <input type="number" step="0.01" name="percentage" value={formData.percentage} onChange={handleChange} className="w-full border rounded-lg p-2" required />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Condition</label>
                            <select name="conditionType" value={formData.conditionType} onChange={handleChange} className="w-full border rounded-lg p-2 text-xs">
                              <option value="manual_selection">Manual Selection</option>
                              <option value="min_invoice_value">Min. Invoice Value</option>
                            </select>
                            {formData.conditionType === "min_invoice_value" && (
                              <input type="number" name="conditionValue" value={formData.conditionValue || 0} onChange={handleChange} className="w-full border rounded-lg p-2 mt-2" placeholder="e.g. 200000" />
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                              <label htmlFor="isActive" className="text-xs font-bold text-gray-700">Active</label>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pb-1 justify-end">
                            <button type="button" onClick={handleCancel} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"><X size={18} /></button>
                            <button type="submit" disabled={isSaving} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-gray-900">{d.sequence}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{d.name}</td>
                      <td className="px-6 py-4 font-black text-emerald-600">{d.percentage}%</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {d.conditionType === "manual_selection" ? "Manual Select" : `>= ₹${d.conditionValue?.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(d)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block mr-2">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
                {discounts.length === 0 && editingId !== "NEW" && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                      No discounts configured. Add a new discount to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
