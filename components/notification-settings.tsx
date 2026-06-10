"use client"

import { useState, useEffect } from "react"
import { Settings, Clock, AlertTriangle, Calendar } from "lucide-react"

interface NotificationSettingsProps {
  user: any
  onSettingsChange?: (settings: NotificationPreferences) => void
}

interface NotificationPreferences {
  conflicts: boolean
  reminders: boolean
  reminderMinutes: number
  dailySummary: boolean
}

export default function NotificationSettings({ user, onSettingsChange }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    conflicts: true,
    reminders: true,
    reminderMinutes: 15,
    dailySummary: false,
  })

  useEffect(() => {
    if (user) {
      const savedPrefs = localStorage.getItem(`notification-prefs-${user.uid}`)
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs)
          setPreferences(parsed)
        } catch (error) {
          console.error("[v0] Error loading notification preferences:", error)
        }
      }
    }
  }, [user])

  const updatePreferences = (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)

    if (user) {
      localStorage.setItem(`notification-prefs-${user.uid}`, JSON.stringify(updated))
    }

    if (onSettingsChange) {
      onSettingsChange(updated)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="Configurações de notificação"
      >
        <Settings size={16} />
        <span className="text-sm font-medium">Configurações</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Settings className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Configurações de Notificação
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Conflitos de Horário</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receber alertas quando conflitos forem detectados
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.conflicts}
                      onChange={(e) => updatePreferences({ conflicts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Lembretes de Reserva</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receber lembretes antes das suas reservas
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.reminders}
                      onChange={(e) => updatePreferences({ reminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {preferences.reminders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lembrar com antecedência de:
                    </label>
                    <select
                      value={preferences.reminderMinutes}
                      onChange={(e) => updatePreferences({ reminderMinutes: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Resumo Diário</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receber um resumo das suas reservas do dia
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.dailySummary}
                      onChange={(e) => updatePreferences({ dailySummary: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
