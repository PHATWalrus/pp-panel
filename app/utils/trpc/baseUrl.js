export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  const deploymentUrl = process.env.VERCEL_URL;
  if (deploymentUrl) return `https://${deploymentUrl}`;
  return "http://localhost:3000";
}
