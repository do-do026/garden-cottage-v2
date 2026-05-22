/// <reference types="vite/client" />

/** Vite environment variables available via import.meta.env */
interface ImportMetaEnv {
  /** Base URL for REST API requests */
  readonly VITE_API_URL: string;
  /** WebSocket / Socket.IO server URL */
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
