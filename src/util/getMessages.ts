import dotenv from "dotenv";
import { cached } from "./cached";
import { getJson } from "./getWeather";
import type { CtaAlert, CtaAlerts, GithubEvent, NwsAlerts, TickerItem, TickerLevel } from "./tickerTypes";

dotenv.config();

// Routes near UIC with CTA alerts worth showing (bus route numbers and train lines)
const CTA_ROUTES = ["Blue", "7", "8", "12", "60", "157"];
const GITHUB_ORGS = ["acm-uic"];
const GITHUB_MAX_AGE_DAYS = 7;
const GITHUB_MAX_ITEMS = 4; // leave room for CTA alerts, which are often older
const MAX_ITEMS = 10;

const LEVEL_RANK: Record<TickerLevel, number> = { severe: 0, warning: 1, info: 2 };

// "41.8658728,-87.6482463" → "41.8659,-87.6482" (NWS allows 4 decimals)
function roundLatLong(latLong: string): string {
  return latLong
    .split(",")
    .map((x) => Number(x).toFixed(4))
    .join(",");
}

async function fetchNwsAlerts(latLong: string): Promise<TickerItem[]> {
  const data = await getJson<NwsAlerts>(`https://api.weather.gov/alerts/active?point=${roundLatLong(latLong)}`);
  return data.features.map(({ properties: p }) => ({
    source: "weather",
    level:
      p.severity === "Extreme" || p.severity === "Severe" ? "severe" : p.severity === "Moderate" ? "warning" : "info",
    text: p.headline ?? p.event,
    time: Date.parse(p.sent) || 0,
  }));
}

function ctaLevel(a: CtaAlert): TickerLevel {
  const score = Number(a.SeverityScore);
  if (a.MajorAlert === "1" || score >= 70) return "severe";
  return score >= 40 ? "warning" : "info";
}

async function fetchCtaAlerts(): Promise<TickerItem[]> {
  // The Customer Alerts API needs no key
  const url = `https://lapi.transitchicago.com/api/1.0/alerts.aspx?activeonly=true&routeid=${CTA_ROUTES.join(",")}&outputType=JSON`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`CTA alerts HTTP ${res.status}`);
  const data = (await res.json()) as CtaAlerts;
  const { Alert, ErrorCode, ErrorMessage } = data.CTAAlerts;
  if (ErrorCode && ErrorCode !== "0") throw new Error(`CTA alerts error ${ErrorCode}: ${ErrorMessage}`);
  const alerts = Alert === undefined ? [] : Array.isArray(Alert) ? Alert : [Alert];
  return alerts.map((a) => ({
    source: "cta",
    level: ctaLevel(a),
    text: `${a.Headline}: ${a.ShortDescription.trim()}`,
    time: Date.parse(a.EventStart ?? "") || 0,
  }));
}

function shortRepo(name: string): string {
  return name.split("/")[1] ?? name;
}

// One readable line per event, or undefined to skip it
function describeEvent(e: GithubEvent): string | undefined {
  const who = e.actor.login;
  const repo = shortRepo(e.repo.name);
  const p = e.payload;
  switch (e.type) {
    case "PushEvent":
      return `${who} pushed to ${repo}`;
    case "PullRequestEvent":
      if (p.action === "opened") return `${who} opened PR #${p.number} in ${repo}`;
      if (p.action === "merged") return `PR #${p.number} merged in ${repo}`;
      return undefined;
    case "ReleaseEvent":
      return p.release?.tag_name ? `${repo} released ${p.release.tag_name}` : `New release of ${repo}`;
    default:
      return undefined;
  }
}

async function fetchGithubEvents(): Promise<TickerItem[]> {
  const headers: Record<string, string> = {
    "User-Agent": "acm-uic-simple-ts-clock",
    Accept: "application/vnd.github+json",
  };
  // Optional: without a token, GitHub allows 60 requests/hour per IP (shared on campus)
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const cutoff = Date.now() - GITHUB_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const lists = await Promise.all(
    GITHUB_ORGS.map(async (org) => {
      const res = await fetch(`https://api.github.com/orgs/${org}/events?per_page=50`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`GitHub events HTTP ${res.status} for ${org}`);
      return (await res.json()) as GithubEvent[];
    }),
  );

  const items: TickerItem[] = [];
  for (const e of lists.flat()) {
    if (e.actor.login.endsWith("[bot]")) continue; // dependabot, upptime, ...
    const time = Date.parse(e.created_at);
    if (time < cutoff) continue;
    const text = describeEvent(e);
    if (text) items.push({ source: "github", level: "info", text, time });
  }
  items.sort((a, b) => b.time - a.time);
  return items.slice(0, GITHUB_MAX_ITEMS);
}

const cachedCta = cached(fetchCtaAlerts, 5);
const cachedGithub = cached(fetchGithubEvents, 10);
let cachedNws: (() => Promise<TickerItem[]>) | undefined;

async function getMessages(weatherLatLong: string): Promise<TickerItem[]> {
  cachedNws ??= cached(() => fetchNwsAlerts(weatherLatLong), 5);

  // Each source fails on its own: a failed one contributes nothing
  const results = await Promise.allSettled([
    weatherLatLong ? cachedNws() : Promise.resolve([]),
    cachedCta(),
    cachedGithub(),
  ]);
  const items: TickerItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
    else console.error("Ticker source failed:", r.reason);
  }

  // Drop duplicates (same source and text), then severe first, newest first
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    const key = `${i.source}|${i.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.time - a.time);
  return unique.slice(0, MAX_ITEMS);
}

export default getMessages;
