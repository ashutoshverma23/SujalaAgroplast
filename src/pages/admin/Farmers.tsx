import { useState, useEffect } from "react";
import { UserRound, Sprout, Phone, Plus, Search, Loader2, X, Eye, Edit, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';

interface FarmerEntity {
  id: string;
  name: string;
  location: string;
  contact: string;
  dob?: string | null;
  crops?: string[] | null;
  landSize?: string | null;
  remark?: string | null;
  geotagPhotoUrl?: string | null;
  geotagLat?: number | null;
  geotagLng?: number | null;
  geotagTimestamp?: string | null;
  geotagAddress?: string | null;
  createdAt?: string;
}

const Farmers = () => {
  const [farmers, setFarmers] = useState<FarmerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingFarmer, setEditingFarmer] = useState<FarmerEntity | null>(null);
  const [viewingFarmer, setViewingFarmer] = useState<FarmerEntity | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: "",
    dob: "",
    cropsInput: "",
    landSize: "",
    remark: "",
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

  const fetchFarmers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/farmers`, {
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

  const handleOpenNewModal = () => {
    setEditingFarmer(null);
    setFormData({
      name: "",
      location: "",
      contact: "",
      dob: "",
      cropsInput: "",
      landSize: "",
      remark: "",
      base64Image: "",
      geotagLat: null,
      geotagLng: null,
      geotagTimestamp: null
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (farmer: FarmerEntity) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      location: farmer.location,
      contact: farmer.contact,
      dob: farmer.dob ? farmer.dob.split("T")[0] : "",
      cropsInput: Array.isArray(farmer.crops) ? farmer.crops.join(", ") : "",
      landSize: farmer.landSize || "",
      remark: farmer.remark || "",
      base64Image: "",
      geotagLat: farmer.geotagLat || null,
      geotagLng: farmer.geotagLng || null,
      geotagTimestamp: farmer.geotagTimestamp || null
    });
    setIsModalOpen(true);
  };

  const handleSubmitFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Parse crops
    const cropsArray = formData.cropsInput.split(",").map(c => c.trim()).filter(Boolean);
    const url = editingFarmer
      ? `${BACKEND_URL}/api/farmers/${editingFarmer.id}`
      : `${BACKEND_URL}/api/farmers`;
    const method = editingFarmer ? "PUT" : "POST";

    const bodyData = editingFarmer ? {
      name: formData.name,
      location: formData.location,
      contact: formData.contact,
      dob: formData.dob,
      crops: cropsArray,
      landSize: formData.landSize,
      remark: formData.remark,
      geotagPhotoUrl: editingFarmer.geotagPhotoUrl,
      base64Image: formData.base64Image,
      geotagLat: formData.geotagLat,
      geotagLng: formData.geotagLng,
      geotagTimestamp: formData.geotagTimestamp
    } : {
      name: formData.name,
      location: formData.location,
      contact: formData.contact,
      dob: formData.dob,
      crops: cropsArray,
      landSize: formData.landSize,
      remark: formData.remark,
      base64Image: formData.base64Image,
      geotagLat: formData.geotagLat,
      geotagLng: formData.geotagLng,
      geotagTimestamp: formData.geotagTimestamp
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingFarmer(null);
        fetchFarmers();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to save farmer");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) || 
    f.location?.toLowerCase().includes(search.toLowerCase()) ||
    (f.contact && f.contact.includes(search))
  );

  return (
    <div className="space-y-6 relative pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
            <UserRound className="text-emerald-600" size={30} /> Farmer Directory
          </h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-wider mt-1 font-sans">
            Farmer Registries, Crops Cultivated & Spatial Geotags
          </p>
        </div>
        <button 
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all self-start sm:self-auto uppercase tracking-wide cursor-pointer"
        >
          <Plus size={18} />
          <span>Register Farmer</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search farmers by name, contact or location..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Farmer Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Crops Cultivated</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Land Size</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-emerald-50/20 transition-all">
                    {/* Farmer Details */}
                    <td className="px-6 py-4 border-r border-gray-200">
                      <p className="font-extrabold text-gray-900 text-sm">{farmer.name}</p>
                      {farmer.dob && (
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                          DOB: {new Date(farmer.dob).toLocaleDateString('en-GB')}
                        </p>
                      )}
                    </td>
                    {/* Contact */}
                    <td className="px-6 py-4 border-r border-gray-200 whitespace-nowrap">
                      <a 
                        href={`tel:${farmer.contact}`} 
                        className="text-xs font-bold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        <Phone size={12} className="text-emerald-500" />
                        {farmer.contact}
                      </a>
                    </td>
                    {/* Location */}
                    <td className="px-6 py-4 border-r border-gray-200 font-extrabold text-xs text-gray-700">
                      {farmer.location}
                    </td>
                    {/* Crops */}
                    <td className="px-6 py-4 border-r border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {farmer.crops?.slice(0, 2).map((crop: string, idx: number) => (
                          <span key={idx} className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                            <Sprout size={10} />
                            {crop}
                          </span>
                        ))}
                        {farmer.crops && farmer.crops.length > 2 && (
                          <span className="text-[10px] text-gray-400 font-black">+{farmer.crops.length - 2} MORE</span>
                        )}
                        {(!farmer.crops || farmer.crops.length === 0) && (
                          <span className="text-xs text-gray-400 italic">None listed</span>
                        )}
                      </div>
                    </td>
                    {/* Land Size */}
                    <td className="px-6 py-4 border-r border-gray-200 font-extrabold text-xs text-gray-700">
                      {farmer.landSize || <span className="text-gray-300">N/A</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingFarmer(farmer)}
                          className="p-2 bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all rounded-xl text-gray-500 cursor-pointer"
                          title="View All Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(farmer)}
                          className="p-2 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-xl text-gray-500 cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-bold text-xs">
                      No farmers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Popup */}
      <AnimatePresence>
        {viewingFarmer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{viewingFarmer.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Farmer Registry Info</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingFarmer(null)}
                  className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Contact Details</span>
                    <a 
                      href={`tel:${viewingFarmer.contact}`}
                      className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 mt-0.5"
                    >
                      <Phone size={12} />
                      {viewingFarmer.contact}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Date of Birth</span>
                    <span className="font-bold text-gray-800">
                      {viewingFarmer.dob ? new Date(viewingFarmer.dob).toLocaleDateString('en-GB') : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Location</span>
                    <span className="font-bold text-gray-800">{viewingFarmer.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Land Size</span>
                    <span className="font-bold text-gray-800">{viewingFarmer.landSize || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Crops Cultivated</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingFarmer.crops?.map((crop, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                        <Sprout size={12} />
                        {crop}
                      </span>
                    ))}
                    {(!viewingFarmer.crops || viewingFarmer.crops.length === 0) && (
                      <span className="text-xs text-gray-400 italic font-bold">No crops listed</span>
                    )}
                  </div>
                </div>

                {viewingFarmer.geotagAddress && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Geotagged Address</span>
                    <p className="text-xs font-semibold text-gray-600 bg-gray-50 p-2.5 border border-gray-100 rounded-xl mt-1 leading-relaxed">
                      {viewingFarmer.geotagAddress}
                    </p>
                  </div>
                )}

                {viewingFarmer.geotagLat && viewingFarmer.geotagLng && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">GPS coordinates</span>
                      <span className="font-bold text-gray-800 text-xs">{viewingFarmer.geotagLat.toFixed(6)}, {viewingFarmer.geotagLng.toFixed(6)}</span>
                    </div>
                    {viewingFarmer.geotagTimestamp && (
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Geotag Timestamp</span>
                        <span className="font-bold text-gray-800 text-xs">
                          {new Date(viewingFarmer.geotagTimestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Preview */}
                {viewingFarmer.geotagPhotoUrl && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Captured Geotag Photo</span>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <img
                        src={viewingFarmer.geotagPhotoUrl.startsWith("http") ? viewingFarmer.geotagPhotoUrl : `${BACKEND_URL}${viewingFarmer.geotagPhotoUrl}`}
                        alt="Farmer Geotag"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {viewingFarmer.remark && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Remarks</span>
                    <p className="text-xs font-semibold text-gray-600 bg-gray-50 p-2.5 border border-gray-100 rounded-xl mt-1 leading-relaxed">
                      {viewingFarmer.remark}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                <button
                  onClick={() => setViewingFarmer(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Farmer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-emerald-950">
                    {editingFarmer ? "Edit Farmer Details" : "Register New Farmer"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {editingFarmer ? "Modify registry values and metadata" : "Add farmer details and capture geotags"}
                  </p>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingFarmer(null); }} 
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Body */}
              <form onSubmit={handleSubmitFarmer} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Farmer Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                    placeholder="Mallikarjun Gowda" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Location</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                      placeholder="Hubli" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Contact</label>
                    <input 
                      type="text" 
                      required
                      value={formData.contact} 
                      onChange={e => setFormData({...formData, contact: e.target.value})} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                      placeholder="+91 9876543210" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.dob} 
                    onChange={e => setFormData({...formData, dob: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Crops Cultivated (Comma separated)</label>
                  <input 
                    type="text" 
                    value={formData.cropsInput} 
                    onChange={e => setFormData({...formData, cropsInput: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                    placeholder="Rice, Sugar Cane" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Land Size</label>
                  <input 
                    type="text" 
                    value={formData.landSize} 
                    onChange={e => setFormData({...formData, landSize: e.target.value})} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all" 
                    placeholder="12 Acres" 
                  />
                </div>
                
                {/* Geotag Photo */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Geotag Photo</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-all w-full bg-gray-50 hover:bg-emerald-50/10">
                      {locationLoading ? <Loader2 size={18} className="animate-spin text-emerald-600" /> : <Calendar size={18} />}
                      <span className="font-extrabold text-xs">
                        {formData.base64Image ? "Photo Tagged Successfully" : "Capture Geotag Photo"}
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
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-1.5">
                      GPS coordinates: {formData.geotagLat.toFixed(5)}, {formData.geotagLng.toFixed(5)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Remarks</label>
                  <textarea 
                    value={formData.remark} 
                    onChange={e => setFormData({...formData, remark: e.target.value})} 
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all resize-none" 
                    placeholder="Enter observations, notes, etc."
                  />
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingFarmer(null); }} 
                    className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-xs uppercase tracking-wide cursor-pointer"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editingFarmer ? "Save Changes" : "Register"}
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