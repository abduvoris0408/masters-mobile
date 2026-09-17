import i18n from "@/lib/i18n/i18n";
import dayjs from "dayjs";
import "dayjs/locale/uz-latn";
import "dayjs/locale/ru";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

// dayjs's "uz" locale is Cyrillic Uzbek, but the rest of the app uses Latin
// Uzbek — "uz-latn" is the locale that actually matches.
const toDayjsLocale = (lng: string) => (lng === "uz" ? "uz-latn" : lng);

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

// Same 2-3-2-2 grouping PhoneInput masks while typing, applied to already-
// stored numbers for display ("+998901234567" -> "+998 90 123 45 67").
// Anything that isn't a 998-prefixed 12-digit number is returned unchanged
// rather than mangled.
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return "";
  const match = phone.replace(/\D/g, "").match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;
  const [, op, a, b, c] = match;
  return `+998 ${op} ${a} ${b} ${c}`;
};

export const formatDate = (date: string, locale = i18n.language) =>
  dayjs(date).locale(toDayjsLocale(locale)).format("DD MMM YYYY");

// A work period picked as a single day ends up with `date_from === date_to`
// — showing that as "22 Avg 2026 – 22 Avg 2026" reads like a bug, so collapse
// it to the one date instead of a same-to-same range.
export const formatDateRange = (from: string, to: string, locale = i18n.language) =>
  dayjs(from).isSame(dayjs(to), "day")
    ? formatDate(from, locale)
    : `${formatDate(from, locale)} – ${formatDate(to, locale)}`;

export const formatDateTime = (date: string, locale = i18n.language) =>
  dayjs(date).locale(toDayjsLocale(locale)).format("D/M/YYYY HH:mm");

// Chat day dividers read "Today, 20 Jun" / "Yesterday, 19 Jun" and fall back
// to the full date for anything older. Also doubles as the grouping key for
// consecutive same-day messages, since it's unique per calendar day.
export const formatRelativeDay = (
  date: string,
  todayLabel: string,
  yesterdayLabel: string,
  locale = i18n.language,
) => {
  const d = dayjs(date).locale(toDayjsLocale(locale));
  const now = dayjs();
  if (d.isSame(now, "day")) return `${todayLabel}, ${d.format("D MMM")}`;
  if (d.isSame(now.subtract(1, "day"), "day")) return `${yesterdayLabel}, ${d.format("D MMM")}`;
  return d.format("D MMM YYYY");
};

// Profile screen's tenure badge: "Yangi" the first month, then "N oy
// platformada" up to a year, then "N yil" — mirrors the web project's
// banner_new_on_platform/months/years keys.
export const formatTenure = (createdAt?: string): string => {
  if (!createdAt) return "Yangi";
  const months = dayjs().diff(dayjs(createdAt), "month");
  if (months < 1) return "Yangi";
  if (months < 12) return `${months} oy platformada`;
  const years = Math.floor(months / 12);
  return `${years} yil platformada`;
};

export const fromNow = (date: string, locale = i18n.language) =>
  dayjs(date).locale(toDayjsLocale(locale)).fromNow();

// Listing-card "posted at" line: today/yesterday get a clock time (the exact
// moment reads better than "3 soat oldin" once you already know it's
// today); anything from 2 days back onward just shows the plain calendar
// date instead of an ever-vaguer relative string.
export const formatPostedAt = (
  date: string,
  labels: {
    today: (time: string) => string;
    yesterday: (time: string) => string;
  },
  locale = i18n.language,
) => {
  const d = dayjs(date).locale(toDayjsLocale(locale));
  const now = dayjs();
  if (d.isSame(now, "day")) return labels.today(d.format("HH:mm"));
  if (d.isSame(now.subtract(1, "day"), "day")) return labels.yesterday(d.format("HH:mm"));
  return d.format("D MMM YYYY, HH:mm");
};
