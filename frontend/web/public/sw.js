// Web push service worker — receives pushes from iam-service (VAPID) and
// shows them as OS notifications.
self.addEventListener("push", (event) => {
	let data = {};
	try {
		data = event.data ? event.data.json() : {};
	} catch {
		data = { body: event.data ? event.data.text() : "" };
	}
	const title = data.title || "S.M.I.L.E";
	event.waitUntil(
		self.registration.showNotification(title, {
			body: data.body || "",
			icon: "/favicon.ico",
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clients) => {
				const existing = clients.find((client) => "focus" in client);
				if (existing) return existing.focus();
				return self.clients.openWindow("/");
			}),
	);
});
