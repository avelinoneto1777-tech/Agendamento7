"use client"

import { User, Trash2 } from 'lucide-react'
import { format } from "date-fns"

interface ReservaComNomeRecurso {
  id: string
  tipo: "ambiente" | "equipamento"
  recursoId: string
  data: string
  horario: string
  turma?: string | null
  professor: string
  usuarioId: string
  usuarioNome: string
  criadoEm: string
  nomeRecurso: string
}

interface MinhasReservasProps {
  minhasReservas: ReservaComNomeRecurso[]
  loadingReservas: boolean
  excluirReserva: (id: string, tipo: "ambiente" | "equipamento", reservaUsuarioId?: string) => void
}

export default function MinhasReservas({ minhasReservas, loadingReservas, excluirReserva }: MinhasReservasProps) {
  return (
    <section className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center">
        <User className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Minhas Reservas
      </h2>
      {loadingReservas ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Carregando suas reservas...</p>
      ) : minhasReservas.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Você não tem nenhuma reserva registrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-600">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr className="text-left border-b-2 border-gray-300 dark:border-gray-700 bg-indigo-100 dark:bg-indigo-900">
                <th className="py-4 px-4 font-bold text-indigo-800 dark:text-indigo-200">Recurso</th>
                <th className="py-4 px-4 font-bold text-indigo-800 dark:text-indigo-200">Data</th>
                <th className="py-4 px-4 font-bold text-indigo-800 dark:text-indigo-200">Horário</th>
                <th className="py-4 px-4 font-bold text-indigo-800 dark:text-indigo-200">Professor</th>
                <th className="py-4 px-4 font-bold text-center text-indigo-800 dark:text-indigo-200">Ações</th>
              </tr>
            </thead>
            <tbody>
              {minhasReservas.map((reserva, index) => (
                <tr
                  key={reserva.id}
                  className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                    index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"
                  } hover:bg-indigo-50 dark:hover:bg-indigo-900`}
                >
                  <td className="py-3 px-4">{reserva.nomeRecurso}</td>
                  <td className="py-3 px-4">{format(new Date(reserva.data + "T00:00:00"), "dd/MM/yyyy")}</td>
                  <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{reserva.horario}</td>
                  <td className="py-3 px-4">
                    {reserva.professor}
                    {reserva.turma && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">({reserva.turma})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => excluirReserva(reserva.id, reserva.tipo, reserva.usuarioId)}
                      className="p-2 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-100 hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors border border-rose-200 dark:border-rose-800"
                      aria-label="Excluir reserva"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
