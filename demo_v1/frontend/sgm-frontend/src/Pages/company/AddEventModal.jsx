import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  MapPin,
  CalendarDays,
  Plus,
  Users,
  Clock,
  Shield,
  Image as ImageIcon,
} from "lucide-react";
// นำเข้าไลบรารีแผนที่
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// --- แก้ไขบั๊ก Icon ของ Leaflet ใน React ---
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
// ----------------------------------------

// คอมโพเนนต์สำหรับรับค่าการคลิกบนแผนที่
function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function AddEventModal({ isOpen, onClose, onSave }) {
  // ================= STATES =================
  const [eventName, setEventName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractor, setContractor] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [headGuardsList, setHeadGuardsList] = useState([]);

  // แผนที่
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [position, setPosition] = useState(null); // [lat, lng]

  // อุปกรณ์ (เริ่มต้นที่ 3 ช่องตามรูป)
  const [requiredTools, setRequiredTools] = useState(["", "", ""]);
  const [providedTools, setProvidedTools] = useState(["", "", ""]);

  // ช่วงเวลาและจำนวนเจ้าหน้าที่ (Shifts)
  const [shifts, setShifts] = useState([
    { guards: "", startTime: "", endTime: "", headGuard: "" },
  ]);

  if (!isOpen) return null;

  // ================= FUNCTIONS =================
  const handleAddRequiredTool = () => setRequiredTools([...requiredTools, ""]);
  const handleAddProvidedTool = () => setProvidedTools([...providedTools, ""]);

  const handleAddShift = () => {
    setShifts([
      ...shifts,
      { guards: "", startTime: "", endTime: "", headGuard: "" },
    ]);
  };

  const updateTool = (type, index, value) => {
    if (type === "required") {
      const newTools = [...requiredTools];
      newTools[index] = value;
      setRequiredTools(newTools);
    } else {
      const newTools = [...providedTools];
      newTools[index] = value;
      setProvidedTools(newTools);
    }
  };

  const updateShift = (index, field, value) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  const handleSubmit = () => {
    // 1. คำนวณผลรวมของจำนวนเจ้าหน้าที่ที่ต้องการจากทุกกะ (ป้องกันกรณีค่าว่างให้เป็น 0)
    const totalRequiredGuards = shifts.reduce((sum, shift) => {
      return sum + (parseInt(shift.guards) || 0);
    }, 0);

    // 2. กรองค่าว่างออกก่อนส่งให้ Backend
    const payload = {
      event_name: eventName,
      location: locationName,
      latitude: position ? position[0].toString() : "",
      longitude: position ? position[1].toString() : "",
      contractor: contractor,
      contact: contactInfo,
      event_detail: eventDetail,
      required_tools: requiredTools.filter((t) => t.trim() !== ""),
      provided_tools: providedTools.filter((t) => t.trim() !== ""),
      shift_times: shifts,

      // 3. เพิ่มฟิลด์นี้เข้าไป เพื่อให้ตรงกับ Entity ของ Backend
      required_guards: totalRequiredGuards,
      startDate: startDate,
      endDate: endDate,
    };

    useEffect(() => {
      if (isOpen) {
        const fetchHeadGuards = async () => {
          try {
            const response = await axios.get(
              "http://localhost:8080/api/headguard",
            );
            // กรองเอาเฉพาะคนที่ยังปฏิบัติงานอยู่ (quit_date เป็น null)
            const activeGuards = response.data.filter(
              (guard) => guard.quit_date === null,
            );
            setHeadGuardsList(activeGuards);
          } catch (error) {
            console.error("Error fetching head guards:", error);
          }
        };
        fetchHeadGuards();
      }
    }, [isOpen]);

    console.log("Saving Data:", payload);
    if (onSave) onSave(payload);
  };

  // ================= RENDER =================
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[900px] max-h-[95vh] overflow-y-auto shadow-2xl relative scrollbar-hide">
        {/* HEADER */}
        <div className="bg-[#2864e8] h-[55px] flex items-center justify-between px-6 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CalendarDays size={22} />
            <h2 className="font-semibold text-[18px]">เพิ่มงานอีเว้นท์</h2>
          </div>
          <button onClick={onClose} className="hover:text-gray-200 transition">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 text-[13px] text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* ซ้าย */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  ชื่อสถานที่ หรือ ชื่องานอีเว้นท์:
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="งานอาหารพื้นเมืองภาคเหนือ"
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold">สถานที่จัดงาน:</label>
                <div className="relative w-[60%]">
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="ระบุสถานที่"
                    className="w-full h-[32px] border border-gray-400 rounded-full pl-4 pr-8 outline-none focus:border-blue-500"
                  />
                  <MapPin
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold">วันที่เริ่มปฏิบัติงาน:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500 text-gray-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  วันที่สิ้นสุดปฏิบัติงาน:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500 text-gray-600"
                />
              </div>

              <div className="mt-2">
                <label className="font-semibold block mb-2">
                  รายละเอียดงาน
                </label>
                <textarea
                  value={eventDetail}
                  onChange={(e) => setEventDetail(e.target.value)}
                  placeholder="รายละเอียดงานเบื้องต้น เช่น งานเกี่ยวกับอะไร..."
                  className="w-full h-[120px] border border-gray-400 rounded-[15px] p-3 outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* ขวา */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col mb-1">
                <label className="font-semibold mb-1">ผู้ว่าจ้าง</label>
                <input
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="ระบุชื่อผู้ว่าจ้าง"
                  className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col mb-2">
                <label className="font-semibold mb-1">ช่องทางติดต่อ</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="ระบุช่องทางติดต่อ เช่น (เบอร์โทร, อีเมล)"
                  className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {/* Upload Box */}
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-2">
                    <ImageIcon size={16} /> รูปภาพที่เกี่ยวข้องกับงาน
                  </label>
                  <div className="h-[90px] border-[2px] border-gray-400 border-dashed rounded-[15px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-500">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                      <Plus size={20} />
                    </div>
                    <span className="text-[11px]">คลิกเพื่ออัปโหลด</span>
                    <span className="text-[10px] text-gray-400">
                      รองรับไฟล์ JPG, PNG
                    </span>
                  </div>
                </div>

                {/* Map Select Box */}
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-2">
                    <MapPin size={16} /> ตำแหน่งที่จัดงาน
                  </label>
                  <div
                    onClick={() => setIsMapOpen(true)}
                    className={`h-[90px] border-[2px] border-gray-400 rounded-[15px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition ${position ? "bg-green-50 border-green-500" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${position ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}
                    >
                      <MapPin size={20} />
                    </div>
                    <span
                      className={`text-[11px] ${position ? "text-green-600 font-semibold" : "text-gray-500"}`}
                    >
                      {position ? "เลือกตำแหน่งแล้ว" : "คลิกเพื่อเลือกตำแหน่ง"}
                    </span>
                    <span className="text-[10px] text-gray-400">บนแผนที่</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* อุปกรณ์ที่ต้องการ */}
                <div>
                  <label className="font-semibold block mb-2">
                    อุปกรณ์ที่ต้องการ
                  </label>
                  {requiredTools.map((tool, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <span className="w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={tool}
                        onChange={(e) =>
                          updateTool("required", idx, e.target.value)
                        }
                        placeholder="ระบุอุปกรณ์"
                        className="flex-1 h-[26px] border border-gray-400 rounded-full px-3 text-[12px] outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAddRequiredTool}
                    className="text-gray-400 hover:text-gray-600 float-right"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* อุปกรณ์ที่มีให้ */}
                <div>
                  <label className="font-semibold block mb-2">
                    อุปกรณ์ที่มีให้
                  </label>
                  {providedTools.map((tool, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <span className="w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={tool}
                        onChange={(e) =>
                          updateTool("provided", idx, e.target.value)
                        }
                        placeholder="ระบุอุปกรณ์"
                        className="flex-1 h-[26px] border border-gray-400 rounded-full px-3 text-[12px] outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAddProvidedTool}
                    className="text-gray-400 hover:text-gray-600 float-right"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-gray-300" />

          {/* ช่วงเวลาปฏิบัติงานและจำนวนเจ้าหน้าที่ */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <h3 className="font-bold text-[14px]">
              ช่วงเวลาปฏิบัติงานและจำนวนเจ้าหน้าที่
            </h3>
            <button
              onClick={handleAddShift}
              className="bg-gray-200 rounded text-gray-600 hover:bg-gray-300 px-1"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-[600px] mx-auto">
            {shifts.map((shift, idx) => (
              <div key={idx} className="flex flex-col gap-3">
                <p className="text-[#2864e8] font-semibold">
                  ช่วงเวลาปฏิบัติงานกะที่ {idx + 1}:
                </p>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-semibold">
                    จำนวนเจ้าหน้าที่ในงาน:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={shift.guards}
                      onChange={(e) =>
                        updateShift(idx, "guards", e.target.value)
                      }
                      placeholder="ระบุจำนวนเจ้าหน้าที่"
                      className="w-full h-[32px] border border-gray-400 rounded-full pl-4 pr-10 outline-none"
                    />
                    <Users
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-semibold">เวลาเริ่มปฏิบัติงาน:</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) =>
                        updateShift(idx, "startTime", e.target.value)
                      }
                      className="w-full h-[32px] border border-gray-400 rounded-full pl-4 pr-10 outline-none text-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-semibold">
                    เวลาสิ้นสุดปฏิบัติงาน:
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) =>
                        updateShift(idx, "endTime", e.target.value)
                      }
                      className="w-full h-[32px] border border-gray-400 rounded-full pl-4 pr-10 outline-none text-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-semibold text-[#2864e8] flex items-center gap-1">
                    <Shield size={16} /> หัวหน้าชุด:
                  </label>
                  <select
                    value={shift.headGuard}
                    onChange={(e) =>
                      updateShift(idx, "headGuard", e.target.value)
                    }
                    className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none bg-white text-gray-600"
                  >
                    <option value="">-- กรุณาเลือกหัวหน้าชุด --</option>
                    {headGuardsList.map((hg) => {
                      // สร้างรหัสแสดงผลแบบ HG-001
                      const hgDisplayId = `HG-${hg.users_id.toString().padStart(3, "0")}`;
                      // ใช้ users_id เป็น value ตอนส่งกลับไปให้ Backend (หรือจะใช้ hgDisplayId ก็ได้ ขึ้นอยู่กับ Backend ของคุณ)
                      return (
                        <option key={hg.users_id} value={hg.users_id}>
                          {hg.first_name} {hg.last_name} ({hgDisplayId})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              className="h-[40px] px-6 bg-[#00a67e] hover:bg-emerald-600 text-white rounded-full font-medium transition shadow-md flex items-center gap-2"
            >
              <CalendarDays size={18} /> บันทึกงานอีเว้นท์
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL แผนที่ (OSM) ================= */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-[700px] h-[500px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="text-red-500" /> คลิกบนแผนที่เพื่อปักหมุด
              </h3>
              <button
                onClick={() => setIsMapOpen(false)}
                className="text-gray-500 hover:text-black"
              >
                <X />
              </button>
            </div>
            <div className="flex-1 bg-gray-200">
              <MapContainer
                center={position || [13.7563, 100.5018]} // Default: กรุงเทพฯ
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationSelector
                  position={position}
                  setPosition={setPosition}
                />
              </MapContainer>
            </div>
            <div className="p-3 bg-white border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {position
                  ? `พิกัด: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
                  : "ยังไม่ได้เลือกพิกัด"}
              </span>
              <button
                onClick={() => setIsMapOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ยืนยันตำแหน่ง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
