/**
 * Formats a person's rank and full name according to Thai conventions:
 * - If military/police rank is present, format as: rank + fullname (e.g., "ร.ต.อ. สมชาย รักดี")
 * - Otherwise, format as: title + fullname (e.g., "นาย สมชาย รักดี")
 * - If neither rank nor title is present, format as: fullname (e.g., "สมชาย รักดี")
 */
export const formatRankAndName = (item) => {
  if (!item) return "-";

  // If item is a string, check if it's already a formatted string
  if (typeof item === "string") return item.trim() || "-";

  const rank = (item.rank || item.user_rank || "").toString().trim();
  const title = (item.title || "").toString().trim();
  const firstName = (item.first_name || item.firstName || "").toString().trim();
  const lastName = (item.last_name || item.lastName || "").toString().trim();

  let name = "";
  if (firstName || lastName) {
    name = `${firstName} ${lastName}`.trim();
  } else if (item.name) {
    name = item.name.toString().trim();
  } else if (item.guardName) {
    name = item.guardName.toString().trim();
  }

  const hasRank =
    rank && rank !== "-" && rank !== "null" && rank !== "undefined";
  const hasTitle =
    title && title !== "-" && title !== "null" && title !== "undefined";

  if (hasRank) {
    if (name.startsWith(rank)) return name;
    return `${rank} ${name}`.trim();
  }
  if (hasTitle) {
    if (name.startsWith(title)) return name;
    return `${title} ${name}`.trim();
  }
  return name || "-";
};
