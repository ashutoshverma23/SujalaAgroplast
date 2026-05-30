import { useState, useEffect } from "react";
import { UserCircle, Mail, Phone, Edit2, Loader2, CheckCircle, ShieldCheck, FileText } from "lucide-react";
import { BACKEND_URL } from '../../config';


export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ 
    name: "", 
    email: "",
    profilePhotoUrl: "",
    geotagLat: null as number | null,
    geotagLng: null as number | null,
    geotagTimestamp: null as string | null
  });
  const [lastEdited, setLastEdited] = useState<string | null>(localStorage.getItem("lastProfileEdit"));
  
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    firmName: "",
    whatsappNo: "",
    lat: "",
    lng: "",
    address: "",
    pincode: "",
    state: "",
    district: "",
    taluka: "",
    city: "",
    firmType: "",
    godownAddress: "",
    godownPincode: "",
    aadhar: "",
    pan: "",
    dob: "",
    gstin: "",
    bankHolderName: "",
    bankName: "",
    bankBranch: "",
    bankAccountNo: "",
    bankCity: "",
    bankIfsc: "",
    bankAccountType: "",
  });

  useEffect(() => {
    fetchProfileAndKyc();
  }, []);

  const fetchProfileAndKyc = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const profileRes = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
        setProfileFormData({ 
          name: data.name || "", 
          email: data.email || "",
          profilePhotoUrl: data.profilePhotoUrl || "",
          geotagLat: data.geotagLat || null,
          geotagLng: data.geotagLng || null,
          geotagTimestamp: data.geotagTimestamp || null
        });
      }

      const kycRes = await fetch(`${BACKEND_URL}/api/users/me/kyc`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setKyc(kycData);
        setKycFormData({
          firmName: kycData.firmName || "",
          whatsappNo: kycData.whatsappNo || "",
          lat: kycData.lat || "",
          lng: kycData.lng || "",
          address: kycData.address || "",
          pincode: kycData.pincode || "",
          state: kycData.state || "",
          district: kycData.district || "",
          taluka: kycData.taluka || "",
          city: kycData.city || "",
          firmType: kycData.firmType || "",
          godownAddress: kycData.godownAddress || "",
          godownPincode: kycData.godownPincode || "",
          aadhar: kycData.aadhar || "",
          pan: kycData.pan || "",
          dob: kycData.dob ? new Date(kycData.dob).toISOString().split('T')[0] : "",
          gstin: kycData.gstin || "",
          bankHolderName: kycData.bankHolderName || "",
          bankName: kycData.bankName || "",
          bankBranch: kycData.bankBranch || "",
          bankAccountNo: kycData.bankAccountNo || "",
          bankCity: kycData.bankCity || "",
          bankIfsc: kycData.bankIfsc || "",
          bankAccountType: kycData.bankAccountType || "",
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
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingPhoto(true);
    try {
      let lat = null;
      let lng = null;
      
      // Try getting geolocation
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch (geoErr) {
          console.warn("Geolocation failed", geoErr);
          alert("Could not fetch geolocation. Photo will be saved without location tag.");
        }
      }

      // Mock URL to avoid huge Base64 strings until S3 bucket is ready
      const mockUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80";

      const newFormData = {
        ...profileFormData,
        profilePhotoUrl: mockUrl,
        geotagLat: lat,
        geotagLng: lng,
        geotagTimestamp: new Date().toISOString()
      };

      setProfileFormData(newFormData);

      // Instantly save to backend
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(newFormData)
      });

      if (res.ok) {
        setProfile({ ...profile, ...newFormData });
      } else {
        alert("Failed to save photo metadata on the server.");
      }
      setIsUpdatingPhoto(false);
      // Clear input so we can upload same file again if needed
      e.target.value = "";
    } catch (err) {
      console.error(err);
      setIsUpdatingPhoto(false);
    }
  };

  const handleSaveKyc = async () => {
    setSavingKyc(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/me/kyc`, {
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
      <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500 to-green-400"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 mt-12">
          <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl shadow-emerald-500/10 relative group">
            <div className="w-full h-full bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 overflow-hidden relative">
              {profile?.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={64} />
              )}
              
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                {isUpdatingPhoto ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Edit2 size={24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">Update Photo<br/>+ Geotag</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={isUpdatingPhoto} />
              </label>
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

            {profile?.geotagLat && profile?.geotagLng && (
              <div>
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Profile Geotag</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold font-mono">Lat: {profile.geotagLat}</p>
                  <p className="text-sm font-bold font-mono">Lng: {profile.geotagLng}</p>
                  {profile.geotagTimestamp && (
                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Captured at: {new Date(profile.geotagTimestamp).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KYC Section */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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

        <div className="space-y-8">
          <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Firm Name*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.firmName} onChange={e => setKycFormData({...kycFormData, firmName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.firmName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Mobile No*</label>
              <p className="text-sm font-semibold text-gray-900">{profile?.mobile}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Whatsapp No</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.whatsappNo} onChange={e => setKycFormData({...kycFormData, whatsappNo: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.whatsappNo || '-'}</p>
              )}
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Latitude</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.lat} onChange={e => setKycFormData({...kycFormData, lat: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.lat || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Longitude</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.lng} onChange={e => setKycFormData({...kycFormData, lng: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.lng || '-'}</p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Address*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.address} onChange={e => setKycFormData({...kycFormData, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.address || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Pincode*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.pincode} onChange={e => setKycFormData({...kycFormData, pincode: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.pincode || '-'}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">State*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.state} onChange={e => setKycFormData({...kycFormData, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.state || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">District*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.district} onChange={e => setKycFormData({...kycFormData, district: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.district || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Taluka*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.taluka} onChange={e => setKycFormData({...kycFormData, taluka: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.taluka || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">City/Village*</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.city} onChange={e => setKycFormData({...kycFormData, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.city || '-'}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">E-Mail</label>
              <p className="text-sm font-semibold text-gray-900">{profile?.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Aadhar No</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.aadhar} onChange={e => setKycFormData({...kycFormData, aadhar: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.aadhar || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">PAN No</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.pan} onChange={e => setKycFormData({...kycFormData, pan: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.pan || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Date of Birth</label>
              {isEditingKyc ? (
                <input type="date" value={kycFormData.dob} onChange={e => setKycFormData({...kycFormData, dob: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.dob ? new Date(kyc.dob).toLocaleDateString('en-GB') : '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">GSTN.</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.gstin} onChange={e => setKycFormData({...kycFormData, gstin: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.gstin || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Firm Type*</label>
              {isEditingKyc ? (
                <select value={kycFormData.firmType} onChange={e => setKycFormData({...kycFormData, firmType: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white">
                  <option value="">Select Type</option>
                  <option value="PROPRIETOR">PROPRIETOR</option>
                  <option value="PARTNERSHIP">PARTNERSHIP</option>
                  <option value="PVT LTD">PVT LTD</option>
                </select>
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.firmType || '-'}</p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Godown Address</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.godownAddress} onChange={e => setKycFormData({...kycFormData, godownAddress: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.godownAddress || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Pincode (Godown)</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.godownPincode} onChange={e => setKycFormData({...kycFormData, godownPincode: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.godownPincode || '-'}</p>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2 mt-8">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank Holder Name</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankHolderName} onChange={e => setKycFormData({...kycFormData, bankHolderName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.bankHolderName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank Name</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankName} onChange={e => setKycFormData({...kycFormData, bankName: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.bankName || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank Branch Name</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankBranch} onChange={e => setKycFormData({...kycFormData, bankBranch: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.bankBranch || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank Account Number</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankAccountNo} onChange={e => setKycFormData({...kycFormData, bankAccountNo: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.bankAccountNo || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank City</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankCity} onChange={e => setKycFormData({...kycFormData, bankCity: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.bankCity || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Bank IFSC Code</label>
              {isEditingKyc ? (
                <input type="text" value={kycFormData.bankIfsc} onChange={e => setKycFormData({...kycFormData, bankIfsc: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
              ) : (
                <p className="text-sm font-semibold text-gray-900 uppercase">{kyc?.bankIfsc || '-'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Account Type</label>
              {isEditingKyc ? (
                <select value={kycFormData.bankAccountType} onChange={e => setKycFormData({...kycFormData, bankAccountType: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white">
                  <option value="">Select</option>
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              ) : (
                <p className="text-sm font-semibold text-gray-900">{kyc?.bankAccountType || '-'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
