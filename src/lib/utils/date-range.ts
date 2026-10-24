import dayjs from "dayjs";

export const DATE_PRESETS = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  lastMonth: "Last month",
  last30: "Last 30 days",
  year: "This year",
  custom: "Custom range…",
} as const;
export type DatePreset = keyof typeof DATE_PRESETS;

/** Inclusive YYYY-MM-DD bounds for a preset (undefined = open-ended). */
export function dateRange(preset: DatePreset, from: string, to: string): { startDate?: string; endDate?: string } {
  const f = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");
  const now = dayjs();
  switch (preset) {
    case "today":
      return { startDate: f(now), endDate: f(now) };
    case "week":
      return { startDate: f(now.startOf("week")), endDate: f(now) };
    case "month":
      return { startDate: f(now.startOf("month")), endDate: f(now) };
    case "lastMonth": {
      const m = now.subtract(1, "month");
      return { startDate: f(m.startOf("month")), endDate: f(m.endOf("month")) };
    }
    case "last30":
      return { startDate: f(now.subtract(29, "day")), endDate: f(now) };
    case "year":
      return { startDate: f(now.startOf("year")), endDate: f(now) };
    case "custom":
      return { startDate: from || undefined, endDate: to || undefined };
    default:
      return {};
  }
}
