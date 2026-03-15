/** Shared date/time formatters. All times GMT+0, 12hr. */

const GMT = "UTC";

export function formatDate(
  dateStr: string,
  style: "short" | "long" | "MMM d" = "MMM d",
): string {
  const d = new Date(dateStr);
  if (style === "MMM d") {
    return d.toLocaleDateString("en-GB", {
      timeZone: GMT,
      month: "short",
      day: "numeric",
    });
  }
  if (style === "long") {
    return d.toLocaleDateString("en-GB", {
      timeZone: GMT,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-GB", {
    timeZone: GMT,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Date + time in GMT, 12hr e.g. "Mar 14, 2:30 pm" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    timeZone: GMT,
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    timeZone: GMT,
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

/** Human-readable market type label from backend value. */
export function formatMarketLabel(marketType: string): string {
  const raw = (marketType ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "btts") return "BTTS";
  if (raw === "1x2") return "1X2";
  const overUnder = /^over_under_(\d+(?:\.\d+)?)$/.exec(raw);
  if (overUnder) return `Over/under ${overUnder[1]}`;
  return raw
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Human-readable pick value; pass marketType for context (e.g. over_under_2_5 + "over" → "Over 2.5"). */
export function formatPickLabel(
  marketType: string,
  predictedValue: string,
): string {
  const type = (marketType ?? "").trim().toLowerCase();
  const val = (predictedValue ?? "").trim().toLowerCase();
  if (type === "1x2") {
    if (val === "1") return "Home";
    if (val === "2") return "Away";
    if (val === "x") return "Draw";
  }
  const overUnder = /^over_under_(\d+(?:\.\d+)?)$/.exec(type);
  if (overUnder) {
    const num = overUnder[1];
    if (val === "over") return `Over ${num}`;
    if (val === "under") return `Under ${num}`;
  }
  if (type === "btts") {
    if (val === "yes") return "Yes";
    if (val === "no") return "No";
  }
  if (val.length > 0) {
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
  return predictedValue || "";
}

/** Ordinal for table position e.g. 1 → "1st", 2 → "2nd", 3 → "3rd" */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Single line for "market · pick" e.g. "1X2 · Home" or "Over/under 2.5 · Over 2.5" */
export function formatMarketAndPick(
  marketType: string,
  predictedValue: string,
): string {
  const market = formatMarketLabel(marketType);
  const pick = formatPickLabel(marketType, predictedValue);
  if (!market && !pick) return "";
  if (!pick) return market;
  return `${market} · ${pick}`;
}
