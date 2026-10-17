// Civil dates, never elapsed milliseconds: DST does not shorten a learning day.
export function localDay(t = Date.now(), timezone = "America/New_York") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(t));
}
export function shiftDay(day, amount) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
export function dayDistance(a, b) {
  return Math.round(
    (Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000,
  );
}
export function validMonth(month) {
  return (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) &&
    Number(month.slice(0, 4)) >= 2000 &&
    Number(month.slice(0, 4)) <= 2200
  );
}
