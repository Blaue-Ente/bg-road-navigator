export type BrowserNotificationPermission =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function notificationPrompt(permission: BrowserNotificationPermission): {
  status: "granted" | "denied" | "ask" | "unsupported";
  text: string;
} {
  if (permission === "granted") {
    return { status: "granted", text: "Известията са разрешени" };
  }
  if (permission === "denied") {
    return {
      status: "denied",
      text: "Известията са блокирани. Разрешете ги от настройките на браузъра за този сайт.",
    };
  }
  if (permission === "unsupported") {
    return {
      status: "unsupported",
      text: "Този браузър не поддържа известия.",
    };
  }
  return { status: "ask", text: "Разреши известия на устройството" };
}
