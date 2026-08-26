import { X, MapPin, AlignLeft, User } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ViewAssignmentModal({
  isOpen,
  onClose,
  assignmentData,
}) {
  if (!isOpen || !assignmentData) return null;

  // เช็คว่ามีพิกัดแผนที่หรือไม่
  const hasLocation = assignmentData.latitude && assignmentData.longitude;
  const position = hasLocation
    ? [
        parseFloat(assignmentData.latitude),
        parseFloat(assignmentData.longitude),
      ]
    : [18.895116, 99.012072]; // ค่า Default ถ้าไม่มีพิกัด

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-[24px] w-[550px] overflow-hidden shadow-2xl relative border-[2px] border-blue-600">
        {/* Header */}
        <div className="bg-blue-600 h-[50px] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <AlignLeft size={18} />
            <h2 className="font-medium text-[15px]">ข้อมูลการมอบหมายงาน</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 text-[13px] text-gray-800 space-y-5">
          {/* ข้อมูล รปภ. */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <div className="font-bold text-[15px] text-gray-900">
                {assignmentData.guardName}
              </div>
              <div className="text-gray-500">
                รหัสประจำตัว: {assignmentData.guardId}
              </div>
            </div>
          </div>

          {/* แผนที่แบบ Read-only */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
              <MapPin size={16} className="text-blue-500" />{" "}
              ตำแหน่งจุดปฏิบัติงาน
            </div>
            <div className="w-full h-[200px] bg-gray-100 border border-gray-300 rounded-xl overflow-hidden relative z-0">
              {hasLocation ? (
                <MapContainer
                  center={position}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={position} />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <MapPin size={32} className="mb-2 text-gray-300" />
                  <p>ไม่มีข้อมูลพิกัดแผนที่</p>
                </div>
              )}
            </div>
          </div>

          {/* รายละเอียด */}
          <div>
            <div className="font-semibold text-gray-900 mb-2">
              รายละเอียดการทำงาน
            </div>
            <div className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 min-h-[80px] text-gray-700">
              {assignmentData.description || (
                <span className="text-gray-400 italic">
                  ไม่มีรายละเอียดเพิ่มเติม...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="h-[36px] px-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition shadow-sm"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
