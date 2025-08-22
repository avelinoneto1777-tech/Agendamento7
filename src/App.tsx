import React, { useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Ícones utilizando lucide-react para um visual moderno
import {
  User as UserIcon,
  Trash2 as TrashIcon,
  X as CloseIcon,
  Calendar as CalendarIcon,
  ClipboardList as ClipboardListIcon,
  LogOut as LogoutIcon,
  Building2 as BuildingIcon,
  Monitor as EquipmentIcon,
  ArrowRight as ArrowRightIcon,
} from "lucide-react";

// ====================================================================
// Interfaces e dados estáticos
// ====================================================================

// Define os tipos para as reservas salvas no Firestore
interface Reserva {
  id: string;
  tipo: "ambiente" | "equipamento";
  recursoId: string;
  data: string;
  horario: string;
  turma?: string | null;
  professor: string;
  usuarioId: string;
  usuarioNome: string;
  criadoEm: string;
}

// Interface para a lista de relatório, que inclui o nome do recurso
interface ReservaComNomeRecurso extends Reserva {
  nomeRecurso: string;
}

interface Mensagem {
  tipo: "sucesso" | "erro";
  texto: string;
}

// Seus dados estáticos com emojis
const ambientes = [
  { id: "informatica1", nome: "Laboratório de Informática I 💻" },
  { id: "informatica2", nome: "Laboratório de Informática II 💻" },
  { id: "salaVideo", nome: "Sala de Vídeo 🎬" },
  { id: "labCiencias", nome: "Laboratório de Ciências 🔬" },
  { id: "biblioteca", nome: "Biblioteca 📚" },
  { id: "labmatematica", nome: "Laboratório de Matemática 📚" },
];

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
];

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
];

const turmas = [
  "1ª Série A (Integral) 🧑‍🎓",
  "1ª Série B (Integral) 🧑‍🎓",
  "2ª Série A (Integral) 🧑‍🎓",
  "2ª Série B (Integral) 🧑‍🎓",
  "3ª Série A (Integral) 🧑‍🎓",
  "3ª Série B (Integral) 🧑‍🎓",
];

const professores = [
  "ALBERTO JUNIOR GONCALVES RIBEIRO 👨‍🏫",
  "ANA ANDREIA DE ARAUJO GOMES 👩‍🏫",
  "ANA LIVIA MARIA MACEDO E CAMPOS 👩‍🏫",
  "ANTONIO GENILSON VIEIRA DE PAIVA 👨‍🏫",
  "AVELINO GOMES FERREIRA NETO 👨‍🏫",
  "DAIANE OLIVEIRA MIRANDA 👩‍🏫",
  "DENILSON SAMPAIO SOARES 👨‍🏫",
  "DOMINGOS MESQUITA ALVES 👨‍🏫",
  "ELAINE CRISTINA SALES BEZERRA DA SILVA 👩‍🏫",
  "FRANCISCA MIRELY SAMPAIO CARVALHO 👩‍🏫",
  "FRANCISCO ALAN DOS SANTOS ALMEIDA 👨‍🏫",
  "FRANCISCO CLEIGIVAN DA ROCHA MARTINS 👨‍🏫",
  "GABRIEL CAMELO DA COSTA 👨‍🏫",
  "JOSE IRAN PEREIRA VERAS 👨‍🏫",
  "LUIZ ROGEAN VIEIRA BATISTA 👨‍🏫",
  "MARIA DO MONTE SERRAT VERAS DE MESQUITA 👩‍🏫",
  "MARIA GLEYCIENE SOARES DE SOUZA 👩‍🏫",
  "WENITHON CARLOS DE SOUSA 👨‍🏫",
].sort();

