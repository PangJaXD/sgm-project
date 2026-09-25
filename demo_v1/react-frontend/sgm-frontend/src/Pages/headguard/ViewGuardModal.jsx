import { Eye, X, User } from "lucide-react";
import { formatRankAndName } from "../../utils/formatters";

export default function ViewGuardModal({ isOpen, onClose, guardData }) {
  if (!isOpen || !guardData) return null;
  const raw = guardData.raw;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-[24px] w-[580px] overflow-hidden shadow-2xl relative border-[2px] border-blue-500">
        {/* Header Modal */}
        <div className="bg-[#111827] h-[54px] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <Eye size={20} />
            <h2 className="font-medium text-[16px]">
              ข้อมูลเจ้าหน้าที่รักษาความปลอดภัย
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-8 text-[13px] text-gray-800">
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  ลำดับที่
                </label>
                <input
                  type="text"
                  readOnly
                  value={guardData.sequence || guardData.id}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  รหัสประจำตัว
                </label>
                <input
                  type="text"
                  readOnly
                  value={guardData.guardId || guardData.raw?.users_id || guardData.id}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-100 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  type="text"
                  readOnly
                  value={raw.username || ""}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-50 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatRankAndName({
                    rank: raw.rank,
                    title: raw.title,
                    firstName: raw.first_name,
                    lastName: raw.last_name,
                  })}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-50 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  เพศ
                </label>
                <input
                  type="text"
                  readOnly
                  value={raw.gender || "-"}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-50 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="w-[120px] font-semibold text-gray-700">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  readOnly
                  value={raw.phone || ""}
                  className="flex-1 h-[32px] border border-gray-300 rounded-lg px-3 bg-gray-50 outline-none"
                />
              </div>
            </div>

            {/* Profile Image Box */}
            <div className="w-[130px] flex flex-col">
              <div className="w-full h-[150px] border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 overflow-hidden shadow-inner">
                {raw.profile_img && raw.profile_img !== "default.png" ? (
                  <img
                    src={`http://localhost:8080/uploads/${raw.profile_img}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} strokeWidth={1.5} />
                )}
              </div>
            </div>
          </div>

          <div className="flex mt-6 items-center justify-between pt-5 border-t border-gray-200">
            <div className="flex items-center">
              <label className="w-[120px] font-semibold text-gray-700">
                สถานะการทำงาน
              </label>
              <div
                className={`h-[32px] px-4 border rounded-lg flex items-center justify-center font-medium ${
                  guardData.status === "ปฏิบัติงาน"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-red-500 bg-red-50 text-red-700"
                }`}
              >
                {guardData.status}
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-[36px] px-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
