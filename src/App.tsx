import React, { useState, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
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
  User as GoogleIcon,
  Trash2 as TrashIcon,
  X as CloseIcon,
  Calendar as CalendarIcon,
  ClipboardList as ClipboardListIcon,
  LogOut as LogoutIcon,
  Building2 as BuildingIcon,
  Monitor as EquipmentIcon,
} from "lucide-react";

// ====================================================================
// ====================================================================
// SUA NOVA CONFIGURAÇÃO DO FIREBASE (ATUALIZADA)
// ====================================================================
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAh1UHya83-uANm6RYmOt-Fk885WIJTe0U",
  authDomain: "agendamento-de-ambientes.firebaseapp.com",
  projectId: "agendamento-de-ambientes",
  storageBucket: "agendamento-de-ambientes.firebasestorage.app",
  messagingSenderId: "436747247500",
  appId: "1:436747247500:web:d9438aab4b29c3d8f900a9",
};

// Inicializa o Firebase e Firestore fora do componente para evitar reinicializações
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Seus dados estáticos com emojis
const ambientes = [
  { id: "informatica1", nome: "Laboratório de Informática I 💻" },
  { id: "informatica2", nome: "Laboratório de Informática II 💻" },
  { id: "salaVideo", nome: "Sala de Vídeo 🎬" },
  { id: "labCiencias", nome: "Laboratório de Ciências 🔬" },
  { id: "biblioteca", nome: "Biblioteca 📚" },
];

