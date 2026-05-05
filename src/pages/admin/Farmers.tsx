import { useState, useEffect } from "react";
import { UserRound, Sprout, Map, Phone, Plus, Search, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Farmers = () => {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: "",
    cropsInput: "",
    landSize: "",
    remark: ""
  });

  const fetchFarmers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/farmers", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFarmers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const handleCreateFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Parse crops
    const cropsArray = formData.cropsInput.split(",").map(c => c.trim()).filter(c => c);

    try {
      const res = await fetch("http://localhost:3000/api/farmers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          contact: formData.contact,
          crops: cropsArray,
          landSize: formData.landSize,
          remark: formData.remark
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", location: "", contact: "", cropsInput: "", landSize: "", remark: "" });
        fetchFarmers();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to create farmer");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) || 
    f.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or location..." 
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} />
          <span>Register Farmer</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFarmers.map((farmer) => (
            <div key={farmer.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <UserRound size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{farmer.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <Map size={14} />
                    <span>{farmer.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Crops Cultivated</p>
                  <div className="flex gap-2">
                    {farmer.crops?.map((crop: string, idx: number) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                        <Sprout size={12} />
                        {crop}
                      </span>
                    ))}
                    {(!farmer.crops || farmer.crops.length === 0) && (
                      <span className="text-sm text-gray-400">None listed</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Land Size</p>
                  <p className="text-sm font-bold text-gray-700">{farmer.landSize || "N/A"}</p>
                </div>

                <button className="p-3 bg-gray-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                  <Phone size={20} />
                </button>
              </div>
            </div>
          ))}
          {filteredFarmers.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No farmers found.
            </div>
          )}
        </div>
      )}

      {/* Add Farmer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Register New Farmer</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateFarmer} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Farmer Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Mallikarjun Gowda" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Location</label>
                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Hubli" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Contact</label>
                    <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+91 9876543210" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Crops Cultivated (Comma separated)</label>
                  <input type="text" value={formData.cropsInput} onChange={e => setFormData({...formData, cropsInput: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Rice, Sugar Cane" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Land Size</label>
                  <input type="text" value={formData.landSize} onChange={e => setFormData({...formData, landSize: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="12 Acres" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Register
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Farmers;