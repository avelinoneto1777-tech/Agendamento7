import { sendLocalNotification } from "./firebase-messaging"

export interface NotificationPreferences {
  conflicts: boolean
  reminders: boolean
  reminderMinutes: number
  dailySummary: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private preferences: NotificationPreferences = {
    conflicts: true,
    reminders: true,
    reminderMinutes: 15,
    dailySummary: false,
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  updatePreferences(prefs: NotificationPreferences) {
    this.preferences = { ...prefs }
    console.log("[v0] Notification preferences updated:", this.preferences)
  }

  sendConflictNotification(conflictMessage: string) {
    if (this.preferences.conflicts) {
      sendLocalNotification("⚠️ Conflito de Horário Detectado", conflictMessage, "/icons/icon-192x192.jpg")
    }
  }

  sendReminderNotification(reservationDetails: string) {
    if (this.preferences.reminders) {
      sendLocalNotification(
        "🔔 Lembrete de Reserva",
        `Sua reserva ${reservationDetails} começará em ${this.preferences.reminderMinutes} minutos`,
        "/icons/icon-192x192.jpg",
      )
    }
  }

  sendReservationStartNotification(reservationDetails: string) {
    if (this.preferences.reminders) {
      sendLocalNotification(
        "🎯 Reserva Iniciada",
        `Sua reserva ${reservationDetails} está começando agora!`,
        "/icons/icon-192x192.jpg",
      )
    }
  }

  sendDailySummary(reservations: Array<{ nomeRecurso: string; horario: string }>) {
    if (this.preferences.dailySummary && reservations.length > 0) {
      const summary =
        reservations.length === 1
          ? `Você tem 1 reserva hoje: ${reservations[0].nomeRecurso} às ${reservations[0].horario}`
          : `Você tem ${reservations.length} reservas hoje. Primeira: ${reservations[0].nomeRecurso} às ${reservations[0].horario}`

      sendLocalNotification("📅 Resumo do Dia", summary, "/icons/icon-192x192.jpg")
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }
}

export const notificationService = NotificationService.getInstance()
