import { X, MapPin, PenSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

// Component ย่อยสำหรับดักจับการคลิกบนแผนที่เพื่อปักหมุด
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function AssignTaskModal({ isOpen, onClose, assignmentData, onSave }) {
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(null); // เก็บค่า [latitude, longitude]

  // ตั้งค่าจุดกึ่งกลางเริ่มต้นของแผนที่ (เช่น มหาวิทยาลัยแม่โจ้ ตามข้อมูล Event)
  const defaultCenter = [18.895116, 99.012072]; 

  // เคลียร์ข้อมูลทุกครั้งที่เปิด Modal ขึ้นมาใหม่
  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setPosition(null);
    }
  }, [isOpen]);

  if (!isOpen || !assignmentData) return null;

  const handleSave = () => {
    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!position) {
      alert("กรุณาคลิกเพื่อปักหมุดตำแหน่งจุดปฏิบัติงานบนแผนที่");
      return;
    }
    if (!description.trim()) {
      alert("กรุณาระบุรายละเอียดการทำงาน");
      return;
    }

    // ส่งข้อมูลที่มีละติจูดและลองจิจูดจริงๆ กลับไปให้หน้า Dashboard เพื่อยิง API
    onSave({
      ...assignmentData,
      latitude: position[0].toString(),
      longitude: position[1].toString(),
      description: description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-[24px] w-[550px] overflow-hidden shadow-2xl relative border-[2px] border-[#111827]">
        
        {/* Header */}
        <div className="bg-[#111827] h-[50px] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <PenSquare size={18} />
            <h2 className="font-medium text-[15px]">มอบหมายงาน</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 text-[13px] text-gray-800 space-y-5">
          <div className="flex gap-10 border-b border-gray-200 pb-4">
            <div>
              <span className="font-semibold text-gray-900">รหัสประจำตัว:</span> 
              <span className="ml-2 text-gray-600">{assignmentData.guardId}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">ชื่อ-นามสกุล:</span> 
              <span className="ml-2 text-gray-600">{assignmentData.guardName}</span>
            </div>
          </div>

          {/* แผนที่ (MapContainer) */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
              <MapPin size={16} className="text-emerald-500" /> ตำแหน่งจุดปฏิบัติงาน
            </div>
            <div className="w-full h-[200px] bg-gray-100 border border-gray-300 rounded-xl overflow-hidden relative z-0">
              <MapContainer 
                center={defaultCenter} 
                zoom={16} 
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            
            {/* ข้อความแจ้งเตือนสถานะการปักหมุด */}
            <div className="mt-1.5 h-[16px]">
              {!position ? (
                <span className="text-red-500 text-[11px] font-medium">* กรุณาคลิกบนแผนที่เพื่อปักหมุด</span>
              ) : (
                <span className="text-emerald-600 text-[11px] font-semibold">
                  ✓ ปักหมุดสำเร็จ (Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)})
                </span>
              )}
            </div>
          </div>

          {/* รายละเอียดการทำงาน */}
          <div>
            <div className="font-semibold text-gray-900 mb-2">รายละเอียดการทำงาน</div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดการทำงาน..."
              rows="3"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-emerald-500 resize-none text-[13px]"
            />
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-100">
            <button 
              onClick={handleSave}
              className="h-[36px] px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition flex items-center gap-2 shadow-sm"
            >
              <PenSquare size={16} /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}