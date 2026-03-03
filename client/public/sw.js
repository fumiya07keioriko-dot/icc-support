// ICC Support Staff - Service Worker for Task Reminders
const CACHE_NAME = "icc-support-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Push通知を受信したときの処理
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "ICCサポート", {
      body: data.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag || "icc-reminder",
      data: data,
    })
  );
});

// 通知クリック時の処理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/tasks");
      }
    })
  );
});

// メインスレッドからのメッセージ（リマインダースケジュール）
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_REMINDER") {
    const { taskId, title, reminderAt } = event.data;
    const delay = new Date(reminderAt).getTime() - Date.now();
    if (delay <= 0) return;

    setTimeout(() => {
      self.registration.showNotification("⏰ タスクリマインダー", {
        body: title,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `reminder-${taskId}`,
        data: { taskId },
      });
    }, delay);
  }

  if (event.data?.type === "CANCEL_REMINDER") {
    // タイムアウトのキャンセルは実装が複雑なため、通知が来ても閉じる
    self.registration.getNotifications({ tag: `reminder-${event.data.taskId}` }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});
