import { useState, useEffect } from "react";
import {
  X,
  User,
  ShieldCheck,
  ArrowDownUp,
  AlertTriangle,
  Info,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatTitleAndName, formatThaiTimeRange } from "../../utils/formatters";

export default function ConfirmGuardStatusModal({
  isOpen,
  onClose,
  onConfirm,
  mode = "TO_ACTUAL", // "TO_ACTUAL" | "TO_RESERVE"
  guardAssignment,
  availableGuardsToSwap = [],
  currentActualCount = 0,
  maxGuards = 6,
  isLoading = false,
}) {
  const [selectedSwapId, setSelectedSwapId] = useState("");

  // รีเซ็ตการเลือกสลับเมื่อเปิด Modal หรือเปลี่ยนตัวเจ้าหน้าที่
  useEffect(() => {
    if (isOpen) {
      setSelectedSwapId("");
    }
  }, [isOpen, guardAssignment]);

  if (!isOpen || !guardAssignment) return null;

  const isToActual = mode === "TO_ACTUAL";
  const isFullCapacity = isToActual && currentActualCount >= maxGuards;

  const handleConfirmClick = () => {
    const swapTarget = selectedSwapId
      ? availableGuardsToSwap.find((g) => g.id.toString() === selectedSwapId.toString())
      : null;
    onConfirm(guardAssignment, swapTarget);
  };

  const selectedSwapGuard = selectedSwapId
    ? availableGuardsToSwap.find((g) => g.id.toString() === selectedSwapId.toString())
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div
        className={`bg-white rounded-[24px] w-full max-w-[500px] overflow-hidden shadow-2xl relative border-[2px] ${
          isToActual ? "border-emerald-500" : "border-amber-500"
        }`}
      >
        {/* Header Modal */}
        <div
          className={`h-[54px] flex items-center justify-between px-6 text-white ${
            isToActual ? "bg-emerald-600" : "bg-amber-600"
          }`}
        >
          <div className="flex items-center gap-2">
            {isToActual ? (
              <ShieldCheck size={20} className="text-white" />
            ) : (
              <ArrowDownUp size={20} className="text-white" />
            )}
            <h2 className="font-semibold text-[15px]">
              {isToActual
                ? "ยืนยันการย้ายเจ้าหน้าที่เป็นตัวจริง"
                : "ยืนยันการสลับเจ้าหน้าที่เป็นตัวสำรอง"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 text-[13px] text-gray-800 space-y-4">
          {/* การ์ดข้อมูล รปภ. ที่ถูกเลือก */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isToActual
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-[15px] truncate">
                {formatTitleAndName(guardAssignment)}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>รหัส: {guardAssignment.guardId || "-"}</span>
                <span>•</span>
                <span>เวลา: {formatThaiTimeRange(guardAssignment.time)}</span>
              </div>
            </div>
          </div>

          {/* กล่องแสดงการเปลี่ยนสถานะ */}
          <div className="flex items-center justify-center gap-3 py-2 bg-gray-50/80 rounded-xl border border-dashed border-gray-300 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-medium ${
                isToActual
                  ? "bg-gray-200 text-gray-700"
                  : guardAssignment.status === "ASSIGNED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isToActual
                ? "ตัวสำรอง"
                : guardAssignment.status === "ASSIGNED"
                ? "ตัวจริง (มอบหมายแล้ว)"
                : "ตัวจริง"}
            </span>
            <ArrowRight size={16} className="text-gray-400" />
            <span
              className={`px-3 py-1 rounded-full font-semibold ${
                isToActual
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              {isToActual ? "ตัวจริง (Starter)" : "ตัวสำรอง (Reserve)"}
            </span>
          </div>

          {/* ข้อความแจ้งเตือน / คำอธิบาย */}
          {isToActual && isFullCapacity && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">เจ้าหน้าที่ตัวจริงเต็มจำนวนแล้ว:</span>{" "}
                ปัจจุบันมีตัวจริง {currentActualCount}/{maxGuards} คน
                ท่านสามารถเลือกสลับตำแหน่งกับตัวจริงที่มีอยู่ด้านล่าง หรือกดยืนยันเพื่อเพิ่มต่อ
              </div>
            </div>
          )}

          {!isToActual && guardAssignment.status === "ASSIGNED" && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">ข้อแนะนำ:</span>{" "}
                เจ้าหน้าที่รายนี้ได้รับการมอบหมายจุดปฏิบัติงานแล้ว หากย้ายไปตัวสำรอง
                งานเดิมที่บันทึกไว้จะยังคงอยู่ แต่สถานะจะเปลี่ยนเป็นตัวสำรอง
              </div>
            </div>
          )}

          {/* ตัวเลือกสลับตำแหน่ง (Dropdown) */}
          {availableGuardsToSwap && availableGuardsToSwap.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-gray-700">
                {isToActual
                  ? "เลือกตัวจริงที่ต้องการสลับตำแหน่งด้วย (ไม่บังคับ):"
                  : "เลือกตัวสำรองที่ต้องการสลับขึ้นมาแทน (ไม่บังคับ):"}
              </label>
              <select
                value={selectedSwapId}
                onChange={(e) => setSelectedSwapId(e.target.value)}
                disabled={isLoading}
                className="w-full h-[38px] px-3 border border-gray-300 rounded-xl text-xs bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                <option value="">
                  {isToActual
                    ? "-- ไม่เลือก (ย้ายเข้าเป็นตัวจริงโดยตรง) --"
                    : "-- ไม่เลือก (ย้ายเป็นตัวสำรองอย่างเดียว) --"}
                </option>
                {availableGuardsToSwap.map((g) => (
                  <option key={g.id} value={g.id}>
                    {formatTitleAndName(g)} (รหัส: {g.guardId || "-"})
                    {g.status === "ASSIGNED" ? " - มอบหมายงานแล้ว" : ""}
                  </option>
                ))}
              </select>
              {selectedSwapGuard && (
                <div className="text-[11px] text-gray-500 italic pl-1">
                  * จะสลับตำแหน่งกับ {formatTitleAndName(selectedSwapGuard)} ทันที
                </div>
              )}
            </div>
          )}

          {/* คำถามยืนยัน */}
          <div className="text-center pt-2 pb-1 text-gray-700 text-sm">
            คุณแน่ใจหรือไม่ว่าต้องการ{isToActual ? "ย้าย" : "สลับ"}{" "}
            <span className="font-bold text-gray-900">
              {formatTitleAndName(guardAssignment)}
            </span>{" "}
            {isToActual ? "เป็นเจ้าหน้าที่ตัวจริง" : "ไปเป็นเจ้าหน้าที่ตัวสำรอง"}?
          </div>

          {/* ปุ่ม Action ด้านล่าง */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-[38px] px-5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition cursor-pointer text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isLoading}
              className={`h-[38px] px-6 text-white rounded-xl font-semibold transition flex items-center gap-2 shadow-sm cursor-pointer text-xs ${
                isToActual
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : isToActual ? (
                <>
                  <ShieldCheck size={16} /> ยืนยันการย้ายเป็นตัวจริง
                </>
              ) : (
                <>
                  <ArrowDownUp size={16} /> ยืนยันการสลับเป็นตัวสำรอง
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

