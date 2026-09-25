import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import ViewGuardModal from "./ViewGuardModal";
import AssignTaskModal from "./AssignTaskModal";
import ViewAssignmentModal from "./ViewAssignmentModal";
import {
  formatRankAndName,
  formatThaiDate,
  formatThaiTimeRange,
} from "../../utils/formatters";
import {
  Users,
  CalendarDays,
  Search,
  Eye,
  LogOut,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  Bell,
  Image as ImageIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function HeadGuardDashboard() {
  const [activeMenu, setActiveMenu] = useState("event");
  const [search, setSearch] = useState("");

  const [guards, setGuards] = useState([]);
  const [shifts, setShifts] = useState([]); // 🌟 เปลี่ยนจาก events เป็น shifts
  const [isLoading, setIsLoading] = useState(true);

  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);

  const [isViewGuardModalOpen, setIsViewGuardModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewAssignmentModalOpen, setIsViewAssignmentModalOpen] =
    useState(false);

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedViewAssignment, setSelectedViewAssignment] = useState(null);

  const [assignmentsList, setAssignmentsList] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }, []);

  const headGuardId = currentUser?.users_id || currentUser?.id || 1;

  useEffect(() => {
    if (headGuardId) {
      axios
        .get(`http://localhost:8080/api/headguards/${headGuardId}`)
        .then((res) => {
          if (res.data) setUserProfile(res.data);
        })
        .catch(() => {});
    }
  }, [headGuardId]);

  const startDateStr =
    userProfile?.start_date ||
    userProfile?.startDate ||
    currentUser?.start_date ||
    currentUser?.startDate;

  const isNotStartedYet = useMemo(() => {
    if (!startDateStr) return false;
    const sDate = new Date(startDateStr);
    return !isNaN(sDate.getTime()) && sDate.getTime() > Date.now();
  }, [startDateStr]);

  const formattedStartDate = useMemo(() => {
    if (!startDateStr) return "";
    try {
      const d = new Date(startDateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString("th-TH") : startDateStr;
    } catch {
      return startDateStr;
    }
  }, [startDateStr]);

  const fname =
    userProfile?.first_name || currentUser?.first_name || currentUser?.firstName;
  const lname =
    userProfile?.last_name || currentUser?.last_name || currentUser?.lastName;
  const userRank =
    userProfile?.rank || currentUser?.rank || currentUser?.user_rank;
  const userTitle = userProfile?.title || currentUser?.title;
  const headGuardName =
    fname && lname
      ? formatRankAndName({
          rank: userRank,
          title: userTitle,
          firstName: fname,
          lastName: lname,
        })
      : currentUser?.username || "นาย สมชาย รักดี";

  const calculateExperience = (startDateStr, quitDateStr = null) => {
    if (!startDateStr) return "ไม่ระบุ";
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return "ไม่ระบุ";

    const endDate = quitDateStr ? new Date(quitDateStr) : new Date();
    const startMidnight = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endMidnight = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    if (startMidnight > endMidnight) {
      return "ยังไม่ถึงวันเริ่มงาน";
    }

    let years = endMidnight.getFullYear() - startMidnight.getFullYear();
    let months = endMidnight.getMonth() - startMidnight.getMonth();
    let days = endMidnight.getDate() - startMidnight.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(
        endMidnight.getFullYear(),
        endMidnight.getMonth(),
        0,
      );
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} ปี ${months} เดือน ${days} วัน`;
  };

  const fetchGuards = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/headguard-dashboard/guards?headName=${encodeURIComponent(headGuardName)}`,
      );
      const rawList = Array.isArray(response.data) ? response.data : [];
      const sorted = [...rawList].sort(
        (a, b) => (Number(a.users_id) || 0) - (Number(b.users_id) || 0),
      );
      const formattedData = sorted.map((guard, index) => {
        const isActive = guard.quit_date === null;
        const ordinalNumber = (index + 1).toString();
        const guardId = (guard.users_id || guard.guard_id || "").toString();
        return {
          sequence: ordinalNumber,
          id: ordinalNumber,
          guardId: guardId,
          rank: guard.rank || "-",
          title: guard.title || "-",
          name: `${guard.first_name || ""} ${guard.last_name || ""}`.trim(),
          gender: guard.gender || "-",
          experience: calculateExperience(guard.start_date, guard.quit_date),
          status: isActive ? "ปฏิบัติงาน" : "พ้นสภาพ",
          active: isActive,
          headName: guard.head_name || "-",
          raw: guard,
        };
      });
      setGuards(formattedData);
    } catch (error) {
      console.error("Error fetching guards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [headGuardName]);

  // 🌟 ดึงข้อมูลระดับ ShiftTime แทน Event
  const fetchShifts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [shiftsRes, eventsRes] = await Promise.all([
        axios.get(
          `http://localhost:8080/api/headguard-dashboard/${headGuardId}/shifts`,
        ),
        axios
          .get(
            `http://localhost:8080/api/headguard-dashboard/events/${headGuardId}`,
          )
          .catch(() => ({ data: [] })),
      ]);

      const eventsList = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const shiftToEventMap = new Map();
      const eventByIdMap = new Map();
      eventsList.forEach((ev) => {
        if (ev.event_id) eventByIdMap.set(ev.event_id, ev);
        if (Array.isArray(ev.shift_times)) {
          ev.shift_times.forEach((st) => {
            shiftToEventMap.set(st.shift_id, ev);
          });
        }
      });

      const mergedShifts = (shiftsRes.data || []).map((sh) => {
        const matchedEvent =
          shiftToEventMap.get(sh.shiftId) ||
          (sh.eventId ? eventByIdMap.get(sh.eventId) : null);
        return {
          ...sh,
          eventId: sh.eventId || matchedEvent?.event_id,
          guard_visible:
            sh.guard_visible !== undefined
              ? sh.guard_visible
              : matchedEvent
                ? Boolean(matchedEvent.guard_visible)
                : false,
          eventData: matchedEvent || null,
        };
      });

      setShifts(mergedShifts);
      setSelectedShiftDetail((prev) => {
        if (!prev) return null;
        const updated = mergedShifts.find((s) => s.shiftId === prev.shiftId);
        return updated
          ? {
              ...prev,
              ...updated,
              eventData: prev.eventData || updated.eventData,
            }
          : prev;
      });
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [headGuardId]);

  useEffect(() => {
    fetchShifts();
    fetchGuards();
  }, [fetchShifts, fetchGuards]);

  useEffect(() => {
    if (activeMenu === "guard") fetchGuards();
    else if (activeMenu === "event") fetchShifts();
  }, [activeMenu, fetchGuards, fetchShifts]);

  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      formatRankAndName(g).toLowerCase().includes(search.toLowerCase()) ||
      g.sequence?.toLowerCase().includes(search.toLowerCase()) ||
      g.guardId?.toLowerCase().includes(search.toLowerCase()) ||
      g.id.toLowerCase().includes(search.toLowerCase()) ||
      g.rank?.toLowerCase().includes(search.toLowerCase()) ||
      g.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.gender?.toLowerCase().includes(search.toLowerCase()) ||
      g.headName?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredShifts = shifts.filter(
    (sh) =>
      sh.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      sh.location?.toLowerCase().includes(search.toLowerCase()),
  );

  const fetchAssignments = useCallback(
    async (shiftId, currentShift) => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/headguard-dashboard/shifts/${shiftId}/assignments`,
        );
        const shiftTimeRange =
          currentShift?.workTime ||
          selectedShiftDetail?.workTime ||
          shifts.find((s) => s.shiftId === shiftId)?.workTime;

        const formattedList = response.data.map((a) => {
          let displayTime = a.time_range;
          if (!displayTime && a.start_time && a.end_time) {
            displayTime = formatThaiTimeRange(
              `${a.start_time} - ${a.end_time}`,
            );
          } else if (displayTime) {
            displayTime = formatThaiTimeRange(displayTime);
          } else {
            displayTime = formatThaiTimeRange(shiftTimeRange) || "ไม่ระบุเวลา";
          }

          const matchedGuard = guards.find(
            (g) =>
              Number(g.raw?.users_id) === Number(a.guard_id) ||
              Number(g.raw?.guard_id) === Number(a.guard_id) ||
              g.guardId === a.guard_id?.toString() ||
              Number(g.raw?.id) === Number(a.guard_id),
          );

          const firstName = (
            a.first_name ||
            a.firstName ||
            matchedGuard?.raw?.first_name ||
            ""
          )
            .toString()
            .trim();

          const lastName = (
            a.last_name ||
            a.lastName ||
            matchedGuard?.raw?.last_name ||
            ""
          )
            .toString()
            .trim();

          let fullName = "";
          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`.trim();
          } else if (
            firstName &&
            a.guard_name &&
            !a.guard_name.includes(firstName)
          ) {
            fullName = `${firstName} ${a.guard_name}`.trim();
          } else if (matchedGuard?.name && matchedGuard.name !== "-") {
            fullName = matchedGuard.name;
          } else if (a.guard_name && a.guard_name !== "ไม่ระบุ") {
            fullName = a.guard_name;
          } else if (firstName) {
            fullName = firstName;
          } else if (lastName) {
            fullName = lastName;
          } else {
            fullName = "ไม่ระบุ";
          }

          const rank =
            a.rank ||
            a.user_rank ||
            matchedGuard?.rank ||
            matchedGuard?.raw?.rank ||
            "";

          const title =
            a.title || matchedGuard?.title || matchedGuard?.raw?.title || "";

          const formattedFullName = formatRankAndName({
            rank,
            title,
            firstName,
            lastName,
            name: fullName,
          });

          return {
            id: a.assignment_id,
            guardId: `${(a.guard_id || 0).toString()}`,
            guardName: formattedFullName,
            rank: rank,
            title: title,
            firstName: firstName,
            lastName: lastName,
            rawName: fullName,
            status: a.assignment_status,
            time: displayTime,
            latitude: a.latitude,
            longitude: a.longitude,
            description: a.description,
          };
        });
        setAssignmentsList(formattedList);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    },
    [selectedShiftDetail, shifts, guards],
  );

  // 🌟 คลิกที่ Card กะงานแล้วกระโดดเข้าหน้า Assign ทันที
  const handleSelectShift = async (shift) => {
    setSelectedShiftDetail(shift);
    fetchAssignments(shift.shiftId, shift);

    const eventId =
      shift.eventId || shift.event_id || shift.eventData?.event_id;
    if (eventId) {
      try {
        const evRes = await axios.get(
          `http://localhost:8080/api/events/${eventId}`,
        );
        if (evRes.data) {
          setSelectedShiftDetail((prev) =>
            prev && prev.shiftId === shift.shiftId
              ? { ...prev, eventData: evRes.data }
              : prev,
          );
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      }
    }
  };

  const moveToActual = async (assignmentId) => {
    if (isNotStartedYet) {
      alert("ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถดำเนินการได้");
      return;
    }
    try {
      await axios.put(
        `http://localhost:8080/api/headguard-dashboard/assignments/${assignmentId}/status`,
        { status: "ACTUAL" },
      );
      fetchAssignments(selectedShiftDetail.shiftId, selectedShiftDetail);
    } catch (error) {
      console.error("Error updating status:", error);
      const msg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการย้ายสถานะ";
      alert(msg);
    }
  };

  const handleSaveAssignment = async (updatedData) => {
    if (isNotStartedYet) {
      alert("ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถดำเนินการได้");
      return;
    }
    try {
      await axios.put(
        `http://localhost:8080/api/headguard-dashboard/assignments/${updatedData.id}/detail`,
        {
          latitude: updatedData.latitude,
          longitude: updatedData.longitude,
          description: updatedData.description,
          status: "ASSIGNED",
        },
      );
      setIsAssignModalOpen(false);
      fetchAssignments(selectedShiftDetail.shiftId, selectedShiftDetail);
      alert("บันทึกการมอบหมายงานเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving assignment detail:", error);
      const msg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการมอบหมายงาน";
      alert(msg);
    }
  };

  const handlePublishGuardRecruitment = async () => {
    if (isNotStartedYet) {
      alert("ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถดำเนินการได้");
      return;
    }
    if (!selectedShiftDetail) return;
    const eventId = selectedShiftDetail.eventId || selectedShiftDetail.event_id;
    const shiftId = selectedShiftDetail.shiftId || selectedShiftDetail.shift_id;

    if (
      !window.confirm(
        "คุณต้องการแจ้งรับสมัครงาน (เปิดให้เจ้าหน้าที่รปภ.มองเห็นงานนี้) ใช่หรือไม่?",
      )
    ) {
      return;
    }

    try {
      if (eventId) {
        await axios.put(
          `http://localhost:8080/api/events/${eventId}/visibility`,
          {
            guard_visible: true,
          },
        );
      } else if (shiftId) {
        await axios.put(
          `http://localhost:8080/api/headguard-dashboard/shifts/${shiftId}/guard-visibility`,
          { guard_visible: true },
        );
      }

      setSelectedShiftDetail((prev) =>
        prev ? { ...prev, guard_visible: true, guardVisible: true } : null,
      );
      setShifts((prev) =>
        prev.map((s) =>
          (eventId && (s.eventId === eventId || s.event_id === eventId)) ||
          s.shiftId === shiftId
            ? { ...s, guard_visible: true, guardVisible: true }
            : s,
        ),
      );
      alert("แจ้งรับสมัครงานเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error updating guard visibility:", error);
      const msg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการแจ้งรับสมัครงาน";
      alert(msg);
    }
  };

  const currentEventData = selectedShiftDetail?.eventData || null;
  const eventLat = parseFloat(
    currentEventData?.latitude || selectedShiftDetail?.latitude,
  );
  const eventLng = parseFloat(
    currentEventData?.longitude || selectedShiftDetail?.longitude,
  );
  const hasEventCoords =
    !isNaN(eventLat) && !isNaN(eventLng) && eventLat !== 0 && eventLng !== 0;
  const eventMapCoords = hasEventCoords ? [eventLat, eventLng] : null;

  const eventReqTools = Array.isArray(currentEventData?.required_tools)
    ? currentEventData.required_tools
    : currentEventData?.required_tools
      ? Array.from(currentEventData.required_tools)
      : [];

  const eventProvTools = Array.isArray(currentEventData?.provided_tools)
    ? currentEventData.provided_tools
    : currentEventData?.provided_tools
      ? Array.from(currentEventData.provided_tools)
      : [];

  const rawEventImg = currentEventData?.event_img;
  const hasValidEventImg =
    rawEventImg &&
    rawEventImg !== "default.png" &&
    rawEventImg !== "no-image.png";

  const eventImgUrl = hasValidEventImg
    ? rawEventImg.startsWith("http://") || rawEventImg.startsWith("https://")
      ? rawEventImg
      : rawEventImg.startsWith("/uploads/")
        ? `http://localhost:8080${rawEventImg}`
        : rawEventImg.startsWith("/")
          ? `http://localhost:8080/uploads${rawEventImg}`
          : `http://localhost:8080/uploads/${rawEventImg}`
    : null;

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
      <aside className="w-[180px] min-h-screen bg-white border-r border-gray-300 flex flex-col pb-6">
        <div className="h-[70px] flex items-center justify-center border-b border-gray-300 mb-6">
          <span className="text-[16px] font-bold text-emerald-600 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            HEADGUARD
          </span>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-3">
          {[
            { id: "guard", label: "เจ้าหน้าที่รปภ.", icon: Users },
            { id: "event", label: "งานอีเว้นท์", icon: CalendarDays },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                setSearch("");
                setSelectedShiftDetail(null);
              }}
              className={`w-full h-[42px] rounded-[10px] flex items-center gap-3 px-4 text-[13px] font-medium transition-all duration-200 ${
                activeMenu === item.id
                  ? "bg-[#111827] text-white shadow-md"
                  : "bg-gray-500 text-white hover:bg-gray-600"
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 border-t border-gray-300 pt-4 mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            className="flex items-center gap-2 text-[13px] font-medium text-gray-700 hover:text-red-500 transition"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#fafafa]">
        <header className="h-[70px] flex items-center justify-between px-8 bg-white border-b border-gray-300 shadow-sm sticky top-0 z-10">
          <h1 className="text-[20px] font-bold text-gray-900">
            {activeMenu === "guard"
              ? "รายชื่อเจ้าหน้าที่รักษาความปลอดภัย"
              : "งานอีเว้นท์ที่ได้รับมอบหมาย"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right pr-4 border-r border-gray-300">
              <p className="text-[13px] font-medium text-gray-600">
                {headGuardName}
              </p>
              <p className="text-[10px] text-gray-400">
                บริษัทรักษาความปลอดภัย
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm">
              {headGuardName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Read-only notification banner when work hasn't started yet */}
        {isNotStartedYet && (
          <div className="bg-amber-500 text-white px-8 py-3 flex items-center justify-between text-xs md:text-sm font-semibold shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                ยังไม่ถึงเวลาเริ่มงาน (กำหนดเริ่มงาน: {formattedStartDate}) — ขณะนี้คุณอยู่ในโหมดดูข้อมูลเท่านั้น (Read-Only) ไม่สามารถมอบหมายงานหรือเปิดรับสมัครงานได้
              </span>
            </div>
            <span className="bg-amber-700/80 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-bold">
              Read-Only
            </span>
          </div>
        )}

        <section className="px-8 pt-8 pb-10">
          {activeMenu === "event" && selectedShiftDetail ? (
            /* 🌟 หน้าจอ Assign งาน (รูปที่ 2) */
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#111827] text-white p-6 rounded-[20px] shadow-md mb-8 relative">
                <button
                  onClick={() => setSelectedShiftDetail(null)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition text-[12px] mb-3"
                >
                  <ChevronLeft size={16} /> กลับ
                </button>
                <h2 className="text-[22px] font-bold mb-2">
                  {selectedShiftDetail.eventName}
                </h2>
                <div className="flex items-center gap-2 text-gray-400 text-[13px]">
                  <MapPin size={16} className="text-emerald-500" />{" "}
                  {selectedShiftDetail.location}
                  {/* <span className="ml-4 bg-gray-700 px-2.5 py-0.5 rounded-md text-[11px] text-white">
                    {selectedShiftDetail.shiftName}
                  </span> */}
                </div>
              </div>

              {/* ข้อมูลรายละเอียดงานอีเว้นท์ (Event Details) */}
              <div className="bg-white border border-gray-300 rounded-[20px] p-6 mb-8 shadow-sm">
                <h3 className="font-bold text-[16px] text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-200">
                  <CalendarDays size={18} className="text-emerald-600" />
                  รายละเอียดงานอีเว้นท์
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
                  {/* คอลัมน์ซ้าย: ชื่องานอีเว้นท์, สถานที่จัดงาน, รายละเอียดงาน */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-600 w-[120px] shrink-0">
                        ชื่องานอีเว้นท์:
                      </label>
                      <div className="flex-1 min-h-[34px] bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 flex items-center text-gray-800">
                        {currentEventData?.event_name ||
                          selectedShiftDetail.eventName ||
                          "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-600 w-[120px] shrink-0">
                        สถานที่จัดงาน:
                      </label>
                      <div className="flex-1 min-h-[34px] bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 flex items-center text-gray-800 truncate">
                        {currentEventData?.location ||
                          selectedShiftDetail.location ||
                          "-"}
                      </div>
                    </div>

                    <div className="mt-1 flex flex-col flex-1">
                      <label className="font-semibold text-gray-600 mb-1.5">
                        รายละเอียดงาน
                      </label>
                      <div className="w-full flex-1 min-h-[140px] max-h-[180px] bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-700 overflow-y-auto leading-relaxed whitespace-pre-line">
                        {currentEventData?.event_detail ||
                          "ไม่มีรายละเอียดเพิ่มเติม"}
                      </div>
                    </div>
                  </div>

                  {/* คอลัมน์ขวา: ผู้ว่าจ้าง, เบอร์โทรศัพท์, อีเมล, รูปภาพ, แผนที่, อุปกรณ์ */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-600 w-[140px] shrink-0">
                        ผู้ว่าจ้าง:
                      </label>
                      <div className="flex-1 h-[34px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-800 truncate">
                        {currentEventData?.contractor || "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-600 w-[140px] shrink-0">
                        เบอร์โทรศัพท์ผู้ว่าจ้าง:
                      </label>
                      <div className="flex-1 h-[34px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-800">
                        {currentEventData?.contact_phone ||
                          currentEventData?.contact ||
                          "-"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-gray-600 w-[140px] shrink-0">
                        อีเมลผู้ว่าจ้าง:
                      </label>
                      <div className="flex-1 h-[34px] bg-gray-50 border border-gray-300 rounded-lg px-3 flex items-center text-gray-800 truncate">
                        {currentEventData?.contact_email || "-"}
                      </div>
                    </div>

                    {/* รูปภาพและแผนที่พิกัด */}
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      {/* รูปภาพ */}
                      <div>
                        <label className="font-semibold text-gray-600 flex items-center gap-1 mb-1.5 text-xs">
                          <ImageIcon size={14} className="text-gray-500" />{" "}
                          รูปภาพ
                        </label>
                        <div className="h-[105px] border border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                          {eventImgUrl ? (
                            <img
                              src={eventImgUrl}
                              alt="Event"
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                              onClick={() => window.open(eventImgUrl, "_blank")}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">
                              ไม่มีรูปภาพ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* แผนที่พิกัด */}
                      <div>
                        <label className="font-semibold text-gray-600 flex items-center gap-1 mb-1.5 text-xs">
                          <MapPin size={14} className="text-gray-500" />{" "}
                          พิกัดที่จัดงาน
                        </label>
                        <div className="h-[105px] border border-gray-300 rounded-xl overflow-hidden relative z-0">
                          {eventMapCoords ? (
                            <MapContainer
                              key={`event-map-${selectedShiftDetail.shiftId}-${eventLat}-${eventLng}`}
                              center={eventMapCoords}
                              zoom={14}
                              style={{ height: "100%", width: "100%" }}
                              zoomControl={false}
                              dragging={false}
                              scrollWheelZoom={false}
                            >
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={eventMapCoords} />
                            </MapContainer>
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                              ไม่มีข้อมูลพิกัด
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* อุปกรณ์ที่ต้องการ และ อุปกรณ์ที่มีให้ */}
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      {/* อุปกรณ์ที่ต้องการ */}
                      <div>
                        <label className="font-semibold text-gray-600 block mb-1 text-xs">
                          อุปกรณ์ที่ต้องการ
                        </label>
                        <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                          {eventReqTools.length > 0 ? (
                            eventReqTools.map((tool, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] text-gray-700 border border-gray-200 truncate"
                                title={tool}
                              >
                                {idx + 1}. {tool}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">
                              - ไม่มี -
                            </span>
                          )}
                        </div>
                      </div>

                      {/* อุปกรณ์ที่มีให้ */}
                      <div>
                        <label className="font-semibold text-gray-600 block mb-1 text-xs">
                          อุปกรณ์ที่มีให้
                        </label>
                        <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                          {eventProvTools.length > 0 ? (
                            eventProvTools.map((tool, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] text-gray-700 border border-gray-200 truncate"
                                title={tool}
                              >
                                {idx + 1}. {tool}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">
                              - ไม่มี -
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ตารางตัวจริง */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users size={18} /> รายชื่อเจ้าหน้าที่ในงาน (ตัวจริง)
                    <span className="font-normal text-gray-500 text-[13px] ml-2">
                      ช่วงเวลา{" "}
                      {formatThaiTimeRange(selectedShiftDetail.workTime)} จำนวน{" "}
                      {
                        assignmentsList.filter(
                          (a) =>
                            a.status === "ACTUAL" || a.status === "ASSIGNED",
                        ).length
                      }
                      /{selectedShiftDetail.totalGuards || 6}
                    </span>
                  </h3>
                  {!selectedShiftDetail.guard_visible &&
                    !selectedShiftDetail.guardVisible && (
                      <button
                        onClick={handlePublishGuardRecruitment}
                        disabled={isNotStartedYet}
                        title={
                          isNotStartedYet
                            ? "ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถแจ้งรับสมัครงานได้"
                            : ""
                        }
                        className={`${
                          isNotStartedYet
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#F5B020] hover:bg-yellow-500 text-gray-900 cursor-pointer"
                        } px-4 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-2 shadow-sm transition`}
                      >
                        <Bell size={14} /> แจ้งรับสมัครงาน
                      </button>
                    )}
                </div>

                <div className="border border-gray-400 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-[70px_110px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div className="text-center">ลำดับที่</div>
                    <div>รหัสประจำตัว</div>
                    <div>ชื่อ</div>
                    <div>ช่วงเวลาการทำงาน</div>
                    <div className="text-center">ข้อมูลงาน</div>
                  </div>

                  {assignmentsList
                    .filter(
                      (a) => a.status === "ACTUAL" || a.status === "ASSIGNED",
                    )
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[70px_110px_1.5fr_1.5fr_120px] h-[48px] items-center border-t border-gray-300 text-[12px] px-6"
                      >
                        <div className="text-center font-medium text-gray-700">
                          {index + 1}
                        </div>
                        <div className="font-medium text-gray-700">
                          {item.guardId}
                        </div>
                        <div>{item.guardName}</div>
                        <div className="font-semibold text-gray-800">
                          {formatThaiTimeRange(item.time)}
                        </div>
                        <div className="flex justify-center">
                          {item.status === "ACTUAL" ? (
                            <button
                              onClick={() => {
                                if (isNotStartedYet) {
                                  alert("ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถดำเนินการได้");
                                  return;
                                }
                                setSelectedAssignment(item);
                                setIsAssignModalOpen(true);
                              }}
                              disabled={isNotStartedYet}
                              title={
                                isNotStartedYet
                                  ? "ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถมอบหมายงานได้"
                                  : ""
                              }
                              className={`${
                                isNotStartedYet
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                              } px-3 py-1 rounded-full text-[10px] font-semibold transition`}
                            >
                              มอบหมายงาน
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedViewAssignment(item);
                                setIsViewAssignmentModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-blue-600 transition"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  <div className="h-[35px] border-t border-gray-300 bg-gray-50/50"></div>
                </div>
              </div>

              {/* ตารางตัวสำรอง */}
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Users size={18} className="text-gray-400" />{" "}
                  รายชื่อเจ้าหน้าที่ในงาน (ตัวสำรอง)
                </h3>

                <div className="border border-gray-400 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-[70px_110px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div className="text-center">ลำดับที่</div>
                    <div>รหัสประจำตัว</div>
                    <div>ชื่อ</div>
                    <div>ช่วงเวลาการทำงาน</div>
                    <div />
                  </div>

                  {assignmentsList
                    .filter((a) => a.status === "RESERVE")
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[70px_110px_1.5fr_1.5fr_120px] h-[48px] items-center border-t border-gray-300 text-[12px] px-6"
                      >
                        <div className="text-center text-gray-500">{index + 1}</div>
                        <div className="font-medium text-gray-700">{item.guardId}</div>
                        <div>{item.guardName}</div>
                        <div className="font-semibold text-gray-800">
                          {formatThaiTimeRange(item.time)}
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => moveToActual(item.id)}
                            disabled={isNotStartedYet}
                            title={
                              isNotStartedYet
                                ? "ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถย้ายไปตัวจริงได้"
                                : ""
                            }
                            className={`${
                              isNotStartedYet
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                            } px-3 py-1 rounded-full text-[10px] font-semibold transition border border-emerald-600`}
                          >
                            ย้ายไปตัวจริง
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ส่วน Search Bar */}
              <div className="relative w-[450px] mb-8">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    activeMenu === "guard"
                      ? "ค้นหาเจ้าหน้าที่รักษาความปลอดภัย"
                      : "ค้นหางานอีเว้นท์"
                  }
                  className="w-full h-[40px] border border-gray-400 rounded-lg pl-11 pr-4 text-[13px] outline-none focus:border-emerald-500 transition bg-white"
                />
              </div>

              {/* Tab: รปภ. */}
              {activeMenu === "guard" && (
                <div className="w-full border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-[70px_100px_1.8fr_70px_1.2fr_100px_120px_50px] h-[44px] bg-[#111827] text-white items-center text-[12px] font-medium px-6">
                    <div className="text-center">ลำดับที่</div>
                    <div className="text-center">รหัสประจำตัว</div>
                    <div>ชื่อ - นามสกุล</div>
                    <div>เพศ</div>
                    <div>ประสบการณ์ทำงาน</div>
                    <div>สถานะ</div>
                    <div>หัวหน้าชุด</div>
                    <div />
                  </div>
                  {isLoading ? (
                    <div className="h-[100px] flex items-center justify-center text-sm text-gray-500">
                      กำลังโหลดข้อมูล...
                    </div>
                  ) : filteredGuards.length === 0 ? (
                    <div className="h-[100px] flex items-center justify-center text-sm text-gray-400">
                      ไม่พบข้อมูล
                    </div>
                  ) : (
                    filteredGuards.map((g) => (
                      <div
                        key={g.guardId || g.id}
                        className="grid grid-cols-[70px_100px_1.8fr_70px_1.2fr_100px_120px_50px] min-h-[48px] items-center border-t border-gray-200 text-[12px] px-6 hover:bg-gray-50 transition"
                      >
                        <div className="text-center font-medium text-gray-700">
                          {g.sequence || g.id}
                        </div>
                        <div className="text-center font-medium text-gray-700">
                          {g.guardId || g.raw?.users_id || "-"}
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatRankAndName(g)}
                        </div>
                        <div>{g.gender}</div>
                        <div>{g.experience}</div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${g.active ? "bg-emerald-500" : "bg-red-500"}`}
                          />
                          <span>{g.status}</span>
                        </div>
                        <div>{g.headName}</div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedGuard(g);
                              setIsViewGuardModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 🌟 Tab: งานอีเว้นท์ (รูปที่ 1 เรนเดอร์ตาม ShiftTime โดยตรง) */}
              {activeMenu === "event" && (
                <div>
                  {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
                      กำลังโหลดข้อมูลงานอีเว้นท์...
                    </div>
                  ) : filteredShifts.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-300 rounded-2xl">
                      <CalendarDays size={48} className="mb-2 text-gray-300" />
                      <p>ไม่มีงานอีเว้นท์ที่ได้รับมอบหมาย</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-6">
                      {filteredShifts.map((shift) => (
                        <div
                          key={shift.shiftId}
                          onClick={() => handleSelectShift(shift)}
                          className="bg-white rounded-[20px] border border-gray-400 p-5 w-full max-w-[280px] flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
                        >
                          <div>
                            <div className="mb-4">
                              <span
                                className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full ${
                                  shift.status === "ONGOING" ||
                                  shift.status === "กำลังดำเนินการ"
                                    ? "bg-[#00d1b2] text-white"
                                    : shift.status === "COMPLETED" ||
                                        shift.status === "เสร็จสิ้น"
                                      ? "bg-green-500 text-white"
                                      : shift.status === "CANCELLED" ||
                                          shift.status === "ยกเลิก"
                                        ? "bg-red-500 text-white"
                                        : "bg-[#ffd700] text-gray-900"
                                }`}
                              >
                                {shift.status === "ONGOING"
                                  ? "กำลังดำเนินการ"
                                  : shift.status === "COMPLETED"
                                    ? "เสร็จสิ้น"
                                    : shift.status === "CANCELLED"
                                      ? "ยกเลิก"
                                      : shift.status || "รอดำเนินการ"}
                              </span>
                            </div>

                            <h3 className="font-bold text-[14px] text-gray-900 mb-3 leading-snug">
                              {shift.eventName}{" "}
                              {/* <span className="text-blue-500 font-normal">
                                {shift.shiftName}
                              </span> */}
                            </h3>

                            <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-2">
                              <MapPin
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <span className="truncate">{shift.location}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-1">
                              <CalendarDays
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <span>
                                เริ่ม{" "}
                                <span className="ml-2">
                                  {formatThaiDate(shift.startDate)}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-4">
                              <CalendarDays
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <span>
                                สิ้นสุด{" "}
                                <span className="ml-1">
                                  {formatThaiDate(shift.endDate)}
                                </span>
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-500 space-y-1.5 mb-5">
                              <p>
                                ช่วงเวลาการทำงาน{" "}
                                {formatThaiTimeRange(shift.workTime)}
                              </p>
                              <p>จำนวนเจ้าหน้าที่ {shift.totalGuards} คน</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <ViewGuardModal
        isOpen={isViewGuardModalOpen}
        onClose={() => setIsViewGuardModalOpen(false)}
        guardData={selectedGuard}
      />

      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        assignmentData={
          selectedAssignment
            ? {
                ...selectedAssignment,
                eventLatitude:
                  selectedShiftDetail?.eventData?.latitude ||
                  selectedShiftDetail?.latitude,
                eventLongitude:
                  selectedShiftDetail?.eventData?.longitude ||
                  selectedShiftDetail?.longitude,
              }
            : null
        }
        onSave={handleSaveAssignment}
      />

      <ViewAssignmentModal
        isOpen={isViewAssignmentModalOpen}
        onClose={() => setIsViewAssignmentModalOpen(false)}
        assignmentData={selectedViewAssignment}
      />
    </div>
  );
}

export default HeadGuardDashboard;
