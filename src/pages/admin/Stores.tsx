import { useState, useEffect } from "react";
import { Store, MapPin, Phone, Plus, X, Loader2, Search, Calendar, Send, ClipboardList, User, Eye, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';

interface StoreEntity {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  contact: string;
  type: string;
  status: string;
  district?: string | null;
  state?: string | null;
  geotagPhotoUrl?: string | null;
  geotagLat?: number | null;
  geotagLng?: number | null;
  geotagTimestamp?: string | null;
  geotagAddress?: string | null;
  latestVisitNotes?: string | null;
  latestVisitDate?: string | null;
  remark?: string | null;
  createdAt?: string;
}

interface VisitEntity {
  id: string;
  storeId: string;
  visitorId: string;
  visitorName: string;
  visitDate: string;
  notes: string;
  createdAt: string;
}

export default function Stores() {
  const [stores, setStores] = useState<StoreEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreEntity | null>(null);
  const [viewingStore, setViewingStore] = useState<StoreEntity | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    location: "",
    contact: "", // multiple comma-separated
    type: "Main Outlet",
    district: "",
    state: "",
    status: "Active",
    base64Image: "",
    geotagLat: null as number | null,
    geotagLng: null as number | null,
    geotagTimestamp: null as string | null
  });

  const [locationLoading, setLocationLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");

  // Visits Panel State
  const [selectedStore, setSelectedStore] = useState<StoreEntity | null>(null);
  const [visits, setVisits] = useState<VisitEntity[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [newVisitNotes, setNewVisitNotes] = useState("");
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingVisit, setSavingVisit] = useState(false);

  // Fetch all stores
  const fetchStores = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stores`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (e) {
      console.error("Failed to fetch stores", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch visits for the selected store
  const fetchVisits = async (storeId: string) => {
    setLoadingVisits(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stores/${storeId}/visits`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data);
      }
    } catch (e) {
      console.error("Failed to fetch visits", e);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // When a store is selected, load its visits
  useEffect(() => {
    if (selectedStore) {
      fetchVisits(selectedStore.id);
    } else {
      setVisits([]);
    }
  }, [selectedStore]);

  // Open modal for New Store
  const handleOpenNewModal = () => {
    setEditingStore(null);
    setFormData({
      name: "",
      ownerName: "",
      location: "",
      contact: "",
      type: "Main Outlet",
      district: "",
      state: "",
      status: "Active",
      base64Image: "",
      geotagLat: null,
      geotagLng: null,
      geotagTimestamp: null
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit Store
  const handleOpenEditModal = (store: StoreEntity) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      ownerName: store.ownerName,
      location: store.location,
      contact: store.contact,
      type: store.type || "Main Outlet",
      district: store.district || "",
      state: store.state || "",
      status: store.status || "Active",
      base64Image: "",
      geotagLat: store.geotagLat || null,
      geotagLng: store.geotagLng || null,
      geotagTimestamp: store.geotagTimestamp || null
    });
    setIsModalOpen(true);
  };

  // Handle Geotag photo capture
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
              alert("Could not retrieve GPS coordinates. Store photo captured without location tags.");
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

  // Create or Edit Store
  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingStore 
        ? `${BACKEND_URL}/api/stores/${editingStore.id}` 
        : `${BACKEND_URL}/api/stores`;
      const method = editingStore ? "PUT" : "POST";

      const bodyData = editingStore ? {
        ...formData,
        geotagPhotoUrl: editingStore.geotagPhotoUrl
      } : formData;

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
        setEditingStore(null);
        fetchStores();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to save store");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Log a new store visit
  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (!newVisitNotes.trim()) {
      alert("Please enter visit notes.");
      return;
    }

    setSavingVisit(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stores/${selectedStore.id}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          visitDate: newVisitDate,
          notes: newVisitNotes
        })
      });

      if (res.ok) {
        setNewVisitNotes("");
        // Reload visits timeline & reload stores dashboard to update Intel field
        await Promise.all([
          fetchVisits(selectedStore.id),
          fetchStores()
        ]);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to log visit");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVisit(false);
    }
  };

  // Helper to split contacts
  const parseContacts = (contactString: string) => {
    if (!contactString) return [];
    return contactString
      .split(/[,|/]/)
      .map(num => num.trim())
      .filter(Boolean);
  };

  // Unique state list for dropdown filters
  const uniqueStates = Array.from(new Set(stores.map(s => s.state).filter(Boolean))) as string[];

  // Dynamic district options based on selected state
  const uniqueDistricts = Array.from(
    new Set(
      stores
        .filter(s => !stateFilter || s.state === stateFilter)
        .map(s => s.district)
        .filter(Boolean)
    )
  ) as string[];

  // Automatically reset district filter if it's no longer available under the state filter
  useEffect(() => {
    if (stateFilter && districtFilter) {
      const match = stores.some(s => s.state === stateFilter && s.district === districtFilter);
      if (!match) setDistrictFilter("");
    }
  }, [stateFilter]);

  // Filter stores
  const filteredStores = stores.filter(store => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      store.name.toLowerCase().includes(q) ||
      store.ownerName.toLowerCase().includes(q) ||
      store.location.toLowerCase().includes(q) ||
      store.contact.includes(q) ||
      (store.district && store.district.toLowerCase().includes(q)) ||
      (store.state && store.state.toLowerCase().includes(q));

    const matchState = !stateFilter || store.state === stateFilter;
    const matchDistrict = !districtFilter || store.district === districtFilter;

    return matchSearch && matchState && matchDistrict;
  });

  return (
    <div className="space-y-6 relative pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
            <Store className="text-emerald-600" size={30} /> Outlet Directory
          </h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-wider mt-1">
            Store Registration, Intel Logging & Field Visits
          </p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all self-start sm:self-auto uppercase tracking-wide"
        >
          <Plus size={18} />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores by name, contact, region..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 transition-all placeholder-gray-400"
          />
        </div>

        {/* State Filter */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 outline-none hover:bg-gray-100 transition-all cursor-pointer focus:border-emerald-500"
          >
            <option value="">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 outline-none hover:bg-gray-100 transition-all cursor-pointer focus:border-emerald-500"
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table view */}
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
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Store details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Contacts</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">District</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">State</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 last:border-r-0">latest Visit Intel</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStores.map((store) => {
                  const phoneList = parseContacts(store.contact);
                  return (
                    <tr key={store.id} className="hover:bg-emerald-50/20 transition-all">
                      {/* Name & Owner */}
                      <td className="px-6 py-4 border-r border-gray-200">
                        <div className="flex items-start gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shrink-0 mt-0.5 ${
                            store.type === "Godown" ? "bg-amber-100 text-amber-800" :
                            store.type === "Sub Outlet" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {store.type || "Store"}
                          </span>
                        </div>
                        <p className="font-extrabold text-gray-900 text-sm mt-1">{store.name}</p>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">Owner: {store.ownerName}</p>
                      </td>
                      {/* Contacts */}
                      <td className="px-6 py-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {phoneList.slice(0, 2).map((phone, idx) => (
                            <a
                              key={idx}
                              href={`tel:${phone}`}
                              className="text-xs font-bold text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                            >
                              <Phone size={12} className="text-emerald-500" />
                              {phone}
                            </a>
                          ))}
                          {phoneList.length > 2 && (
                            <span className="text-[10px] text-gray-400 font-bold">+{phoneList.length - 2} more</span>
                          )}
                          {phoneList.length === 0 && <span className="text-xs text-gray-400 font-bold">No Contact</span>}
                        </div>
                      </td>
                      {/* District */}
                      <td className="px-6 py-4 border-r border-gray-200 font-extrabold text-xs text-gray-700">
                        {store.district || <span className="text-gray-300 font-bold">N/A</span>}
                      </td>
                      {/* State */}
                      <td className="px-6 py-4 border-r border-gray-200 font-extrabold text-xs text-gray-700">
                        {store.state || <span className="text-gray-300 font-bold">N/A</span>}
                      </td>
                      {/* Intel */}
                      <td className="px-6 py-4 border-r border-gray-200 max-w-xs">
                        {store.latestVisitNotes ? (
                          <p className="text-xs text-gray-800 font-bold line-clamp-1 leading-relaxed bg-gray-50 p-1.5 border border-gray-100 rounded-lg truncate">
                            {store.latestVisitNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 font-bold italic">No visits logged</p>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingStore(store)}
                            className="p-2 bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all rounded-xl text-gray-500 cursor-pointer"
                            title="View All Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(store)}
                            className="p-2 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 transition-all rounded-xl text-gray-500 cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedStore(store)}
                            className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all rounded-xl text-[10px] font-black text-emerald-700 flex items-center gap-1 cursor-pointer"
                            title="Visits Log"
                          >
                            <ClipboardList size={12} />
                            <span>VISITS</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStores.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-bold text-xs">
                      No stores found matching your filters.
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
        {viewingStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    viewingStore.type === "Godown" ? "bg-amber-100 text-amber-800" :
                    viewingStore.type === "Sub Outlet" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {viewingStore.type || "Store"}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-1">{viewingStore.name}</h3>
                </div>
                <button
                  onClick={() => setViewingStore(null)}
                  className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Owner Name</span>
                    <span className="font-bold text-gray-800">{viewingStore.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${
                      viewingStore.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {viewingStore.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">District</span>
                    <span className="font-bold text-gray-800">{viewingStore.district || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">State</span>
                    <span className="font-bold text-gray-800">{viewingStore.state || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contact Numbers</span>
                  <div className="flex flex-wrap gap-2">
                    {parseContacts(viewingStore.contact).map((num, idx) => (
                      <a
                        key={idx}
                        href={`tel:${num}`}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5"
                      >
                        <Phone size={12} className="text-emerald-500" />
                        {num}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">General Location description</span>
                  <span className="font-semibold text-gray-600 block bg-gray-50 p-2.5 border border-gray-100 rounded-xl mt-1">
                    {viewingStore.location}
                  </span>
                </div>

                {viewingStore.geotagAddress && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Geotagged Address</span>
                    <span className="font-semibold text-gray-600 block bg-gray-50 p-2.5 border border-gray-100 rounded-xl mt-1 text-xs leading-relaxed">
                      {viewingStore.geotagAddress}
                    </span>
                  </div>
                )}

                {viewingStore.geotagLat && viewingStore.geotagLng && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">GPS coordinates</span>
                      <span className="font-bold text-gray-800 text-xs">{viewingStore.geotagLat.toFixed(6)}, {viewingStore.geotagLng.toFixed(6)}</span>
                    </div>
                    {viewingStore.geotagTimestamp && (
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Geotag Timestamp</span>
                        <span className="font-bold text-gray-800 text-xs">
                          {new Date(viewingStore.geotagTimestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Geotag Photo */}
                {viewingStore.geotagPhotoUrl && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Captured Store Photo</span>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <img
                        src={viewingStore.geotagPhotoUrl.startsWith("http") ? viewingStore.geotagPhotoUrl : `${BACKEND_URL}${viewingStore.geotagPhotoUrl}`}
                        alt="Store Geotag"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {viewingStore.remark && (
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Remarks</span>
                    <p className="text-xs font-semibold text-gray-600 bg-gray-50 p-2.5 border border-gray-100 rounded-xl mt-1 leading-relaxed">
                      {viewingStore.remark}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                <button
                  onClick={() => setViewingStore(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Store Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-emerald-950">
                    {editingStore ? "Edit Store Details" : "Add New Store"}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {editingStore ? "Modify registry values and metadata" : "Register outlet metadata and geotags"}
                  </p>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); setEditingStore(null); }}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitStore} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                    placeholder="GreenField Agro"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                      placeholder="Nashik"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Location / General Area</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                      placeholder="Hubli, Near Main Highway"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Mobile No.(s) <span className="text-[10px] text-gray-400 capitalize">(comma separated)</span></label>
                    <input
                      type="text"
                      required
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-gray-50 focus:bg-white transition-all"
                      placeholder="9876543210, 9876543211"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Store Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="Main Outlet">Main Outlet</option>
                      <option value="Sub Outlet">Sub Outlet</option>
                      <option value="Godown">Godown</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Geotag Photo */}
                <div className="pt-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1">Geotag Photo</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-all w-full bg-gray-50 hover:bg-emerald-50/10">
                      {locationLoading ? <Loader2 size={18} className="animate-spin text-emerald-600" /> : <MapPin size={18} />}
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

                {/* Modal Footer */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingStore(null); }}
                    className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 text-xs uppercase tracking-wide"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editingStore ? "Save Changes" : "Create Store"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visits Timeline Side Panel */}
      <AnimatePresence>
        {selectedStore && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStore(null)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
              />

              {/* Panel Container */}
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="pointer-events-auto w-screen max-w-md"
                >
                  <div className="flex h-full flex-col bg-white shadow-2xl overflow-hidden border-l border-gray-100">
                    {/* Header */}
                    <div className="p-6 bg-emerald-950 text-white flex items-center justify-between shrink-0">
                      <div className="min-w-0">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-emerald-200 text-[9px] font-black uppercase tracking-wider">
                          {selectedStore.type || "Outlet"}
                        </span>
                        <h3 className="text-lg font-black truncate mt-1">{selectedStore.name}</h3>
                        <p className="text-emerald-400 font-bold text-[10px] mt-0.5 truncate uppercase tracking-tight">
                          District: {selectedStore.district || "N/A"} · State: {selectedStore.state || "N/A"}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedStore(null)}
                        className="p-2 text-emerald-400 hover:bg-emerald-900/50 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Log Visit Form */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 space-y-3">
                        <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">
                          Log Field Visit Notes
                        </h4>
                        <form onSubmit={handleLogVisit} className="space-y-3">
                          <div>
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                              Visit Date
                            </label>
                            <input
                              type="date"
                              required
                              value={newVisitDate}
                              onChange={(e) => setNewVisitDate(e.target.value)}
                              className="w-full px-3 py-2 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                              Visit Intel / Details
                            </label>
                            <textarea
                              required
                              rows={3}
                              value={newVisitNotes}
                              onChange={(e) => setNewVisitNotes(e.target.value)}
                              placeholder="Describe client requirements, stock levels, or visit remarks..."
                              className="w-full px-3 py-2 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white placeholder-gray-400 resize-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={savingVisit}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-75"
                          >
                            {savingVisit ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                            <span>Log Visit</span>
                          </button>
                        </form>
                      </div>

                      {/* Timeline of visits */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          Visit History
                        </h4>

                        {loadingVisits ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                          </div>
                        ) : visits.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl p-4">
                            <ClipboardList className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-xs text-gray-400 font-bold">No visits logged for this store yet.</p>
                          </div>
                        ) : (
                          <div className="relative pl-4 border-l border-emerald-100 space-y-5 ml-2 pt-2">
                            {visits.map((visit) => (
                              <div key={visit.id} className="relative space-y-1">
                                {/* Bullet indicator */}
                                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white ring-4 ring-emerald-50" />
                                
                                <div className="flex justify-between items-start">
                                  <p className="text-xs text-emerald-600 font-black flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    {new Date(visit.visitDate).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </p>
                                  <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                                    <User size={10} className="text-gray-400" />
                                    {visit.visitorName || "Field Agent"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-3 leading-relaxed font-semibold">
                                  {visit.notes}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}