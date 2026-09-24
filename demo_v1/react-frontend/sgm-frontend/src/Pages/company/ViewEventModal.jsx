import {
  X,
  MapPin,
  CalendarDays,
  Shield,
  Image as ImageIcon,
} from "lucide-react";
import { formatThaiDate, formatThaiTimeRange } from "../../utils/formatters";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ViewEventModal({ isOpen, onClose, eventData }) {
  if (!isOpen || !eventData) return null;

  // แปลงพิกัดเป็นตัวเลข (ถ้ามี)
  const lat = parseFloat(eventData.latitude) || 13.7563;
  const lng = parseFloat(eventData.longitude) || 100.5018;
  const position =
    eventData.latitude && eventData.longitude ? [lat, lng] : null;

  // เรียงกะงานเพื่อเอาไปแสดงผลด้านล่างอย่างเดียว
  const shifts = eventData.shift_times || [];
  const sortedShifts = [...shifts].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time),
  );

  // 🌟 ดึงวันที่หลักของอีเว้นท์จากข้อมูลที่ส่งมาโดยตรง
  const startDate = eventData.start_date
    ? eventData.start_date.split("T")[0]
    : "-";
  const endDate = eventData.end_date ? eventData.end_date.split("T")[0] : "-";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[900px] max-h-[95vh] overflow-y-auto shadow-2xl relative scrollbar-hide border-[2px] border-blue-500">
        {/* HEADER */}
        <div className="bg-blue-600 h-[50px] flex items-center justify-between px-6 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} />
            <h2 className="font-medium text-[16px]">
              ข้อมูลงานอีเว้นท์: {eventData.event_name}
            </h2>
          </div>
          <button onClick={onClose} className="hover:text-gray-200 transition">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 text-[13px] text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* ซ้าย */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-500 w-[140px]">
                  ชื่องานอีเว้นท์:
                </label>
                <div className="flex-1 h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {eventData.event_name}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-500 w-[140px]">
                  สถานที่จัดงาน:
                </label>
                <div className="flex-1 h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700 truncate">
                  {eventData.location}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-500 w-[140px]">
                  วันที่เริ่มปฏิบัติงาน:
                </label>
                <div className="flex-1 h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {formatThaiDate(startDate)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-500 w-[140px]">
                  วันที่สิ้นสุดปฏิบัติงาน:
                </label>
                <div className="flex-1 h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {formatThaiDate(endDate)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <label className="font-semibold text-gray-500 w-[140px]">
                  สถานะงาน:
                </label>
                <div className="flex-1 h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {eventData.status === "ONGOING"
                    ? "กำลังดำเนินการ"
                    : eventData.status === "COMPLETED"
                      ? "เสร็จสิ้น"
                      : eventData.status === "CANCELLED"
                        ? "ยกเลิก"
                        : "รอดำเนินการ"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-500 w-[140px]">
                  การมองเห็นหัวหน้าชุด:
                </label>
                <div
                  className={`flex-1 h-[32px] border rounded-lg px-3 flex items-center font-medium ${
                    eventData.headguard_visible
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-gray-50 border-gray-300 text-gray-500"
                  }`}
                >
                  {eventData.headguard_visible
                    ? "มอบหมายแล้ว (มองเห็น)"
                    : "ยังไม่มอบหมาย (ซ่อน)"}
                </div>
              </div>

              <div className="mt-2">
                <label className="font-semibold text-gray-500 block mb-2">
                  รายละเอียดงาน
                </label>
                <div className="w-full h-[120px] bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-700 overflow-y-auto">
                  {eventData.event_detail}
                </div>
              </div>
            </div>

            {/* ขวา */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col mb-1">
                <label className="font-semibold text-gray-500 mb-1">
                  ผู้ว่าจ้าง
                </label>
                <div className="w-full h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {eventData.contractor || "-"}
                </div>
              </div>
              <div className="flex flex-col mb-1">
                <label className="font-semibold text-gray-500 mb-1">
                  เบอร์โทรศัพท์ผู้ว่าจ้าง
                </label>
                <div className="w-full h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {eventData.contact_phone || eventData.contact || "-"}
                </div>
              </div>
              <div className="flex flex-col mb-2">
                <label className="font-semibold text-gray-500 mb-1">
                  อีเมลผู้ว่าจ้าง
                </label>
                <div className="w-full h-[32px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-700">
                  {eventData.contact_email || "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Image Box */}
                <div>
                  <label className="font-semibold text-gray-500 flex items-center gap-1 mb-2">
                    <ImageIcon size={16} /> รูปภาพ
                  </label>
                  <div className="h-[90px] border border-gray-300 rounded-[15px] overflow-hidden bg-gray-50 flex items-center justify-center">
                    {eventData.event_img &&
                    eventData.event_img !== "default.png" ? (
                      <img
                        src={`http://localhost:8080/uploads/${eventData.event_img}`}
                        alt="Event"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">ไม่มีรูปภาพ</span>
                    )}
                  </div>
                </div>

                {/* Map Box */}
                <div>
                  <label className="font-semibold text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={16} /> พิกัดที่จัดงาน
                  </label>
                  <div className="h-[90px] border border-gray-300 rounded-[15px] overflow-hidden relative z-0">
                    {position ? (
                      <MapContainer
                        center={position}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        dragging={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={position} />
                      </MapContainer>
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                        ไม่มีข้อมูลพิกัด
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* อุปกรณ์ที่ต้องการ */}
                <div>
                  <label className="font-semibold text-gray-500 block mb-2">
                    อุปกรณ์ที่ต้องการ
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {eventData.required_tools?.length > 0 ? (
                      eventData.required_tools.map((tool, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-100 px-3 py-1.5 rounded-full text-[12px] text-gray-700 border border-gray-200"
                        >
                          {idx + 1}. {tool}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">- ไม่มี -</span>
                    )}
                  </div>
                </div>

                {/* อุปกรณ์ที่มีให้ */}
                <div>
                  <label className="font-semibold text-gray-500 block mb-2">
                    อุปกรณ์ที่มีให้
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {eventData.provided_tools?.length > 0 ? (
                      eventData.provided_tools.map((tool, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-100 px-3 py-1.5 rounded-full text-[12px] text-gray-700 border border-gray-200"
                        >
                          {idx + 1}. {tool}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">- ไม่มี -</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* ช่วงเวลาปฏิบัติงานและจำนวนเจ้าหน้าที่ */}
          <div className="mb-6">
            <h3 className="font-bold text-[14px] text-center mb-4">
              ช่วงเวลาปฏิบัติงานและเจ้าหน้าที่ (รวม {eventData.required_guards}{" "}
              คน)
            </h3>
            <div className="flex flex-col gap-4 w-full max-w-[600px] mx-auto">
              {sortedShifts.map((shift, idx) => {
                const startTimeStr = shift.start_time
                  ? shift.start_time.split("T")[1].substring(0, 5)
                  : "-";
                const endTimeStr = shift.end_time
                  ? shift.end_time.split("T")[1].substring(0, 5)
                  : "-";

                return (
                  <div
                    key={idx}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-[#2864e8] font-semibold mb-3">
                      กะที่ {idx + 1} : วันที่{" "}
                      {formatThaiDate(
                        shift.shift_date || shift.start_time || "-",
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* เพิ่มบล็อกนี้เข้าไปใน Card แสดงกะงานของ ViewEventModal.jsx */}
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 col-span-2 mt-2">
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <Shield size={14} className="text-blue-500" />{" "}
                          หัวหน้าชุด:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {shift.headGuard
                            ? `${shift.headGuard.first_name} ${shift.headGuard.last_name}`
                            : "ยังไม่ระบุหัวหน้า"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100">
                        <span className="text-gray-500 font-medium">
                          เจ้าหน้าที่:
                        </span>
                        <span className="font-semibold">
                          {shift.maximum_guards} คน
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100">
                        <span className="text-gray-500 font-medium">
                          เวลาทำงาน:
                        </span>
                        <span className="font-semibold">
                          {formatThaiTimeRange(
                            `${startTimeStr} - ${endTimeStr}`,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end mt-8 border-t border-gray-200 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
