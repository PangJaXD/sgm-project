import {
  AlertCircle,
  X,
  Clock,
  FileText,
  Image as ImageIcon,
  CalendarDays,
} from "lucide-react";

export default function ViewRequestModal({ isOpen, onClose, requestData }) {
  if (!isOpen || !requestData) return null;

  const eventName =
    requestData.eventName || requestData.event_name || "ไม่ระบุชื่องาน";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-[24px] w-[500px] overflow-hidden shadow-2xl relative border-[2px] border-red-500">
        <div className="bg-red-500 h-[54px] flex items-center justify-between px-6 text-white">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <h2 className="font-medium text-[16px]">รายละเอียดการแจ้งเหตุ</h2>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white transition"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 text-[13px] text-gray-800 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">
                {requestData.report_type}
              </h3>
              <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                <Clock size={14} />
                <span>
                  {new Date(requestData.report_time).toLocaleString("th-TH")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200/60 flex items-center gap-2.5">
            <CalendarDays size={18} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-blue-600 font-medium">
                งานอีเว้นท์ที่เกิดเหตุ
              </p>
              <p className="font-bold text-gray-800 text-[13px] truncate">
                {eventName}
              </p>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2 font-semibold text-gray-700">
              <FileText size={16} className="text-red-400" />{" "}
              รายละเอียดเหตุการณ์
            </div>
            <p className="text-gray-700 leading-relaxed">
              {requestData.report_desc}
            </p>
          </div>

          {/* ภาพประกอบเหตุการณ์ (ถ้ามี) */}
          {requestData.report_img &&
            requestData.report_img !== "no-image.png" &&
            requestData.report_img !== "default_report.jpg" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-semibold text-gray-700">
                    <ImageIcon size={16} className="text-blue-400" /> ภาพประกอบเหตุการณ์
                  </span>
                  <span className="text-[11px] text-gray-400">คลิกที่ภาพเพื่อดูรูปขนาดเต็ม</span>
                </div>
                {(() => {
                  const rawImg = requestData.report_img;
                  const imgSrc = rawImg.startsWith("http://") || rawImg.startsWith("https://")
                    ? rawImg
                    : rawImg.startsWith("/uploads/")
                    ? `http://localhost:8080${rawImg}`
                    : rawImg.startsWith("/")
                    ? `http://localhost:8080/uploads${rawImg}`
                    : `http://localhost:8080/uploads/${rawImg}`;

                  return (
                    <div className="w-full h-[200px] bg-gray-100 rounded-xl border border-gray-300 overflow-hidden flex items-center justify-center group relative cursor-pointer">
                      <img
                        src={imgSrc}
                        alt="Report Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onClick={() => window.open(imgSrc, "_blank")}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            )}


          <div className="flex mt-6 items-center justify-between pt-5 border-t border-gray-200">
            <span className="text-red-600 font-semibold px-3 py-1 bg-red-100 rounded-full text-[11px]">
              สถานะ: ต้องตรวจสอบด่วน
            </span>
            <button
              onClick={onClose}
              className="h-[36px] px-8 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition"
            >
              รับทราบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
