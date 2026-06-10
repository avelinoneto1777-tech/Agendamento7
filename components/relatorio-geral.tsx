"use client"

import { ClipboardList, Building2, Monitor, Trash2 } from "lucide-react"

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

interface RelatorioGeralProps {
  relatorioTipo: "ambiente" | "equipamento"
  setRelatorioTipo: (tipo: "ambiente" | "equipamento") => void
  dataSelecionada: string
  setDataSelecionada: (data: string) => void
  recursoBusca: string
  setRecursoBusca: (recurso: string) => void
  professorBusca: string
  setProfessorBusca: (professor: string) => void
  turmaBusca: string
  setTurmaBusca: (turma: string) => void
  relatorioReservas: ReservaComNomeRecurso[]
  loadingReservas: boolean
  ambientes: Array<{ id: string; nome: string }>
  equipamentos: Array<{ id: string; nome: string }>
  professores: string[]
  turmas: string[]
  excluirReserva: (id: string, tipo: "ambiente" | "equipamento", reservaUsuarioId?: string) => void
  isAdmin: boolean
  currentUserId: string
}

export default function RelatorioGeral({
  relatorioTipo,
  setRelatorioTipo,
  dataSelecionada,
  setDataSelecionada,
  recursoBusca,
  setRecursoBusca,
  professorBusca,
  setProfessorBusca,
  turmaBusca,
  setTurmaBusca,
  relatorioReservas,
  loadingReservas,
  ambientes,
  equipamentos,
  professores,
  turmas,
  excluirReserva,
  isAdmin,
  currentUserId,
}: RelatorioGeralProps) {
  return (
    <section className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center">
        <ClipboardList className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Relatório Geral do Dia
        {isAdmin && (
          <span className="ml-3 px-3 py-1 text-xs font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-full border border-purple-300 dark:border-purple-700">
            ADMIN
          </span>
        )}
      </h2>

      <div className="flex justify-center space-x-2 md:space-x-4 mb-6">
        <button
          onClick={() => {
            setRelatorioTipo("ambiente")
            setRecursoBusca("")
            setProfessorBusca("")
            setTurmaBusca("")
          }}
          className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            relatorioTipo === "ambiente"
              ? "bg-emerald-600 dark:bg-emerald-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          }`}
        >
          <Building2 className="mr-2 h-5 w-5" /> Ambientes
        </button>
        <button
          onClick={() => {
            setRelatorioTipo("equipamento")
            setRecursoBusca("")
            setProfessorBusca("")
            setTurmaBusca("")
          }}
          className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            relatorioTipo === "equipamento"
              ? "bg-orange-600 dark:bg-orange-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900"
          }`}
        >
          <Monitor className="mr-2 h-5 w-5" /> Equipamentos
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <label htmlFor="relatorioData" className="block text-gray-600 dark:text-gray-400 font-medium">
          Selecione a data:
        </label>
        <input
          type="date"
          id="relatorioData"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="w-full md:w-1/3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <label htmlFor="recursoBusca" className="block text-gray-600 dark:text-gray-400 font-medium">
          Pesquisar por recurso:
        </label>
        <select
          id="recursoBusca"
          value={recursoBusca}
          onChange={(e) => setRecursoBusca(e.target.value)}
          className="w-full md:w-1/3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          <option value="">-- Todos --</option>
          {relatorioTipo === "ambiente"
            ? ambientes.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome}
                </option>
              ))
            : equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome}
                </option>
              ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <label htmlFor="professorBusca" className="block text-gray-600 dark:text-gray-400 font-medium">
          Pesquisar por professor:
        </label>
        <select
          id="professorBusca"
          value={professorBusca}
          onChange={(e) => setProfessorBusca(e.target.value)}
          className="w-full md:w-1/3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
        >
          <option value="">-- Todos --</option>
          {professores.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {relatorioTipo === "ambiente" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <label htmlFor="turmaBusca" className="block text-gray-600 dark:text-gray-400 font-medium">
            Pesquisar por turma:
          </label>
          <select
            id="turmaBusca"
            value={turmaBusca}
            onChange={(e) => setTurmaBusca(e.target.value)}
            className="w-full md:w-1/3 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">-- Todas --</option>
            {turmas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadingReservas ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Carregando reservas...</p>
      ) : relatorioReservas.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhuma reserva de {relatorioTipo} registrada para esta data
          {recursoBusca ? " e recurso." : "."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-600">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr
                className={`text-left border-b-2 border-gray-300 dark:border-gray-700 ${
                  relatorioTipo === "ambiente"
                    ? "bg-emerald-100 dark:bg-emerald-900"
                    : "bg-orange-100 dark:bg-orange-900"
                }`}
              >
                <th
                  className={`py-4 px-4 font-bold ${
                    relatorioTipo === "ambiente"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  {relatorioTipo === "ambiente" ? "Ambiente" : "Equipamento"}
                </th>
                <th
                  className={`py-4 px-4 font-bold ${
                    relatorioTipo === "ambiente"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  Horário
                </th>
                <th
                  className={`py-4 px-4 font-bold ${
                    relatorioTipo === "ambiente"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  Professor
                </th>
                <th
                  className={`py-4 px-4 font-bold ${
                    relatorioTipo === "ambiente"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  Responsável
                </th>
                <th
                  className={`py-4 px-4 font-bold text-center ${
                    relatorioTipo === "ambiente"
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {relatorioReservas.map((reserva, index) => {
                const canDelete = isAdmin || reserva.usuarioId === currentUserId

                return (
                  <tr
                    key={reserva.id}
                    className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                      index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"
                    } ${
                      relatorioTipo === "ambiente"
                        ? "hover:bg-emerald-50 dark:hover:bg-emerald-900"
                        : "hover:bg-orange-50 dark:hover:bg-orange-900"
                    }`}
                  >
                    <td className="py-3 px-4">{reserva.nomeRecurso}</td>
                    <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{reserva.horario}</td>
                    <td className="py-3 px-4">
                      {reserva.professor}
                      {reserva.turma && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">({reserva.turma})</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {reserva.usuarioNome}
                      {isAdmin && reserva.usuarioId !== currentUserId && (
                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                          (pode excluir)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDelete ? (
                        <button
                          onClick={() => excluirReserva(reserva.id, reserva.tipo, reserva.usuarioId)}
                          className="p-2 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-100 hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors border border-rose-200 dark:border-rose-800"
                          aria-label="Excluir reserva"
                          title={
                            isAdmin && reserva.usuarioId !== currentUserId ? "Excluir como Admin" : "Excluir reserva"
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          aria-label="Sem permissão para excluir"
                          disabled
                          title="Sem permissão"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
