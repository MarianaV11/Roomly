export const BASE_URL = process.env.NEXT_PUBLIC_BASEURL ?? "http://localhost:9000";

export const WS_BASE_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? BASE_URL.replace(/^http/, "ws");
