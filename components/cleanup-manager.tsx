"use client"

import { useState, useEffect } from "react"
import { Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { shouldRunCleanup, cleanupOldReservations, getLastCleanupDate, type CleanupResult } from "../lib/auto-cleanup"

interface CleanupManagerProps {
  db: any
  isAdmin: boolean
}

export default function CleanupManager({ db, isAdmin }: CleanupManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [autoCleanupChecked, setAutoCleanupChecked] = useState(false)

  useEffect(() => {
    if (!db || !isAdmin || autoCleanupChecked) return

    const checkAndRunAutoCleanup = async () => {
      try {
        const shouldRun = shouldRunCleanup()

        if (shouldRun) {
          console.log("[v0] Auto-cleanup: 10 days passed, running cleanup...")
          const result = await cleanupOldReservations(db)
          setCleanupResult(result)
        } else {
          console.log("[v0] Auto-cleanup: Not needed yet")
        }

        const currentLastCleanup = getLastCleanupDate()
        setLastCleanup(currentLastCleanup)
        setAutoCleanupChecked(true)
      } catch (error) {
        console.error("[v0] Error in auto-cleanup check:", error)
        setAutoCleanupChecked(true)
      }
    }

    checkAndRunAutoCleanup()
  }, [db, isAdmin, autoCleanupChecked])

  useEffect(() => {
    if (!isAdmin) return

    const date = getLastCleanupDate()
    setLastCleanup(date)
  }, [isAdmin])

  const handleManualCleanup = async () => {
    if (!db || isLoading) return

    setIsLoading(true)
    setCleanupResult(null)

    try {
      const result = await cleanupOldReservations(db)
      setCleanupResult(result)

      const newLastCleanup = getLastCleanupDate()
      setLastCleanup(newLastCleanup)
    } catch (error) {
      console.error("[v0] Error in manual cleanup:", error)
      setCleanupResult({
        success: false,
        deletedCount: 0,
        message: "Erro ao executar limpeza manual.",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca"
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getDaysSinceLastCleanup = () => {
    if (!lastCleanup) return null
    const now = new Date()
    const days = Math.floor((now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (!isAdmin) return null

  const daysSince = getDaysSinceLastCleanup()

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-purple-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Trash2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Limpeza Automática</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Última limpeza: {formatDate(lastCleanup)}
              {daysSince !== null && (
                <span className="ml-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  ({daysSince} {daysSince === 1 ? "dia" : "dias"} atrás)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualCleanup}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Limpando...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Limpar Agora
            </>
          )}
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>
          O sistema exclui automaticamente reservas antigas a cada 10 dias para economizar espaço no banco de dados.
        </p>
      </div>

      {cleanupResult && (
        <div
          className={`mt-4 p-4 rounded-lg border-l-4 transition-all duration-300 ${
            cleanupResult.success
              ? "bg-emerald-50 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-600"
              : "bg-rose-50 dark:bg-rose-900 border-rose-400 dark:border-rose-600"
          }`}
        >
          <div className="flex items-start gap-3">
            {cleanupResult.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  cleanupResult.success ? "text-emerald-700 dark:text-emerald-100" : "text-rose-700 dark:text-rose-100"
                }`}
              >
                {cleanupResult.message}
              </p>
              {cleanupResult.error && (
                <p className="text-sm text-rose-600 dark:text-rose-300 mt-1">Erro: {cleanupResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {daysSince !== null && daysSince >= 10 && !cleanupResult && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900 border-l-4 border-amber-400 dark:border-amber-600 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-100">
              Já passaram {daysSince} dias desde a última limpeza. Recomenda-se executar a limpeza.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
