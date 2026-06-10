"use client"

import { useState, useEffect } from "react"
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
} from "firebase/auth"
import { getFirestore, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs } from "firebase/firestore"
import { initializeApp } from "firebase/app"
import { format } from "date-fns"
import { CloverIcon as CloseIcon, LinkIcon } from 'lucide-react'

import Navbar from "../components/navbar"
import ReservaForm from "../components/reserva-form"
import RelatorioGeral from "../components/relatorio-geral"
import MinhasReservas from "../components/minhas-reservas"
import NotificationManager from "../components/notification-manager"
import ConflictAlert from "../components/conflict-alert"

// ====================================================================
// Interfaces e dados estáticos
// ====================================================================

// Define os tipos para as reservas salvas no Firestore
interface Reserva {
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
}

// Interface para a lista de relatório, que inclui o nome do recurso
interface ReservaComNomeRecurso extends Reserva {
  nomeRecurso: string
}

interface Mensagem {
  tipo: "sucesso" | "erro"
  texto: string
}

// Seus dados estáticos com emojis
const ambientes = [
  { id: "informatica1", nome: "Laboratório de Informática I 💻" },
  { id: "informatica2", nome: "Laboratório de Informática II 💻" },
  { id: "salaVideo", nome: "Sala de Vídeo 🎬" },
  { id: "labCiencias", nome: "Laboratório de Ciências 🔬" },
  { id: "biblioteca", nome: "Biblioteca 📚" },
  { id: "labmatematica", nome: "Laboratório de Matemática 📚" },
  { id: "sala7", nome: "Sala 7 📚" },
]

const equipamentos = [
  { id: "projetorEpson", nome: "Projetor Epson 🖥️" },
  { id: "projetorBenq", nome: "Projetor Benq 🖥️" },
  { id: "smartvSamsung", nome: "Smartv Samsung 📺" },
  { id: "caixaSom", nome: "Caixa de Som 🔊" },
  { id: "smarttvAOC", nome: "smart tv AOC 💻" },
  { id: "projetorGoldentec", nome: "Projetor Goldentec 💻" },
  { id: "smartvCordenaçãodearea", nome: "Smartv coordenação de área 📺" },
  { id: "smartvInformaticaI", nome: "Smartv Informática I 📺" },
  { id: "smartvInformaticaII", nome: "Smartv Informática II 📺" },
  { id: "smartvSaladevideo", nome: "Smartv sala de vídeo 📺" },
  { id: "smartvSala7", nome: "Smartv sala 7 📺" },
  { id: "telaprojeção", nome: "Tela para projeção 💻" },
]

const horarios = [
  "07:15 - 08:05",
  "08:05 - 08:55",
  "09:15 - 10:05",
  "10:05 - 10:55",
  "10:55 - 11:45",
  "13:10 - 14:00",
  "14:00 - 14:50",
  "15:10 - 16:00",
  "16:00 - 16:50",
]

const turmas = [
  "1ª Série A (Integral) 🧑‍🎓",
  "1ª Série B (Integral) 🧑‍🎓",
  "2ª Série A (Integral) 🧑‍🎓",
  "2ª Série B (Integral) 🧑‍🎓",
  "3ª Série A (Integral) 🧑‍🎓",
  "3ª Série B (Integral) 🧑‍🎓",
]

const professores = [
  "ANA ANDREIA DE ARAUJO GOMES 👩‍🏫",
  "ANA LIVIA MARIA MACEDO E CAMPOS 👩‍🏫",
  "ANTONIO GENILSON VIEIRA DE PAIVA 👨‍🏫",
  "AVELINO GOMES FERREIRA NETO 👨‍🏫",
  "BENEDITA ELENICE PINTO SILVA 👩‍🏫",
  "DAIANE OLIVEIRA MIRANDA 👩‍🏫",
  "DAVID RUAN SAMPAIO PRUDENCIO 👨‍🏫",
  "DENILSON SAMPAIO SOARES 👨‍🏫",
  "DOMINGOS MESQUITA ALVES 👨‍🏫",
  "ELAINE CRISTINA SALES BEZERRA DA SILVA 👩‍🏫",
  "EVANDRO PEREIRA VERAS 👨‍🏫",
  "FRANCISCO ALAN DOS SANTOS ALMEIDA 👨‍🏫",
  "FRANCISCO DEJACIR MARQUES 👨‍🏫",
  "FRANCISCO CLEIGIVAN DA ROCHA MARTINS 👨‍🏫",
  "GABRIEL CAMELO DA COSTA 👨‍🏫",
  "MARIA RITA DA SILVA GOMES 👩‍🏫",
  "JOICE SOARES DE ARAUJO 👩‍🏫" ,
  "JOSE IRAN PEREIRA VERAS 👨‍🏫",
  "LUCAS FERREIRA DE OLIVEIRA 👨‍🏫",
  "LUIZ ROGEAN VIEIRA BATISTA 👨‍🏫",
  "SANDRA MARIA VERAS DE SOUSA 👩‍🏫",
  "WENITHON CARLOS DE SOUSA 👨‍🏫",
  "JOÃO PAULO MOTA 👨‍🏫",
  "EDIBERTO RIBEIRO 👨‍🏫",
  "MARCUS WILLIAM 👨‍🏫",
].sort()

