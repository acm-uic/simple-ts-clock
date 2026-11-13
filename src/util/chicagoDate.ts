const format = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-11-09" for a moment in Chicago; text in this form compares correctly
export const chicagoDate = (when: Date = new Date()): string => format.format(when);
