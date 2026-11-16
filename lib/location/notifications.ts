export type BrowserNotificationPermission =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export type NotificationPromptStatus =
  | "granted"
  | "denied"
  | "ask"
  | "unsupported";

export type NotificationMessageCode =
  | "granted"
  | "denied"
  | "unsupported"
  | "ask";

export function notificationPrompt(permission: BrowserNotificationPermission): {
  status: NotificationPromptStatus;
  code: NotificationMessageCode;
} {
  if (permission === "granted") {
    return { status: "granted", code: "granted" };
  }
  if (permission === "denied") {
    return { status: "denied", code: "denied" };
  }
  if (permission === "unsupported") {
    return { status: "unsupported", code: "unsupported" };
  }
  return { status: "ask", code: "ask" };
}