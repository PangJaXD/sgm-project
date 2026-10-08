/**
 * Formats a person's title prefix and full name (e.g., "ร.ต.อ. นาย สมชาย รักดี").
 */
export const formatTitleAndName = (item) => {
  if (!item) return "-";

  // If item is a string, check if it's already a formatted string
  if (typeof item === "string") return item.trim() || "-";

  const title = (item.title || "").toString().trim();
  const firstName = (item.first_name || item.firstName || "").toString().trim();
  const lastName = (item.last_name || item.lastName || "").toString().trim();

  let name = "";
  if (firstName && lastName) {
    name = `${firstName} ${lastName}`.trim();
  } else if (
    firstName &&
    item.guardName &&
    !item.guardName.includes(firstName)
  ) {
    name = `${firstName} ${item.guardName}`.trim();
  } else if (
    firstName &&
    item.guard_name &&
    !item.guard_name.includes(firstName)
  ) {
    name = `${firstName} ${item.guard_name}`.trim();
  } else if (item.name) {
    name = item.name.toString().trim();
  } else if (item.guardName) {
    name = item.guardName.toString().trim();
  } else if (item.guard_name) {
    name = item.guard_name.toString().trim();
  } else if (firstName) {
    name = firstName;
  } else if (lastName) {
    name = lastName;
  }

  const hasTitle =
    title && title !== "-" && title !== "null" && title !== "undefined";

  if (hasTitle) {
    if (name.startsWith(`${title} `) || name === title) return name;
    const civilTitle = ["นางสาว", "นาย", "นาง"].find((prefix) =>
      title.endsWith(` ${prefix}`),
    );
    if (civilTitle && name.startsWith(`${civilTitle} `)) {
      name = name.slice(civilTitle.length + 1).trim();
    }
    return `${title} ${name}`.trim();
  }
  return name || "-";
};

/**
 * Converts a date to Thai Buddhist calendar (พ.ศ.) format: DD/MM/YYYY
 * e.g. "2026-10-20" -> "20/10/2569"
 * e.g. "2026-10-20T08:30:00" -> "20/10/2569"
 */
export const formatThaiDate = (dateInput) => {
  if (!dateInput) return "-";

  // If already in DD/MM/YYYY format with Buddhist year
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === "-") return "-";

    // Matches DD/MM/YYYY or D/M/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      let y = parseInt(dmyMatch[3], 10);
      if (y < 2400) y += 543;
      const d = dmyMatch[1].padStart(2, "0");
      const m = dmyMatch[2].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }

    // Matches YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      let y = parseInt(ymdMatch[1], 10);
      if (y < 2400) y += 543;
      const m = ymdMatch[2].padStart(2, "0");
      const d = ymdMatch[3].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }
  }

  // Handle Date instance or other parsable date string
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime()))
      return typeof dateInput === "string" ? dateInput : "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    let year = d.getFullYear();
    if (year < 2400) year += 543;
    return `${day}/${month}/${year}`;
  } catch {
    return typeof dateInput === "string" ? dateInput : "-";
  }
};

/**
 * Converts any time string (including AM/PM) to 24-hour format: HH:mm (00:00 - 23:59 / 24:00)
 * Removes AM/PM.
 */
export const format24HourTime = (timeInput) => {
  if (!timeInput) return "";
  const str = timeInput.toString().trim();
  if (!str || str === "-") return "";

  // Check for AM / PM
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);

  // Extract hour and minute digits
  let timeStr = str;
  if (timeStr.includes("T")) {
    timeStr = timeStr.split("T")[1];
  }

  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return str.replace(/am|pm|น\.?/gi, "").trim();

  let hour = parseInt(match[1], 10);
  const minute = match[2];

  if (isPM && hour < 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }

  const formattedHour = String(hour).padStart(2, "0");
  return `${formattedHour}:${minute}`;
};

/**
 * Formats a single time into Thai 24-hour time with " น." suffix (e.g. "08:00 น.")
 */
export const formatThaiTime = (timeInput) => {
  if (!timeInput || timeInput === "-") return "-";
  const formatted = format24HourTime(timeInput);
  if (!formatted) return "-";
  return `${formatted} น.`;
};

