"use client"

import { useState } from "react"
import { AlertTriangle, X, Eye } from "lucide-react"

interface ConflictAlertProps {
  conflicts: Array<{
    conflictType: "same_resource" | "professor_conflict"
    message: string
    conflictingReservation: any
  }>
  onDismiss: () => void
}

export default function ConflictAlert({ conflicts, onDismiss }: ConflictAlertProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (conflicts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-amber-50 dark:bg-amber-900 border-l-4 border-amber-400 p-4 rounded-lg shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {conflicts.length === 1 ? "Conflito Detectado" : `${conflicts.length} Conflitos Detectados`}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {conflicts.length === 1
                  ? "Foi detectado um conflito de horário em suas reservas."
                  : "Foram detectados múltiplos conflitos de horário."}
              </p>

              {showDetails && (
                <div className="mt-3 space-y-2">
                  {conflicts.map((conflict, index) => (
                    <div
                      key={index}
                      className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-800 p-2 rounded"
                    >
                      {conflict.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-1 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  <Eye size={12} />
                  <span>{showDetails ? "Ocultar" : "Ver"} Detalhes</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
