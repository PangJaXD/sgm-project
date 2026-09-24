import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import AddEventModal from "./AddEventModal";
import ViewEventModal from "./ViewEventModal";
import EditEventModal from "./EditEventModal";
import { formatRankAndName, formatThaiDate, toISODate } from "../../utils/formatters";
import {
  Shield,
  ShieldCheck,
  Users,
  CalendarDays,
  Search,
  Plus,
  Eye,
  X,
  User,
  Edit,
  PenSquare,
  MapPin,
} from "lucide-react";

const PHONE_REGEX = /^0[689]\d{8}$/;

function CompanyDashboard() {
  const [activeMenu, setActiveMenu] = useState("headguard");
  const [search, setSearch] = useState("");

  const [headGuards, setHeadGuards] = useState([]);
  const [guards, setGuards] = useState([]);
  const [events, setEvents] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const newlyAddedGuardIdsRef = useRef([]);
  const newlyAddedHeadGuardIdsRef = useRef([]);
  const newlyAddedEventIdsRef = useRef([]);

  // ดึงข้อมูลบริษัทปัจจุบัน
  const currentUser = useMemo(() => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }, []);
  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    if (currentUser?.users_id) {
      axios
        .get(`http://localhost:8080/api/company/${currentUser.users_id}`)
        .then((res) => {
          if (res.data) {
            setCompanyProfile(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching company profile:", err);
        });
    }
  }, [currentUser?.users_id]);

  const currentCompanyName =
    companyProfile?.company_name ||
    currentUser?.company_name ||
    currentUser?.first_name ||
    currentUser?.username ||
    "บริษัทรักษาความปลอดภัย";

  const isGuardMenu = activeMenu === "guard";
  const apiEndpoint = isGuardMenu ? "guard" : "headguard";

  let pageTitle = "การจัดการหัวหน้าชุดรักษาความปลอดภัย";
  if (activeMenu === "guard")
    pageTitle = "การจัดการเจ้าหน้าที่รักษาความปลอดภัย";
  if (activeMenu === "schedule") pageTitle = "การจัดการงานอีเว้นท์";

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rank: "",
    title: "",
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    userDetail: "",
    startDate: "",
    address: "",
    status: "ปฏิบัติงาน",
    headName: "",
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingDisplayId, setEditingDisplayId] = useState("");

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

  const fetchHeadGuards = useCallback(
    async (newlyCreatedId = null) => {
      if (
        newlyCreatedId &&
        !newlyAddedHeadGuardIdsRef.current.includes(newlyCreatedId)
      ) {
        newlyAddedHeadGuardIdsRef.current = [
          newlyCreatedId,
          ...newlyAddedHeadGuardIdsRef.current,
        ];
      }
      try {
        setIsLoading(true);
        const queryCompany =
          companyProfile?.company_name ||
          currentUser?.company_name ||
          companyProfile?.username ||
          currentUser?.username ||
          "";

        const response = await axios.get(
          "http://localhost:8080/api/headguard",
          {
            params: queryCompany ? { company: queryCompany } : {},
          },
        );

        if (Array.isArray(response.data)) {
          const filtered = response.data.filter((guard) => {
            if (!queryCompany) return true;
            const gComp = guard.company_name;
            if (!gComp) return true;
            return (
              gComp === queryCompany ||
              gComp === currentUser?.username ||
              gComp === companyProfile?.username ||
              gComp === currentUser?.company_name ||
              gComp === companyProfile?.company_name
            );
          });

          const sorted = [...filtered].sort(
            (a, b) => (Number(a.users_id) || 0) - (Number(b.users_id) || 0),
          );

          const newIds = newlyAddedHeadGuardIdsRef.current;
          const newItems = [];
          const regularItems = [];

          sorted.forEach((guard) => {
            if (newIds.includes(guard.users_id)) {
              newItems.push(guard);
            } else {
              regularItems.push(guard);
            }
          });

          newItems.sort(
            (a, b) => newIds.indexOf(a.users_id) - newIds.indexOf(b.users_id),
          );
          const finalOrderedList = [...newItems, ...regularItems];

          const formattedData = finalOrderedList.map((guard, index) => {
            const isActive = guard.quit_date === null;
            const ordinalNumber = (index + 1).toString();
            return {
              id: `${ordinalNumber}`,
              rank: guard.rank || "-",
              title: guard.title || "-",
              name: `${guard.first_name || ""} ${guard.last_name || ""}`.trim(),
              gender: guard.gender || "-",
              experience: calculateExperience(
                guard.start_date,
                guard.quit_date,
              ),
              status: isActive ? "ปฏิบัติงาน" : "พ้นสภาพ/พักงาน",
              active: isActive,
              raw: guard,
            };
          });
          setHeadGuards(formattedData);
        } else {
          setHeadGuards([]);
        }
      } catch (error) {
        console.error("Error fetching head guards:", error);
        setHeadGuards([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      companyProfile?.company_name,
      companyProfile?.username,
      currentUser?.company_name,
      currentUser?.username,
    ],
  );

  const fetchGuards = useCallback(
    async (newlyCreatedId = null) => {
      if (
        newlyCreatedId &&
        !newlyAddedGuardIdsRef.current.includes(newlyCreatedId)
      ) {
        newlyAddedGuardIdsRef.current = [
          newlyCreatedId,
          ...newlyAddedGuardIdsRef.current,
        ];
      }
      try {
        setIsLoading(true);
        const queryCompany =
          companyProfile?.company_name ||
          currentUser?.company_name ||
          companyProfile?.username ||
          currentUser?.username ||
          "";

        const response = await axios.get("http://localhost:8080/api/guard", {
          params: queryCompany ? { company: queryCompany } : {},
        });

        if (Array.isArray(response.data)) {
          const filtered = response.data.filter((guard) => {
            if (!queryCompany) return true;
            const gComp = guard.company_name;
            if (!gComp) return true;
            return (
              gComp === queryCompany ||
              gComp === currentUser?.username ||
              gComp === companyProfile?.username ||
              gComp === currentUser?.company_name ||
              gComp === companyProfile?.company_name
            );
          });

          const sorted = [...filtered].sort(
            (a, b) => (Number(a.users_id) || 0) - (Number(b.users_id) || 0),
          );

          const newIds = newlyAddedGuardIdsRef.current;
          const newItems = [];
          const regularItems = [];

          sorted.forEach((guard) => {
            if (newIds.includes(guard.users_id)) {
              newItems.push(guard);
            } else {
              regularItems.push(guard);
            }
          });

          newItems.sort(
            (a, b) => newIds.indexOf(a.users_id) - newIds.indexOf(b.users_id),
          );
          const finalOrderedList = [...newItems, ...regularItems];

          const formattedData = finalOrderedList.map((guard, index) => {
            const isActive = guard.quit_date === null;
            const ordinalNumber = (index + 1).toString();
            return {
              id: `${ordinalNumber}`,
              rank: guard.rank || "-",
              title: guard.title || "-",
              name: `${guard.first_name || ""} ${guard.last_name || ""}`.trim(),
              gender: guard.gender || "-",
              experience: calculateExperience(
                guard.start_date,
                guard.quit_date,
              ),
              status: isActive ? "ปฏิบัติงาน" : "พ้นสภาพ/พักงาน",
              active: isActive,
              headName: guard.head_name || "-",
              raw: guard,
            };
          });
          setGuards(formattedData);
        } else {
          setGuards([]);
        }
      } catch (error) {
        console.error("Error fetching guards:", error);
        setGuards([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      companyProfile?.company_name,
      companyProfile?.username,
      currentUser?.company_name,
      currentUser?.username,
    ],
  );

  // 🌟 ป้องกันกรณี response.data ไม่ใช่ Array และกรองอีเว้นท์ของบริษัทอย่างถูกต้อง
  const fetchEvents = useCallback(
    async (newlyCreatedId = null) => {
      if (
        newlyCreatedId &&
        !newlyAddedEventIdsRef.current.includes(newlyCreatedId)
      ) {
        newlyAddedEventIdsRef.current = [
          newlyCreatedId,
          ...newlyAddedEventIdsRef.current,
        ];
      }
      try {
        setIsLoading(true);
        const compId = companyProfile?.users_id || currentUser?.users_id;
        const queryCompany =
          companyProfile?.company_name ||
          currentUser?.company_name ||
          companyProfile?.username ||
          currentUser?.username ||
          "";

        const response = await axios.get("http://localhost:8080/api/events", {
          params: {
            ...(compId ? { companyId: compId } : {}),
            ...(queryCompany ? { company: queryCompany } : {}),
          },
        });

        const rawEvents = Array.isArray(response.data)
          ? response.data
          : response.data && typeof response.data === "object"
            ? [response.data]
            : [];

        const filtered = rawEvents.filter((ev) => {
          // หากไม่มีข้อมูลระบุบริษัท ให้แสดงทั้งหมด
          if (!compId && !queryCompany) return true;

          // 1. ตรวจสอบ company_id โดยตรง
          const evCompId = ev.company_id != null ? ev.company_id : ev.companyId;
          if (compId && evCompId != null && evCompId == compId) {
            return true;
          }

          // 2. ตรวจสอบกะงาน (shift_times) ว่ามีหัวหน้ารปภ. สังกัดบริษัทนี้หรือไม่
          if (Array.isArray(ev.shift_times) && ev.shift_times.length > 0) {
            const hasMatchingShift = ev.shift_times.some((st) => {
              const hg = st.headGuard || st.head_guard;
              if (!hg) return false;
              const hgComp = hg.company_name;
              if (!hgComp) return false;
              return (
                hgComp === queryCompany ||
                hgComp === currentUser?.company_name ||
                hgComp === companyProfile?.company_name ||
                hgComp === currentUser?.username ||
                hgComp === companyProfile?.username
              );
            });
            if (hasMatchingShift) return true;
          }

          // 3. ตรวจสอบชื่อบริษัทใน event
          if (
            queryCompany &&
            (ev.company_name === queryCompany || ev.contractor === queryCompany)
          ) {
            return true;
          }

          // 4. กรณีที่ backend กรองมาให้แล้ว (ถ้าไม่มี company_id และไม่มี shift_times ขัดแย้ง)
          if (!evCompId && (!ev.shift_times || ev.shift_times.length === 0)) {
            return true;
          }

          return false;
        });

        const sorted = [...filtered].sort(
          (a, b) => (Number(a.event_id) || 0) - (Number(b.event_id) || 0),
        );

        const newEventIds = newlyAddedEventIdsRef.current;
        const newEvents = [];
        const regularEvents = [];

        sorted.forEach((ev) => {
          if (newEventIds.includes(ev.event_id)) {
            newEvents.push(ev);
          } else {
            regularEvents.push(ev);
          }
        });

        newEvents.sort(
          (a, b) =>
            newEventIds.indexOf(a.event_id) - newEventIds.indexOf(b.event_id),
        );
        const finalOrderedEvents = [...newEvents, ...regularEvents];

        setEvents(finalOrderedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [companyProfile, currentUser],
  );

  useEffect(() => {
    if (activeMenu === "headguard") {
      fetchHeadGuards();
    } else if (activeMenu === "guard") {
      fetchGuards();
      fetchHeadGuards();
    } else if (activeMenu === "schedule") {
      fetchEvents();
    }
  }, [activeMenu, fetchHeadGuards, fetchGuards, fetchEvents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormData({
      username: "",
      password: "",
      rank: "",
      title: "",
      firstName: "",
      lastName: "",
      gender: "",
      phone: "",
      userDetail: "",
      startDate: "",
      address: "",
      status: "ปฏิบัติงาน",
      headName: "",
    });
  };

  const handleOpenAddModal = () => {
    clearForm();
    setIsAddModalOpen(true);
  };

  const handleSaveData = async () => {
    if (!formData.phone || !PHONE_REGEX.test(formData.phone.trim())) {
      alert(
        "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09 และมีความยาว 10 หลัก)",
      );
      return;
    }

    const payload = {
      rank: formData.rank?.trim() || "-",
      title: formData.title?.trim() || "-",
      first_name: formData.firstName,
      last_name: formData.lastName,
      gender: formData.gender?.trim() || "-",
      phone: formData.phone.trim(),
      address: formData.address,
      user_detail: formData.userDetail || "-",
      start_date: formData.startDate
        ? `${toISODate(formData.startDate)}T00:00:00`
        : new Date().toISOString(),
      profile_img: "default.png",
      company_name: currentCompanyName,
      username: formData.username,
      password: formData.password,
    };

    if (isGuardMenu) {
      payload.head_name = formData.headName || "-";
    }

    try {
      const response = await axios.post(
        `http://localhost:8080/api/${apiEndpoint}`,
        payload,
      );

      if (response.status === 201 || response.status === 200) {
        setIsAddModalOpen(false);
        const createdId = response.data?.users_id ?? response.data?.id;
        isGuardMenu ? fetchGuards(createdId) : fetchHeadGuards(createdId);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล โปรดตรวจสอบ Username ว่าซ้ำหรือไม่",
      );
    }
  };

  const handleOpenViewModal = (dataItem) => {
    const raw = dataItem.raw;
    const startDateStr = raw.start_date ? raw.start_date.split("T")[0] : "";

    setFormData({
      username: raw.username || "",
      password: "********",
      rank: raw.rank || "-",
      title: raw.title || "-",
      firstName: raw.first_name || "",
      lastName: raw.last_name || "",
      gender: raw.gender || "-",
      phone: raw.phone || "",
      userDetail: raw.user_detail || "",
      startDate: startDateStr,
      address: raw.address || "",
      status: dataItem.status,
      headName: raw.head_name || "-",
    });

    setEditingId(raw.users_id);
    setEditingDisplayId(dataItem.id);
    setSelectedGuard(dataItem);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setIsViewModalOpen(false);
    setFormData((prev) => ({ ...prev, password: "" }));
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    if (selectedGuard) {
      const raw = selectedGuard.raw;
      const startDateStr = raw.start_date ? raw.start_date.split("T")[0] : "";
      setFormData({
        username: raw.username || "",
        password: "********",
        rank: raw.rank || "-",
        title: raw.title || "-",
        firstName: raw.first_name || "",
        lastName: raw.last_name || "",
        gender: raw.gender || "-",
        phone: raw.phone || "",
        userDetail: raw.user_detail || "",
        startDate: startDateStr,
        address: raw.address || "",
        status: selectedGuard.status,
        headName: raw.head_name || "-",
      });
    }
    setIsEditModalOpen(false);
  };

  const handleUpdateData = async () => {
    if (!formData.phone || !PHONE_REGEX.test(formData.phone.trim())) {
      alert(
        "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09 และมีความยาว 10 หลัก)",
      );
      return;
    }

    const payload = {
      rank: formData.rank?.trim() || "-",
      title: formData.title?.trim() || "-",
      first_name: formData.firstName,
      last_name: formData.lastName,
      gender: formData.gender?.trim() || "-",
      phone: formData.phone.trim(),
      address: formData.address,
      user_detail: formData.userDetail || "-",
      start_date: formData.startDate ? `${toISODate(formData.startDate)}T00:00:00` : null,
      quit_date:
        formData.status === "ปฏิบัติงาน"
          ? null
          : selectedGuard.raw.quit_date || new Date().toISOString(),
      profile_img: selectedGuard.raw.profile_img || "default.png",
      username: formData.username,
      password: formData.password,
      company_name: selectedGuard.raw.company_name,
    };

    if (isGuardMenu) {
      payload.head_name = formData.headName || "-";
    }

    try {
      const response = await axios.put(
        `http://localhost:8080/api/${apiEndpoint}/${editingId}`,
        payload,
      );

      if (response.status === 200) {
        setIsEditModalOpen(false);
        isGuardMenu ? fetchGuards() : fetchHeadGuards();
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleToggleHeadGuardVisibility = async (eventItem) => {
    const currentVis = Boolean(eventItem.headguard_visible);
    const newVisibility = !currentVis;
    const confirmMessage = newVisibility
      ? `ต้องการมอบหมายงาน "${eventItem.event_name}" ให้หัวหน้าชุดมองเห็นใช่หรือไม่?`
      : `ต้องการยกเลิกการมอบหมายงาน "${eventItem.event_name}" (ซ่อนจากหัวหน้าชุด) ใช่หรือไม่?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await axios.put(
        `http://localhost:8080/api/events/${eventItem.event_id}/visibility`,
        {
          headguard_visible: newVisibility,
        },
      );

      if (response.status === 200) {
        setEvents((prevEvents) =>
          prevEvents.map((ev) =>
            ev.event_id === eventItem.event_id
              ? { ...ev, headguard_visible: newVisibility }
              : ev,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating event visibility:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตการมอบหมายงาน");
    }
  };

  const currentDataList = Array.isArray(isGuardMenu ? guards : headGuards)
    ? isGuardMenu
      ? guards
      : headGuards
    : [];

  const filteredData = currentDataList.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.id?.toLowerCase().includes(keyword) ||
      item.rank?.toLowerCase().includes(keyword) ||
      item.title?.toLowerCase().includes(keyword) ||
      item.name?.toLowerCase().includes(keyword) ||
      formatRankAndName(item).toLowerCase().includes(keyword) ||
      item.gender?.toLowerCase().includes(keyword) ||
      item.experience?.toLowerCase().includes(keyword) ||
      item.status?.toLowerCase().includes(keyword)
    );
  });

  // 🌟 ค้นหาอีเว้นท์ตามคำค้นหา (keyword)
  const filteredEvents = (Array.isArray(events) ? events : []).filter((ev) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      ev.event_name?.toLowerCase().includes(keyword) ||
      ev.location?.toLowerCase().includes(keyword) ||
      ev.contractor?.toLowerCase().includes(keyword) ||
      ev.status?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[148px] min-h-screen bg-gray-200 border-r border-gray-300 flex flex-col">
        <div className="h-[70px] flex items-center justify-center border-b border-gray-300">
          <div className="flex items-center gap-1">
            <span className="text-[20px] font-bold text-blue-600">company</span>
          </div>
        </div>
        <nav className="flex-1 pt-6 px-2">
          {[
            { id: "headguard", label: "หัวหน้ารปภ.", icon: Users },
            { id: "guard", label: "เจ้าหน้าที่รปภ.", icon: Users },
            { id: "schedule", label: "งานอีเว้นท์", icon: CalendarDays },
          ].map((item) => {
            const active = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setSearch("");
                }}
                className={`w-full h-[38px] mb-2 rounded flex items-center justify-center gap-2 px-3 text-[13px] transition ${
                  active
                    ? "bg-blue-400 text-white"
                    : "bg-blue-200 text-white hover:bg-blue-300"
                }`}
              >
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-gray-400 p-4">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            className="text-[13px] text-gray-700 hover:text-red-500 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 bg-gray-300/50 pb-10">
        <header className="h-[70px] border-b border-gray-400 flex items-center justify-between px-6 bg-white/50">
          <h1 className="text-[19px] font-medium text-gray-800">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right pr-3 border-r border-gray-400">
              <p className="text-[13px] font-medium text-gray-800">
                {currentCompanyName}
              </p>
              <p className="text-[10px] text-gray-500">
                บริษัทรักษาความปลอดภัย
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {currentCompanyName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="px-10 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-[310px]">
              <Search
                size={21}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeMenu === "schedule"
                    ? "ค้นหางานอีเว้นท์"
                    : `ค้นหา${isGuardMenu ? "เจ้าหน้าที่" : "หัวหน้าชุด"}รักษาความปลอดภัย`
                }
                className="w-full h-[34px] border border-gray-400 rounded-xl pl-10 pr-3 text-sm outline-none focus:border-blue-500 bg-white"
              />
            </div>

            {activeMenu !== "schedule" ? (
              <button
                onClick={handleOpenAddModal}
                className="h-[38px] px-5 bg-[#42a884] hover:bg-emerald-600 text-white rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
              >
                เพิ่ม
                {isGuardMenu ? "เจ้าหน้าที่" : "หัวหน้าชุด"}
              </button>
            ) : (
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="h-[38px] px-5 bg-[#42a884] hover:bg-emerald-600 text-white rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
              >
                เพิ่มงานอีเว้นท์
              </button>
            )}
          </div>

          {activeMenu !== "schedule" ? (
            <div className="w-full border border-gray-400 rounded-xl overflow-hidden bg-white/80">
              <div className="grid grid-cols-[80px_1.8fr_90px_1.3fr_1.1fr_45px] h-[40px] bg-blue-400 text-white items-center text-[12px] font-medium px-4">
                <div className="text-center">ลำดับที่</div>
                <div>ชื่อ - นามสกุล</div>
                <div>เพศ</div>
                <div>ประสบการณ์ทำงาน</div>
                <div>สถานะการทำงาน</div>
                <div />
              </div>

              {isLoading ? (
                <div className="h-[100px] flex items-center justify-center text-sm text-gray-500">
                  กำลังโหลดข้อมูล...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="h-[100px] flex items-center justify-center text-sm text-gray-400">
                  ไม่พบข้อมูล
                </div>
              ) : (
                filteredData.map((dataItem) => (
                  <div
                    key={dataItem.raw?.users_id || dataItem.id}
                    className="grid grid-cols-[80px_1.8fr_90px_1.3fr_1.1fr_45px] min-h-[44px] items-center border-t border-gray-300 text-[12px] px-4 hover:bg-gray-50 transition"
                  >
                    <div className="text-center text-gray-600 bg-gray-200/50 py-1 rounded w-14 mx-auto">
                      {dataItem.id}
                    </div>
                    <div className="font-medium text-gray-900 truncate pr-2">
                      {formatRankAndName(dataItem)}
                    </div>
                    <div>{dataItem.gender}</div>
                    <div>{dataItem.experience}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dataItem.active ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span>{dataItem.status}</span>
                    </div>
                    <div className="flex justify-center items-center">
                      <button
                        type="button"
                        onClick={() => handleOpenViewModal(dataItem)}
                        className="text-gray-500 hover:text-blue-600 transition cursor-pointer z-10 p-2"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
                  กำลังโหลดข้อมูลอีเว้นท์...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-white/60 border border-gray-300 rounded-2xl">
                  <CalendarDays size={48} className="mb-2 text-gray-300" />
                  <p>ไม่พบข้อมูลงานอีเว้นท์ในระบบ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map((ev, index) => (
                    <div
                      key={ev.event_id || index}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setIsViewEventModalOpen(true);
                      }}
                      className="bg-white rounded-2xl border border-gray-300 shadow-sm p-5 flex flex-col justify-between relative hover:shadow-md transition"
                    >
                      <div>
                        <div className="mb-3">
                          <span
                            className={`inline-block px-3 py-1 text-[11px] font-semibold rounded-full ${
                              ev.status === "ONGOING"
                                ? "bg-blue-100 text-blue-700"
                                : ev.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : ev.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {ev.status === "ONGOING"
                              ? "กำลังดำเนินการ"
                              : ev.status === "COMPLETED"
                                ? "เสร็จสิ้น"
                                : ev.status === "CANCELLED"
                                  ? "ยกเลิก"
                                  : "รอดำเนินการ"}
                          </span>
                        </div>
                        <h3 className="font-bold text-[15px] text-gray-900 mb-2">
                          {ev.event_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-600 text-[12px] mb-2">
                          <MapPin
                            size={14}
                            className="text-gray-400 shrink-0"
                          />
                          <span className="truncate">{ev.location}</span>
                        </div>
                        <div className="text-[12px] text-gray-600 space-y-1 mb-3 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-gray-400" />
                            <span>เริ่ม: {formatThaiDate(ev.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-gray-400" />
                            <span>สิ้นสุด: {formatThaiDate(ev.end_date)}</span>
                          </div>
                        </div>
                        <div className="text-[12px] text-gray-700 space-y-1 mb-4">
                          <p className="font-medium text-gray-900">
                            กะปฏิบัติงานทั้งหมด: {ev.shift_times?.length || 0}{" "}
                            กะ
                          </p>
                          <p className="text-gray-500">
                            ต้องการเจ้าหน้าที่รวม: {ev.required_guards || 0} คน
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                            setIsEditEventModalOpen(true);
                          }}
                          className="w-full h-[32px] bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[12px] font-medium transition shadow-sm cursor-pointer"
                        >
                          แก้ไขงานอีเว้นท์
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHeadGuardVisibility(ev);
                          }}
                          className={`w-full h-[32px] rounded-xl text-[12px] font-medium transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                            ev.headguard_visible
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {ev.headguard_visible ? (
                            <ShieldCheck size={15} />
                          ) : (
                            <Shield size={14} />
                          )}
                          {ev.headguard_visible
                            ? "มอบหมายแล้ว (คลิกเพื่อยกเลิก)"
                            : "มอบหมายงานอีเว้นท์"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ================= MODAL เพิ่มข้อมูล (Guard/HeadGuard) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[580px] overflow-hidden shadow-2xl relative border-[2px] border-emerald-500">
            <div className="bg-emerald-600 h-[50px] flex items-center justify-between px-5 text-white">
              <div className="flex items-center gap-2">
                {" "}
                <h2 className="font-medium text-[16px]">
                  เพิ่ม{isGuardMenu ? "เจ้าหน้าที่" : "หัวหน้าชุด"}
                  รักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={() => {
                  clearForm();
                  setIsAddModalOpen(false);
                }}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-7 text-[13px] text-gray-800">
              <div className="flex gap-5">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      รหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ยศ (ทหาร/ตำรวจ)
                    </label>
                    <input
                      type="text"
                      name="rank"
                      placeholder="เช่น ร.ต.อ. (เว้นว่างหรือ - หากไม่มี)"
                      value={formData.rank}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">คำนำหน้า</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="เช่น นาย / นาง / นางสาว"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">ชื่อ</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">นามสกุล</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">เพศ</label>
                    <input
                      type="text"
                      name="gender"
                      placeholder="เช่น ชาย / หญิง"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength="10"
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      วันที่เริ่มทำงาน
                    </label>
                    <Flatpickr
                      value={formData.startDate}
                      onChange={([date], dateStr) => {
                        setFormData((prev) => ({ ...prev, startDate: dateStr }));
                      }}
                      options={{
                        dateFormat: "d/m/Y",
                        allowInput: true,
                      }}
                      placeholder="วว/ดด/ปปปป"
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500 bg-white text-xs"
                    />
                  </div>

                  {isGuardMenu && (
                    <div className="flex items-center">
                      <label className="w-[120px] font-semibold">
                        หัวหน้าชุด
                      </label>
                      <select
                        name="headName"
                        value={formData.headName}
                        onChange={handleInputChange}
                        className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-white outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                      >
                        <option value="">-- ระบุหัวหน้าชุด --</option>
                        {headGuards
                          .filter((hg) => hg.active)
                          .map((hg) => (
                            <option key={hg.id} value={hg.name}>
                              {hg.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="w-[120px] flex flex-col pt-1">
                  <div className="w-full h-[140px] border border-gray-400 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                    <User size={60} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[120px] font-semibold pt-1">
                  รายละเอียดผู้ใช้
                </label>
                <textarea
                  name="userDetail"
                  value={formData.userDetail}
                  onChange={handleInputChange}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex mt-3">
                <label className="w-[120px] font-semibold pt-1">ที่อยู่</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    clearForm();
                    setIsAddModalOpen(false);
                  }}
                  className="h-[38px] px-8 bg-red-600 hover:bg-red-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <X size={18} /> ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveData}
                  className="h-[38px] px-8 bg-[#42a884] hover:bg-emerald-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={18} /> บันทึกข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL เพิ่มงานอีเว้นท์ ================= */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        companyName={currentCompanyName}
        companyId={companyProfile?.users_id || currentUser?.users_id}
        onSave={async (payload) => {
          try {
            const compId = companyProfile?.users_id || currentUser?.users_id;
            const fullPayload = {
              ...payload,
              company_id: payload.company_id || compId,
            };
            const response = await axios.post(
              "http://localhost:8080/api/events",
              fullPayload,
            );
            if (response.status === 201 || response.status === 200) {
              alert("บันทึกข้อมูลงานอีเว้นท์เรียบร้อยแล้ว!");
              setIsAddEventModalOpen(false);
              const createdEventId =
                response.data?.event_id ?? response.data?.id;
              fetchEvents(createdEventId);
            }
          } catch (error) {
            console.error("Event Save Error:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกงานอีเว้นท์");
          }
        }}
      />

      <ViewEventModal
        isOpen={isViewEventModalOpen}
        onClose={() => setIsViewEventModalOpen(false)}
        eventData={selectedEvent}
      />

      {/* ================= MODAL แก้ไขข้อมูลอีเว้นท์ (EDIT) ================= */}
      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => setIsEditEventModalOpen(false)}
        eventData={selectedEvent}
        companyName={currentCompanyName}
        companyId={companyProfile?.users_id || currentUser?.users_id}
        onSave={async (payload) => {
          try {
            const compId = companyProfile?.users_id || currentUser?.users_id;
            const fullPayload = {
              ...payload,
              company_id:
                payload.company_id || selectedEvent?.company_id || compId,
            };
            const response = await axios.put(
              `http://localhost:8080/api/events/${selectedEvent.event_id}`,
              fullPayload,
            );
            if (response.status === 200) {
              alert("อัปเดตข้อมูลงานอีเว้นท์เรียบร้อยแล้ว!");
              setIsEditEventModalOpen(false);
              fetchEvents();
            }
          } catch (error) {
            console.error("Event Update Error:", error);
            alert("เกิดข้อผิดพลาดในการแก้ไขงานอีเว้นท์");
          }
        }}
      />

      {/* ================= MODAL ดูข้อมูล (VIEW) ================= */}
      {isViewModalOpen && selectedGuard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[580px] overflow-hidden shadow-2xl relative border-[2px] border-blue-500">
            <div className="bg-blue-600 h-[50px] flex items-center justify-between px-5 text-white">
              <div className="flex items-center gap-2">
                <Eye size={20} />{" "}
                <h2 className="font-medium text-[16px]">
                  ข้อมูล{isGuardMenu ? "เจ้าหน้าที่" : "หัวหน้าชุด"}
                  รักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-7 text-[13px] text-gray-800">
              <div className="flex gap-5">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">ลำดับที่</label>
                    <input
                      type="text"
                      readOnly
                      value={editingDisplayId}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-100 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ชื่อผู้ใช้งาน
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.username}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">รหัสผ่าน</label>
                    <input
                      type="password"
                      readOnly
                      value={formData.password}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ชื่อ - นามสกุล
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatRankAndName({
                        rank: formData.rank,
                        title: formData.title,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                      })}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">เพศ</label>
                    <input
                      type="text"
                      readOnly
                      value={formData.gender || "-"}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.phone}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      วันที่เริ่มทำงาน
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatThaiDate(formData.startDate)}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                    />
                  </div>

                  {isGuardMenu && (
                    <div className="flex items-center">
                      <label className="w-[120px] font-semibold">
                        หัวหน้าชุด
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={formData.headName}
                        className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none cursor-default"
                      />
                    </div>
                  )}
                </div>

                <div className="w-[120px] flex flex-col pt-1">
                  <div className="w-full h-[140px] border border-gray-400 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                    {selectedGuard.raw?.profile_img &&
                    selectedGuard.raw.profile_img !== "default.png" ? (
                      <img
                        src={`http://localhost:8080/uploads/${selectedGuard.raw.profile_img}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <User size={60} strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[120px] font-semibold pt-1">
                  รายละเอียดผู้ใช้
                </label>
                <textarea
                  readOnly
                  value={formData.userDetail}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 bg-gray-50 outline-none cursor-default resize-none"
                />
              </div>

              <div className="flex mt-3">
                <label className="w-[120px] font-semibold pt-1">ที่อยู่</label>
                <textarea
                  readOnly
                  value={formData.address}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 bg-gray-50 outline-none cursor-default resize-none"
                />
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <label className="w-[120px] font-semibold">
                    สถานะการทำงาน
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.status}
                    className="h-[28px] border border-gray-400 rounded-full px-3 bg-gray-50 outline-none w-[130px] cursor-default"
                  />
                </div>

                <button
                  onClick={handleOpenEditModal}
                  className="h-[38px] px-6 bg-[#F58220] hover:bg-orange-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2"
                >
                  <Edit size={18} /> แก้ไขข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL แก้ไขข้อมูล (EDIT) ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[580px] overflow-hidden shadow-2xl relative border-[2px] border-blue-500">
            <div className="bg-blue-600 h-[50px] flex items-center justify-between px-5 text-white">
              <div className="flex items-center gap-2">
                <PenSquare size={20} />{" "}
                <h2 className="font-medium text-[16px]">
                  แก้ไขข้อมูล{isGuardMenu ? "เจ้าหน้าที่" : "หัวหน้าชุด"}
                  รักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-7 text-[13px] text-gray-800">
              <div className="flex gap-5">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">ลำดับที่</label>
                    <input
                      type="text"
                      readOnly
                      value={editingDisplayId}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-gray-100 outline-none cursor-default"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ชื่อผู้ใช้งาน
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center relative">
                    <label className="w-[120px] font-semibold">รหัสผ่าน</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="เว้นว่างหากไม่เปลี่ยน"
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      ยศ (ทหาร/ตำรวจ)
                    </label>
                    <input
                      type="text"
                      name="rank"
                      placeholder="เช่น ร.ต.อ. (เว้นว่างหรือ - หากไม่มี)"
                      value={formData.rank}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">คำนำหน้า</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="เช่น นาย / นาง / นางสาว"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">ชื่อ</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">นามสกุล</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">เพศ</label>
                    <input
                      type="text"
                      name="gender"
                      placeholder="เช่น ชาย / หญิง"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, phone: val }));
                      }}
                      maxLength="10"
                      placeholder="เช่น 0812345678"
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-[120px] font-semibold">
                      วันที่เริ่มทำงาน
                    </label>
                    <Flatpickr
                      value={formData.startDate}
                      onChange={([date], dateStr) => {
                        setFormData((prev) => ({ ...prev, startDate: dateStr }));
                      }}
                      options={{
                        dateFormat: "d/m/Y",
                        allowInput: true,
                      }}
                      placeholder="วว/ดด/ปปปป"
                      className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 outline-none focus:border-blue-500 bg-white text-xs"
                    />
                  </div>

                  {isGuardMenu && (
                    <div className="flex items-center">
                      <label className="w-[120px] font-semibold">
                        หัวหน้าชุด
                      </label>
                      <select
                        name="headName"
                        value={formData.headName}
                        onChange={handleInputChange}
                        className="flex-1 h-[28px] border border-gray-400 rounded-full px-3 bg-white outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                      >
                        <option value="">-- ระบุหัวหน้าชุด --</option>
                        {headGuards
                          .filter((hg) => hg.active)
                          .map((hg) => (
                            <option key={hg.id} value={hg.name}>
                              {hg.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="w-[120px] flex flex-col pt-1">
                  <div className="w-full h-[140px] border border-gray-400 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden">
                    {selectedGuard?.raw?.profile_img &&
                    selectedGuard.raw.profile_img !== "default.png" ? (
                      <img
                        src={`http://localhost:8080/uploads/${selectedGuard.raw.profile_img}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <User size={60} strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[120px] font-semibold pt-1">
                  รายละเอียดผู้ใช้
                </label>
                <textarea
                  name="userDetail"
                  value={formData.userDetail}
                  onChange={handleInputChange}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex mt-3">
                <label className="w-[120px] font-semibold pt-1">ที่อยู่</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-[12px] p-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <label className="w-[120px] font-semibold">
                    สถานะการทำงาน
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="h-[28px] border border-gray-400 rounded-full px-3 outline-none w-[130px] bg-white cursor-pointer"
                  >
                    <option value="ปฏิบัติงาน">ปฏิบัติงาน</option>
                    <option value="พักงาน">พักงาน</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="h-[38px] px-8 bg-red-600 hover:bg-red-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <X size={18} /> ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateData}
                    className="h-[38px] px-8 bg-[#F58220] hover:bg-orange-600 text-white rounded-[10px] font-medium transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <PenSquare size={18} /> ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDashboard;
