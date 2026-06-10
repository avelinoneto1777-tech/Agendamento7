"use client"

import { Building2, Monitor } from "lucide-react"

interface ReservaFormProps {
  tipoAgendamento: "ambiente" | "equipamento"
  setTipoAgendamento: (tipo: "ambiente" | "equipamento") => void
  dataSelecionada: string
  setDataSelecionada: (data: string) => void
  recursoSelecionado: string
  setRecursoSelecionado: (recurso: string) => void
  horariosSelecionados: string[]
  setHorariosSelecionados: (horarios: string[]) => void
  turmaSelecionada: string
  setTurmaSelecionada: (turma: string) => void
  professorSelecionado: string
  setProfessorSelecionado: (professor: string) => void
  ambientes: Array<{ id: string; nome: string }>
  equipamentos: Array<{ id: string; nome: string }>
  turmas: string[]
  professores: string[]
  horarios: string[]
  reservasAmbiente: any[]
  reservasEquipamento: any[]
  handleHorarioSelection: (horario: string, isChecked: boolean) => void
  salvarReserva: () => void
  user: any
}

export default function ReservaForm({
  tipoAgendamento,
  setTipoAgendamento,
  dataSelecionada,
  setDataSelecionada,
  recursoSelecionado,
  setRecursoSelecionado,
  horariosSelecionados,
  setHorariosSelecionados,
  turmaSelecionada,
  setTurmaSelecionada,
  professorSelecionado,
  setProfessorSelecionado,
  ambientes,
  equipamentos,
  turmas,
  professores,
  horarios,
  reservasAmbiente,
  reservasEquipamento,
  handleHorarioSelection,
  salvarReserva,
  user,
}: ReservaFormProps) {
  return (
    <section className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-700 dark:text-gray-200 flex items-center">
        <span className="mr-2">📝</span> Nova Reserva
      </h2>

      <div className="flex justify-center space-x-2 md:space-x-4 mb-6">
        <button
          onClick={() => {
            setTipoAgendamento("ambiente")
            setRecursoSelecionado("")
            setHorariosSelecionados([])
          }}
          className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            tipoAgendamento === "ambiente"
              ? "bg-emerald-600 dark:bg-emerald-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          }`}
        >
          <Building2 className="mr-2 h-5 w-5" /> Agendar Ambiente
        </button>
        <button
          onClick={() => {
            setTipoAgendamento("equipamento")
            setRecursoSelecionado("")
            setHorariosSelecionados([])
          }}
          className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            tipoAgendamento === "equipamento"
              ? "bg-orange-600 dark:bg-orange-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900"
          }`}
        >
          <Monitor className="mr-2 h-5 w-5" /> Agendar Equipamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="data" className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
            Data
          </label>
          <input
            type="date"
            id="data"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
        </div>

        {tipoAgendamento === "ambiente" ? (
          <>
            <div>
              <label htmlFor="ambiente" className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
                Ambiente
              </label>
              <select
                id="ambiente"
                value={recursoSelecionado}
                onChange={(e) => {
                  setRecursoSelecionado(e.target.value)
                  setHorariosSelecionados([])
                }}
                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">-- Selecione --</option>
                {ambientes.map((amb) => (
                  <option key={amb.id} value={amb.id}>
                    {amb.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="turma" className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
                Turma
              </label>
              <select
                id="turma"
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-400 dark:focus:border-emerald-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                <option value="">-- Selecione --</option>
                {turmas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="equipamento" className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
              Equipamento
            </label>
            <select
              id="equipamento"
              value={recursoSelecionado}
              onChange={(e) => {
                setRecursoSelecionado(e.target.value)
                setHorariosSelecionados([])
              }}
              className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 dark:focus:ring-orange-800 focus:border-orange-400 dark:focus:border-orange-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="">-- Selecione --</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label htmlFor="professor" className="block text-gray-600 dark:text-gray-400 font-medium mb-1">
            Professor
          </label>
          <select
            id="professor"
            value={professorSelecionado}
            onChange={(e) => setProfessorSelecionado(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 transition-all bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="">-- Selecione --</option>
            {professores.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">Horários Disponíveis</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {horarios.map((h, i) => {
          const isAmbiente = tipoAgendamento === "ambiente"
          const reservado = isAmbiente
            ? reservasAmbiente.some((r) => r.horario === h)
            : reservasEquipamento.some((r) => r.horario === h)
          const isChecked = horariosSelecionados.includes(h)
          const isFixa = (isAmbiente ? reservasAmbiente : reservasEquipamento).some(
            (r) => r.horario === h && r.id.startsWith("eletiva-"),
          )

          return (
            <div key={i}>
              <label
                className={`flex flex-col justify-center items-center p-3 rounded-xl shadow-md transition-all duration-200 cursor-pointer text-center border-2 ${
                  reservado
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-600"
                    : isChecked
                      ? isAmbiente
                        ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100"
                        : "bg-orange-100 dark:bg-orange-900 border-orange-400 dark:border-orange-600 text-orange-900 dark:text-orange-100"
                      : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={reservado}
                  onChange={(e) => handleHorarioSelection(h, e.target.checked)}
                  className={`form-checkbox h-5 w-5 mb-2 ${isAmbiente ? "text-emerald-600" : "text-orange-600"}`}
                />
                <span className="text-sm font-semibold">{h}</span>
                {reservado && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isFixa ? "(Eletiva Fixa)" : "(Reservado)"}
                  </span>
                )}
              </label>
            </div>
          )
        })}
      </div>

      <button
        onClick={salvarReserva}
        disabled={
          !user ||
          horariosSelecionados.length === 0 ||
          !professorSelecionado ||
          (tipoAgendamento === "ambiente" && !turmaSelecionada)
        }
        className={`mt-8 w-full py-3 rounded-full font-bold text-white transition-all duration-300 transform ${
          user &&
          horariosSelecionados.length > 0 &&
          professorSelecionado &&
          (tipoAgendamento === "equipamento" || turmaSelecionada)
            ? tipoAgendamento === "ambiente"
              ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 shadow-xl hover:scale-105"
              : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 shadow-xl hover:scale-105"
            : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
        }`}
      >
        Confirmar Reserva
      </button>
    </section>
  )
}