// Lista de equipamentos atualizada com os novos itens
const equipamentos = [
  { id: "projetorEpson", nome: "Projetor Epson 🖥️" },
  { id: "projetorBenq", nome: "Projetor Benq 🖥️" },
  { id: "smartvSamsung", nome: "Smartv Samsung 📺" },
  { id: "caixaSom", nome: "Caixa de Som 🔊" },
  { id: "smarttvAOC", nome: "Smart TV AOC 💻" },
  { id: "projetorGoldentec", nome: "Projetor Goldentec 💻" },
  { id: "smartvCoordenacaoDeArea", nome: "Smartv Coordenação de Área 📺" },
  { id: "smartvInformaticaI", nome: "Smartv Informática I 📺" },
  { id: "smartvInformaticaII", nome: "Smartv Informática II 📺" },
  { id: "smartvSalaDeVideo", nome: "Smartv Sala de Vídeo 📺" },
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

// Tipagem para as reservas salvas no Firestore
interface Reserva {
  id: string;
  tipo: "ambiente" | "equipamento"; // Novo campo para diferenciar
  recursoId: string; // ID do ambiente ou equipamento
  data: string;
  horario: string;
  turma?: string | null; // Opcional para equipamentos
  professor: string;
  usuarioId: string;
  usuarioNome: string;
  criadoEm: string;
}

// Nova interface para a lista de relatório, que inclui o nome do recurso
interface ReservaComNomeRecurso extends Reserva {
  nomeRecurso: string;
}

interface Mensagem {
  tipo: "sucesso" | "erro";
  texto: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [view, setView] = useState<"reserva" | "relatorio">("reserva");

  // Observa o estado de autenticação do usuário
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  // Hook para buscar reservas de AMBIENTE para a visualização de reserva (verificação de conflitos)
  useEffect(() => {
    if (
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
  }, [recursoSelecionado, dataSelecionada, tipoAgendamento]);

  // Hook para buscar reservas de EQUIPAMENTO para a visualização de reserva (verificação de conflitos)
  useEffect(() => {
    if (
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
  }, [recursoSelecionado, dataSelecionada, tipoAgendamento]);

  // Hook para buscar TODAS as reservas do dia para o relatório
  useEffect(() => {
    if (!dataSelecionada || view !== "relatorio") {
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

        // Adiciona o nome do recurso ao objeto de reserva
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
  }, [dataSelecionada, view, relatorioTipo]);

  // Função para selecionar horários
  const handleHorarioSelection = (horario: string, isChecked: boolean) => {
    if (isChecked) {
      setHorariosSelecionados([...horariosSelecionados, horario]);
    } else {
      setHorariosSelecionados(
        horariosSelecionados.filter((h) => h !== horario)
      );
    }
  };

  // Funções de login e logout com Google
  const loginGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      setMensagem({ tipo: "erro", texto: error.message });
    });
  };

  const logout = () => {
    signOut(auth).catch((error) => {
      setMensagem({ tipo: "erro", texto: error.message });
    });
  };

  // Função para salvar as reservas
  const salvarReserva = async () => {
    const isAmbiente = tipoAgendamento === "ambiente";
    const collectionName = isAmbiente
      ? "reservas_ambientes"
      : "reservas_equipamentos";

    // Validações
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
        usuarioNome: user!.displayName,
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

  // Função para excluir uma reserva
  const excluirReserva = async (
    id: string,
    tipo: "ambiente" | "equipamento"
  ) => {
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

  if (loadingUser) {
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
          <button
            onClick={loginGoogle}
            className="flex items-center justify-center w-full px-6 py-3 text-lg bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <GoogleIcon className="mr-3 h-6 w-6" /> Entrar com Google
          </button>
        </div>
        {mensagem && (
          <div
            className={`mt-6 p-4 rounded-lg flex justify-between items-center shadow-lg ${
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
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-poppins text-gray-800 bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <GoogleIcon className="mr-2 text-blue-600" size={24} /> Olá,{" "}
              {user.displayName} 👋
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 flex items-center"
            >
              <LogoutIcon className="mr-2 h-5 w-5" /> Sair
            </button>
          </div>
        </header>

        {/* Navegação entre as visualizações */}
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
            <ClipboardListIcon className="mr-2 h-5 w-5" /> Relatório de Reservas
          </button>
        </div>

        {/* Seção de Mensagens */}
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

        {/* Visualização de Fazer Reserva */}
        {view === "reserva" && (
          <section className="p-6 bg-white rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
              <span className="mr-2">📝</span> Nova Reserva
            </h2>

            {/* Alternador de tipo de agendamento */}
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
                <EquipmentIcon className="mr-2 h-5 w-5" /> Agendar Equipamento
              </button>
            </div>

            {/* Formulário de Reserva */}
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
                // Formulário para Ambientes
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
                // Formulário para Equipamentos
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
                          ? "bg-green-100 border-2 border-green-500 text-green-800"
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
                  ? "bg-green-600 hover:bg-green-700 shadow-xl hover:scale-105"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Confirmar Reserva
            </button>
          </section>
        )}

        {/* Visualização de Relatório */}
        {view === "relatorio" && (
          <section className="p-6 bg-white rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center">
              <ClipboardListIcon className="mr-2 h-6 w-6" /> Relatório de
              Reservas do Dia
            </h2>

            {/* Alternador de tipo de relatório */}
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
                Nenhuma reserva de {relatorioTipo} registrada para esta data.
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
                      {relatorioTipo === "ambiente" && (
                        <th className="py-4 px-4 font-bold text-blue-800">
                          Turma
                        </th>
                      )}
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
                    {relatorioReservas.map((r, index) => (
                      <tr
                        key={r.id}
                        className={`border-b border-gray-200 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50`}
                      >
                        <td className="py-3 px-4">{r.nomeRecurso}</td>
                        <td className="py-3 px-4">{r.horario}</td>
                        {relatorioTipo === "ambiente" && (
                          <td className="py-3 px-4">{r.turma}</td>
                        )}
                        <td className="py-3 px-4">{r.professor}</td>
                        <td className="py-3 px-4">{r.usuarioNome}</td>
                        <td className="py-3 px-4 text-center">
                          {user && r.usuarioId === user.uid ? (
                            <button
                              onClick={() => excluirReserva(r.id, r.tipo)}
                              className="text-red-500 hover:text-red-700 transition-colors transform hover:scale-110"
                            >
                              <TrashIcon size={20} />
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