// ====================================================================
// Componente principal
// ====================================================================
export default function App() {
  // Estado para autenticação e inicialização do Firebase
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Estado para a visualização de agendamento
  const [tipoAgendamento, setTipoAgendamento] = useState<
    "ambiente" | "equipamento"
  >("ambiente");
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [recursoSelecionado, setRecursoSelecionado] = useState<string>("");
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(
    []
  );
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [professorSelecionado, setProfessorSelecionado] = useState<string>("");

  // Estado para a visualização de relatório
  const [relatorioReservas, setRelatorioReservas] = useState<
    ReservaComNomeRecurso[]
  >([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [relatorioTipo, setRelatorioTipo] = useState<
    "ambiente" | "equipamento"
  >("ambiente");

  // Estado para as reservas atuais (para verificação de conflitos)
  const [reservasAmbiente, setReservasAmbiente] = useState<Reserva[]>([]);
  const [reservasEquipamento, setReservasEquipamento] = useState<Reserva[]>([]);

  // Estado para mensagens de sucesso/erro
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [view, setView] = useState<"reserva" | "relatorio">("reserva");

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
        };

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        // Lógica de autenticação adaptada para o ambiente
        const globalToken = (globalThis as any).__initial_auth_token;
        if (globalToken) {
          // Usa o token do ambiente para login automático
          await signInWithCustomToken(authInstance, globalToken);
        }

        const unsub = onAuthStateChanged(authInstance, (usuario) => {
          setUser(usuario);
          setLoadingUser(false);
          setIsAuthReady(true);
        });
        return () => unsub();
      } catch (e: any) {
        console.error("Erro ao inicializar Firebase ou autenticar:", e);
        setLoadingUser(false);
        setIsAuthReady(true);
        setMensagem({
          tipo: "erro",
          texto: `Erro: ${e.message}. Verifique a configuração do Firebase.`,
        });
      }
    };
    initFirebase();
  }, []);

  // ====================================================================
  // Hooks para buscar dados do Firestore
  // ====================================================================
  useEffect(() => {
    if (
      !db ||
      !user ||
      !isAuthReady ||
      tipoAgendamento !== "ambiente" ||
      !recursoSelecionado ||
      !dataSelecionada
    ) {
      setReservasAmbiente([]);
      return;
    }
    setLoadingReservas(true);
    const q = query(
      collection(db, "reservas_ambientes"),
      where("recursoId", "==", recursoSelecionado),
      where("data", "==", dataSelecionada)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: "ambiente",
          ...doc.data(),
        })) as Reserva[];
        setReservasAmbiente(lista);
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas de ambiente:", error);
        setLoadingReservas(false);
      }
    );
    return () => unsub();
  }, [
    db,
    user,
    recursoSelecionado,
    dataSelecionada,
    tipoAgendamento,
    isAuthReady,
  ]);

  useEffect(() => {
    if (
      !db ||
      !user ||
      !isAuthReady ||
      tipoAgendamento !== "equipamento" ||
      !recursoSelecionado ||
      !dataSelecionada
    ) {
      setReservasEquipamento([]);
      return;
    }
    setLoadingReservas(true);
    const q = query(
      collection(db, "reservas_equipamentos"),
      where("recursoId", "==", recursoSelecionado),
      where("data", "==", dataSelecionada)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: "equipamento",
          ...doc.data(),
        })) as Reserva[];
        setReservasEquipamento(lista);
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas de equipamento:", error);
        setLoadingReservas(false);
      }
    );
    return () => unsub();
  }, [
    db,
    user,
    recursoSelecionado,
    dataSelecionada,
    tipoAgendamento,
    isAuthReady,
  ]);

  useEffect(() => {
    if (
      !db ||
      !user ||
      !isAuthReady ||
      !dataSelecionada ||
      view !== "relatorio"
    ) {
      setRelatorioReservas([]);
      return;
    }

    setLoadingReservas(true);

    const collectionName =
      relatorioTipo === "ambiente"
        ? "reservas_ambientes"
        : "reservas_equipamentos";

    const q = query(
      collection(db, collectionName),
      where("data", "==", dataSelecionada)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          tipo: relatorioTipo,
          ...doc.data(),
        })) as Reserva[];

        const listaComNomes: ReservaComNomeRecurso[] = lista.map((reserva) => {
          const dadosRecurso =
            reserva.tipo === "ambiente"
              ? ambientes.find((amb) => amb.id === reserva.recursoId)
              : equipamentos.find((eq) => eq.id === reserva.recursoId);
          return {
            ...reserva,
            nomeRecurso: dadosRecurso?.nome || "Desconhecido",
          };
        });

        setRelatorioReservas(
          listaComNomes.sort((a, b) => a.horario.localeCompare(b.horario))
        );
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas para o relatório:", error);
        setLoadingReservas(false);
      }
    );
    return () => unsub();
  }, [db, user, dataSelecionada, view, relatorioTipo, isAuthReady]);

  // ====================================================================
  // Funções de manipulação do estado e Firestore
  // ====================================================================

  // Função para lidar com o login do Google
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setMensagem({
        tipo: "sucesso",
        texto: "Login com Google realizado com sucesso!",
      });
    } catch (error: any) {
      setMensagem({ tipo: "erro", texto: error.message });
    }
  };

  const handleHorarioSelection = (horario: string, isChecked: boolean) => {
    if (isChecked) {
      setHorariosSelecionados([...horariosSelecionados, horario]);
    } else {
      setHorariosSelecionados(
        horariosSelecionados.filter((h) => h !== horario)
      );
    }
  };

  const logout = () => {
    if (auth) {
      signOut(auth).catch((error) => {
        setMensagem({ tipo: "erro", texto: error.message });
      });
    }
  };

  const salvarReserva = async () => {
    if (!db || !user) return;
    const isAmbiente = tipoAgendamento === "ambiente";
    const collectionName = isAmbiente
      ? "reservas_ambientes"
      : "reservas_equipamentos";

    if (
      !recursoSelecionado ||
      !dataSelecionada ||
      horariosSelecionados.length === 0 ||
      !professorSelecionado
    ) {
      setMensagem({
        tipo: "erro",
        texto: "Preencha todos os campos para reservar.",
      });
      return;
    }
    if (isAmbiente && !turmaSelecionada) {
      setMensagem({
        tipo: "erro",
        texto: "Selecione a turma para agendar um ambiente.",
      });
      return;
    }

    const reservasAtuais = isAmbiente ? reservasAmbiente : reservasEquipamento;
    const conflitos = horariosSelecionados.filter((h) =>
      reservasAtuais.some((r) => r.horario === h)
    );
    if (conflitos.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Os seguintes horários já estão reservados para este ${
          isAmbiente ? "ambiente" : "equipamento"
        }: ${conflitos.join(", ")}`,
      });
      return;
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
      })
    );

    try {
      await Promise.all(promessasDeSalvar);
      setMensagem({
        tipo: "sucesso",
        texto: "Reservas realizadas com sucesso!",
      });
      setHorariosSelecionados([]);
      setTurmaSelecionada("");
      setProfessorSelecionado("");
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar reservas: " + error.message,
      });
    }
  };

  const excluirReserva = async (
    id: string,
    tipo: "ambiente" | "equipamento"
  ) => {
    if (!db) return;
    try {
      const collectionName =
        tipo === "ambiente" ? "reservas_ambientes" : "reservas_equipamentos";
      await deleteDoc(doc(db, collectionName, id));
      setMensagem({ tipo: "sucesso", texto: "Reserva excluída com sucesso!" });
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao excluir reserva: " + error.message,
      });
    }
  };

  // ====================================================================
  // Renderização da interface
  // ====================================================================
  if (loadingUser || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 font-poppins bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="font-semibold text-lg text-blue-800 p-4 rounded-xl shadow-xl bg-white">
          Carregando...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-poppins p-8 text-gray-800">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow-md">
            EEMTI Jader de Figueiredo Correia
          </h1>
          <h2 className="text-xl md:text-2xl mb-8 mt-2 text-gray-600 font-semibold">
            Agendamento de Ambientes e Equipamentos
          </h2>
          <p className="text-lg text-gray-500 mb-6">
            Por favor, faça login para continuar.
          </p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <svg
              className="w-6 h-6 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              fill="currentColor"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.615 4.989-6.401 8.583-11.303 8.583-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.096 29.043 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691L14.69 21.014l5.656-5.657-8.384-6.323z"
              />
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
              className={`mt-4 p-3 rounded-xl transition-all duration-300 ${
                mensagem.tipo === "sucesso"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <span>{mensagem.texto}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-poppins text-gray-800 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Tailwind CSS CDN */}
      <script src="https://cdn.tailwindcss.com"></script>

      {/* Google Fonts Poppins */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-3xl shadow-lg p-5 md:p-8 mb-6 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 drop-shadow-md">
            EEMTI Jader de Figueiredo Correia
          </h1>
          <div className="flex flex-col md:flex-row justify-between w-full mt-4 items-center gap-4">
            <div className="flex items-center text-lg md:text-xl font-semibold text-gray-700">
              <UserIcon className="mr-2 text-blue-600" size={24} /> Olá,{" "}
              {user.displayName || "Usuário"} 👋
            </div>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold hover:bg-red-200 transition-all duration-300"
            >
              <LogoutIcon className="mr-2 h-5 w-5" /> Sair
            </button>
          </div>
        </header>

        {mensagem && (
          <div
            className={`p-4 rounded-xl mb-6 flex justify-between items-center shadow-lg transition-all duration-300 ${
              mensagem.tipo === "sucesso"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            <span>{mensagem.texto}</span>
            <button
              onClick={() => setMensagem(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {user && (
          <>
            <div className="flex justify-center space-x-2 md:space-x-4 mb-6 p-2 rounded-2xl bg-white shadow-lg">
              <button
                onClick={() => setView("reserva")}
                className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  view === "reserva"
                    ? "bg-blue-600 text-white shadow-xl"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                <CalendarIcon className="mr-2 h-5 w-5" /> Fazer Reserva
              </button>
              <button
                onClick={() => setView("relatorio")}
                className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  view === "relatorio"
                    ? "bg-blue-600 text-white shadow-xl"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                <ClipboardListIcon className="mr-2 h-5 w-5" /> Relatório de
                Reservas
              </button>
            </div>

            {view === "reserva" && (
              <section className="p-6 bg-white rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
                  <span className="mr-2">📝</span> Nova Reserva
                </h2>

                <div className="flex justify-center space-x-2 md:space-x-4 mb-6">
                  <button
                    onClick={() => {
                      setTipoAgendamento("ambiente");
                      setRecursoSelecionado("");
                      setHorariosSelecionados([]);
                    }}
                    className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      tipoAgendamento === "ambiente"
                        ? "bg-blue-600 text-white shadow-xl"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    <BuildingIcon className="mr-2 h-5 w-5" /> Agendar Ambiente
                  </button>
                  <button
                    onClick={() => {
                      setTipoAgendamento("equipamento");
                      setRecursoSelecionado("");
                      setHorariosSelecionados([]);
                    }}
                    className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      tipoAgendamento === "equipamento"
                        ? "bg-blue-600 text-white shadow-xl"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    <EquipmentIcon className="mr-2 h-5 w-5" /> Agendar
                    Equipamento
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="data"
                      className="block text-gray-600 font-medium mb-1"
                    >
                      Data
                    </label>
                    <input
                      type="date"
                      id="data"
                      value={dataSelecionada}
                      onChange={(e) => setDataSelecionada(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
                    />
                  </div>

                  {tipoAgendamento === "ambiente" ? (
                    <>
                      <div>
                        <label
                          htmlFor="ambiente"
                          className="block text-gray-600 font-medium mb-1"
                        >
                          Ambiente
                        </label>
                        <select
                          id="ambiente"
                          value={recursoSelecionado}
                          onChange={(e) => {
                            setRecursoSelecionado(e.target.value);
                            setHorariosSelecionados([]);
                          }}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
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
                        <label
                          htmlFor="turma"
                          className="block text-gray-600 font-medium mb-1"
                        >
                          Turma
                        </label>
                        <select
                          id="turma"
                          value={turmaSelecionada}
                          onChange={(e) => setTurmaSelecionada(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
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
                      <label
                        htmlFor="equipamento"
                        className="block text-gray-600 font-medium mb-1"
                      >
                        Equipamento
                      </label>
                      <select
                        id="equipamento"
                        value={recursoSelecionado}
                        onChange={(e) => {
                          setRecursoSelecionado(e.target.value);
                          setHorariosSelecionados([]);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
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
                    <label
                      htmlFor="professor"
                      className="block text-gray-600 font-medium mb-1"
                    >
                      Professor
                    </label>
                    <select
                      id="professor"
                      value={professorSelecionado}
                      onChange={(e) => setProfessorSelecionado(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
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

                <h3 className="text-xl font-bold mb-4 text-gray-700">
                  Horários Disponíveis
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {horarios.map((h, i) => {
                    const reservado =
                      tipoAgendamento === "ambiente"
                        ? reservasAmbiente.some((r) => r.horario === h)
                        : reservasEquipamento.some((r) => r.horario === h);
                    const isChecked = horariosSelecionados.includes(h);

                    return (
                      <div key={i}>
                        <label
                          className={`flex flex-col justify-center items-center p-3 rounded-xl shadow-md transition-all duration-200 cursor-pointer text-center ${
                            reservado
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : isChecked
                              ? "bg-blue-200 border-2 border-blue-500 text-blue-900"
                              : "bg-white hover:bg-blue-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={reservado}
                            onChange={(e) =>
                              handleHorarioSelection(h, e.target.checked)
                            }
                            className="form-checkbox text-blue-600 h-5 w-5 mb-2"
                          />
                          <span className="text-sm font-semibold">{h}</span>
                          {reservado && (
                            <span className="text-xs text-gray-500 mt-1">
                              (Reservado)
                            </span>
                          )}
                        </label>
                      </div>
                    );
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
                      ? "bg-blue-600 hover:bg-blue-700 shadow-xl hover:scale-105"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirmar Reserva
                </button>
              </section>
            )}

            {view === "relatorio" && (
              <section className="p-6 bg-white rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
                  <ClipboardListIcon className="mr-2 h-6 w-6" /> Relatório de
                  Reservas do Dia
                </h2>

                <div className="flex justify-center space-x-2 md:space-x-4 mb-6">
                  <button
                    onClick={() => setRelatorioTipo("ambiente")}
                    className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      relatorioTipo === "ambiente"
                        ? "bg-blue-600 text-white shadow-xl"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    <BuildingIcon className="mr-2 h-5 w-5" /> Ambientes
                  </button>
                  <button
                    onClick={() => setRelatorioTipo("equipamento")}
                    className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      relatorioTipo === "equipamento"
                        ? "bg-blue-600 text-white shadow-xl"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    <EquipmentIcon className="mr-2 h-5 w-5" /> Equipamentos
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <label
                    htmlFor="relatorioData"
                    className="block text-gray-600 font-medium"
                  >
                    Selecione a data:
                  </label>
                  <input
                    type="date"
                    id="relatorioData"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    className="w-full md:w-1/3 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
                  />
                </div>

                {loadingReservas ? (
                  <p className="text-center text-gray-500">
                    Carregando reservas...
                  </p>
                ) : relatorioReservas.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Nenhuma reserva de {relatorioTipo} registrada para esta
                    data.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="text-left border-b-2 border-gray-300 bg-blue-100">
                          <th className="py-4 px-4 font-bold text-blue-800">
                            {relatorioTipo === "ambiente"
                              ? "Ambiente"
                              : "Equipamento"}
                          </th>
                          <th className="py-4 px-4 font-bold text-blue-800">
                            Horário
                          </th>
                          <th className="py-4 px-4 font-bold text-blue-800">
                            Professor
                          </th>
                          <th className="py-4 px-4 font-bold text-blue-800">
                            Responsável
                          </th>
                          <th className="py-4 px-4 font-bold text-blue-800 text-center">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioReservas.map((reserva, index) => (
                          <tr
                            key={reserva.id}
                            className={`border-b border-gray-200 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="py-3 px-4">{reserva.nomeRecurso}</td>
                            <td className="py-3 px-4 font-semibold text-gray-700">
                              {reserva.horario}
                            </td>
                            <td className="py-3 px-4">
                              {reserva.professor}
                              {reserva.turma && (
                                <span className="text-xs text-gray-500 block">
                                  ({reserva.turma})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">{reserva.usuarioNome}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() =>
                                  excluirReserva(reserva.id, reserva.tipo)
                                }
                                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                aria-label="Excluir reserva"
                              >
                                <TrashIcon size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
