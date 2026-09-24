import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  PenSquare,
  Search,
  Loader2,
  Locate,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// การตั้งค่าให้ไอคอนหมุดของ Leaflet แสดงผลได้ถูกต้องใน React (Vite)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component ย่อยสำหรับปรับมุมมองแผนที่เมื่อพิกัดศูนย์กลางเปลี่ยนไป
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 16);
    }
  }, [center, map]);
  return null;
}

// Component ย่อยสำหรับดักจับการคลิกบนแผนที่เพื่อปักหมุด
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function AssignTaskModal({
  isOpen,
  onClose,
  assignmentData,
  onSave,
}) {
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(null); // [latitude, longitude]
  const [mapCenter, setMapCenter] = useState([18.895116, 99.012072]); // ศูนย์กลางแผนที่

  // สำหรับการค้นหาสถานที่บนแผนที่
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // ตั้งค่าจุดกึ่งกลางเริ่มต้นสำรอง (มหาวิทยาลัยแม่โจ้)
  const defaultCenter = [18.895116, 99.012072];

  // ฟังก์ชันดึงตำแหน่งปัจจุบันของผู้ใช้
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่งปัจจุบัน");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setMapCenter(coords);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Unable to get current location:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  // ค้นหาสถานที่ผ่าน OpenStreetMap Nominatim API
  const handleSearchLocation = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "th,en",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        if (data.length === 1) {
          handleSelectSearchResult(data[0]);
        }
      } else {
        setSearchError("ไม่พบสถานที่ที่ค้นหา กรุณาลองใช้คำค้นหาอื่น");
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
      setSearchError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const coords = [lat, lon];
    setPosition(coords);
    setMapCenter(coords);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  // เมื่อเปิด Modal ขึ้นมา: กำหนดค่าเริ่มต้นเป็นตำแหน่งปัจจุบัน
  useEffect(() => {
    if (isOpen) {
      setDescription(assignmentData?.description || "");
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");

      const prevLat = parseFloat(assignmentData?.latitude);
      const prevLng = parseFloat(assignmentData?.longitude);

      if (!isNaN(prevLat) && !isNaN(prevLng) && prevLat !== 0 && prevLng !== 0) {
        // หากมีพิกัดเดิมอยู่แล้ว ให้ใช้พิกัดเดิม
        setPosition([prevLat, prevLng]);
        setMapCenter([prevLat, prevLng]);
      } else {
        // ค่าเริ่มต้น: ดึงตำแหน่งปัจจุบัน (Default settings on current location)
        if (navigator.geolocation) {
          setIsLocating(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const currentCoords = [pos.coords.latitude, pos.coords.longitude];
              setPosition(currentCoords);
              setMapCenter(currentCoords);
              setIsLocating(false);
            },
            (err) => {
              console.warn("Unable to get initial current location:", err);
              setPosition(defaultCenter);
              setMapCenter(defaultCenter);
              setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
          );
        } else {
          setPosition(defaultCenter);
          setMapCenter(defaultCenter);
        }
      }
    }
  }, [isOpen, assignmentData]);

  if (!isOpen || !assignmentData) return null;

  const handleSave = () => {
    if (!position) {
      alert("กรุณาคลิกเพื่อปักหมุดตำแหน่งจุดปฏิบัติงานบนแผนที่");
      return;
    }
    if (!description.trim()) {
      alert("กรุณาระบุรายละเอียดการทำงาน");
      return;
    }

    onSave({
      ...assignmentData,
      latitude: position[0].toString(),
      longitude: position[1].toString(),
      description: description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[560px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative border-[2px] border-[#111827]">
        {/* Header */}
        <div className="bg-[#111827] h-[50px] flex items-center justify-between px-6 text-white shrink-0">
          <div className="flex items-center gap-2">
            <PenSquare size={18} />
            <h2 className="font-medium text-[15px]">มอบหมายงาน</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-[13px] text-gray-800 space-y-4 overflow-y-auto">
          {/* ข้อมูลเจ้าหน้าที่ */}
          <div className="flex gap-8 border-b border-gray-200 pb-3">
            <div>
              <span className="font-semibold text-gray-900">รหัสประจำตัว:</span>
              <span className="ml-2 text-gray-600">
                {assignmentData.guardId}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">ชื่อ-นามสกุล:</span>
              <span className="ml-2 text-gray-600">
                {assignmentData.guardName}
              </span>
            </div>
          </div>

          {/* แผนที่ (MapContainer & Search) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald-500" />
                <span>ตำแหน่งจุดปฏิบัติงาน</span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                title="ใช้ตำแหน่งปัจจุบันของคุณ"
              >
                {isLocating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Locate size={13} />
                )}
                <span>ตำแหน่งปัจจุบัน</span>
              </button>
            </div>

            {/* ช่องค้นหาสถานที่ */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search
                  size={15}
                  className="absolute left-3 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                  placeholder="ค้นหาสถานที่ (เช่น มหาวิทยาลัยแม่โจ้, สยามพารากอน)..."
                  className="w-full h-[36px] pl-9 pr-24 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-sm"
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setSearchError("");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                      title="ล้างข้อความ"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearching || !searchQuery.trim()}
                    className="h-[28px] px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-md flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSearching ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "ค้นหา"
                    )}
                  </button>
                </div>
              </div>

              {/* รายการผลการค้นหา */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[40px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-[180px] overflow-y-auto z-[1000] divide-y divide-gray-100">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition flex items-start gap-2 text-xs cursor-pointer group"
                    >
                      <MapPin
                        size={14}
                        className="text-red-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-gray-800 line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchError && (
                <div className="mt-1 text-[11px] text-red-500 font-medium">
                  {searchError}
                </div>
              )}
            </div>

            {/* กล่องแผนที่ */}
            <div className="w-full h-[230px] bg-gray-100 border border-gray-300 rounded-xl overflow-hidden relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapRecenter center={mapCenter} />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>

            {/* ข้อความแจ้งเตือนสถานะการปักหมุด */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              {!position ? (
                <span className="text-red-500 font-medium">
                  * กรุณาคลิกบนแผนที่หรือค้นหาเพื่อปักหมุด
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">
                  ✓ ปักหมุดตำแหน่ง (Lat: {position[0].toFixed(5)}, Lng:{" "}
                  {position[1].toFixed(5)})
                </span>
              )}
              <span className="text-gray-400">
                คลิกบนแผนที่เพื่อเปลี่ยนตำแหน่ง
              </span>
            </div>
          </div>

          {/* รายละเอียดการทำงาน */}
          <div>
            <div className="font-semibold text-gray-900 mb-1.5">
              รายละเอียดการทำงาน
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดงานที่มอบหมาย เช่น ประจำจุดประตูทางเข้าหลัก..."
              rows="3"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-emerald-500 resize-none text-[13px]"
            />
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-[36px] px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <PenSquare size={16} /> บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
