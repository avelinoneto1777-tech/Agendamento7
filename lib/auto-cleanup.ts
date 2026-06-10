import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"

export interface CleanupResult {
  success: boolean
  deletedCount: number
  message: string
  error?: string
}

const CLEANUP_STORAGE_KEY = "last_cleanup_date"

/**
 * Verifica se uma reserva já passou (data e horário no passado)
 */
export function isReservationPast(reservationDate: string, reservationTime: string): boolean {
  try {
    const [year, month, day] = reservationDate.split("-").map(Number)
    const startTime = reservationTime.split(" - ")[0]
    const [hours, minutes] = startTime.split(":").map(Number)

    const reservationDateTime = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()

    return reservationDateTime < now
  } catch (error) {
    console.error("[v0] Error checking if reservation is past:", error)
    return false
  }
}

/**
 * Busca a data da última limpeza no localStorage
 */
export function getLastCleanupDate(): Date | null {
  try {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem(CLEANUP_STORAGE_KEY)
    return stored ? new Date(stored) : null
  } catch (error) {
    console.error("[v0] Error getting last cleanup date:", error)
    return null
  }
}

/**
 * Atualiza a data da última limpeza no localStorage
 */
export function updateLastCleanupDate(): void {
  try {
    if (typeof window === "undefined") return

    localStorage.setItem(CLEANUP_STORAGE_KEY, new Date().toISOString())
  } catch (error) {
    console.error("[v0] Error updating last cleanup date:", error)
  }
}

/**
 * Verifica se já passaram 10 dias desde a última limpeza
 */
export function shouldRunCleanup(): boolean {
  const lastCleanup = getLastCleanupDate()

  if (!lastCleanup) {
    return true
  }

  const now = new Date()
  const daysSinceLastCleanup = Math.floor((now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceLastCleanup >= 10
}

/**
 * Executa a limpeza de reservas antigas
 */
export async function cleanupOldReservations(db: any): Promise<CleanupResult> {
  try {
    let deletedCount = 0

    const ambientesSnapshot = await getDocs(collection(db, "reservas_ambientes"))
    const ambientesPromises = ambientesSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data()
      const id = docSnapshot.id

      if (isReservationPast(data.data, data.horario)) {
        await deleteDoc(doc(db, "reservas_ambientes", id))
        return true
      }

      return false
    })

    const equipamentosSnapshot = await getDocs(collection(db, "reservas_equipamentos"))
    const equipamentosPromises = equipamentosSnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data()
      const id = docSnapshot.id

      if (isReservationPast(data.data, data.horario)) {
        await deleteDoc(doc(db, "reservas_equipamentos", id))
        return true
      }

      return false
    })

    const ambientesResults = await Promise.all(ambientesPromises)
    const equipamentosResults = await Promise.all(equipamentosPromises)

    deletedCount = [...ambientesResults, ...equipamentosResults].filter(Boolean).length

    // Atualiza a data da última limpeza
    updateLastCleanupDate()

    return {
      success: true,
      deletedCount,
      message: `Limpeza concluída com sucesso! ${deletedCount} reserva(s) antiga(s) excluída(s).`,
    }
  } catch (error: any) {
    console.error("[v0] Error during cleanup:", error)
    return {
      success: false,
      deletedCount: 0,
      message: "Erro ao executar limpeza.",
      error: error.message,
    }
  }
}
