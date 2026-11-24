// Without NEXT_PUBLIC_BASEURL the backend is assumed on the same host as the page, port
// 9000: works from localhost and from a phone opening http://<computer IP>:3001.
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASEURL ??
  (typeof window === "undefined"
    ? "http://localhost:9000"
    : `${window.location.protocol}//${window.location.hostname}:9000`);

export const WS_BASE_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? BASE_URL.replace(/^http/, "ws");

// JSON list of RTCIceServer. Add a TURN server for people behind strict NATs/firewalls.
export const ICE_SERVERS: RTCIceServer[] = process.env.NEXT_PUBLIC_ICE_SERVERS
  ? JSON.parse(process.env.NEXT_PUBLIC_ICE_SERVERS)
  : [{ urls: "stun:stun.l.google.com:19302" }];
