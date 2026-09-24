import { useState, useEffect, useRef, useCallback } from "react";
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
  Locate,
  Search,
  Loader2,
} from "lucide-react";
import Flatpickr from "react-flatpickr";
import { toISODate } from "../../utils/formatters";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
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

function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

const PHONE_REGEX = /^0[689]\d{8}$/;
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
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [headGuardsList, setHeadGuardsList] = useState([]);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

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

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Unable to get current location:", err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  };

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
          const item = data[0];
          setPosition([parseFloat(item.lat), parseFloat(item.lon)]);
          setSearchResults([]);
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
    setPosition([parseFloat(result.lat), parseFloat(result.lon)]);
    setSearchResults([]);
  };

  const resetToPreviousData = useCallback(() => {
    if (!eventData) return;
    setEventName(eventData.event_name || "");
    setLocationName(eventData.location || "");
    setContractor(eventData.contractor || "");
    setContactPhone(eventData.contact_phone || eventData.contact || "");
    setContactEmail(eventData.contact_email || "");
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
        endTime: st.end_time ? st.end_time.split("T")[1]?.substring(0, 5) : "",
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
  }, [eventData]);

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
      resetToPreviousData();
    }
  }, [isOpen, resetToPreviousData, companyName]);

  const handleCancel = () => {
    resetToPreviousData();
    if (onClose) onClose();
  };

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

    if (!contactPhone || !PHONE_REGEX.test(contactPhone.trim())) {
      alert(
        "กรุณากรอกเบอร์โทรศัพท์ผู้ว่าจ้างให้ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09 และมีความยาว 10 หลัก)",
      );
      return;
    }

    if (!contactEmail || !EMAIL_REGEX.test(contactEmail.trim())) {
      alert("กรุณากรอกอีเมลผู้ว่าจ้างให้ถูกต้อง (เช่น user@example.com)");
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
      contact_phone: contactPhone,
      contact_email: contactEmail,
      contact: contactPhone,
      event_detail: eventDetail,
      required_tools: requiredTools.filter((t) => t.trim() !== ""),
      provided_tools: providedTools.filter((t) => t.trim() !== ""),
      shift_times: shifts.map((st) => ({
        ...st,
        shiftDate: toISODate(st.shiftDate),
      })),
      required_guards: totalRequiredGuards,
      start_date: toISODate(startDate),
      end_date: toISODate(endDate),
      status: status,
      company_id: companyId || eventData?.company_id,
      event_img: eventImg || eventData?.event_img || "default.png",
      headguard_visible: eventData?.headguard_visible ?? false,
      guard_visible: eventData?.guard_visible ?? false,
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
          <button
            onClick={handleCancel}
            className="hover:text-gray-200 transition"
          >
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
                <Flatpickr
                  value={startDate}
                  onChange={([date], dateStr) => setStartDate(dateStr)}
                  options={{
                    dateFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  placeholder="วว/ดด/ปปปป"
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500 text-gray-700 bg-white text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold">
                  วันที่สิ้นสุดปฏิบัติงาน:
                </label>
                <Flatpickr
                  value={endDate}
                  onChange={([date], dateStr) => setEndDate(dateStr)}
                  options={{
                    dateFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  placeholder="วว/ดด/ปปปป"
                  className="w-[60%] h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500 text-gray-700 bg-white text-xs"
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
              <div className="flex flex-col mb-1">
                <label className="font-semibold mb-1">
                  เบอร์โทรศัพท์ผู้ว่าจ้าง{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength="10"
                  placeholder="เช่น 0812345678 (ขึ้นต้นด้วย 06, 08, 09)"
                  className="w-full h-[32px] border border-gray-400 rounded-full px-4 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col mb-2">
                <label className="font-semibold mb-1">
                  อีเมลผู้ว่าจ้าง <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="เช่น contractor@example.com"
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
            <div className="flex mt-2">
              <button
                onClick={handleAddShift}
                className="bg-gray-200 rounded text-gray-600 hover:bg-gray-300 p-1"
              >
                <div className="flex">
                  <Plus size={16} />
                  เพิ่มกะการทำงาน
                </div>
              </button>
            </div>
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
                  <Flatpickr
                    value={shift.shiftDate || ""}
                    onChange={([date], dateStr) =>
                      updateShift(idx, "shiftDate", dateStr)
                    }
                    options={{
                      dateFormat: "d/m/Y",
                      allowInput: true,
                    }}
                    placeholder="วว/ดด/ปปปป"
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-700 bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="font-semibold">เวลาเริ่มปฏิบัติงาน:</label>
                  <Flatpickr
                    value={shift.startTime || ""}
                    onChange={([date], dateStr) =>
                      updateShift(idx, "startTime", dateStr)
                    }
                    options={{
                      enableTime: true,
                      noCalendar: true,
                      dateFormat: "H:i",
                      time_24hr: true,
                      allowInput: true,
                    }}
                    placeholder="--:--"
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-700 bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <label className="font-semibold">
                    เวลาสิ้นสุดปฏิบัติงาน:
                  </label>
                  <Flatpickr
                    value={shift.endTime || ""}
                    onChange={([date], dateStr) =>
                      updateShift(idx, "endTime", dateStr)
                    }
                    options={{
                      enableTime: true,
                      noCalendar: true,
                      dateFormat: "H:i",
                      time_24hr: true,
                      allowInput: true,
                    }}
                    placeholder="--:--"
                    className="w-full h-[30px] border border-gray-400 rounded-full px-4 outline-none text-gray-700 bg-white text-xs"
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

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={handleCancel}
              className="h-[38px] px-8 bg-red-600 hover:bg-red-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2 cursor-pointer"
            >
              <X size={18} /> ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-[40px] px-8 bg-[#F58220] hover:bg-orange-600 text-white rounded-full font-medium transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Edit size={18} /> บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-[700px] h-[540px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-gray-100 p-3 flex justify-between items-center border-b">
              <div className="flex items-center gap-3">
                <h3 className="font-bold flex items-center gap-2">
                  <MapPin className="text-red-500" /> คลิกบนแผนที่เพื่อแก้พิกัด
                </h3>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm transition cursor-pointer"
                  title="ไปยังตำแหน่งปัจจุบัน"
                >
                  <Locate size={14} className="text-blue-600" /> ตำแหน่งปัจจุบัน
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="text-gray-500 hover:text-black cursor-pointer"
              >
                <X />
              </button>
            </div>

            {/* ช่องค้นหาสถานที่ */}
            <div className="p-2.5 bg-gray-50 border-b relative z-[1000]">
              <div className="relative flex items-center">
                <Search
                  size={16}
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
                  placeholder="ค้นหาสถานที่ (เช่น สยามพารากอน, เชียงใหม่, ถนนสุขุมวิท)..."
                  className="w-full h-[36px] pl-9 pr-24 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
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
                    className="h-[28px] px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-md flex items-center gap-1 transition cursor-pointer disabled:cursor-not-allowed shadow-sm"
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
                <div className="absolute left-2.5 right-2.5 top-[48px] bg-white border border-gray-200 rounded-lg shadow-2xl max-h-[200px] overflow-y-auto z-[1100] divide-y divide-gray-100">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition flex items-start gap-2.5 text-xs cursor-pointer group"
                    >
                      <MapPin
                        size={15}
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
                <div className="mt-1.5 text-[11px] text-red-500 px-1 font-medium">
                  {searchError}
                </div>
              )}
            </div>

            <div className="flex-1 bg-gray-200">
              <MapContainer
                center={position || [13.7563, 100.5018]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapRecenter position={position} />
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
