import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X,
  MapPin,
  Plus,
  Users,
  Shield,
  Image as ImageIcon,
  PenSquare,
  Edit,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function EditEventModal({
  isOpen,
  onClose,
  onSave,
  eventData,
  companyName,
  companyId,
}) {
  const [eventName, setEventName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractor, setContractor] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [headGuardsList, setHeadGuardsList] = useState([]);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const [requiredTools, setRequiredTools] = useState(["", "", ""]);
  const [providedTools, setProvidedTools] = useState(["", "", ""]);

  const [shifts, setShifts] = useState([
    { guards: "", shiftDate: "", startTime: "", endTime: "", headGuard: "" },
  ]);

  const [eventImg, setEventImg] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "events");

    setIsUploadingImage(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (res.data && res.data.fileName) {
        setEventImg(res.data.fileName);
      }
    } catch (err) {
      console.error("Upload event image failed:", err);
      alert("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 🌟 ดึงรายชื่อ HeadGuards เตรียมไว้
      const fetchHeadGuards = async () => {
        try {
          const response = await axios.get(
            "http://localhost:8080/api/headguard",
            {
              params: companyName ? { company: companyName } : {},
            },
          );
          if (Array.isArray(response.data)) {
            const activeGuards = response.data.filter((guard) => {
              if (guard.quit_date !== null) return false;
              if (!companyName) return true;
              const gComp = guard.company_name;
              return !gComp || gComp === companyName;
            });
            setHeadGuardsList(activeGuards);
          }
        } catch (error) {
          console.error("Error fetching head guards:", error);
        }
      };
      fetchHeadGuards();

      if (eventData) {
        setEventName(eventData.event_name || "");
        setLocationName(eventData.location || "");
        setContractor(eventData.contractor || "");
        setContactInfo(eventData.contact || "");
        setEventDetail(eventData.event_detail || "");
        setStatus(eventData.status || "PENDING");

        if (eventData.latitude && eventData.longitude) {
          setPosition([
            parseFloat(eventData.latitude),
            parseFloat(eventData.longitude),
          ]);
        } else {
          setPosition(null);
        }

        const padTools = (tools) => {
          const padded = [...(tools || [])];
          while (padded.length < 3) padded.push("");
          return padded;
        };
        setRequiredTools(padTools(eventData.required_tools));
        setProvidedTools(padTools(eventData.provided_tools));

        setStartDate(
          eventData.start_date ? eventData.start_date.split("T")[0] : "",
        );
        setEndDate(eventData.end_date ? eventData.end_date.split("T")[0] : "");

        // 🌟 Map กะเวลาเดิมกลับเข้า Form ให้ถูกต้อง
        if (eventData.shift_times && eventData.shift_times.length > 0) {
          const sortedShifts = [...eventData.shift_times].sort(
            (a, b) => new Date(a.start_time) - new Date(b.start_time),
          );

          const mappedShifts = sortedShifts.map((st) => ({
            guards: st.maximum_guards?.toString() || "",
            shiftDate: st.shift_date
              ? st.shift_date.split("T")[0]
              : st.start_time
                ? st.start_time.split("T")[0]
                : "",
            startTime: st.start_time
              ? st.start_time.split("T")[1]?.substring(0, 5)
              : "",
            endTime: st.end_time
              ? st.end_time.split("T")[1]?.substring(0, 5)
              : "",
            headGuard:
              st.headGuard?.users_id?.toString() ||
              st.head_guard_id?.toString() ||
              "",
          }));
          setShifts(mappedShifts);
        } else {
          setShifts([
            {
              guards: "",
              shiftDate: "",
              startTime: "",
              endTime: "",
              headGuard: "",
            },
          ]);
        }

        const existingImg = eventData.event_img || "";
        setEventImg(existingImg);
        if (
          existingImg &&
          existingImg !== "default.png" &&
          existingImg !== "no-image.png"
        ) {
          const previewSrc = existingImg.startsWith("http")
            ? existingImg
            : existingImg.startsWith("/uploads/")
              ? `http://localhost:8080${existingImg}`
              : existingImg.startsWith("/")
                ? `http://localhost:8080/uploads${existingImg}`
                : `http://localhost:8080/uploads/${existingImg}`;
          setImagePreview(previewSrc);
        } else {
          setImagePreview("");
        }
      }
    }
  }, [isOpen, eventData, companyName]);

  if (!isOpen) return null;

  const handleAddRequiredTool = () => setRequiredTools([...requiredTools, ""]);
  const handleAddProvidedTool = () => setProvidedTools([...providedTools, ""]);

  const handleAddShift = () => {
    setShifts([
      ...shifts,
      {
        guards: "",
        shiftDate: startDate || "",
        startTime: "",
        endTime: "",
        headGuard: "",
      },
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
    if (!eventName.trim()) {
      alert("กรุณาระบุชื่องานอีเว้นท์");
      return;
    }

    if (!contactInfo || !contactInfo.trim()) {
      alert("กรุณาระบุช่องทางติดต่อ (อีเมล)");
      return;
    }

    if (!EMAIL_REGEX.test(contactInfo.trim())) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    const totalRequiredGuards = shifts.reduce(
      (sum, shift) => sum + (parseInt(shift.guards) || 0),
      0,
    );

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
      required_guards: totalRequiredGuards,
      start_date: startDate,
      end_date: endDate,
      status: status,
      company_id: companyId || eventData?.company_id,
      event_img: eventImg || eventData?.event_img || "default.png",
    };

    if (onSave) onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[900px] max-h-[95vh] overflow-y-auto shadow-2xl relative scrollbar-hide border-[2px] border-blue-500">
        <div className="bg-[#2864e8] h-[55px] flex items-center justify-between px-6 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <PenSquare size={22} />
            <h2 className="font-semibold text-[18px]">
              แก้ไขรายละเอียดงานอีเว้นท์
            </h2>
          </div>
          <button onClick={onClose} className="hover:text-gray-200 transition">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

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
              <div className="flex items-center justify-between">
                <label className="font-semibold">สถานะงานอีเว้นท์:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="ONGOING">กำลังดำเนินการ</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>

              <div className="mt-2">
                <label className="font-semibold block mb-2">
                  รายละเอียดงาน
                </label>
                <textarea
                  value={eventDetail}
                  onChange={(e) => setEventDetail(e.target.value)}
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
                  className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col mb-2">
                <label className="font-semibold mb-1">
                  ช่องทางติดต่อ (อีเมล) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="เช่น example@email.com"
                  className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="font-semibold flex items-center gap-1 mb-2">
                    <ImageIcon size={16} /> รูปภาพที่เกี่ยวข้องกับงาน
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[90px] border-[2px] border-gray-400 border-dashed rounded-[15px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-500 overflow-hidden relative group"
                  >
                    {imagePreview ? (
                      <div className="w-full h-full relative">
                        <img
                          src={imagePreview}
                          alt="Event Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-medium">
                          คลิกเพื่อเปลี่ยนรูป
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                          {isUploadingImage ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={20} />
                          )}
                        </div>
                        <span className="text-[11px]">
                          {isUploadingImage
                            ? "กำลังอัปโหลด..."
                            : "คลิกเพื่อเปลี่ยนรูป"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          รองรับไฟล์ JPG, PNG
                        </span>
                      </>
                    )}
                  </div>
                </div>

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
                      {position ? "เปลี่ยนตำแหน่ง" : "คลิกเพื่อเลือกตำแหน่ง"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
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

          <div className="flex items-center justify-center gap-2 mb-6">
            <h3 className="font-bold text-[14px]">
              ช่วงเวลาปฏิบัติงานและจำนวนเจ้าหน้าที่
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mx-auto">
            {shifts.map((shift, idx) => (
              <div key={idx} className="flex flex-col gap-3 bg-white p-2">
                <p className="text-[#2864e8] font-semibold">
                  ช่วงเวลาปฏิบัติงานกะที่ {idx + 1}:
                </p>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
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
                      className="w-full h-[30px] border border-gray-400 rounded-full pl-4 pr-10 outline-none"
                    />
                    <Users
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="font-semibold">วันที่ปฏิบัติงาน:</label>
                  <input
                    type="date"
                    value={shift.shiftDate || ""}
                    onChange={(e) =>
                      updateShift(idx, "shiftDate", e.target.value)
                    }
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-600"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="font-semibold">เวลาเริ่มปฏิบัติงาน:</label>
                  <input
                    type="time"
                    value={shift.startTime}
                    onChange={(e) =>
                      updateShift(idx, "startTime", e.target.value)
                    }
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-600"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="font-semibold">
                    เวลาสิ้นสุดปฏิบัติงาน:
                  </label>
                  <input
                    type="time"
                    value={shift.endTime}
                    onChange={(e) =>
                      updateShift(idx, "endTime", e.target.value)
                    }
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-600"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
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
                    {headGuardsList.map((hg) => (
                      <option key={hg.users_id} value={hg.users_id}>
                        {hg.first_name} {hg.last_name} (HG-
                        {hg.users_id.toString().padStart(3, "0")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex mt-2">
            <button
              onClick={handleAddShift}
              className="bg-gray-200 rounded text-gray-600 hover:bg-gray-300 p-1"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              className="h-[40px] px-8 bg-[#F58220] hover:bg-orange-600 text-white rounded-full font-medium transition shadow-md flex items-center gap-2"
            >
              <Edit size={18} /> ยืนยัน
            </button>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-[700px] h-[500px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="text-red-500" /> คลิกบนแผนที่เพื่อแก้พิกัด
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
                center={position || [13.7563, 100.5018]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
