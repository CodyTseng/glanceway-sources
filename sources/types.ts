/**
 * Glanceway Source API
 *
 * The main API object passed to your source function.
 */
export interface GlancewayAPI {
  /** Send information items to Glanceway for display */
  emit(items: InfoItem[]): void;

  /** Make HTTP requests */
  fetch<T>(url: string, options?: FetchOptions): Promise<FetchResponse<T>>;

  /** Log messages for debugging */
  log(level: "info" | "error" | "warn" | "debug", message: string): void;

  /** Persistent key-value storage */
  storage: StorageAPI;

  /** Access user-configured values */
  config: ConfigAPI;

  /** Create WebSocket connections */
  websocket: WebSocketAPI;
}

/**
 * Information item displayed in Glanceway
 */
export interface InfoItem {
  /** Unique identifier for the item */
  id: string;

  /** Main display text */
  title: string;

  /** Secondary text below the title */
  subtitle?: string;

  /** Link opened when item is clicked */
  url?: string;

  /** Time associated with the item (ISO string, Unix timestamp, or Date) */
  timestamp?: Date | string | number;
}

/**
 * HTTP request options
 */
export interface FetchOptions {
  /** HTTP method (default: GET) */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body (for POST/PUT) */
  body?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * HTTP response
 */
export interface FetchResponse<T> {
  /** True if status code is 200-299 */
  ok: boolean;

  /** HTTP status code */
  status: number;

  /** Response headers */
  headers: Record<string, string>;

  /** Raw response body */
  text: string;

  /** Parsed JSON (if response is valid JSON) */
  json?: T;
}

/**
 * Persistent storage API
 *
 * Data persists between refreshes and app restarts.
 */
export interface StorageAPI {
  /** Get a stored value */
  get(key: string): unknown;

  /** Store a value */
  set(key: string, value: unknown): void;
}

/**
 * Configuration API
 *
 * Access user-configured values defined in manifest.yaml.
 */
export interface ConfigAPI {
  /** Get a config value by key */
  get(key: string): string | undefined;

  /** Get all config values */
  getAll(): Record<string, string>;
}

/**
 * WebSocket API for real-time connections
 */
export interface WebSocketAPI {
  /** Connect to a WebSocket server */
  connect(
    url: string,
    callbacks: WebSocketCallbacks,
  ): Promise<WebSocketConnection>;
}

/**
 * WebSocket event callbacks
 */
export interface WebSocketCallbacks {
  /** Called when connection is established */
  onConnect?: (ws: WebSocketConnection) => void;

  /** Called when a message is received */
  onMessage?: (data: string) => void;

  /** Called when an error occurs */
  onError?: (error: string) => void;

  /** Called when connection is closed */
  onClose?: (code: number) => void;
}

/**
 * WebSocket connection
 */
export interface WebSocketConnection {
  /** Send a message */
  send(message: string): Promise<void>;

  /** Close the connection */
  close(): void;
}

/**
 * Source methods returned by your source function
 */
export interface SourceMethods {
  /** Called on startup and periodically based on user settings */
  refresh?: () => Promise<void> | void;

  /** Called when source is stopped (for cleanup) */
  stop?: () => Promise<void> | void;
}
