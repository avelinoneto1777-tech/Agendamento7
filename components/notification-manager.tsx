"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Settings } from "lucide-react"
import {
  requestNotificationPermission,
  onMessageListener,
  detectScheduleConflicts,
  getTimeUntilReservation,
  sendLocalNotification,
} from "../lib/firebase-messaging"

interface NotificationManagerProps {
  user: any
  reservas: Array<{
    id: string
    recursoId: string
    data: string
    horario: string
    professor: string
    usuarioNome: string
    tipo: "ambiente" | "equipamento"
    nomeRecurso: string
  }>
  onConflictDetected?: (conflicts: any[]) => void
}

export default function NotificationManager({ user, reservas, onConflictDetected }: NotificationManagerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [reminderTimers, setReminderTimers] = useState<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const initNotifications = async () => {
      if ("Notification" in window) {
        const permission = Notification.permission
        if (permission === "granted") {
          setNotificationsEnabled(true)
          const token = await requestNotificationPermission()
          setFcmToken(token)
        }
      }
    }

    initNotifications()

    // Listen for foreground messages
    onMessageListener()
      .then((payload: any) => {
        console.log("[v0] Foreground message received:", payload)
        sendLocalNotification(
          payload.notification?.title || "Sistema de Reservas",
          payload.notification?.body || "Nova notificação",
        )
      })
      .catch((err) => console.log("[v0] Failed to receive message:", err))
  }, [])

  useEffect(() => {
    if (!notificationsEnabled || !user) return

    // Clear existing timers
    reminderTimers.forEach((timer) => clearTimeout(timer))
    const newTimers = new Map()

    const userReservations = reservas.filter((r) => r.usuarioNome === user.displayName || r.usuarioNome === user.email)

    userReservations.forEach((reserva) => {
      const timeUntilReservation = getTimeUntilReservation(reserva.data, reserva.horario)

      // Set reminder for 15 minutes before
      const reminderTime = timeUntilReservation - 15 * 60 * 1000 // 15 minutes in milliseconds

      if (reminderTime > 0) {
        const timer = setTimeout(() => {
          sendLocalNotification(
            "🔔 Lembrete de Reserva",
            `Sua reserva de ${reserva.nomeRecurso} começará em 15 minutos (${reserva.horario})`,
            "/icons/icon-192x192.jpg",
          )
        }, reminderTime)

        newTimers.set(reserva.id, timer)
      }

      // Set notification for when reservation starts
      if (timeUntilReservation > 0) {
        const startTimer = setTimeout(() => {
          sendLocalNotification(
            "🎯 Reserva Iniciada",
            `Sua reserva de ${reserva.nomeRecurso} está começando agora! (${reserva.horario})`,
            "/icons/icon-192x192.jpg",
          )
        }, timeUntilReservation)

        newTimers.set(`${reserva.id}-start`, startTimer)
      }
    })

    setReminderTimers(newTimers)

    return () => {
      newTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [reservas, notificationsEnabled, user])

  useEffect(() => {
    if (!notificationsEnabled || reservas.length === 0) return

    // Check for conflicts in the current reservations
    const conflicts: any[] = []

    reservas.forEach((reserva, index) => {
      const otherReservations = reservas.slice(index + 1)
      const reservationConflicts = detectScheduleConflicts(
        {
          recursoId: reserva.recursoId,
          data: reserva.data,
          horario: reserva.horario,
          tipo: reserva.tipo,
        },
        otherReservations,
      )

      if (reservationConflicts.length > 0) {
        conflicts.push(...reservationConflicts)

        // Send notification about conflict
        sendLocalNotification(
          "⚠️ Conflito de Horário Detectado",
          `Conflito encontrado para ${reserva.nomeRecurso} no horário ${reserva.horario}`,
          "/icons/icon-192x192.jpg",
        )
      }
    })

    if (conflicts.length > 0 && onConflictDetected) {
      onConflictDetected(conflicts)
    }
  }, [reservas, notificationsEnabled, onConflictDetected])

  const handleEnableNotifications = async () => {
    try {
      const token = await requestNotificationPermission()
      if (token) {
        setFcmToken(token)
        setNotificationsEnabled(true)

        // Send test notification
        sendLocalNotification(
          "✅ Notificações Ativadas",
          "Você receberá lembretes sobre suas reservas e alertas de conflitos.",
          "/icons/icon-192x192.jpg",
        )
      }
    } catch (error) {
      console.error("[v0] Error enabling notifications:", error)
    }
  }

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false)
    setFcmToken(null)

    // Clear all timers
    reminderTimers.forEach((timer) => clearTimeout(timer))
    setReminderTimers(new Map())
  }

  return (
    <div className="flex items-center space-x-2">
      {notificationsEnabled ? (
        <button
          onClick={handleDisableNotifications}
          className="flex items-center space-x-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
          title="Desativar notificações"
        >
          <Bell size={16} />
          <span className="text-sm font-medium">Notificações Ativas</span>
        </button>
      ) : (
        <button
          onClick={handleEnableNotifications}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Ativar notificações"
        >
          <BellOff size={16} />
          <span className="text-sm font-medium">Ativar Notificações</span>
        </button>
      )}

      {fcmToken && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Settings size={12} />
          <span>FCM Conectado</span>
        </div>
      )}
    </div>
  )
}
