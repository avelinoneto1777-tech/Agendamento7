// Firebase Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

const firebase = self.firebase // Declare the firebase variable
const firebaseConfig = {
  apiKey: "AIzaSyAh1UHya83-uANm6RYmOt-Fk885WIJTe0U",
  authDomain: "agendamento-de-ambientes.firebaseapp.com",
  projectId: "agendamento-de-ambientes",
  storageBucket: "agendamento-de-ambientes.firebasestorage.app",
  messagingSenderId: "436747247500",
  appId: "1:436747247500:web:d9438aab4b29c3d8f900a9",
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload)

  const notificationTitle = payload.notification?.title || "EEMTI - Sistema de Reservas"
  const notificationOptions = {
    body: payload.notification?.body || "Nova notificação do sistema de reservas",
    icon: "/icons/icon-192x192.jpg",
    badge: "/icons/icon-72x72.jpg",
    tag: "school-reservation",
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "Ver Detalhes",
      },
      {
        action: "dismiss",
        title: "Dispensar",
      },
    ],
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.")

  event.notification.close()

  if (event.action === "view") {
    // Open the app when user clicks "Ver Detalhes"
    event.waitUntil(clients.openWindow("/"))
  }
  // For 'dismiss' action or default click, just close the notification
})
