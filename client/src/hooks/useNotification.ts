import { useState, useEffect, useCallback } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

interface ReminderTask {
  taskId: number;
  title: string;
  reminderAt: Date | string;
}

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission as NotificationPermission);

    // Service Worker登録
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistration(reg);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result === "granted";
  }, []);

  const scheduleReminder = useCallback(
    (task: ReminderTask) => {
      if (!swRegistration?.active) return;
      swRegistration.active.postMessage({
        type: "SCHEDULE_REMINDER",
        taskId: task.taskId,
        title: task.title,
        reminderAt: new Date(task.reminderAt).toISOString(),
      });
    },
    [swRegistration]
  );

  const cancelReminder = useCallback(
    (taskId: number) => {
      if (!swRegistration?.active) return;
      swRegistration.active.postMessage({
        type: "CANCEL_REMINDER",
        taskId,
      });
    },
    [swRegistration]
  );

  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  return {
    isSupported,
    permission,
    requestPermission,
    scheduleReminder,
    cancelReminder,
  };
}
