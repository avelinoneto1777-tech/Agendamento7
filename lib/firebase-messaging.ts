import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"
import { initializeApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyAh1UHya83-uANm6RYmOt-Fk885WIJTe0U",
  authDomain: "agendamento-de-ambientes.firebaseapp.com",
  projectId: "agendamento-de-ambientes",
  storageBucket: "agendamento-de-ambientes.firebasestorage.app",
  messagingSenderId: "436747247500",
  appId: "1:436747247500:web:d9438aab4b29c3d8f900a9",
}

let messaging: Messaging | null = null

export const initializeMessaging = () => {
  if (typeof window !== "undefined") {
    const app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
    return messaging
  }
  return null
}

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      console.log("[v0] Notification permission granted")

      if (!messaging) {
        messaging = initializeMessaging()
      }

      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: "BKxvxhk6f0JTzuykaDTfFJ-WouQhdAOJ8Pt-9gEWEjzFfYp7AzBvJWQUYaByabyabyabyabyabyabyabyabyabyabya", // Substitua pela sua VAPID key
        })
        console.log("[v0] FCM Token:", token)
        return token
      }
    } else {
      console.log("[v0] Notification permission denied")
    }
  } catch (error) {
    console.error("[v0] Error requesting notification permission:", error)
  }
  return null
}

export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("[v0] Message received:", payload)
        resolve(payload)
      })
    }
  })
}

// Função para detectar conflitos de horário
export const detectScheduleConflicts = (
  newReservation: {
    recursoId: string
    data: string
    horario: string
    tipo: "ambiente" | "equipamento"
  },
  existingReservations: Array<{
    recursoId: string
    data: string
    horario: string
    professor: string
    usuarioNome: string
  }>,
): Array<{
  conflictType: "same_resource" | "professor_conflict"
  message: string
  conflictingReservation: any
}> => {
  const conflicts = []

  // Verificar conflitos no mesmo recurso
  const sameResourceConflicts = existingReservations.filter(
    (reservation) =>
      reservation.recursoId === newReservation.recursoId &&
      reservation.data === newReservation.data &&
      reservation.horario === newReservation.horario,
  )

  sameResourceConflicts.forEach((conflict) => {
    conflicts.push({
      conflictType: "same_resource" as const,
      message: `Conflito detectado: ${newReservation.tipo} já reservado por ${conflict.usuarioNome} no horário ${conflict.horario}`,
      conflictingReservation: conflict,
    })
  })

  return conflicts
}

// Função para calcular tempo até a reserva
export const getTimeUntilReservation = (data: string, horario: string): number => {
  const [startTime] = horario.split(" - ")
  const [hours, minutes] = startTime.split(":").map(Number)

  const reservationDate = new Date(data)
  reservationDate.setHours(hours, minutes, 0, 0)

  const now = new Date()
  return reservationDate.getTime() - now.getTime()
}

// Função para enviar notificação local
export const sendLocalNotification = (title: string, body: string, icon?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/icons/icon-192x192.jpg",
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
    })
  }
}
