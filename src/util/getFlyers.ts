import dotenv from "dotenv";
import { cached } from "./cached";
import type { Flyer } from "./flyerTypes";

dotenv.config();

// The public Drive folder officers drop flyers into. The server decides the
// folder (not the query string), so the key can't be pointed at other folders.
const FLYERS_FOLDER_ID = "1P5ww7kSd9eH6Cc_kTazQcaO-fGglCUgy";
const MAX_BYTES = 15 * 1024 * 1024; // skip huge files; they'd load slowly on the clock
// Browsers can't show HEIC, so only these
const SHOWABLE = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface DriveFile extends Flyer {
  size?: string;
}

// "2026-11-09" in Chicago; text in this form compares correctly
const chicagoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// A flyer named "11-11-26 Talk.png" or "2026-11-11 Talk.png" expires after that day.
// Gives back "2026-11-11", or undefined when the name doesn't start with a date.
function dateFromName(name: string): string | undefined {
  const us = name.match(/^(\d{2})-(\d{2})-(\d{2})\b/); // MM-DD-YY
  if (us) return `20${us[3]}-${us[1]}-${us[2]}`;
  const iso = name.match(/^(\d{4})-(\d{2})-(\d{2})\b/); // YYYY-MM-DD
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return undefined;
}

function driveUrl(path: string, params: Record<string, string>): URL {
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  url.search = new URLSearchParams({
    ...params,
    key: process.env.GOOGLE_API_KEY ?? "",
    // The folder is in a Shared Drive; without these, Drive lists nothing
    supportsAllDrives: "true",
  }).toString();
  return url;
}

async function fetchFlyerList(): Promise<Flyer[]> {
  const url = driveUrl("files", {
    q: `'${FLYERS_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`,
    fields: "files(id,name,mimeType,size)",
    includeItemsFromAllDrives: "true",
    orderBy: "name",
    pageSize: "100",
  });
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  // Never log the URL: it contains the API key
  if (!res.ok) throw new Error(`Google Drive list HTTP ${res.status}`);
  const data = (await res.json()) as { files?: DriveFile[] };

  const today = chicagoDate.format(new Date());
  return (data.files ?? [])
    .filter((f) => SHOWABLE.includes(f.mimeType))
    .filter((f) => Number(f.size ?? 0) <= MAX_BYTES)
    .filter((f) => {
      const date = dateFromName(f.name);
      return date === undefined || date >= today; // shown through its date
    })
    .map(({ id, name, mimeType }) => ({ id, name, mimeType }));
}

const cachedList = cached(fetchFlyerList, 5);

export async function listFlyers(): Promise<Flyer[]> {
  if (!process.env.GOOGLE_API_KEY) return []; // no key yet: the panel hides itself
  return cachedList();
}

// The image bytes for one flyer, or undefined if it isn't in the current list
export async function getFlyerImage(id: string): Promise<{ bytes: Buffer; mimeType: string } | undefined> {
  const flyer = (await listFlyers()).find((f) => f.id === id);
  if (!flyer) return undefined; // only files in the folder, so the key can't fetch others

  const res = await fetch(driveUrl(`files/${encodeURIComponent(id)}`, { alt: "media" }), {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Google Drive download HTTP ${res.status} for ${flyer.name}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), mimeType: flyer.mimeType };
}
