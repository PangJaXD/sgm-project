import { useState } from "react";
import axios from "axios"; // นำเข้า axios
import {
  Shield,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";

function LoginPage() {
  const API_URL = "http://localhost:8080";
  const [role, setRole] = useState(() =>
    window.location.pathname.includes("/admin") ? "admin" : "company"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const USERNAME_REGEX = /^[a-zA-Z0-9]{8,20}$/;
  const PASSWORD_REGEX = /^[a-zA-Z0-9!#_.]{8,16}$/;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้งาน");
      return;
    }
    if (username.includes(" ")) {
      setError("ชื่อผู้ใช้ต้องไม่มีเว้นวรรค หรือช่องว่าง");
      return;
    }
    if (username.length < 8 || username.length > 20) {
      setError("ชื่อผู้ใช้ต้องมีความยาวตั้งแต่ 8 ตัวอักษร และไม่เกิน 20 ตัวอักษร");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setError("ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น");
      return;
    }

    if (!password.trim()) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }
    if (password.includes(" ")) {
      setError("รหัสผ่านต้องไม่มีเว้นวรรค หรือช่องว่าง");
      return;
    }
    if (password.length < 8 || password.length > 16) {
      setError("รหัสผ่านต้องมีความยาวตั้งแต่ 8 ตัวอักษร และไม่เกิน 16 ตัวอักษร");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("รหัสผ่านต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลข รวมอักขระพิเศษ [ !#_. ]");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: username.trim(),
        password: password,
      });

      const data = response.data;
      console.log("Login success:", data);

      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "HEAD_GUARD") {
        window.location.href = "/headguard";
      } else if (data.role === "COMPANY") {
        window.location.href = "/company";
      } else if (data.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        setError("ไม่สามารถระบุประเภทผู้ใช้งานได้");
      }
    } catch (error) {
      console.error("Login error:", error);

      // การจัดการ Error ของ Axios
      if (error.response) {
        // กรณีเซิร์ฟเวอร์ตอบกลับมาด้วย Status Code อื่นที่ไม่ใช่ 2xx
        // เช่น 401 Unauthorized
        setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      } else if (error.request) {
        // กรณีส่งคำขอไปแล้ว แต่ไม่ได้รับการตอบกลับ (เช่น เซิร์ฟเวอร์ล่ม)
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง");
      } else {
        // ข้อผิดพลาดอื่นๆ ในการตั้งค่าคำขอ
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#e5e5e5] flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-[1000px] min-h-[600px] overflow-hidden rounded-2xl border border-gray-500 bg-white shadow-lg flex flex-col md:flex-row">
        {/* ================================================= */}
        {/* LEFT SIDE */}
        {/* ================================================= */}

        <div className="w-full md:w-[38%] bg-[#2864e8] text-white flex flex-col justify-between p-8">
          {/* Logo */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl border-2 border-white/30 flex items-center justify-center">
              <Shield size={30} />
            </div>

            <div>
              <h1 className="font-bold text-lg leading-tight">
                EventGuard System
              </h1>

              <p className="font-semibold text-base">(EGS)</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="w-full">
            <p className="text-center text-sm text-white/80 mb-3">
              กรุณาเลือกประเภทผู้ใช้
            </p>

            <div className="flex gap-3">
              {/* Company */}
              <button
                type="button"
                onClick={() => {
                  setRole("company");
                  setError("");
                }}
                className={`
                  flex-1
                  h-16
                  rounded-xl
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  transition
                  cursor-pointer
                  ${
                    role === "company"
                      ? "bg-white text-[#2864e8]"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }
                `}
              >
                <Building2 size={25} />

                <span className="text-xs font-medium">Company</span>
              </button>

              {/* Security Head */}
              <button
                type="button"
                onClick={() => {
                  setRole("headguard");
                  setError("");
                }}
                className={`
                  flex-1
                  h-16
                  rounded-xl
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  transition
                  cursor-pointer
                  ${
                    role === "headguard"
                      ? "bg-white text-[#2864e8]"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }
                `}
              >
                <Shield size={25} />

                <span className="text-xs font-medium">Security Head</span>
              </button>
            </div>

            {/* Admin */}
            <button
              type="button"
              onClick={() => {
                setRole(role === "admin" ? "company" : "admin");
                setError("");
              }}
              className={`block w-full mt-4 py-1.5 px-3 rounded-lg text-center text-xs transition ${
                role === "admin"
                  ? "bg-white text-[#2864e8] font-bold shadow"
                  : "text-white/90 underline underline-offset-2 hover:text-white"
              }`}
            >
              {role === "admin" ? "✓ ใช้งานในฐานะ Admin" : "เข้าสู่ระบบ Admin"}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT SIDE */}
        {/* ================================================= */}

        <div className="w-full md:w-[62%] bg-white flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-[470px]">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                กรุณากรอกข้อมูลเพื่อเข้าใช้งานในฐานะ{" "}
                <span className="text-[#2864e8] font-medium">
                  {role === "company"
                    ? "บริษัท รักษาความปลอดภัย"
                    : role === "admin"
                      ? "ผู้ดูแลระบบ EventGuard System (EGS)"
                      : "ผู้ดูแล Security Head"}
                </span>
                {role !== "admin" && (
                  <>
                    <br />
                    หรือ{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setRole("admin");
                        setError("");
                      }}
                      className="text-[#2864e8] hover:underline inline"
                    >
                      ดูแลระบบ EventGuard System (EGS)
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-semibold text-gray-900"
                >
                  บัญชีผู้ใช้งาน
                </label>

                <div className="h-12 flex items-center gap-3 px-4 rounded-lg border border-gray-400 bg-gray-50 focus-within:border-[#2864e8] focus-within:ring-2 focus-within:ring-blue-100 transition">
                  <UserRound size={20} className="text-gray-500 shrink-0" />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-900"
                  >
                    รหัสผ่าน
                  </label>

                  <button
                    type="button"
                    onClick={() => alert("หน้าลืมรหัสผ่าน")}
                    className="text-xs text-[#2864e8] hover:underline cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>

                <div className="h-12 flex items-center gap-3 px-4 rounded-lg border border-gray-400 bg-gray-50 focus-within:border-[#2864e8] focus-within:ring-2 focus-within:ring-blue-100 transition">
                  <LockKeyhole size={20} className="text-gray-500 shrink-0" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="************"
                    className="w-full outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                className="block mx-auto w-32 h-12 rounded-lg bg-[#2864e8] text-white text-sm font-semibold hover:bg-[#1d55cf] active:scale-95 transition cursor-pointer"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