// Mapeamento de dia da semana para string
const diasDaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]

// Funções auxiliares para limpeza automática
function isReservationPast(reservationDate: string, reservationTime: string): boolean {
  try {
    const [year, month, day] = reservationDate.split("-").map(Number)
    const startTime = reservationTime.split(" - ")[0]
    const [hours, minutes] = startTime.split(":").map(Number)

    // Create date using local timezone instead of UTC
    const reservationDateTime = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()

    return reservationDateTime < now
  } catch (error) {
    console.error("[v0] Error checking if reservation is past:", error)
    return false
  }
}

function getLastCleanupDate(): Date | null {
  try {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("last_cleanup_date")
    return stored ? new Date(stored) : null
  } catch (error) {
    console.error("[v0] Error getting last cleanup date:", error)
    return null
  }
}

function updateLastCleanupDate(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("last_cleanup_date", new Date().toISOString())
  } catch (error) {
    console.error("[v0] Error updating last cleanup date:", error)
  }
}

function shouldRunCleanup(): boolean {
  const lastCleanup = getLastCleanupDate()
  if (!lastCleanup) return true

  const now = new Date()
  const daysSinceLastCleanup = Math.floor((now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24))
  return daysSinceLastCleanup >= 10
}

async function cleanupOldReservations(db: any): Promise<void> {
  try {
    let deletedCount = 0

    const ambientesSnapshot = await getDocs(collection(db, "reservas_ambientes"))
    for (const docSnapshot of ambientesSnapshot.docs) {
      const data = docSnapshot.data()
      if (isReservationPast(data.data, data.horario)) {
        await deleteDoc(doc(db, "reservas_ambientes", docSnapshot.id))
        deletedCount++
      }
    }

    const equipamentosSnapshot = await getDocs(collection(db, "reservas_equipamentos"))
    for (const docSnapshot of equipamentosSnapshot.docs) {
      const data = docSnapshot.data()
      if (isReservationPast(data.data, data.horario)) {
        await deleteDoc(doc(db, "reservas_equipamentos", docSnapshot.id))
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      console.log(`[v0] Cleanup completed: ${deletedCount} old reservation(s) deleted`)
      updateLastCleanupDate()
    }
  } catch (error: any) {
    console.error("[v0] Error during cleanup:", error)
  }
}

// ====================================================================
// Componente principal
// ====================================================================
export default function App() {
  // Estado para autenticação e inicialização do Firebase
  const [db, setDb] = useState<any>(null)
  const [auth, setAuth] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isAuthReady, setIsAuthReady] = useState(false)

  // Estado para a visualização de agendamento
  const [tipoAgendamento, setTipoAgendamento] = useState<"ambiente" | "equipamento">("ambiente")
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"))
  const [recursoSelecionado, setRecursoSelecionado] = useState<string>("")
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("")
  const [professorSelecionado, setProfessorSelecionado] = useState<string>("")

  // Estado para a visualização de relatório
  const [relatorioReservas, setRelatorioReservas] = useState<ReservaComNomeRecurso[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)
  const [relatorioTipo, setRelatorioTipo] = useState<"ambiente" | "equipamento">("ambiente")
  const [recursoBusca, setRecursoBusca] = useState<string>("")
  const [professorBusca, setProfessorBusca] = useState<string>("")
  const [turmaBusca, setTurmaBusca] = useState<string>("")

  // Estado para as reservas atuais (para verificação de conflitos)
  const [reservasAmbiente, setReservasAmbiente] = useState<Reserva[]>([])
  const [reservasEquipamento, setReservasEquipamento] = useState<Reserva[]>([])
  const [minhasReservas, setMinhasReservas] = useState<ReservaComNomeRecurso[]>([])

  // Estado para mensagens de sucesso/erro
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [view, setView] = useState<"reserva" | "relatorio" | "minhas-reservas" | "website">("reserva")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [conflicts, setConflicts] = useState<any[]>([])
  const [showConflictAlert, setShowConflictAlert] = useState(false)

  // ====================================================================
  // Autenticação e Inicialização do Firebase (Versão com login do Google)
  // ====================================================================
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const firebaseConfig = {
          apiKey: "AIzaSyAh1UHya83-uANm6RYmOt-Fk885WIJTe0U",
          authDomain: "agendamento-de-ambientes.firebaseapp.com",
          projectId: "agendamento-de-ambientes",
          storageBucket: "agendamento-de-ambientes.firebasestorage.app",
          messagingSenderId: "436747247500",
          appId: "1:436747247500:web:d9438aab4b29c3d8f900a9",
        }

        const app = initializeApp(firebaseConfig)

        // Add a small delay to ensure Firebase is ready
        await new Promise((resolve) => setTimeout(resolve, 100))

        const authInstance = getAuth(app)
        const dbInstance = getFirestore(app)

        setAuth(authInstance)
        setDb(dbInstance)

        // Lógica de autenticação adaptada para o ambiente
        const globalToken = (globalThis as any).__initial_auth_token
        if (globalToken) {
          // Usa o token do ambiente para login automático
          try {
            await signInWithCustomToken(authInstance, globalToken)
          } catch (tokenError) {
            console.warn("[v0] Custom token sign-in failed, will use Google sign-in:", tokenError)
          }
        }

        const unsub = onAuthStateChanged(authInstance, (usuario) => {
          setUser(usuario)
          setLoadingUser(false)
          setIsAuthReady(true)
        })
        return () => unsub()
      } catch (e: any) {
        console.error("Erro ao inicializar Firebase ou autenticar:", e)
        setLoadingUser(false)
        setIsAuthReady(true)
        setMensagem({
          tipo: "erro",
          texto: `Erro: ${e.message}. Verifique a configuração do Firebase.`,
        })
      }
    }
    initFirebase()
  }, [])

  // ====================================================================
  // Hooks para buscar dados do Firestore
  // ====================================================================
  useEffect(() => {
    if (!db || !user || !isAuthReady || tipoAgendamento !== "ambiente" || !recursoSelecionado || !dataSelecionada) {
      setReservasAmbiente([])
      return
    }
    setLoadingReservas(true)

    const q = query(
      collection(db, "reservas_ambientes"),
      where("recursoId", "==", recursoSelecionado),
      where("data", "==", dataSelecionada),
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: "ambiente",
          ...doc.data(),
        })) as Reserva[]

        setReservasAmbiente(lista)
        setLoadingReservas(false)
      },
      (error) => {
        console.error("Erro ao buscar reservas de ambiente:", error)
        setLoadingReservas(false)
      },
    )
    return () => unsub()
  }, [db, user, recursoSelecionado, dataSelecionada, tipoAgendamento, isAuthReady])

  useEffect(() => {
    if (!db || !user || !isAuthReady || tipoAgendamento !== "equipamento" || !recursoSelecionado || !dataSelecionada) {
      setReservasEquipamento([])
      return
    }
    setLoadingReservas(true)

    const q = query(
      collection(db, "reservas_equipamentos"),
      where("recursoId", "==", recursoSelecionado),
      where("data", "==", dataSelecionada),
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: "equipamento",
          ...doc.data(),
        })) as Reserva[]

        setReservasEquipamento(lista)
        setLoadingReservas(false)
      },
      (error) => {
        console.error("Erro ao buscar reservas de equipamento:", error)
        setLoadingReservas(false)
      },
    )
    return () => unsub()
  }, [db, user, recursoSelecionado, dataSelecionada, tipoAgendamento, isAuthReady])

  useEffect(() => {
    if (!db || !user || !isAuthReady || view !== "relatorio") {
      setRelatorioReservas([])
      return
    }

    setLoadingReservas(true)

    const collectionName = relatorioTipo === "ambiente" ? "reservas_ambientes" : "reservas_equipamentos"

    const whereClauses = [where("data", "==", dataSelecionada)]
    if (recursoBusca) {
      whereClauses.push(where("recursoId", "==", recursoBusca))
    }
    if (professorBusca) {
      whereClauses.push(where("professor", "==", professorBusca))
    }
    if (turmaBusca && relatorioTipo === "ambiente") {
      whereClauses.push(where("turma", "==", turmaBusca))
    }

    const q = query(collection(db, collectionName), ...whereClauses)

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: relatorioTipo,
          ...doc.data(),
        })) as Reserva[]

        const listaComNomes: ReservaComNomeRecurso[] = lista.map((reserva) => {
          const dadosRecurso =
            reserva.tipo === "ambiente"
              ? ambientes.find((amb) => amb.id === reserva.recursoId)
              : equipamentos.find((eq) => eq.id === reserva.recursoId)
          return {
            ...reserva,
            nomeRecurso: dadosRecurso?.nome || "Desconhecido",
          }
        })

        setRelatorioReservas(listaComNomes.sort((a, b) => a.horario.localeCompare(b.horario)))
        setLoadingReservas(false)
      },
      (error) => {
        console.error("Erro ao buscar reservas para o relatório:", error)
        setLoadingReservas(false)
      },
    )
    return () => unsub()
  }, [db, user, dataSelecionada, view, relatorioTipo, isAuthReady, recursoBusca, professorBusca, turmaBusca])

  useEffect(() => {
    if (!db || !user || !isAuthReady || view !== "minhas-reservas") {
      setMinhasReservas([])
      return
    }

    setLoadingReservas(true)

    const qAmbientes = query(collection(db, "reservas_ambientes"), where("usuarioId", "==", user.uid))
    const qEquipamentos = query(collection(db, "reservas_equipamentos"), where("usuarioId", "==", user.uid))

    const unsubAmbientes = onSnapshot(qAmbientes, (snapshot) => {
      const reservasAmb = snapshot.docs.map((doc) => ({
        id: doc.id,
        tipo: "ambiente",
        ...doc.data(),
      })) as Reserva[]

      const unsubEquipamentos = onSnapshot(qEquipamentos, (snapshot) => {
        const reservasEq = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: "equipamento",
          ...doc.data(),
        })) as Reserva[]

        const allReservations = [...reservasAmb, ...reservasEq]
        const reservasComNomes: ReservaComNomeRecurso[] = allReservations.map((reserva) => {
          const dadosRecurso =
            reserva.tipo === "ambiente"
              ? ambientes.find((amb) => amb.id === reserva.recursoId)
              : equipamentos.find((eq) => eq.id === reserva.recursoId)
          return {
            ...reserva,
            nomeRecurso: dadosRecurso?.nome || "Desconhecido",
          }
        })
        setMinhasReservas(
          reservasComNomes.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()),
        )
        setLoadingReservas(false)
      })
      return () => unsubEquipamentos()
    })

    return () => unsubAmbientes()
  }, [db, user, view, isAuthReady])

  // ====================================================================
  // Funções de manipulação do estado e Firestore
  // ====================================================================

  // Função para lidar com o login do Google
  const handleGoogleSignIn = async () => {
    if (!auth) return
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      setMensagem({
        tipo: "sucesso",
        texto: "Login com Google realizado com sucesso!",
      })
    } catch (error: any) {
      setMensagem({ tipo: "erro", texto: error.message })
    }
  }

  const handleHorarioSelection = (horario: string, isChecked: boolean) => {
    if (isChecked) {
      setHorariosSelecionados([...horariosSelecionados, horario])
    } else {
      setHorariosSelecionados(horariosSelecionados.filter((h) => h !== horario))
    }
  }

  const logout = () => {
    if (auth) {
      signOut(auth).catch((error) => {
        setMensagem({ tipo: "erro", texto: error.message })
      })
    }
  }

  const salvarReserva = async () => {
    if (!db || !user) return
    const isAmbiente = tipoAgendamento === "ambiente"
    const collectionName = isAmbiente ? "reservas_ambientes" : "reservas_equipamentos"

    if (!recursoSelecionado || !dataSelecionada || horariosSelecionados.length === 0 || !professorSelecionado) {
      setMensagem({
        tipo: "erro",
        texto: "Preencha todos os campos para reservar.",
      })
      return
    }
    if (isAmbiente && !turmaSelecionada) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione a turma para agendar um ambiente.",
      })
      return
    }

    const reservasAtuais = isAmbiente ? reservasAmbiente : reservasEquipamento
    const conflitos = horariosSelecionados.filter((h) => reservasAtuais.some((r) => r.horario === h))
    if (conflitos.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Os seguintes horários já estão reservados para este ${
          isAmbiente ? "ambiente" : "equipamento"
        }: ${conflitos.join(", ")}`,
      })
      return
    }

    const promessasDeSalvar = horariosSelecionados.map((horario) =>
      addDoc(collection(db, collectionName), {
        tipo: tipoAgendamento,
        recursoId: recursoSelecionado,
        data: dataSelecionada,
        horario: horario,
        turma: isAmbiente ? turmaSelecionada : null,
        professor: professorSelecionado,
        usuarioId: user!.uid,
        usuarioNome: user?.displayName || user?.email || "Desconhecido", // Nome do usuário logado
        criadoEm: new Date().toISOString(),
      }),
    )

    try {
      await Promise.all(promessasDeSalvar)
      setMensagem({
        tipo: "sucesso",
        texto: "Reservas realizadas com sucesso!",
      })
      setHorariosSelecionados([])
      setTurmaSelecionada("")
      setProfessorSelecionado("")
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar reservas: " + error.message,
      })
    }
  }

  const isAdmin = (user: User | null): boolean => {
    if (!user || !user.email) return false
    return user.email.toLowerCase() === "avelino.neto@prof.ce.gov.br"
  }

  const excluirReserva = async (id: string, tipo: "ambiente" | "equipamento", reservaUsuarioId?: string) => {
    if (!db || !user) return

    const userIsAdmin = isAdmin(user)
    const isOwner = reservaUsuarioId === user.uid

    if (!userIsAdmin && !isOwner) {
      setMensagem({
        tipo: "erro",
        texto: "Você não tem permissão para excluir esta reserva.",
      })
      return
    }

    try {
      const collectionName = tipo === "ambiente" ? "reservas_ambientes" : "reservas_equipamentos"
      await deleteDoc(doc(db, collectionName, id))
      setMensagem({
        tipo: "sucesso",
        texto: userIsAdmin && !isOwner ? "Reserva excluída com sucesso! (Admin)" : "Reserva excluída com sucesso!",
      })
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao excluir reserva: " + error.message,
      })
    }
  }

  const handleConflictDetected = (detectedConflicts: any[]) => {
    console.log("[v0] Conflicts detected:", detectedConflicts)
    setConflicts(detectedConflicts)
    setShowConflictAlert(true)
  }

  const dismissConflictAlert = () => {
    setShowConflictAlert(false)
    setConflicts([])
  }

  // ====================================================================
  // Limpeza automática quando admin faz login
  // ====================================================================
  useEffect(() => {
    if (!db || !user || !isAuthReady || !isAdmin(user)) {
      return
    }

    if (shouldRunCleanup()) {
      console.log("[v0] Running automatic cleanup...")
      cleanupOldReservations(db)
    }
  }, [db, user, isAuthReady])

  // ====================================================================
  // Renderização da interface
  // ====================================================================

  if (loadingUser || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 font-poppins bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <p className="font-semibold text-lg text-indigo-800 dark:text-indigo-200 p-4 rounded-xl shadow-xl bg-white dark:bg-gray-800 border-l-4 border-indigo-500">
          Carregando...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-poppins p-8 text-gray-800 dark:text-gray-200">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md mx-auto border-t-4 border-indigo-500">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo-escola.png" alt="Logo da Escola" className="h-16 w-16 mr-4" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 drop-shadow-md">
              EEMTI Jader de Figueiredo Correia
            </h1>
          </div>
          <h2 className="text-xl md:text-2xl mb-8 mt-2 text-gray-600 dark:text-gray-400 font-semibold">
            Agendamento de Ambientes e Equipamentos
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">Por favor, faça login para continuar.</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 dark:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.615 4.989-6.401 8.583-11.303 8.583-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.096 29.043 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path fill="#FF3D00" d="M6.306 14.691L14.69 21.014l5.656-5.657-8.384-6.323z" />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238a12.028 12.028 0 01-7.219 2.19c-3.167 0-5.908-1.545-7.594-3.875L6.306 34.1z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083c-.138-1.341-.389-2.65-.769-3.917H24v8h11.303a12.053 12.053 0 01-3.13 6.918l5.656 5.657c3.153-2.935 5.253-7.054 6.6-11.751z"
              />
            </svg>
            Entrar com Google
          </button>
          {mensagem && (
            <div
              className={`mt-4 p-3 rounded-xl transition-all duration-300 border-l-4 ${
                mensagem.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-600"
                  : "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-600"
              }`}
            >
              <span>{mensagem.texto}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 font-poppins ${isDarkMode ? "dark" : ""}`}>
      {/* Estilos para o Dark Mode */}
      <style jsx global>{`
        body {
          background-color: #f9fafb;
          transition: background-color 0.3s ease;
        }
        .dark body {
          background-color: #111827;
        }
      `}</style>

      <div className="max-w-6xl mx-auto dark:bg-gray-900 rounded-3xl shadow-xl transition-colors duration-300">
        <Navbar
          user={user}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          logout={logout}
          view={view}
          setView={setView}
          setRecursoBusca={setRecursoBusca}
          setProfessorBusca={setProfessorBusca}
          setTurmaBusca={setTurmaBusca}
          setRecursoSelecionado={setRecursoSelecionado}
          setHorariosSelecionados={setHorariosSelecionados}
          setTurmaSelecionada={setTurmaSelecionada}
          setProfessorSelecionado={setProfessorSelecionado}
        />

        {user && (
          <div className="mb-4 flex justify-end">
            <NotificationManager
              user={user}
              reservas={[...relatorioReservas, ...minhasReservas]}
              onConflictDetected={handleConflictDetected}
            />
          </div>
        )}

        {user && isAdmin(user) && db && (
          <div className="mb-6">
            {/* Placeholder for CleanupManager component */}
            {/* <CleanupManager db={db} isAdmin={isAdmin(user)} /> */}
          </div>
        )}

        {showConflictAlert && <ConflictAlert conflicts={conflicts} onDismiss={dismissConflictAlert} />}

        {mensagem && (
          <div
            className={`p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg transition-all duration-300 border-l-4 ${
              mensagem.tipo === "sucesso"
                ? "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-600"
                : "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-600"
            }`}
          >
            <span>{mensagem.texto}</span>
            <button
              onClick={() => setMensagem(null)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {user && (
          <>
            {view === "reserva" && (
              <ReservaForm
                tipoAgendamento={tipoAgendamento}
                setTipoAgendamento={setTipoAgendamento}
                dataSelecionada={dataSelecionada}
                setDataSelecionada={setDataSelecionada}
                recursoSelecionado={recursoSelecionado}
                setRecursoSelecionado={setRecursoSelecionado}
                horariosSelecionados={horariosSelecionados}
                setHorariosSelecionados={setHorariosSelecionados}
                turmaSelecionada={turmaSelecionada}
                setTurmaSelecionada={setTurmaSelecionada}
                professorSelecionado={professorSelecionado}
                setProfessorSelecionado={setProfessorSelecionado}
                ambientes={ambientes}
                equipamentos={equipamentos}
                turmas={turmas}
                professores={professores}
                horarios={horarios}
                reservasAmbiente={reservasAmbiente}
                reservasEquipamento={reservasEquipamento}
                handleHorarioSelection={handleHorarioSelection}
                salvarReserva={salvarReserva}
                user={user}
              />
            )}

            {view === "relatorio" && (
              <RelatorioGeral
                relatorioTipo={relatorioTipo}
                setRelatorioTipo={setRelatorioTipo}
                dataSelecionada={dataSelecionada}
                setDataSelecionada={setDataSelecionada}
                recursoBusca={recursoBusca}
                setRecursoBusca={setRecursoBusca}
                professorBusca={professorBusca}
                setProfessorBusca={setProfessorBusca}
                turmaBusca={turmaBusca}
                setTurmaBusca={setTurmaBusca}
                relatorioReservas={relatorioReservas}
                loadingReservas={loadingReservas}
                ambientes={ambientes}
                equipamentos={equipamentos}
                professores={professores}
                turmas={turmas}
                excluirReserva={excluirReserva}
                isAdmin={isAdmin(user)}
                currentUserId={user?.uid || ""}
              />
            )}

            {view === "minhas-reservas" && (
              <MinhasReservas
                minhasReservas={minhasReservas}
                loadingReservas={loadingReservas}
                excluirReserva={excluirReserva}
              />
            )}

            {view === "website" && (
              <section className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-indigo-500 transition-colors duration-300 flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
                  <LinkIcon className="mr-2 h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Conecta JFC
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Acesse o site oficial da EEMTI Jader de Figueiredo Correia para informações institucionais.
                </p>
                <a
                  href="https://sites.google.com/view/escolajfc/in%C3%ADcio?authuser=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <LinkIcon className="mr-2 h-5 w-5" /> Ir para o Site
                </a>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
