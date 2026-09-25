import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Flatpickr from "react-flatpickr";
import { formatThaiDate, toISODate } from "../../utils/formatters";
import {
  Building2,
  Shield,
  Search,
  Plus,
  Eye,
  Trash2,
  X,
  Edit,
  PenSquare,
  LogOut,
  Building,
  AlertCircle,
} from "lucide-react";

function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingDisplayId, setEditingDisplayId] = useState("");

  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    startDate: new Date().toISOString().split("T")[0],
    status: "ปฏิบัติงาน",
  });

  // Current admin profile
  const currentUser = useMemo(() => {
    try {
      const userJson = localStorage.getItem("user");
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }, []);
  const adminName =
    currentUser?.first_name || currentUser?.username || "Admin Master";

  // Regex rules from SRS & Logic Refine:
  // Username: English or numbers + special characters [ !#_.- ], length 4-30, no spaces, not empty
  const USERNAME_REGEX = /^[a-zA-Z0-9!#_.-]{4,30}$/;
  // Password: English or numbers + special characters [ !#_. ], length 8-16, no spaces, not empty
  const PASSWORD_REGEX = /^[a-zA-Z0-9!#_.]{8,16}$/;

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (adminName && adminName !== "Admin Master") {
        params.adminName = adminName;
      } else if (currentUser?.first_name) {
        params.adminName = currentUser.first_name;
      }
      if (currentUser?.username) {
        params.adminUsername = currentUser.username;
      }

      const res = await axios.get("http://localhost:8080/api/company", { params });
      if (Array.isArray(res.data)) {
        const adminIdentifiers = [
          adminName,
          currentUser?.username,
          currentUser?.first_name,
          currentUser?.first_name && currentUser?.last_name
            ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
            : null,
        ]
          .filter(Boolean)
          .map((n) => n.toLowerCase().trim());

        const filteredByAdmin = res.data.filter((c) => {
          if (!adminIdentifiers.length) return true;
          const compAdmin = (c.admin_name || "").toLowerCase().trim();
          if (!compAdmin) return false;
          return adminIdentifiers.some(
            (id) =>
              compAdmin === id ||
              compAdmin.includes(id) ||
              id.includes(compAdmin),
          );
        });

        const sorted = [...filteredByAdmin].sort(
          (a, b) => (Number(a.users_id) || 0) - (Number(b.users_id) || 0),
        );
        const formatted = sorted.map((c, index) => {
          const isActive = c.quit_date === null;
          const ordinalNumber = (index + 1).toString();
          return {
            id: `${ordinalNumber}`,
            rawId: c.users_id,
            companyName: c.company_name || c.username || "-",
            username: c.username,
            phone: c.phone || "-",
            email: c.user_detail || "-",
            address: c.address || "-",
            startDate: c.start_date ? c.start_date.split("T")[0] : "-",
            status: isActive ? "ปฏิบัติงาน" : "พ้นสภาพ",
            active: isActive,
            raw: c,
          };
        });
        setCompanies(formatted);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [adminName, currentUser]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const clearForm = () => {
    setFormData({
      companyName: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      startDate: new Date().toISOString().split("T")[0],
      status: "ปฏิบัติงาน",
    });
    setFormError("");
  };

  const validateCredentials = (u, p, isPasswordRequired = true) => {
    if (!u || !u.trim()) {
      return "กรุณากรอกชื่อผู้ใช้งาน";
    }
    if (u.includes(" ")) {
      return "ชื่อผู้ใช้งานต้องไม่มีเว้นวรรค หรือช่องว่าง";
    }
    if (u.length < 4 || u.length > 30) {
      return "ชื่อผู้ใช้งานต้องมีความยาวตั้งแต่ 4 ตัวอักษร และไม่เกิน 30 ตัวอักษร";
    }
    if (!USERNAME_REGEX.test(u)) {
      return "ชื่อผู้ใช้งานต้องเป็นภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษ [ !#_.- ] เท่านั้น";
    }

    if (isPasswordRequired || (p && p.trim().length > 0)) {
      if (!p || !p.trim()) {
        return "กรุณากรอกรหัสผ่าน";
      }
      if (p.includes(" ")) {
        return "รหัสผ่านต้องไม่มีเว้นวรรค หรือช่องว่าง";
      }
      if (p.length < 8 || p.length > 16) {
        return "รหัสผ่านต้องมีความยาวตั้งแต่ 8 ตัวอักษร และไม่เกิน 16 ตัวอักษร";
      }
      if (!PASSWORD_REGEX.test(p)) {
        return "รหัสผ่านต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข รวมอักขระพิเศษ [ !#_. ]";
      }
    }

    return null;
  };

  const handleOpenAddModal = () => {
    clearForm();
    setIsAddModalOpen(true);
  };

  const handleSaveNewCompany = async () => {
    const validationError = validateCredentials(
      formData.username,
      formData.password,
      true,
    );
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!formData.companyName.trim()) {
      setFormError("กรุณากรอกชื่อบริษัท");
      return;
    }

    const payload = {
      company_name: formData.companyName.trim(),
      first_name: formData.companyName.trim(),
      last_name: "-",
      phone: formData.phone || "064-XXXXXXX",
      address: formData.address || "-",
      user_detail: formData.email || "-",
      start_date: formData.startDate
        ? `${toISODate(formData.startDate)}T00:00:00`
        : new Date().toISOString(),
      profile_img: "default_company.png",
      username: formData.username.trim(),
      password: formData.password,
      admin_name: adminName,
    };

    try {
      const res = await axios.post(
        "http://localhost:8080/api/company",
        payload,
      );
      if (res.status === 201 || res.status === 200) {
        setIsAddModalOpen(false);
        fetchCompanies();
      }
    } catch (err) {
      console.error("Save company error:", err);
      const msg =
        err.response?.data?.message ||
        "เกิดข้อผิดพลาดในการบันทึกข้อมูล โปรดตรวจสอบ Username ว่าซ้ำหรือไม่";
      setFormError(msg);
    }
  };

  const handleOpenViewModal = (item) => {
    setSelectedCompany(item);
    setEditingId(item.rawId);
    setEditingDisplayId(item.id);
    setFormData({
      companyName: item.companyName,
      username: item.username || "",
      password: "••••••••",
      firstName: item.raw.first_name || item.companyName,
      lastName: item.raw.last_name || "-",
      phone: item.phone,
      email: item.email,
      address: item.address,
      startDate: item.startDate !== "-" ? item.startDate : "",
      status: item.status,
    });
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setIsViewModalOpen(false);
    setFormData((prev) => ({ ...prev, password: "" }));
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleUpdateCompany = async () => {
    const validationError = validateCredentials(
      formData.username,
      formData.password,
      false,
    );
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!formData.companyName.trim()) {
      setFormError("กรุณากรอกชื่อบริษัท");
      return;
    }

    const payload = {
      company_name: formData.companyName.trim(),
      first_name: formData.companyName.trim(),
      last_name: "-",
      phone: formData.phone,
      address: formData.address,
      user_detail: formData.email,
      start_date: formData.startDate
        ? `${toISODate(formData.startDate)}T00:00:00`
        : null,
      username: formData.username.trim(),
      status: formData.status,
    };

    if (formData.password && formData.password.trim().length > 0) {
      payload.password = formData.password;
    }

    try {
      const res = await axios.put(
        `http://localhost:8080/api/company/${editingId}`,
        payload,
      );
      if (res.status === 200) {
        setIsEditModalOpen(false);
        fetchCompanies();
      }
    } catch (err) {
      console.error("Update company error:", err);
      const msg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูลบริษัท";
      setFormError(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingId) return;
    try {
      await axios.delete(`http://localhost:8080/api/company/${editingId}`);
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error("Delete company error:", err);
      alert("เกิดข้อผิดพลาดในการลบบริษัท");
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const kw = search.toLowerCase();
    return (
      c.id.toLowerCase().includes(kw) ||
      c.companyName.toLowerCase().includes(kw) ||
      c.username.toLowerCase().includes(kw) ||
      c.phone.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[170px] min-h-screen bg-gray-200 border-r border-gray-300 flex flex-col">
        <div className="h-[70px] flex items-center justify-center border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
              <Shield size={18} />
            </div>
            <span className="text-[20px] font-bold text-blue-600">Admin</span>
          </div>
        </div>

        <nav className="flex-1 pt-6 px-3">
          <button className="w-full h-[40px] mb-2.5 rounded-xl flex items-center justify-start gap-2.5 px-3.5 text-[13px] font-medium bg-blue-600 text-white shadow-sm cursor-pointer">
            <Building2 size={17} />
            <span className="whitespace-nowrap">บริษัท รปภ.</span>
          </button>
        </nav>

        <div className="border-t border-gray-300 p-4">
          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-2 text-[13px] text-gray-700 hover:text-red-500 transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 bg-gray-300/40 pb-10">
        {/* Header */}
        <header className="h-[70px] border-b border-gray-300 flex items-center justify-between px-8 bg-white/70 backdrop-blur-sm">
          <h1 className="text-[19px] font-bold text-gray-800">
            การจัดการบริษัทรักษาความปลอดภัย
          </h1>

          <div className="flex items-center gap-3">
            <div className="text-right pr-3 border-r border-gray-300">
              <p className="text-[13px] font-semibold text-gray-800">
                {adminName}
              </p>
              <p className="text-[11px] text-gray-500">ผู้ดูแลระบบ (Admin)</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Section Body */}
        <section className="px-10 pt-8">
          {/* ================= COMPANIES LIST (Matching Fig 3.127) ================= */}
          <div>
            {/* Top Bar: Search & Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-[340px]">
                <Search
                  size={20}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาบริษัทรักษาความปลอดภัย"
                  className="w-full h-[38px] border border-gray-400 rounded-xl pl-10 pr-4 text-sm outline-none focus:border-blue-500 bg-white shadow-sm"
                />
              </div>

              <button
                onClick={handleOpenAddModal}
                className="h-[38px] px-5 bg-[#42a884] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow cursor-pointer"
              >
                <Plus size={18} /> เพิ่มบริษัทรปภ.
              </button>
            </div>

            {/* Table (Matching Fig 3.127) */}
            <div className="w-full border border-gray-400 rounded-xl overflow-hidden bg-white/90 shadow-sm">
              <div className="grid grid-cols-[100px_2fr_1.5fr_1.2fr_1.2fr_50px] h-[44px] bg-blue-500 text-white items-center text-[13px] font-semibold px-5">
                <div className="text-center">ลำดับที่</div>
                <div>บริษัทรักษาความปลอดภัย</div>
                <div>เบอร์โทรศัพท์</div>
                <div>วันที่เริ่มทำงาน</div>
                <div>สถานะ</div>
                <div className="text-center">การจัดการ</div>
              </div>

              {isLoading ? (
                <div className="h-[140px] flex items-center justify-center text-sm text-gray-500">
                  กำลังโหลดข้อมูลบริษัท...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="h-[140px] flex flex-col items-center justify-center text-gray-400">
                  <Building2 size={36} className="mb-2 text-gray-300" />
                  <p className="text-sm">ไม่พบข้อมูลบริษัทรักษาความปลอดภัย</p>
                </div>
              ) : (
                filteredCompanies.map((comp) => (
                  <div
                    key={comp.id}
                    className="grid grid-cols-[100px_2fr_1.5fr_1.2fr_1.2fr_50px] min-h-[48px] items-center border-t border-gray-300 text-[13px] px-5 hover:bg-blue-50/40 transition"
                  >
                    <div className="text-center font-medium text-gray-700 bg-gray-200/60 py-1 px-2.5 rounded-lg w-16 mx-auto">
                      {comp.id}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {comp.companyName}
                    </div>
                    <div className="text-gray-600">{comp.phone}</div>
                    <div className="text-gray-600">
                      {formatThaiDate(comp.startDate)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          comp.active ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-xs font-medium">{comp.status}</span>
                    </div>
                    <div className="flex justify-center items-center">
                      <button
                        type="button"
                        onClick={() => handleOpenViewModal(comp)}
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODAL: เพิ่มบริษัทรักษาความปลอดภัย (ADD) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[620px] overflow-hidden shadow-2xl relative border-2 border-emerald-500">
            {/* Modal Header */}
            <div className="bg-emerald-600 h-[52px] flex items-center justify-between px-6 text-white">
              <div className="flex items-center gap-2.5">
                <Building2 size={20} />
                <h2 className="font-semibold text-[16px]">
                  เพิ่มบริษัทรักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 text-[13px] text-gray-800">
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-3.5">
                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="8-20 ตัวอักษร/ตัวเลข"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      รหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="8-16 ตัว รวม [ !#_. ]"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ชื่อบริษัท <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="ชื่อบริษัทรักษาความปลอดภัย"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="064-XXXXXXX"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="company@email.com"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      วันที่เริ่มทำงาน
                    </label>
                    <Flatpickr
                      value={formData.startDate}
                      onChange={([date], dateStr) => {
                        setFormData((prev) => ({
                          ...prev,
                          startDate: dateStr,
                        }));
                      }}
                      options={{
                        dateFormat: "d/m/Y",
                        allowInput: true,
                      }}
                      placeholder="วว/ดด/ปปปป"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs bg-white text-gray-700"
                    />
                  </div>
                </div>

                {/* Company Logo / Illustration (Fig 3.130) */}
                <div className="w-[130px] flex flex-col items-center justify-center">
                  <div className="w-full h-[150px] border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                    <Building size={48} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500">
                      โลโก้บริษัท
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[130px] font-semibold pt-1 text-gray-700">
                  ที่อยู่
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="ที่อยู่สำนักงาน / บริษัท"
                  className="flex-1 border border-gray-400 rounded-xl p-2.5 outline-none focus:border-blue-500 resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveNewCompany}
                  className="h-[38px] px-8 bg-[#42a884] hover:bg-emerald-600 text-white rounded-xl font-semibold transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={18} /> บันทึกข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ดูข้อมูลบริษัท (VIEW - Fig 3.130) ================= */}
      {isViewModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[620px] overflow-hidden shadow-2xl relative border-2 border-blue-500">
            {/* Modal Header */}
            <div className="bg-blue-600 h-[52px] flex items-center justify-between px-6 text-white">
              <div className="flex items-center gap-2.5">
                <Eye size={20} />
                <h2 className="font-semibold text-[16px]">
                  ข้อมูลบริษัทรักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body (Matching Fig 3.130) */}
            <div className="p-7 text-[13px] text-gray-800">
              <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-3.5">
                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ลำดับที่
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={editingDisplayId}
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none text-center"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      รหัสผ่าน
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="••••••••"
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ชื่อบริษัท
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.companyName}
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.phone}
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      email
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.email}
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      วันที่เริ่มทำงาน
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatThaiDate(formData.startDate)}
                      className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                    />
                  </div>
                </div>

                {/* Company Logo Illustration */}
                <div className="w-[130px] flex flex-col items-center justify-center">
                  <div className="w-full h-[150px] border border-gray-400 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-500 shadow-inner">
                    <Building size={54} className="text-gray-400 mb-1" />
                    <span className="text-[11px] font-medium text-gray-600">
                      {selectedCompany.companyName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[130px] font-semibold pt-1 text-gray-700">
                  ที่อยู่
                </label>
                <textarea
                  readOnly
                  value={formData.address}
                  rows="2"
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                />
              </div>

              {/* Bottom Actions: Trash icon (Remove) and Edit button (Fig 3.130) */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition cursor-pointer"
                  title="ลบบริษัทรักษาความปลอดภัย"
                >
                  <Trash2 size={20} />
                </button>

                <button
                  onClick={handleOpenEditModal}
                  className="h-[38px] px-7 bg-[#F58220] hover:bg-orange-600 text-white rounded-xl font-semibold transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Edit size={18} /> แก้ไขข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: แก้ไขข้อมูลบริษัท (EDIT - Fig 3.133) ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] w-[620px] overflow-hidden shadow-2xl relative border-2 border-orange-500">
            {/* Modal Header */}
            <div className="bg-[#F58220] h-[52px] flex items-center justify-between px-6 text-white">
              <div className="flex items-center gap-2.5">
                <PenSquare size={20} />
                <h2 className="font-semibold text-[16px]">
                  แก้ไขข้อมูลบริษัทรักษาความปลอดภัย
                </h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 text-[13px] text-gray-800">
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-6">
                <div className="flex-1 flex flex-col gap-3.5">
                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ลำดับที่
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={editingDisplayId}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center bg-gray-100 outline-none text-xs font-semibold cursor-default"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ชื่อผู้ใช้งาน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      ชื่อบริษัท <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      วันที่เริ่มทำงาน
                    </label>
                    <Flatpickr
                      value={formData.startDate}
                      onChange={([date], dateStr) => {
                        setFormData((prev) => ({
                          ...prev,
                          startDate: dateStr,
                        }));
                      }}
                      options={{
                        dateFormat: "d/m/Y",
                        allowInput: true,
                      }}
                      placeholder="วว/ดด/ปปปป"
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center outline-none focus:border-blue-500 text-xs bg-white text-gray-700"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[130px] font-semibold text-gray-700">
                      สถานะการทำงาน
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="flex-1 h-[30px] border border-gray-400 rounded-full px-3 text-center bg-white outline-none focus:border-blue-500 text-xs cursor-pointer"
                    >
                      <option value="ปฏิบัติงาน">ปฏิบัติงาน</option>
                      <option value="พักงาน">พักงาน (Suspended)</option>
                      <option value="พ้นสภาพ">พ้นสภาพ (Fired)</option>
                    </select>
                  </div>
                </div>

                {/* Company Logo Illustration */}
                <div className="w-[130px] flex flex-col items-center justify-center">
                  <div className="w-full h-[150px] border border-gray-400 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-500 shadow-inner">
                    <Building size={54} className="text-gray-400 mb-1" />
                    <span className="text-[11px] font-medium text-gray-600">
                      {formData.companyName || "บริษัท"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex mt-4">
                <label className="w-[130px] font-semibold pt-1 text-gray-700">
                  ที่อยู่
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="flex-1 border border-gray-400 rounded-xl p-2.5 outline-none focus:border-blue-500 resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdateCompany}
                  className="h-[38px] px-8 bg-[#F58220] hover:bg-orange-600 text-white rounded-xl font-semibold transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <PenSquare size={18} /> บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ยืนยันการลบบริษัท (DELETE - Fig 3.136) ================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[440px] overflow-hidden shadow-2xl p-6 border border-red-300">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-gray-900">
                ยืนยันการลบบริษัท
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              คุณต้องการลบหรือปลดสถานะบริษัท{" "}
              <span className="font-bold text-gray-900">
                {selectedCompany?.companyName}
              </span>{" "}
              (ลำดับที่ {editingDisplayId}) ใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-[36px] px-5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-[36px] px-6 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
