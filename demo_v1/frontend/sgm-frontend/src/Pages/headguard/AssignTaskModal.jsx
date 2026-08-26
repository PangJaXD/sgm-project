import { X, MapPin, PenSquare } from "lucide-react";
import { useState } from "react";

export default function AssignTaskModal({
  isOpen,
  onClose,
  assignmentData,
  onSave,
}) {
  const [description, setDescription] = useState("");

  if (!isOpen || !assignmentData) return null;

  const handleSave = () => {
    // ส่งข้อมูลกลับไปให้หน้าหลัก (พิกัดสมมติไปก่อน สามารถต่อยอดใช้ Google Maps API ได้)
    onSave({
      ...assignmentData,
      latitude: "18.8951163", // ค่าสมมติ
      longitude: "99.0120720", // ค่าสมมติ
      description: description,
    });
    setDescription(""); // เคลียร์ค่าหลังเซฟ
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-[24px] w-[500px] overflow-hidden shadow-2xl relative border-[2px] border-[#111827]">
        <div className="bg-[#111827] h-[50px] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <PenSquare size={18} />
            <h2 className="font-medium text-[15px]">มอบหมายงาน</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-7 text-[13px] text-gray-800 space-y-4">
          <div className="flex gap-10 border-b border-gray-200 pb-4">
            <div>
              <span className="font-semibold text-gray-900">รหัสประจำตัว:</span>
              <span className="ml-2 text-gray-600">
                {assignmentData.guardId}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">ชื่อ-นามสกุล:</span>
              <span className="ml-2 text-gray-600">
                {assignmentData.guardName}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
              <MapPin size={16} /> ตำแหน่งจุดปฏิบัติงาน
            </div>
            {/* พื้นที่จำลองสำหรับใส่แผนที่ (Google Maps) */}
            <div className="w-full h-[140px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition cursor-pointer">
              <MapPin size={32} className="mb-2 text-gray-300" />
              <p>คลิกเพื่อเลือกตำแหน่งบนแผนที่</p>
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-2">
              รายละเอียดการทำงาน
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดการทำงาน..."
              rows="3"
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-emerald-500 resize-none text-[13px]"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSave}
              className="h-[36px] px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition flex items-center gap-2 shadow-sm"
            >
              <PenSquare size={16} /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
