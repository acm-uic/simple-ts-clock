export type TickerLevel = "severe" | "warning" | "info";

export interface TickerItem {
  source: "weather" | "cta" | "github";
  level: TickerLevel;
  text: string;
  time: number; // milliseconds since 1970, for newest-first sorting
}

// NWS: https://api.weather.gov/alerts/active?point=…
export interface NwsAlerts {
  features: {
    properties: {
      event: string; // "Winter Storm Warning"
      headline: string | null;
      severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
      sent: string;
    };
  }[];
}

// CTA Customer Alerts: Alert is a single object (not a list) when there's only one
export interface CtaAlert {
  Headline: string;
  ShortDescription: string;
  SeverityScore: string; // "37" for planned reroutes; higher is worse
  MajorAlert: string; // "1" or "0"
  EventStart: string | null;
}

export interface CtaAlerts {
  CTAAlerts: {
    ErrorCode: string | null;
    ErrorMessage: string | null;
    Alert?: CtaAlert | CtaAlert[];
  };
}

// GitHub org events. The API no longer includes PR titles or commit counts.
export interface GithubEvent {
  type: string; // "PushEvent", "PullRequestEvent", "ReleaseEvent", ...
  actor: { login: string };
  repo: { name: string }; // "acm-uic/simple-ts-clock"
  created_at: string;
  payload: {
    action?: string; // PullRequestEvent: "opened", "closed", "merged", ...
    number?: number;
    ref?: string; // PushEvent: "refs/heads/main"
    release?: { tag_name?: string };
  };
}
