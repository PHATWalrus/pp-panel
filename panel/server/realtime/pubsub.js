// No-op pubsub for panel standalone mode (real-time handled by main site when both run)
export function publishTargetEvent() {}
export function subscribeTargetEvent() {
  return () => {};
}
export function targetTopic(targetId, channel) {
  return `target:${targetId}:${channel}`;
}
