function cleanBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

export function resolveMainSiteUrl(panelOverride, envUrl, localhostFallback = "http://localhost:3000") {
  return (
    cleanBaseUrl(panelOverride) ||
    cleanBaseUrl(envUrl) ||
    cleanBaseUrl(localhostFallback)
  );
}

export function buildTrpcUrl(baseUrl) {
  return `${cleanBaseUrl(baseUrl)}/api/trpc`;
}