/**
 * Formats a time range string to 24-hour format without AM/PM and with " น."
 * e.g. "08:00 - 18:00 น.", "8:00 AM - 6:00 PM", "08:00:00 - 18:00:00"
 */
export const formatThaiTimeRange = (rangeInput) => {
  if (!rangeInput || rangeInput === "-" || rangeInput === "ไม่ระบุเวลา") {
    return rangeInput || "-";
  }

  const str = rangeInput.toString().trim();
  // If it's a range like "A - B" or "A to B"
  const parts = str.split(/\s*[-–—]\s*/);
  if (parts.length === 2) {
    const start = format24HourTime(parts[0]);
    const end = format24HourTime(parts[1]);
    if (start && end) {
      return `${start} - ${end} น.`;
    }
  }

  // Single time or other format
  const single = format24HourTime(str);
  if (single) {
    return `${single} น.`;
  }
  return str.replace(/am|pm/gi, "").trim();
};

/**
 * Formats a datetime string or Date object to Thai Buddhist calendar + 24-hour time:
 * e.g. "2026-09-24T22:30:00" -> "24/09/2569 22:30 น."
 */
export const formatThaiDateTime = (dateTimeInput) => {
  if (!dateTimeInput) return "-";
  try {
    const d = new Date(dateTimeInput);
    if (isNaN(d.getTime())) return formatThaiDate(dateTimeInput);
    const datePart = formatThaiDate(d);
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${datePart} ${hour}:${minute} น.`;
  } catch {
    return formatThaiDate(dateTimeInput);
  }
};

/**
 * Converts a date string (e.g. "DD/MM/YYYY" or "YYYY-MM-DD") to ISO "YYYY-MM-DD".
 * If year is Buddhist Era (> 2400), it converts to CE year.
 */
export const toISODate = (dateStr) => {
  if (!dateStr) return "";
  const trimmed = dateStr.toString().trim();
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3], 10);
    if (year >= 2400) year -= 543;
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return trimmed.split("T")[0];
};

/**
 * Calculates end time from startTime ("HH:mm" or ISO datetime) and duration (hours, integer).
 * Handles cross-day shifts (e.g. 22:00 + 5h = 03:00 next day).
 */
export const calculateEndTimeFromDuration = (startTime, duration) => {
  if (!startTime || duration === undefined || duration === null || duration === "") {
    return { endTime: "", isNextDay: false, displayText: "" };
  }
  const cleanTime = format24HourTime(startTime);
  if (!cleanTime) return { endTime: "", isNextDay: false, displayText: "" };

  const parts = cleanTime.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || "0", 10);
  const durHours = parseInt(duration, 10);

  if (isNaN(durHours) || durHours <= 0) {
    return { endTime: cleanTime, isNextDay: false, displayText: `${cleanTime} น.` };
  }

  const totalHours = h + durHours;
  const endH = totalHours % 24;
  const isNextDay = totalHours >= 24;
  const formattedEndH = String(endH).padStart(2, "0");
  const formattedEndM = String(m).padStart(2, "0");
  const endTime = `${formattedEndH}:${formattedEndM}`;

  return {
    endTime,
    isNextDay,
    displayText: `${endTime} น.${isNextDay ? " (วันถัดไป)" : ""}`,
  };
};

/**
 * Formats a shift's time range based on startTime and duration (hours).
 * Falls back to legacy fallbackEndTime if duration is not available.
 * e.g. "22:00 - 03:00 น."
 */
export const formatShiftDurationRange = (startTime, duration, fallbackEndTime = null) => {
  if (!startTime) return "ไม่ระบุเวลา";
  const start = format24HourTime(startTime);
  if (!start) return "ไม่ระบุเวลา";

  if (duration !== undefined && duration !== null && duration !== "") {
    const { endTime } = calculateEndTimeFromDuration(start, duration);
    if (endTime) {
      return `${start} - ${endTime} น.`;
    }
  }

  if (fallbackEndTime) {
    const end = format24HourTime(fallbackEndTime);
    if (end) return `${start} - ${end} น.`;
  }

  return `${start} น.`;
};
