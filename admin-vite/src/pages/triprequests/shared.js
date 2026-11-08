export const STATUSES = [
  { value: "new", label: "New", badge: "badge badge-warning" },
  { value: "quoted", label: "Quoted", badge: "badge badge-info" },
  { value: "accepted", label: "Accepted", badge: "badge badge-success" },
  { value: "declined", label: "Declined", badge: "badge badge-ghost" },
  { value: "cancelled", label: "Cancelled", badge: "badge badge-error" },
];
export const statusBadge = (s) => STATUSES.find((x) => x.value === s)?.badge || "badge";
export const kes = (n) => (n === null || n === undefined || n === "" ? "-" : "KES " + Number(n).toLocaleString("en-KE"));
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-");
export const itemCount = (r) => (r.days || []).reduce((n, d) => n + (d.items || []).length, 0) + (r.ideas || []).length;
