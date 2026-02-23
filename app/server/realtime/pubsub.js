import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

export function publishTargetEvent(topic, payload) {
  emitter.emit(topic, payload);
}

export function subscribeTargetEvent(topic, callback) {
  emitter.on(topic, callback);
  return () => emitter.off(topic, callback);
}

export function targetTopic(targetId, channel) {
  return `target:${targetId}:${channel}`;
}
