import { cached } from "./cached";
import { fetchJson } from "./fetchJson";
import { getNws, WEATHER_LAT_LONG } from "./getWeather";
import type { CtaAlert, CtaAlerts, GithubEvent, NwsAlerts, TickerItem, TickerLevel } from "./tickerTypes";

// Routes near UIC with CTA alerts worth showing (bus route numbers and train lines)
const CTA_ROUTES = ["Blue", "7", "8", "12", "60", "157"];
const GITHUB_ORGS = ["acm-uic"];
const GITHUB_MAX_AGE_DAYS = 7;
const GITHUB_MAX_ITEMS = 4; // leave room for CTA alerts, which are often older
const MAX_ITEMS = 10;

const LEVEL_RANK: Record<TickerLevel, number> = { severe: 0, warning: 1, info: 2 };

async function fetchNwsAlerts(): Promise<TickerItem[]> {
  const data = await getNws<NwsAlerts>(`https://api.weather.gov/alerts/active?point=${WEATHER_LAT_LONG}`);
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
  const { Alert, ErrorCode, ErrorMessage } = (await fetchJson<CtaAlerts>(url, "CTA alerts")).CTAAlerts;
  if (ErrorCode && ErrorCode !== "0") throw new Error(`CTA alerts error ${ErrorCode}: ${ErrorMessage}`);
  const alerts = Alert === undefined ? [] : Array.isArray(Alert) ? Alert : [Alert];
  return alerts.map((a) => ({
    source: "cta",
    level: ctaLevel(a),
    text: `${a.Headline}: ${a.ShortDescription.trim()}`,
    time: Date.parse(a.EventStart ?? "") || 0,
  }));
}

// One readable line per event, or undefined to skip it
function describeEvent(e: GithubEvent): string | undefined {
  const who = e.actor.login;
  const repo = e.repo.name.split("/")[1] ?? e.repo.name; // "acm-uic/simple-ts-clock" → "simple-ts-clock"
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
    GITHUB_ORGS.map((org) =>
      fetchJson<GithubEvent[]>(
        `https://api.github.com/orgs/${org}/events?per_page=50`,
        `GitHub events (${org})`,
        headers,
      ),
    ),
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

const sources = [cached(fetchNwsAlerts, 5), cached(fetchCtaAlerts, 5), cached(fetchGithubEvents, 10)];

async function getMessages(): Promise<TickerItem[]> {
  // Each source fails on its own (cached() logs it): a failed one contributes nothing
  const results = await Promise.allSettled(sources.map((get) => get()));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Keep the first of any duplicates (same source and text), then severe first, newest first
  const same = (a: TickerItem, b: TickerItem) => a.source === b.source && a.text === b.text;
  return items
    .filter((item, n) => items.findIndex((other) => same(item, other)) === n)
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.time - a.time)
    .slice(0, MAX_ITEMS);
}

export default getMessages;
