import React, { useState, useEffect } from "react";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  signInWithCustomToken,
  Auth,
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
  Firestore,
} from "firebase/firestore";
import { initializeApp, FirebaseApp } from "firebase/app";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Ícones utilizando lucide-react para um visual moderno
import {
  Trash2 as TrashIcon,
  X as CloseIcon,
  Calendar as CalendarIcon,
  ClipboardList as ClipboardListIcon,
  User as UserIcon,
} from "lucide-react";

// ====================================================================
// Variáveis globais do ambiente (fornecidas pelo Canvas)
// Não altere essas linhas.
// ====================================================================
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const initialAuthToken =
  typeof __initial_auth_token !== "undefined"
    ? __initial_auth_token
    : undefined;

// Dados estáticos (os mesmos do app anterior + a lista de equipamentos)
const equipamentos = [
  { id: "projetorEpson", nome: "Projetor Epson 🖥️" },
  { id: "projetorBenq", nome: "Projetor Benq 🖥️" },
  { id: "smartvSamsung", nome: "Smartv Samsung 📺" },
  { id: "smartvAOC", nome: "Smartv AOC 📺" },
  { id: "projetorGoldentec", nome: "Projetor Goldentec 🖥️" },
  { id: "caixaSom", nome: "Caixa de Som 🔊" },
  { id: "smartvCoordenacao", nome: "Smartv Coordenação de Área 📺" },
  { id: "smartvInformatica1", nome: "Smartv Informática I 📺" },
  { id: "smartvInformatica2", nome: "Smartv Informática II 📺" },
  { id: "smartvSalaVideo", nome: "Smartv Sala de Vídeo 📺" },
  { id: "smartvSala07", nome: "Smartv Sala 07 📺" },
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

// Tipagem para as reservas
interface Reserva {
  id: string;
  equipamentoId: string;
  data: string;
  horario: string;
  professor: string;
  usuarioId: string;
  usuarioNome: string;
  criadoEm: string;
}

interface Mensagem {
  tipo: "sucesso" | "erro";
  texto: string;
}

export default function App() {
  // Estados do componente para gerenciar as instâncias do Firebase
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [firebaseError, setFirebaseError] = useState("");

  // Estados para a lógica do aplicativo
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [equipamentoSelecionado, setEquipamentoSelecionado] =
    useState<string>("");
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(
    []
  );
  const [professorSelecionado, setProfessorSelecionado] = useState<string>("");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [relatorioReservas, setRelatorioReservas] = useState<Reserva[]>([]);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [view, setView] = useState<"reserva" | "relatorio">("reserva");

  // A função `dbPath` cria o caminho para a coleção pública no Firestore.
  const dbPath = (path: string) => `artifacts/${appId}/public/data/${path}`;

  // Hook para inicializar o Firebase e lidar com a autenticação
  useEffect(() => {
    // Apenas inicializa o Firebase se a configuração estiver disponível
    if (Object.keys(firebaseConfig).length === 0) {
      setFirebaseError(
        "Configuração do Firebase não encontrada. Verifique se o ambiente está configurado corretamente."
      );
      setLoadingUser(false);
      return;
    }

    // Inicializa o app Firebase
    const firebaseApp = initializeApp(firebaseConfig);
    const firebaseAuth = getAuth(firebaseApp);
    const firestoreDb = getFirestore(firebaseApp);

    setApp(firebaseApp);
    setAuth(firebaseAuth);
    setDb(firestoreDb);

    // Lida com a autenticação
    const handleAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(firebaseAuth, initialAuthToken);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        setFirebaseError("Erro ao autenticar o usuário.");
      } finally {
        setLoadingUser(false);
      }
    };

    // Observa mudanças no estado de autenticação
    const unsubAuth = onAuthStateChanged(firebaseAuth, (usuario) => {
      setUser(usuario);
    });

    handleAuth();

    // Função de limpeza do useEffect
    return () => unsubAuth();
  }, []);

  // Hook para buscar reservas para a visualização de reserva
  useEffect(() => {
    if (!db || !equipamentoSelecionado || !dataSelecionada || !user) {
      setReservas([]);
      return;
    }

    setLoadingReservas(true);
    const q = query(
      collection(db, dbPath("equipamento_reservas")),
      where("equipamentoId", "==", equipamentoSelecionado),
      where("data", "==", dataSelecionada)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Reserva[];
        setReservas(lista);
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas:", error);
        setLoadingReservas(false);
        setMensagem({ tipo: "erro", texto: "Erro ao carregar reservas." });
      }
    );

    return () => unsub();
  }, [db, equipamentoSelecionado, dataSelecionada, user]);

  // Hook para buscar reservas para a visualização de relatório
  useEffect(() => {
    if (!db || !dataSelecionada || !user) {
      setRelatorioReservas([]);
      return;
    }
    setLoadingReservas(true);
    const q = query(
      collection(db, dbPath("equipamento_reservas")),
      where("data", "==", dataSelecionada)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        })) as Reserva[];

        // Adiciona o nome do equipamento ao objeto de reserva
        const listaComNomes = lista.map((reserva) => ({
          ...reserva,
          nomeEquipamento:
            equipamentos.find((eq) => eq.id === reserva.equipamentoId)?.nome ||
            "Desconhecido",
        }));

        setRelatorioReservas(
          listaComNomes.sort((a, b) => a.horario.localeCompare(b.horario))
        );
        setLoadingReservas(false);
      },
      (error) => {
        console.error("Erro ao buscar reservas para o relatório:", error);
        setLoadingReservas(false);
        setMensagem({ tipo: "erro", texto: "Erro ao carregar relatório." });
      }
    );
    return () => unsub();
  }, [db, dataSelecionada, user]);

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

  // Função para salvar as reservas
  const salvarReserva = async () => {
    if (!db || !user) return; // Garante que o db e o user estejam definidos

    if (
      !equipamentoSelecionado ||
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

    // Verifica se há conflitos antes de tentar salvar
    const conflitos = horariosSelecionados.filter((h) =>
      reservas.some((r) => r.horario === h)
    );
    if (conflitos.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Os seguintes horários já estão reservados: ${conflitos.join(
          ", "
        )}`,
      });
      return;
    }

    try {
      // Cria uma promessa para cada horário selecionado
      const promessasDeSalvar = horariosSelecionados.map((horario) =>
        addDoc(collection(db, dbPath("equipamento_reservas")), {
          equipamentoId: equipamentoSelecionado,
          data: dataSelecionada,
          horario: horario,
          professor: professorSelecionado,
          usuarioId: user.uid,
          usuarioNome: "Usuário Anônimo",
          criadoEm: new Date().toISOString(),
        })
      );
      await Promise.all(promessasDeSalvar);
      setMensagem({
        tipo: "sucesso",
        texto: "Reservas realizadas com sucesso!",
      });
      setHorariosSelecionados([]);
      setProfessorSelecionado("");
    } catch (error: any) {
      console.error("Erro ao salvar reservas:", error);
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar reservas: " + error.message,
      });
    }
  };

  // Função para excluir uma reserva
  const excluirReserva = async (id: string) => {
    if (!db) return; // Garante que o db esteja definido

    try {
      await deleteDoc(doc(db, dbPath("equipamento_reservas"), id));
      setMensagem({ tipo: "sucesso", texto: "Reserva excluída com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao excluir reserva:", error);
      setMensagem({
        tipo: "erro",
        texto: "Erro ao excluir reserva: " + error.message,
      });
    }
  };

  // Renderização condicional para carregamento e erros
  if (firebaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 font-poppins bg-gradient-to-br from-red-100 to-red-200">
        <p className="font-semibold text-lg text-red-800 p-4 rounded-xl shadow-xl bg-white">
          {firebaseError}
        </p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 font-poppins bg-gradient-to-br from-emerald-100 to-green-200">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-emerald-600 animate-bounce"></div>
          <div className="w-4 h-4 rounded-full bg-emerald-600 animate-bounce delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-emerald-600 animate-bounce delay-300"></div>
          <p className="ml-4 font-semibold text-lg text-emerald-800">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-poppins text-gray-800 bg-gradient-to-br from-emerald-100 to-green-200">
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
        <header className="bg-white rounded-3xl shadow-xl p-5 md:p-8 mb-6 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-900 drop-shadow-md">
            Agendamento de Equipamentos
          </h1>
          <div className="flex flex-col md:flex-row justify-between w-full mt-4 items-center gap-4">
            <div className="flex items-center text-lg md:text-xl font-semibold text-gray-700">
              <UserIcon className="mr-2 text-emerald-600" size={24} /> Olá,
              Usuário Anônimo 👋
            </div>
          </div>
        </header>

        {/* Navegação entre as visualizações */}
        <div className="flex justify-center space-x-2 md:space-x-4 mb-6 p-2 rounded-3xl bg-white shadow-xl">
          <button
            onClick={() => {
              setView("reserva");
              // Ao voltar para a tela de reserva, limpamos a seleção de horários para evitar confusão.
              setHorariosSelecionados([]);
            }}
            className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              view === "reserva"
                ? "bg-emerald-600 text-white shadow-xl"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
            }`}
          >
            <CalendarIcon className="mr-2 h-5 w-5" /> Fazer Reserva
          </button>
          <button
            onClick={() => setView("relatorio")}
            className={`flex-1 flex justify-center items-center px-4 md:px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              view === "relatorio"
                ? "bg-emerald-600 text-white shadow-xl"
                : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
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
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
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
              <span className="text-3xl mr-2">📝</span> Nova Reserva
            </h2>
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="equipamento"
                  className="block text-gray-600 font-medium mb-1"
                >
                  Equipamento
                </label>
                <select
                  id="equipamento"
                  value={equipamentoSelecionado}
                  onChange={(e) => {
                    setEquipamentoSelecionado(e.target.value);
                    setHorariosSelecionados([]); // Limpa a seleção ao mudar de equipamento
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all"
                >
                  <option value="">-- Selecione --</option>
                  {equipamentos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all"
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
            {equipamentoSelecionado ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {horarios.map((h, i) => {
                  const reservado = reservas.some((r) => r.horario === h);
                  const isChecked = horariosSelecionados.includes(h);

                  return (
                    <div key={i}>
                      <label
                        className={`flex flex-col justify-center items-center p-3 rounded-xl shadow-md transition-all duration-200 cursor-pointer text-center ${
                          reservado
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : isChecked
                            ? "bg-emerald-200 border-2 border-emerald-500 text-emerald-900"
                            : "bg-white hover:bg-emerald-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={reservado}
                          onChange={(e) =>
                            handleHorarioSelection(h, e.target.checked)
                          }
                          className="form-checkbox text-emerald-600 h-5 w-5 mb-2 rounded"
                        />
                        <span className="text-sm font-semibold">{h}</span>
                        {reservado && (
                          <span className="text-xs text-gray-500 mt-1 font-normal">
                            (Reservado)
                          </span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
                <p>
                  Por favor, selecione um equipamento para ver os horários
                  disponíveis.
                </p>
              </div>
            )}

            <button
              onClick={salvarReserva}
              disabled={
                !user ||
                horariosSelecionados.length === 0 ||
                !professorSelecionado ||
                !equipamentoSelecionado
              }
              className={`mt-8 w-full py-3 rounded-full font-bold text-white transition-all duration-300 transform ${
                user &&
                horariosSelecionados.length > 0 &&
                professorSelecionado &&
                equipamentoSelecionado
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-xl hover:scale-105"
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
              <ClipboardListIcon className="mr-2 h-6 w-6 text-emerald-600" />{" "}
              Relatório de Reservas do Dia
            </h2>
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
                className="w-full md:w-1/3 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all"
              />
            </div>

            {loadingReservas ? (
              <p className="text-center text-gray-500">
                Carregando reservas...
              </p>
            ) : relatorioReservas.length === 0 ? (
              <p className="text-center text-gray-500">
                Nenhuma reserva registrada para esta data.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left border-b-2 border-gray-300 bg-emerald-100">
                      <th className="py-4 px-4 font-bold text-emerald-800">
                        Equipamento
                      </th>
                      <th className="py-4 px-4 font-bold text-emerald-800">
                        Horário
                      </th>
                      <th className="py-4 px-4 font-bold text-emerald-800">
                        Professor
                      </th>
                      <th className="py-4 px-4 font-bold text-emerald-800">
                        Responsável
                      </th>
                      <th className="py-4 px-4 font-bold text-emerald-800 text-center">
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
                        } hover:bg-emerald-50`}
                      >
                        <td className="py-3 px-4">
                          {
                            equipamentos.find((eq) => eq.id === r.equipamentoId)
                              ?.nome
                          }
                        </td>
                        <td className="py-3 px-4">{r.horario}</td>
                        <td className="py-3 px-4">{r.professor}</td>
                        <td className="py-3 px-4">{r.usuarioNome}</td>
                        <td className="py-3 px-4 text-center">
                          {user && r.usuarioId === user.uid ? (
                            <button
                              onClick={() => excluirReserva(r.id)}
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
