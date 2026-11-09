// Text from outside sources (calendar titles, GitHub usernames, alert text) must be
// escaped before it goes into innerHTML, or it could inject HTML into the page.
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
