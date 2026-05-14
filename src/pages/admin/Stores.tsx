import { useState, useEffect } from "react";
import { Store, MapPin, Phone, ExternalLink, Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const StoreCard = ({ name, location, contact, type, status }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
        <Store size={24} />
      </div>
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}>
        {status}
      </span>
    </div>
    
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-tight">{type}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin size={16} />
          <span className="text-sm font-medium">{location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Phone size={16} />
          <span className="text-sm font-medium">{contact}</span>
        </div>
      </div>

      <button className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all group">
        <span>Manage Store</span>
        <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  </motion.div>
);

const Stores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    location: "",
    contact: "",
    type: "Main Outlet",
    status: "Active",
    base64Image: "",
    geotagLat: null as number | null,
    geotagLng: null as number | null,
    geotagTimestamp: null as string | null
  });

  const [locationLoading, setLocationLoading] = useState(false);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocationLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setFormData(prev => ({
                ...prev,
                base64Image: base64String,
                geotagLat: position.coords.latitude,
                geotagLng: position.coords.longitude,
                geotagTimestamp: new Date().toISOString()
              }));
              setLocationLoading(false);
            },
            (error) => {
              console.error("Error getting location:", error);
              alert("Could not get your location. Please ensure location services are enabled.");
              setFormData(prev => ({
                ...prev,
                base64Image: base64String
              }));
              setLocationLoading(false);
            }
          );
        } else {
          setFormData(prev => ({ ...prev, base64Image: base64String }));
          setLocationLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/stores", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("http://localhost:3000/api/stores", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", ownerName: "", location: "", contact: "", type: "Main Outlet", status: "Active" });
        fetchStores();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to create store");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Store Directory</h2>
          <p className="text-gray-500 font-medium mt-1">Manage and monitor all Sujala Agro outlets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} />
          <span>New Store</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store, i) => (
            <StoreCard key={i} {...store} />
          ))}
          {stores.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No stores found. Add one!
            </div>
          )}
        </div>
      )}

      {/* Add Store Modal */}
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
                <h3 className="text-xl font-bold text-gray-900">Add New Store</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateStore} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Store Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="GreenField Agro" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Owner Name</label>
                  <input type="text" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Location</label>
                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Hubli, Karnataka" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Contact</label>
                    <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="+91 9876543210" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Store Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="Main Outlet">Main Outlet</option>
                      <option value="Sub-Dealer">Sub-Dealer</option>
                      <option value="Distribution Point">Distribution Point</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Geotag Photo</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-colors w-full">
                      {locationLoading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                      <span className="font-medium text-sm">
                        {formData.base64Image ? "Photo Captured (Geotagged)" : "Take Geotag Photo"}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>
                    {formData.base64Image && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={formData.base64Image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  {formData.geotagLat && formData.geotagLng && (
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Location recorded: {formData.geotagLat.toFixed(4)}, {formData.geotagLng.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Create Store
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

export default Stores;