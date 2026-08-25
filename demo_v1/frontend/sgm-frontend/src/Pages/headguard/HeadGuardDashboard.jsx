import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ViewGuardModal from "./ViewGuardModal";
import ViewEventModal from "./ViewEventModal";
import ViewRequestModal from "./ViewRequestModal";
import AssignTaskModal from "./AssignTaskModal";
import ViewAssignmentModal from "./ViewAssignmentModal"; // 🌟 Import เพิ่มเติม
import {
  Users,
  CalendarDays,
  Search,
  Eye,
  LogOut,
  MapPin,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  Bell,
  ClipboardList,
} from "lucide-react";

function HeadGuardDashboard() {
  const [activeMenu, setActiveMenu] = useState("event");
  const [search, setSearch] = useState("");

  const [guards, setGuards] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);

  const [isViewGuardModalOpen, setIsViewGuardModalOpen] = useState(false);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [isViewRequestModalOpen, setIsViewRequestModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewAssignmentModalOpen, setIsViewAssignmentModalOpen] =
    useState(false); // 🌟 State ใหม่

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedViewAssignment, setSelectedViewAssignment] = useState(null); // 🌟 State สำหรับเก็บข้อมูลที่จะ View

  const [assignmentsList, setAssignmentsList] = useState([]);

  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;
  const fname = currentUser?.first_name || currentUser?.firstName;
  const lname = currentUser?.last_name || currentUser?.lastName;
  const headGuardName =
    fname && lname
      ? `${fname} ${lname}`
      : currentUser?.username || "นาย สมชาย รักดี";
  const headGuardId = currentUser?.users_id || currentUser?.id || 1;

  const calculateExperience = (startDateStr) => {
    if (!startDateStr) return "ไม่ระบุ";
    const start = new Date(startDateStr);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
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
      const formattedData = response.data.map((guard) => {
        const isActive = guard.quit_date === null;
        return {
          id: `G-${guard.users_id.toString().padStart(3, "0")}`,
          name: `${guard.first_name} ${guard.last_name}`,
          experience: calculateExperience(guard.start_date),
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

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/headguard-dashboard/events/${headGuardId}`,
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [headGuardId]);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8080/api/headguard-dashboard/requests`,
      );
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMenu === "guard") fetchGuards();
    else if (activeMenu === "event") fetchEvents();
    else if (activeMenu === "request") fetchRequests();
  }, [activeMenu, fetchGuards, fetchEvents, fetchRequests]);

  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.id.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredEvents = events.filter(
    (ev) =>
      ev.event_name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.location?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredRequests = requests.filter((req) =>
    req.report_type?.toLowerCase().includes(search.toLowerCase()),
  );

  const fetchAssignments = useCallback(async (shiftId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/headguard-dashboard/shifts/${shiftId}/assignments`,
      );
      const formattedList = response.data.map((a) => ({
        id: a.assignment_id,
        guardId: `G-${(a.guard_id || 0).toString().padStart(3, "0")}`,
        guardName: a.guard_name || "ไม่ระบุ",
        status: a.assignment_status,
        time: a.time_range || "08:00 - 18:00 น.",
        latitude: a.latitude, // 🌟 เพิ่มฟิลด์เหล่านี้ให้ ViewModal นำไปใช้ได้
        longitude: a.longitude,
        description: a.description,
      }));
      setAssignmentsList(formattedList);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }, []);

  const handleSelectShift = (eventData, shiftData) => {
    setSelectedEvent(eventData);
    setSelectedShiftDetail(shiftData);
    setIsViewEventModalOpen(false);
    fetchAssignments(shiftData.shift_id);
  };

  const moveToActual = async (assignmentId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/headguard-dashboard/assignments/${assignmentId}/status`,
        {
          status: "ACTUAL",
        },
      );
      fetchAssignments(selectedShiftDetail.shift_id);
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
      fetchAssignments(selectedShiftDetail.shift_id);
      alert("บันทึกการมอบหมายงานเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error saving assignment detail:", error);
      alert("เกิดข้อผิดพลาดในการมอบหมายงาน");
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
            { id: "request", label: "คำร้องขอ", icon: ClipboardList },
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
              : activeMenu === "event"
                ? "งานอีเว้นท์ที่ได้รับมอบหมาย"
                : "คำร้องขอและแจ้งเตือน"}
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
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#111827] text-white p-6 rounded-[20px] shadow-md mb-8 relative">
                <button
                  onClick={() => setSelectedShiftDetail(null)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition text-[12px] mb-3"
                >
                  <ChevronLeft size={16} /> กลับ
                </button>
                <h2 className="text-[22px] font-bold mb-2">
                  {selectedEvent?.event_name}
                </h2>
                <div className="flex items-center gap-2 text-gray-400 text-[13px]">
                  <MapPin size={16} className="text-emerald-500" />{" "}
                  {selectedEvent?.location}
                  <span className="ml-4 bg-gray-700 px-2 py-0.5 rounded-md text-[11px] text-white">
                    กะที่ {selectedShiftDetail.shift_id}
                  </span>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users size={18} /> รายชื่อเจ้าหน้าที่ในงาน (ตัวจริง)
                    <span className="font-normal text-gray-500 text-[13px] ml-2">
                      ช่วงเวลา 08:00 - 18:00 น. จำนวน{" "}
                      {
                        assignmentsList.filter(
                          (a) =>
                            a.status === "ACTUAL" || a.status === "ASSIGNED",
                        ).length
                      }
                      /{selectedShiftDetail.maximum_guards || 6}
                    </span>
                  </h3>
                  <button className="bg-[#F5B020] hover:bg-yellow-500 text-gray-900 px-4 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-2 shadow-sm transition">
                    <Bell size={14} /> แจ้งรับสมัครงาน
                  </button>
                </div>

                <div className="border border-gray-400 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-[120px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div>รหัสประจำตัว</div>
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
                          {item.time}
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
                            // 🌟 ปุ่ม View พร้อมฟังก์ชัน onClick
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
                  <div className="h-[35px] border-t border-gray-300 bg-gray-50/50"></div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Users size={18} className="text-gray-400" />{" "}
                  รายชื่อเจ้าหน้าที่ในงาน (ตัวสำรอง)
                </h3>

                <div className="border border-gray-400 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-[60px_120px_1.5fr_1.5fr_120px] h-[40px] bg-[#4b5563] text-white items-center text-[12px] font-medium px-6">
                    <div>ลำดับ</div>
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
                        className="grid grid-cols-[60px_120px_1.5fr_1.5fr_120px] h-[48px] items-center border-t border-gray-300 text-[12px] px-6"
                      >
                        <div className="text-gray-500">{index + 1}</div>
                        <div className="font-medium text-gray-700">
                          {item.guardId}
                        </div>
                        <div>{item.guardName}</div>
                        <div className="font-semibold text-gray-800">
                          {item.time}
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
              {activeMenu !== "event" && (
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
                        : activeMenu === "event"
                          ? "ค้นหางานอีเว้นท์"
                          : "ค้นหาคำร้องขอ"
                    }
                    className="w-full h-[40px] border border-gray-400 rounded-lg pl-11 pr-4 text-[13px] outline-none focus:border-emerald-500 transition bg-white"
                  />
                </div>
              )}

              {activeMenu === "guard" && (
                <div className="w-full border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-[120px_1.5fr_1.5fr_1fr_1fr_60px] h-[44px] bg-[#111827] text-white items-center text-[12px] font-medium px-6">
                    <div className="text-center">รหัสประจำตัว</div>
                    <div>ชื่อ - นามสกุล</div>
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
                        className="grid grid-cols-[120px_1.5fr_1.5fr_1fr_1fr_60px] min-h-[48px] items-center border-t border-gray-200 text-[12px] px-6 hover:bg-gray-50 transition"
                      >
                        <div className="text-center font-medium text-gray-700">
                          {g.id}
                        </div>
                        <div>{g.name}</div>
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

              {activeMenu === "event" && (
                <div>
                  {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
                      กำลังโหลดข้อมูลงานอีเว้นท์...
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-300 rounded-2xl">
                      <CalendarDays size={48} className="mb-2 text-gray-300" />
                      <p>ไม่มีงานอีเว้นท์ที่ได้รับมอบหมาย</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-6">
                      {filteredEvents.map((ev, index) => {
                        const myShifts =
                          ev.shift_times?.filter(
                            (st) =>
                              Number(st.head_guard_id) === Number(headGuardId),
                          ) || [];
                        const displayShift =
                          myShifts.length > 0
                            ? myShifts[0]
                            : ev.shift_times?.[0] || {};

                        const formatTime = (timeStr) => {
                          if (!timeStr) return "08.00 - 18.00 น.";
                          try {
                            const timePart = timeStr.split("T")[1];
                            if (timePart) {
                              const [h, m] = timePart.split(":");
                              return `${h}.${m}`;
                            }
                          } catch (e) {}
                          return "08.00";
                        };

                        const startTime = formatTime(displayShift.start_time);
                        const endTime = formatTime(displayShift.end_time);

                        return (
                          <div
                            key={ev.event_id || index}
                            onClick={() => {
                              setSelectedEvent(ev);
                              setIsViewEventModalOpen(true);
                            }}
                            className="bg-white rounded-[20px] border border-gray-400 p-5 w-full max-w-[280px] flex flex-col justify-between hover:shadow-lg transition cursor-pointer"
                          >
                            <div>
                              <div className="mb-4">
                                <span
                                  className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full ${
                                    ev.status === "ONGOING" ||
                                    ev.status === "กำลังดำเนินการ"
                                      ? "bg-[#00d1b2] text-white"
                                      : ev.status === "COMPLETED" ||
                                          ev.status === "เสร็จสิ้น"
                                        ? "bg-green-500 text-white"
                                        : ev.status === "CANCELLED" ||
                                            ev.status === "ยกเลิก"
                                          ? "bg-red-500 text-white"
                                          : "bg-[#ffd700] text-gray-900"
                                  }`}
                                >
                                  {ev.status === "ONGOING"
                                    ? "กำลังดำเนินการ"
                                    : ev.status === "COMPLETED"
                                      ? "เสร็จสิ้น"
                                      : ev.status === "CANCELLED"
                                        ? "ยกเลิก"
                                        : ev.status || "รอดำเนินการ"}
                                </span>
                              </div>

                              <h3 className="font-bold text-[14px] text-gray-900 mb-3 leading-snug">
                                {ev.event_name}{" "}
                                <span className="text-blue-500 font-normal">
                                  กะที่ {displayShift.shift_id || 1}
                                </span>
                              </h3>

                              <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-2">
                                <MapPin
                                  size={14}
                                  className="text-gray-400 shrink-0"
                                />
                                <span className="truncate">{ev.location}</span>
                              </div>

                              <div className="flex items-center gap-2 text-gray-600 text-[11px] mb-1">
                                <CalendarDays
                                  size={14}
                                  className="text-gray-400 shrink-0"
                                />
                                <span>
                                  เริ่ม{" "}
                                  <span className="ml-2">
                                    {ev.start_date || "-"}
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
                                    {ev.end_date || "-"}
                                  </span>
                                </span>
                              </div>

                              <div className="text-[10px] text-gray-500 space-y-1.5 mb-5">
                                <p>
                                  ช่วงเวลาการทำงาน {startTime} - {endTime} น.
                                </p>
                                <p>
                                  จำนวนเจ้าหน้าที่{" "}
                                  {displayShift.maximum_guards ||
                                    ev.required_guards ||
                                    0}{" "}
                                  คน
                                </p>
                              </div>
                            </div>

                            <div className="border border-gray-400 rounded-xl p-3">
                              <p className="text-[10px] text-blue-600 font-medium mb-1.5">
                                หัวหน้าหน่วยที่รับผิดชอบ
                              </p>
                              <div className="flex items-center gap-1.5 text-gray-800 font-medium text-[12px]">
                                <ShieldCheck
                                  size={16}
                                  className="text-blue-600"
                                />
                                <span>{headGuardName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeMenu === "request" && (
                <div className="w-full border border-red-300 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-[150px_1fr_2fr_1fr_60px] h-[44px] bg-red-500 text-white items-center text-[12px] font-medium px-6">
                    <div>เวลาแจ้งเหตุ</div>
                    <div>ประเภทคำร้องขอ</div>
                    <div>รายละเอียด</div>
                    <div>สถานะ</div>
                    <div />
                  </div>
                  {isLoading ? (
                    <div className="h-[100px] flex items-center justify-center text-sm text-gray-500">
                      กำลังโหลดคำร้องขอ...
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="h-[100px] flex items-center justify-center text-sm text-gray-400">
                      ไม่มีคำร้องขอหรือการแจ้งเตือน
                    </div>
                  ) : (
                    filteredRequests.map((req, index) => (
                      <div
                        key={req.report_id || index}
                        className="grid grid-cols-[150px_1fr_2fr_1fr_60px] min-h-[48px] items-center border-t border-gray-200 text-[12px] px-6 hover:bg-red-50 transition"
                      >
                        <div className="text-gray-600 font-medium">
                          {new Date(req.report_time).toLocaleString("th-TH")}
                        </div>
                        <div className="flex items-center gap-2 font-bold text-red-600">
                          <AlertCircle size={15} />
                          {req.report_type}
                        </div>
                        <div className="truncate pr-4 text-gray-700">
                          {req.report_desc}
                        </div>
                        <div>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-semibold">
                            ต้องตรวจสอบ
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsViewRequestModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-red-600 transition"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                    ))
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

      <ViewEventModal
        isOpen={isViewEventModalOpen}
        onClose={() => setIsViewEventModalOpen(false)}
        eventData={selectedEvent}
        headGuardId={headGuardId}
        onSelectShift={handleSelectShift}
      />

      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        assignmentData={selectedAssignment}
        onSave={handleSaveAssignment}
      />

      {/* 🌟 แสดงหน้าต่าง ViewAssignmentModal */}
      <ViewAssignmentModal
        isOpen={isViewAssignmentModalOpen}
        onClose={() => setIsViewAssignmentModalOpen(false)}
        assignmentData={selectedViewAssignment}
      />

      <ViewRequestModal
        isOpen={isViewRequestModalOpen}
        onClose={() => setIsViewRequestModalOpen(false)}
        requestData={selectedRequest}
      />
    </div>
  );
}

export default HeadGuardDashboard;
