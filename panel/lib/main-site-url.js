export const PANEL_MAIN_SITE_URL_KEY = "panel.mainSiteUrl";
export const PANEL_MAIN_SITE_URL_EVENT = "panel-main-site-url-changed";

export function getPanelMainSiteUrl() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PANEL_MAIN_SITE_URL_KEY) || "";
}

export function setPanelMainSiteUrl(value) {
  if (typeof window === "undefined") return;
  const cleaned = String(value || "").trim();
  if (cleaned) {
    window.localStorage.setItem(PANEL_MAIN_SITE_URL_KEY, cleaned);
  } else {
    window.localStorage.removeItem(PANEL_MAIN_SITE_URL_KEY);
  }
  window.dispatchEvent(new CustomEvent(PANEL_MAIN_SITE_URL_EVENT));
}
