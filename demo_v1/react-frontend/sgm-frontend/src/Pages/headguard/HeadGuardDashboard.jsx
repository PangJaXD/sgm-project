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
} from "lucide-react";

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

  const currentUser = useMemo(() => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }, []);
  const fname = currentUser?.first_name || currentUser?.firstName;
  const lname = currentUser?.last_name || currentUser?.lastName;
  const userRank = currentUser?.rank || currentUser?.user_rank;
  const userTitle = currentUser?.title;
  const headGuardName =
    fname && lname
      ? formatRankAndName({
          rank: userRank,
          title: userTitle,
          firstName: fname,
          lastName: lname,
        })
      : currentUser?.username || "นาย สมชาย รักดี";
  const headGuardId = currentUser?.users_id || currentUser?.id || 1;

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
        return {
          id: `${ordinalNumber}`,
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
      eventsList.forEach((ev) => {
        if (Array.isArray(ev.shift_times)) {
          ev.shift_times.forEach((st) => {
            shiftToEventMap.set(st.shift_id, ev);
          });
        }
      });

      const mergedShifts = (shiftsRes.data || []).map((sh) => {
        const matchedEvent = shiftToEventMap.get(sh.shiftId);
        return {
          ...sh,
          eventId: sh.eventId || matchedEvent?.event_id,
          guard_visible:
            sh.guard_visible !== undefined
              ? sh.guard_visible
              : matchedEvent
                ? Boolean(matchedEvent.guard_visible)
                : false,
        };
      });

      setShifts(mergedShifts);
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
              Number(g.raw?.id) === Number(a.guard_id) ||
              g.id === a.guard_id?.toString(),
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
  const handleSelectShift = (shift) => {
    setSelectedShiftDetail(shift);
    fetchAssignments(shift.shiftId, shift);
  };

  const moveToActual = async (assignmentId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/headguard-dashboard/assignments/${assignmentId}/status`,
        { status: "ACTUAL" },
      );
      fetchAssignments(selectedShiftDetail.shiftId, selectedShiftDetail);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("เกิดข้อผิดพลาดในการย้ายสถานะ");
    }
  };

  const handleSaveAssignment = async (updatedData) => {
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
      alert("เกิดข้อผิดพลาดในการมอบหมายงาน");
    }
  };

  const handlePublishGuardRecruitment = async () => {
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
      alert("เกิดข้อผิดพลาดในการแจ้งรับสมัครงาน");
    }
  };

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
                        className="bg-[#F5B020] hover:bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-2 shadow-sm transition"
                      >
                        <Bell size={14} /> แจ้งรับสมัครงาน
                      </button>
                    )}
                </div>

                <div className="border border-gray-400 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-[120px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div>ลำดับที่</div>
                    <div>ชื่อ</div>
                    <div>ช่วงเวลาการทำงาน</div>
                    <div className="text-center">ข้อมูลงาน</div>
                  </div>

                  {assignmentsList
                    .filter(
                      (a) => a.status === "ACTUAL" || a.status === "ASSIGNED",
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[120px_1.5fr_1.5fr_120px] h-[48px] items-center border-t border-gray-300 text-[12px] px-6"
                      >
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
                                setSelectedAssignment(item);
                                setIsAssignModalOpen(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-semibold transition"
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
                  <div className="grid grid-cols-[60px_120px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div>ลำดับ</div>
                    <div>ชื่อ</div>
                    <div>ช่วงเวลาการทำงาน</div>
                    <div />
                  </div>

                  {assignmentsList
                    .filter((a) => a.status === "RESERVE")
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[60px_120px_1.5fr_1.5fr_120px] h-[48px] items-center border-t border-gray-300 text-[12px] px-6"
                      >
                        <div className="text-gray-500">{index + 1}</div>
                        <div>{item.guardName}</div>
                        <div className="font-semibold text-gray-800">
                          {formatThaiTimeRange(item.time)}
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => moveToActual(item.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-semibold transition border border-emerald-600"
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
                  <div className="grid grid-cols-[80px_1.8fr_80px_1.3fr_100px_120px_50px] h-[44px] bg-[#111827] text-white items-center text-[12px] font-medium px-6">
                    <div className="text-center">ลำดับที่</div>
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
                        key={g.id}
                        className="grid grid-cols-[80px_1.8fr_80px_1.3fr_100px_120px_50px] min-h-[48px] items-center border-t border-gray-200 text-[12px] px-6 hover:bg-gray-50 transition"
                      >
                        <div className="text-center font-medium text-gray-700">
                          {g.id}
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
        assignmentData={selectedAssignment}
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
