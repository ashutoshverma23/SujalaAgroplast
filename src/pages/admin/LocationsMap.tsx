import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Filter, Sliders, X, Navigation, Info, Loader2 } from "lucide-react";
import { BACKEND_URL } from "../../config";

interface LocationEntity {
  id: string;
  name: string;
  mobile: string;
  role?: string;
  type?: string; // Store type
  status?: string;
  lat?: string | number | null;
  lng?: string | number | null;
  geotagLat?: number | null;
  geotagLng?: number | null;
  geotagAddress?: string | null;
  location?: string; // Farmer/Store general location string
  crops?: string[];
  firmName?: string;
  ownerName?: string;
  state?: string;
}

// Haversine distance calculator
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function LocationsMap() {
  const [dealers, setDealers] = useState<LocationEntity[]>([]);
  const [stores, setStores] = useState<LocationEntity[]>([]);
  const [farmers, setFarmers] = useState<LocationEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Check if Leaflet is loaded on window
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Filters
  const [showDealers, setShowDealers] = useState(true);
  const [showStores, setShowStores] = useState(true);
  const [showFarmers, setShowFarmers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusCenter, setRadiusCenter] = useState<{
    lat: number;
    lng: number;
    name: string;
    type: string;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  // Map state
  const mapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markersMapRef = useRef<Map<string, any>>(new Map());

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        const [usersRes, storesRes, farmersRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/users`, { headers }),
          fetch(`${BACKEND_URL}/api/stores`, { headers }),
          fetch(`${BACKEND_URL}/api/farmers`, { headers }),
        ]);

        if (usersRes.ok) {
          const u = await usersRes.json();
          setDealers(u.filter((user: any) => user.role === "DEALER"));
        }
        if (storesRes.ok) {
          setStores(await storesRes.json());
        }
        if (farmersRes.ok) {
          setFarmers(await farmersRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch coordinates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Bridge global functions for Leaflet buttons
  useEffect(() => {
    (window as any).setMapCenter = (lat: number, lng: number, name: string, type: string) => {
      setRadiusCenter({ lat, lng, name, type });
    };
    return () => {
      delete (window as any).setMapCenter;
    };
  }, []);

  // Map Initialization
  useEffect(() => {
    const L = (window as any).L;
    if (!L || mapRef.current) return;

    // Center of Maharashtra / Mumbai area
    const defaultCenter = [19.0760, 72.8777]; 

    const map = L.map("map-container", {
      center: defaultCenter,
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    markerGroupRef.current = L.layerGroup().addTo(map);

    // Call invalidateSize after a short timeout to ensure container is fully dimensioned in DOM
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Parse location coordinates helper
  const getCoordinates = (entity: LocationEntity) => {
    let lat = parseFloat(String(entity.lat));
    let lng = parseFloat(String(entity.lng));
    if (isNaN(lat) || isNaN(lng)) {
      lat = parseFloat(String(entity.geotagLat));
      lng = parseFloat(String(entity.geotagLng));
    }
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  };

  // Process data for rendering & filtering
  const allEntities = [
    ...dealers.map((d) => ({ ...d, _category: "dealer", label: d.firmName || d.name })),
    ...stores.map((s) => ({ ...s, _category: "store", label: s.name })),
    ...farmers.map((f) => ({ ...f, _category: "farmer", label: f.name })),
  ].map((entity) => {
    const coords = getCoordinates(entity);
    let distance: number | null = null;
    if (coords && radiusCenter) {
      distance = calculateDistance(radiusCenter.lat, radiusCenter.lng, coords.lat, coords.lng);
    }
    return { ...entity, coords, distance };
  });

  // Filter items
  const filteredEntities = allEntities.filter((item) => {
    if (!item.coords) return false;

    // Type filter
    if (item._category === "dealer" && !showDealers) return false;
    if (item._category === "store" && !showStores) return false;
    if (item._category === "farmer" && !showFarmers) return false;

    // Radius filter
    if (radiusCenter && item.distance !== null && item.distance > radiusKm) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchFirm = item.firmName?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      const matchAddress = item.geotagAddress?.toLowerCase().includes(q);
      if (!matchName && !matchFirm && !matchLoc && !matchAddress) return false;
    }

    return true;
  });

  // Redraw Markers & Circle
  useEffect(() => {
    if (!mapRef.current || !markerGroupRef.current) return;

    const L = (window as any).L;
    markerGroupRef.current.clearLayers();
    markersMapRef.current.clear();

    // Draw search radius circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (radiusCenter) {
      circleRef.current = L.circle([radiusCenter.lat, radiusCenter.lng], {
        radius: radiusKm * 1000, // Leaflet radius is in meters
        color: "#10b981",
        fillColor: "#10b981",
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: "4, 6",
      }).addTo(mapRef.current);
    }

    // Plot matching entities
    filteredEntities.forEach((item) => {
      if (!item.coords) return;

      const { lat, lng } = item.coords;
      let colorClass = "bg-blue-600";
      let textLabel = "D";

      if (item._category === "store") {
        colorClass = "bg-emerald-600";
        textLabel = "S";
      } else if (item._category === "farmer") {
        colorClass = "bg-amber-500";
        textLabel = "F";
      }

      const icon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `<div class="relative flex items-center justify-center">
                 <div class="absolute w-8 h-8 rounded-full ${colorClass} opacity-25 animate-ping"></div>
                 <div class="relative w-7 h-7 rounded-full ${colorClass} border-2 border-white flex items-center justify-center shadow-md text-white font-black text-[10px] tracking-tighter">
                   ${textLabel}
                 </div>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const detailText = item._category === "farmer"
        ? `Crops: ${Array.isArray(item.crops) && item.crops.length > 0 ? item.crops.join(", ") : "N/A"}`
        : item._category === "store"
        ? `Owner: ${item.ownerName || "N/A"} (${item.type || "General"})`
        : `Firm: ${item.firmName || "N/A"}`;

      const popupHtml = `
        <div class="p-3 min-w-[200px] space-y-1 text-gray-900">
          <p class="font-black text-sm text-emerald-950">${item.label}</p>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${item._category}</p>
          <p class="text-xs font-semibold text-gray-600">${detailText}</p>
          <p class="text-xs font-bold text-gray-500 mt-1">📞 ${item.mobile}</p>
          ${item.geotagAddress ? `<p class="text-[10px] text-gray-400 font-medium leading-tight mt-1 bg-gray-50 p-1.5 border border-gray-100 rounded-lg max-h-[50px] overflow-y-auto">${item.geotagAddress}</p>` : ""}
          ${item.distance !== null ? `<p class="text-[10px] text-emerald-600 font-black mt-1">📍 Distance: ${item.distance.toFixed(2)} km</p>` : ""}
          <button 
            onclick="window.setMapCenter(${lat}, ${lng}, '${item.label.replace(/'/g, "\\'")}', '${item._category}')"
            class="mt-3 w-full px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            Set Search Center
          </button>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(popupHtml)
        .addTo(markerGroupRef.current);

      markersMapRef.current.set(item.id, marker);
    });

    // Auto fit map boundary if markers exist
    if (filteredEntities.length > 0 && !radiusCenter) {
      const coordsList = filteredEntities.map((item) => [item.coords!.lat, item.coords!.lng]);
      mapRef.current.fitBounds(coordsList, { padding: [50, 50] });
    }
  }, [dealers, stores, farmers, showDealers, showStores, showFarmers, radiusCenter, radiusKm, searchQuery]);

  // Centering on a selected list item
  const handleLocateItem = (item: any) => {
    if (!mapRef.current || !item.coords) return;
    const marker = markersMapRef.current.get(item.id);
    if (marker) {
      marker.openPopup();
      mapRef.current.flyTo([item.coords.lat, item.coords.lng], 14, { duration: 1.5 });
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Left Control Panel */}
        <div className="w-full md:w-80 flex flex-col shrink-0 space-y-5 h-full">
          {/* Header */}
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <MapPin className="text-emerald-600" size={22} /> Location Dashboard
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Field Tracking & Range Queries</p>
          </div>

          {/* Toggle Layers */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={12} /> Layers & Entities
            </h4>
            <div className="space-y-2 text-xs font-bold text-gray-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDealers}
                  onChange={(e) => setShowDealers(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Dealers ({dealers.length})
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStores}
                  onChange={(e) => setShowStores(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Stores ({stores.length})
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFarmers}
                  onChange={(e) => setShowFarmers(e.target.checked)}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Farmers ({farmers.length})
                </span>
              </label>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, address..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-bold text-gray-700"
            />
          </div>

          {/* Range queries */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders size={12} /> Radial Range Filter
            </h4>
            {radiusCenter ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-2.5 text-xs flex items-start gap-2">
                  <Navigation size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-black truncate">{radiusCenter.name}</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mt-0.5">{radiusCenter.type}</p>
                  </div>
                  <button
                    onClick={() => setRadiusCenter(null)}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Radius Range</span>
                    <span className="text-emerald-600">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-start gap-2.5 text-[11px] font-bold text-gray-400">
                <Info size={14} className="text-gray-300 mt-0.5 shrink-0" />
                <p className="leading-normal">Click a marker on the map and choose <strong>"Set Search Center"</strong> to find other items nearby.</p>
              </div>
            )}
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            <div className="flex items-center justify-between px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Listings</span>
              <span>{filteredEntities.length} shown</span>
            </div>
            {filteredEntities.map((item) => {
              let tagColor = "bg-blue-50 border-blue-100 text-blue-700";
              if (item._category === "store") {
                tagColor = "bg-emerald-50 border-emerald-100 text-emerald-700";
              } else if (item._category === "farmer") {
                tagColor = "bg-amber-50 border-amber-100 text-amber-700";
              }
              return (
                <div
                  key={item.id}
                  onClick={() => handleLocateItem(item)}
                  className="bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all rounded-xl p-3 flex items-start gap-3 text-xs"
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center font-black text-[10px] uppercase shrink-0 ${tagColor}`}>
                    {item._category.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{item.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                      {item._category === "farmer" ? item.location : item._category === "store" ? `${item.type || "Store"} · ${item.location}` : item.state || "KYC Location"}
                    </p>
                    {item.distance !== null && (
                      <p className="text-[9px] text-emerald-600 font-black uppercase mt-1">📍 {item.distance.toFixed(1)} km away</p>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredEntities.length === 0 && (
              <div className="text-center py-8 text-gray-400 font-bold text-xs">
                No matching locations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner relative bg-gray-50 h-full">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-600" size={36} />
              <p className="text-sm font-black text-emerald-950 uppercase tracking-widest">Loading Entity Locations...</p>
            </div>
          ) : !leafletLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-emerald-600" size={36} />
              <p className="text-sm font-black text-emerald-950 uppercase tracking-widest">Loading Map Canvas...</p>
            </div>
          ) : null}
          <div id="map-container" className="w-full h-full relative z-0" />
        </div>
      </div>
    </div>
  );
}
