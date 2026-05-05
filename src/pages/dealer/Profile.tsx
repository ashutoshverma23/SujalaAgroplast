import { useState, useEffect } from "react";
import { UserCircle, Mail, Phone, Edit2, Loader2, CheckCircle, ShieldCheck, FileText } from "lucide-react";


export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: "", email: "" });
  const [lastEdited, setLastEdited] = useState<string | null>(localStorage.getItem("lastProfileEdit"));

  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    bankDetails: "",
    aadhar: "",
    pan: "",
    dob: "",
    address: "",
    gstin: ""
  });

  useEffect(() => {
    fetchProfileAndKyc();
  }, []);

  const fetchProfileAndKyc = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const profileRes = await fetch("http://localhost:3000/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setProfileFormData({ name: data.name || "", email: data.email || "" });
      }

      const kycRes = await fetch("http://localhost:3000/api/users/me/kyc", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setKyc(kycData);
        setKycFormData({
          bankDetails: kycData.bankDetails || "",
          aadhar: kycData.aadhar || "",
          pan: kycData.pan || "",
          dob: kycData.dob ? new Date(kycData.dob).toISOString().split('T')[0] : "",
          address: kycData.address || "",
          gstin: kycData.gstin || ""
        });
      }
    } catch (e) {
      console.error("Failed to fetch profile or kyc");
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => {
    if (!lastEdited) return true;
    const last = new Date(lastEdited);
    const now = new Date();
    // 24 hours limitation
    return (now.getTime() - last.getTime()) > 24 * 60 * 60 * 1000;
  };

  const handleSaveProfile = async () => {
    if (!canEdit()) {
      alert("You can only edit your profile once a day.");
      setIsEditingProfile(false);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("http://localhost:3000/api/users/me", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(profileFormData)
      });
      if (res.ok) {
        setProfile({ ...profile, ...profileFormData });
        setIsEditingProfile(false);
        const now = new Date().toISOString();
        localStorage.setItem("lastProfileEdit", now);
        setLastEdited(now);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveKyc = async () => {
    setSavingKyc(true);
    try {
      const res = await fetch("http://localhost:3000/api/users/me/kyc", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(kycFormData)
      });
      if (res.ok) {
        setKyc({ ...kyc, ...kycFormData });
        setIsEditingKyc(false);
      } else {
        alert("Failed to save KYC");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingKyc(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500 to-green-400"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 mt-12">
          <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl shadow-emerald-500/10">
            <div className="w-full h-full bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <UserCircle size={64} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-gray-900">{profile?.name}</h1>
              <ShieldCheck className="text-emerald-500" size={24} />
            </div>
            <p className="font-bold text-emerald-600 uppercase tracking-widest text-sm">{profile?.role}</p>
          </div>
          
          <div>
            {!isEditingProfile ? (
              <button 
                onClick={() => {
                  if (canEdit()) setIsEditingProfile(true);
                  else alert("You can only edit your profile once a day.");
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                  canEdit() ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingProfile(false)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">Cancel</button>
                <button onClick={handleSaveProfile} disabled={savingProfile} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 flex items-center gap-2">
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
              {isEditingProfile ? (
                <input type="text" value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} className="w-full px-4 py-3 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{profile?.name}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Registered Mobile</label>
              <div className="flex items-center gap-3 text-gray-900">
                <Phone size={18} className="text-gray-400" />
                <span className="text-lg font-semibold">{profile?.mobile}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold rounded">Unchangeable</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
              {isEditingProfile ? (
                <input type="email" value={profileFormData.email} onChange={e => setProfileFormData({...profileFormData, email: e.target.value})} className="w-full px-4 py-3 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Not provided" />
              ) : (
                <div className="flex items-center gap-3 text-gray-900">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-lg font-semibold">{profile?.email || <span className="text-gray-400 italic">Not provided</span>}</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Account Status</label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile?.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                <span className={`text-lg font-semibold ${profile?.status === 'APPROVED' ? 'text-emerald-700' : 'text-orange-700'}`}>{profile?.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Section */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">KYC & Business Details</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Complete your profile for seamless transactions.</p>
            </div>
          </div>
          <div>
            {!isEditingKyc ? (
              <button 
                onClick={() => setIsEditingKyc(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
              >
                <Edit2 size={16} />
                <span>{kyc ? "Edit KYC" : "Complete KYC"}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingKyc(false)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">Cancel</button>
                <button onClick={handleSaveKyc} disabled={savingKyc} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center gap-2">
                  {savingKyc ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  <span>Save KYC</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">GSTIN</label>
            {isEditingKyc ? (
              <input type="text" value={kycFormData.gstin} onChange={e => setKycFormData({...kycFormData, gstin: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. 29ABCDE1234F2Z5" />
            ) : (
              <p className="text-lg font-semibold text-gray-900 uppercase">{kyc?.gstin || <span className="text-gray-400 italic normal-case">Not provided</span>}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">PAN Number</label>
            {isEditingKyc ? (
              <input type="text" value={kycFormData.pan} onChange={e => setKycFormData({...kycFormData, pan: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="e.g. ABCDE1234F" />
            ) : (
              <p className="text-lg font-semibold text-gray-900 uppercase">{kyc?.pan || <span className="text-gray-400 italic normal-case">Not provided</span>}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Aadhar Number</label>
            {isEditingKyc ? (
              <input type="text" value={kycFormData.aadhar} onChange={e => setKycFormData({...kycFormData, aadhar: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="12-digit Aadhar" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{kyc?.aadhar || <span className="text-gray-400 italic">Not provided</span>}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Date of Birth / Incorporation</label>
            {isEditingKyc ? (
              <input type="date" value={kycFormData.dob} onChange={e => setKycFormData({...kycFormData, dob: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{kyc?.dob ? new Date(kyc.dob).toLocaleDateString() : <span className="text-gray-400 italic">Not provided</span>}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Bank Details</label>
            {isEditingKyc ? (
              <textarea value={kycFormData.bankDetails} onChange={e => setKycFormData({...kycFormData, bankDetails: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Bank Name, Account Number, IFSC Code..." />
            ) : (
              <p className="text-lg font-semibold text-gray-900 whitespace-pre-line">{kyc?.bankDetails || <span className="text-gray-400 italic">Not provided</span>}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Registered Address</label>
            {isEditingKyc ? (
              <textarea value={kycFormData.address} onChange={e => setKycFormData({...kycFormData, address: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full business or residential address" />
            ) : (
              <p className="text-lg font-semibold text-gray-900 whitespace-pre-line">{kyc?.address || <span className="text-gray-400 italic">Not provided</span>}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
