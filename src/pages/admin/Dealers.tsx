import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Loader2, X, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BACKEND_URL } from '../../config';

export default function Dealers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [editKycFormData, setEditKycFormData] = useState({
    firmName: "", whatsappNo: "", lat: "", lng: "", address: "", pincode: "", state: "", district: "", taluka: "", city: "", firmType: "", godownAddress: "", godownPincode: "",
    aadhar: "", pan: "", dob: "", gstin: "",
    bankHolderName: "", bankName: "", bankBranch: "", bankAccountNo: "", bankCity: "", bankIfsc: "", bankAccountType: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    role: "DEALER",
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", mobile: "", email: "", password: "", role: "DEALER" });
        fetchUsers();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to create user");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = async (userId: string) => {
    setSelectedUserId(userId);
    setIsEditModalOpen(true);
    setLoadingKyc(true);
    
    // reset form
    setEditKycFormData({
      firmName: "", whatsappNo: "", lat: "", lng: "", address: "", pincode: "", state: "", district: "", taluka: "", city: "", firmType: "", godownAddress: "", godownPincode: "",
      aadhar: "", pan: "", dob: "", gstin: "",
      bankHolderName: "", bankName: "", bankBranch: "", bankAccountNo: "", bankCity: "", bankIfsc: "", bankAccountType: ""
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${userId}/kyc`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const kycData = await res.json();
        setEditKycFormData({
          firmName: kycData.firmName || "", whatsappNo: kycData.whatsappNo || "", lat: kycData.lat || "", lng: kycData.lng || "", address: kycData.address || "", pincode: kycData.pincode || "", state: kycData.state || "", district: kycData.district || "", taluka: kycData.taluka || "", city: kycData.city || "", firmType: kycData.firmType || "", godownAddress: kycData.godownAddress || "", godownPincode: kycData.godownPincode || "",
          aadhar: kycData.aadhar || "", pan: kycData.pan || "", dob: kycData.dob ? new Date(kycData.dob).toISOString().split('T')[0] : "", gstin: kycData.gstin || "",
          bankHolderName: kycData.bankHolderName || "", bankName: kycData.bankName || "", bankBranch: kycData.bankBranch || "", bankAccountNo: kycData.bankAccountNo || "", bankCity: kycData.bankCity || "", bankIfsc: kycData.bankIfsc || "", bankAccountType: kycData.bankAccountType || ""
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKyc(false);
    }
  };

  const handleSaveKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${selectedUserId}/kyc`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editKycFormData),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        alert("Dealer details updated successfully");
      } else {
        alert("Failed to update dealer details");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${selectedUserId}/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        setIsPasswordModalOpen(false);
        setNewPassword("");
        alert("Password updated successfully");
      } else {
        const d = await res.json();
        alert(d.message || "Failed to update password");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.role === "DEALER" &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || 
     u.mobile?.includes(search)) &&
    (stateFilter === "" || u.state?.toLowerCase() === stateFilter.toLowerCase())
  );

  // Extract unique states from the users array
  const uniqueStates = Array.from(new Set(users.filter(u => u.role === "DEALER" && u.state).map(u => u.state)));

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or mobile..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 outline-none hover:bg-gray-50 transition-all cursor-pointer shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500"
          >
            <option value="">All States</option>
            {uniqueStates.map(state => (
              <option key={state as string} value={state as string}>{state as string}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
          >
            <Plus size={18} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-r-0">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-r-0">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 border-r border-gray-200">
                      <p className="font-bold text-gray-900">{user.name}</p>
                      {user.dealerId && <p className="text-xs font-bold text-emerald-600 mt-0.5">{user.dealerId}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user.state || "No State Info"}
                        {user.dob ? ` • DOB: ${new Date(user.dob).toLocaleDateString()}` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      <p className="font-medium text-gray-700">{user.mobile}</p>
                      {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      <span className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold tracking-wide">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        {user.status === "APPROVED" && <CheckCircle size={16} className="text-emerald-500" />}
                        {user.status === "PENDING" && <Clock size={16} className="text-orange-500" />}
                        {user.status === "REJECTED" && <XCircle size={16} className="text-red-500" />}
                        <span className={`text-sm font-bold ${
                          user.status === "APPROVED" ? "text-emerald-700" :
                          user.status === "PENDING" ? "text-orange-700" : "text-red-700"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 transition-opacity">
                        {user.status === "PENDING" && (
                          <>
                            <button onClick={() => handleUpdateStatus(user.id, "APPROVED")} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleUpdateStatus(user.id, "REJECTED")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleEditClick(user.id)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Details">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
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
                <h3 className="text-xl font-bold text-gray-900">Add New User</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Mobile</label>
                    <input type="text" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Role</label>
                    <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                      <option value="DEALER">Dealer</option>
                      <option value="STAFF">Staff</option>
                      <option value="ORGANIZATION">Organization</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Dealer KYC Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-gray-900">Edit Dealer Details</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {loadingKyc ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <form id="edit-kyc-form" onSubmit={handleSaveKyc} className="space-y-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Business Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Firm Name</label>
                          <input type="text" value={editKycFormData.firmName} onChange={e => setEditKycFormData({...editKycFormData, firmName: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Firm Type</label>
                          <select value={editKycFormData.firmType} onChange={e => setEditKycFormData({...editKycFormData, firmType: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                            <option value="">Select Type</option>
                            <option value="PROPRIETOR">PROPRIETOR</option>
                            <option value="PARTNERSHIP">PARTNERSHIP</option>
                            <option value="PVT LTD">PVT LTD</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">WhatsApp No</label>
                          <input type="text" value={editKycFormData.whatsappNo} onChange={e => setEditKycFormData({...editKycFormData, whatsappNo: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">GSTIN</label>
                          <input type="text" value={editKycFormData.gstin} onChange={e => setEditKycFormData({...editKycFormData, gstin: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">PAN</label>
                          <input type="text" value={editKycFormData.pan} onChange={e => setEditKycFormData({...editKycFormData, pan: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Date of Birth</label>
                          <input type="date" value={editKycFormData.dob} onChange={e => setEditKycFormData({...editKycFormData, dob: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Address Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Address</label>
                          <input type="text" value={editKycFormData.address} onChange={e => setEditKycFormData({...editKycFormData, address: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">City/Village</label>
                          <input type="text" value={editKycFormData.city} onChange={e => setEditKycFormData({...editKycFormData, city: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Taluka</label>
                          <input type="text" value={editKycFormData.taluka} onChange={e => setEditKycFormData({...editKycFormData, taluka: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">District</label>
                          <input type="text" value={editKycFormData.district} onChange={e => setEditKycFormData({...editKycFormData, district: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">State</label>
                          <input type="text" value={editKycFormData.state} onChange={e => setEditKycFormData({...editKycFormData, state: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Pincode</label>
                          <input type="text" value={editKycFormData.pincode} onChange={e => setEditKycFormData({...editKycFormData, pincode: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Bank Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bank Name</label>
                          <input type="text" value={editKycFormData.bankName} onChange={e => setEditKycFormData({...editKycFormData, bankName: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Account Name</label>
                          <input type="text" value={editKycFormData.bankHolderName} onChange={e => setEditKycFormData({...editKycFormData, bankHolderName: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Account No</label>
                          <input type="text" value={editKycFormData.bankAccountNo} onChange={e => setEditKycFormData({...editKycFormData, bankAccountNo: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">IFSC</label>
                          <input type="text" value={editKycFormData.bankIfsc} onChange={e => setEditKycFormData({...editKycFormData, bankIfsc: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Branch</label>
                          <input type="text" value={editKycFormData.bankBranch} onChange={e => setEditKycFormData({...editKycFormData, bankBranch: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" form="edit-kyc-form" disabled={saving || loadingKyc} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">New Password</label>
                  <input type="text" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Enter new password" />
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}