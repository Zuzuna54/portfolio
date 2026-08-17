/**
 * `YYYY-MM` → `"October 2025"`.
 *
 * Parsed by hand rather than through `new Date("2025-10")`. That string is
 * treated as UTC midnight, and rendering it in a timezone behind UTC shifts it
 * back a day — which, on the first of a month, silently prints the *previous*
 * month. A blog post filed under September because the reader is in Los Angeles
 * is the kind of bug that survives every test written in UTC.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(worked: string): string {
  const [y, m] = worked.split("-");
  const i = Number(m) - 1;
  const name = MONTHS[i];
  // Fall back to the raw value rather than printing "undefined 2025" if a post
  // ever ships a malformed `worked`.
  return name ? `${name} ${y}` : worked;
}
