import {
  CalendarDays,
  X,
  MapPin,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function ViewEventModal({
  isOpen,
  onClose,
  eventData,
  headGuardId,
  onSelectShift,
}) {
  if (!isOpen || !eventData) return null;

  // 🌟 ติดเกราะ 1: ดึง ID จาก LocalStorage เองโดยตรงเลย เผื่อหน้าหลักลืมส่ง Prop มาให้
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : {};
  const currentUserId = headGuardId || currentUser.users_id || 1;

  // 🌟 ติดเกราะ 2: บังคับแปลงเป็น Number() ทั้งสองฝั่ง ป้องกัน 8 !== "8"
  const myShifts = (eventData.shift_times || []).filter(
    (st) => Number(st.head_guard_id) === Number(currentUserId),
  );

  // ฟังก์ชันแปลงรูปแบบเวลา
  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      const timePart = timeStr.split("T")[1];
      if (timePart) {
        const [h, m] = timePart.split(":");
        return `${h}.${m} น.`;
      }
    } catch (e) {}
    return timeStr;
  };

  // ฟังก์ชันดึงเฉพาะวันที่
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-[24px] w-[600px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative border-[2px] border-[#111827]">
        {/* Header */}
        <div className="bg-[#111827] h-[54px] shrink-0 flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} />
            <h2 className="font-medium text-[16px]">
              รายละเอียดงานและกะที่รับผิดชอบ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 text-[13px] text-gray-800 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-[18px] font-bold text-gray-900 mb-1">
              {eventData.event_name}
            </h3>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} className="text-emerald-600" />
              <span>{eventData.location}</span>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
              <h4 className="font-bold text-[14px] text-gray-900">
                กะการทำงานของคุณ ({myShifts.length} กะ)
              </h4>
            </div>

            {myShifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                ไม่พบข้อมูลกะที่คุณรับผิดชอบในงานอีเว้นท์นี้
              </div>
            ) : (
              <div className="space-y-3">
                {myShifts.map((shift, idx) => (
                  <div
                    key={shift.shift_id || idx}
                    onClick={() => onSelectShift(eventData, shift)}
                    className="bg-white border border-gray-300 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          กะที่ {shift.shift_id}
                        </span>
                        <span className="font-semibold text-gray-800">
                          วันที่ {formatDate(shift.shift_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[12px] text-gray-600 mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          <span>
                            {formatTime(shift.start_time)} -{" "}
                            {formatTime(shift.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-gray-400" />
                          <span>รปภ. ที่ต้องการ {shift.maximum_guards} คน</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex mt-8 items-center justify-end pt-4 border-t border-gray-200">
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
