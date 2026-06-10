"use client"

import { User, LogOut, Moon, Sun, Calendar, ClipboardList, Link } from "lucide-react"

interface NavbarProps {
  user: any
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  logout: () => void
  view: "reserva" | "relatorio" | "minhas-reservas" | "website"
  setView: (view: "reserva" | "relatorio" | "minhas-reservas" | "website") => void
  setRecursoBusca: (value: string) => void
  setProfessorBusca: (value: string) => void
  setTurmaBusca: (value: string) => void
  setRecursoSelecionado: (value: string) => void
  setHorariosSelecionados: (value: string[]) => void
  setTurmaSelecionada: (value: string) => void
  setProfessorSelecionado: (value: string) => void
}

export default function Navbar({
  user,
  isDarkMode,
  setIsDarkMode,
  logout,
  view,
  setView,
  setRecursoBusca,
  setProfessorBusca,
  setTurmaBusca,
  setRecursoSelecionado,
  setHorariosSelecionados,
  setTurmaSelecionada,
  setProfessorSelecionado,
}: NavbarProps) {
  return (
    <>
      <header className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-5 md:p-8 mb-6 flex flex-col items-center text-center border-t-4 border-indigo-500 transition-colors duration-300">
        {/* Background desfocado com a logo */}
        <div className="absolute inset-0 bg-[url('/logo-imagem.png')] bg-cover bg-center bg-no-repeat z-0">
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-colors duration-300"></div>
        </div>

        {/* Conteúdo do cabeçalho à frente */}
        <div className="relative z-10 flex flex-col items-center text-center w-full">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 drop-shadow-md">
              EEMTI Jader de Figueiredo Correia
            </h1>
          </div>
          <div className="flex flex-col md:flex-row justify-between w-full mt-4 items-center gap-4">
            <div className="flex items-center text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300">
              {user.photoURL ? (
                <img
                  src={user.photoURL || "/placeholder.svg"}
                  alt="Foto de perfil"
                  className="h-8 w-8 rounded-full mr-2"
                />
              ) : (
                <User className="mr-2 text-indigo-600 dark:text-indigo-400" size={24} />
              )}
              Olá, Professor(a) {user.displayName || "Usuário"} 👋
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                aria-label="Alternar modo de cor"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 bg-rose-100 text-rose-700 rounded-full font-semibold hover:bg-rose-200 dark:bg-rose-900 dark:text-rose-100 dark:hover:bg-rose-800 transition-colors duration-300 border border-rose-200 dark:border-rose-800"
              >
                <LogOut className="mr-2 h-5 w-5" /> Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex justify-center flex-wrap space-x-2 md:space-x-4 mb-6 p-2 rounded-2xl bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
        <button
          onClick={() => {
            setView("reserva")
            setRecursoBusca("")
            setProfessorBusca("")
            setTurmaBusca("")
          }}
          className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            view === "reserva"
              ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
          }`}
        >
          <Calendar className="mr-2 h-5 w-5" /> Fazer Reserva
        </button>
        <button
          onClick={() => {
            setView("relatorio")
            setRecursoSelecionado("")
            setHorariosSelecionados([])
            setTurmaSelecionada("")
            setProfessorSelecionado("")
          }}
          className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            view === "relatorio"
              ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
          }`}
        >
          <ClipboardList className="mr-2 h-5 w-5" /> Relatório Geral
        </button>
        <button
          onClick={() => setView("minhas-reservas")}
          className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            view === "minhas-reservas"
              ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
          }`}
        >
          <User className="mr-2 h-5 w-5" /> Minhas Reservas
        </button>
        <button
          onClick={() => setView("website")}
          className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
            view === "website"
              ? "bg-indigo-600 dark:bg-indigo-700 text-white shadow-xl"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900"
          }`}
        >
          <Link className="mr-2 h-5 w-5" /> Site da Escola
        </button>
      </div>
    </>
  )
}
