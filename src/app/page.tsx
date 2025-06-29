'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image';

// ========== DADOS DO JOGO ==========
const Grupos = [
  { name: "Partes de uma calça", words: ["Bolso", "Gancho", "Cós", "Barra"] },
  { name: "Coletivos", words: ["Cardume", "Buquê", "Frota", "Molho"] },
  { name: "Palíndromos", words: ["Radar", "Osso", "Arara", "Reviver"] },
  { name: "Perfurantes", words: ["Agulha", "Prego", "Arpão", "Flecha"] }
]

const todasPalavrasDoJogo = Grupos.flatMap(group => group.words);

// ========== FUNÇÃO UTILITÁRIA ==========
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function gerarTransitionStates(
  palavras: string[],
  { opacity, duration }: { opacity: number; duration: number },
  getDelay?: (index: number) => number
): Record<string, { opacity: number; transitionDelay: number; transitionDuration: number }> {
  return palavras.reduce((acc, palavra, i) => {
    acc[palavra] = {
      opacity,
      transitionDelay: getDelay ? getDelay(i) : 0,
      transitionDuration: duration
    };
    return acc;
  }, {} as Record<string, { opacity: number; transitionDelay: number; transitionDuration: number }>);
}

// ========== FRASES DO JOGO ==========
const frasesErro = [
  "Errar faz parte, mas também não precisa exagerar!",
  "Parece que o óbvio não é assim tão óbvio para todo mundo.",
  "Perfeito! Mais um exemplo de como não se faz. Anotou?",
  "Ah, a mente humana... Cheia de limitações, não é mesmo?",
  "Sempre achei que o óbvio dispensava explicações...",
  "Impressionante. Não no bom sentido, claro.",
  "Errar é humano. Mas essa foi de outro planeta.",
  "Talvez um erro... ou uma arte conceitual. Difícil dizer.",
  "Errar faz bem. Assim você valoriza quando acerta.",
  "Quase lá! Só precisa ir na direção oposta dessa última jogada.",
  "Essa tentativa foi diferente. Diferente de \"certo\", por exemplo.",
];

const frasesQuaseAcerto = [
  "Quase lá! Só uma escapou...",
  "Você está no caminho certo! Três palavras corretas...",
  "Foi por pouco, uma só está errada. Repare bem nas palavras.",
  "Você enxergou o padrão — só uma peça está fora do lugar.",
  "Um pouco mais de atenção e você acerta tudo...",
  "Está chegando perto. Não desista agora!",
  "Continue nesse caminho! A resposta está bem na sua frente."
];


const frasesMotivacionais = [
  "Um novo olhar pode trazer a resposta que você precisa. Vamos lá!",
  "Você já é um vencedor só por tentar!",
  "Permita-se pensar fora da caixa!",
  "Todo grande enigma só se revela a quem não desiste.",
  "O jogo não está contra você. Ele está testando o quanto você quer vencer.",
  "Respire fundo. Às vezes, a mente precisa de tempo para enxergar o óbvio.",
  "O verdadeiro jogo não é contra o tempo — é contra a vontade de desistir.",
  "Não duvide do seu potencial. Você tem o que é preciso para resolver isso.",
  "Você é capaz de mais do que imagina. Permita-se surpreender com sua própria força.",
  "Todo desafio é também um convite ao crescimento.",
  "Você está treinando não só para vencer este jogo — mas para pensar como um gênio.",
  "Persista mais um pouco. A próxima tentativa pode ser a certa.",
  "Lembre-se de todas as vezes que você superou algo difícil. Esta é só mais uma delas. Você consegue!"
];

const frasesEmbaralhar = [
  "Um novo olhar é um ótima maneira de encontrar a resposta!",
  "Isso está começando a ficar um pouco preocupante.",
  "Eu já estou começando a ficar tonto!"
];

const frasesFimDeJogo = [
  "Você fracassou gloriosamente. Nos vemos no próximo enigma.",
  "A derrota é também uma forma de aprendizado. Jamais pare de tentar!",
  "Seu esforço hoje prepara as vitórias de amanhã. Não para de tentar!",
  "Lembre-se que a jornada vale mais do que o resultado. Até breve.",
  "A persintência é o que transforma sonhos em conquistas.",
  "Seu esforço vale ouro. Continue tentando, o sucesso está próximo!",
  "A mente que persiste sempre encontra o caminho. Nos vemos em breve!",
  "A mente descansa, o jogo espera. Jamais pare de tentar."
];

// ========== CONSTANTES DE ANIMAÇÃO ==========
const FADE_IN_DURATION_MS = 500;
const FADE_OUT_DURATION_MS = 1000;
const TREMOR_DURATION_MS = 800;
const MOTIVATION_TRANSITION_DURATION = 400;

const fraseDeEmbaralharPorCount = new Map<number, string>([
  [3, frasesEmbaralhar[0]],
  [8, frasesEmbaralhar[1]],
  [14, frasesEmbaralhar[2]],
  [20, frasesEmbaralhar[3]],
]);

const calcularPosicaoSeta = (vidas: number, vidasOrdemExibicao: number[]): { einsteinIndex: number, arrowPosition: string } => {
  const einsteinVisiveis = vidasOrdemExibicao.filter(originalIndex => originalIndex < vidas);

  if (einsteinVisiveis.length === 0) {
    return { einsteinIndex: 0, arrowPosition: '50%' }; // Fallback
  }

  // Escolhe um Einstein aleatório entre os visíveis
  const einsteinAleatorio = einsteinVisiveis[Math.floor(Math.random() * einsteinVisiveis.length)];

  const posicoes = {
    0: '12%',   // Primeiro Einstein (mais à esquerda)
    1: '35%',   // Segundo Einstein  
    2: '59%',   // Terceiro Einstein
    3: '85%'    // Quarto Einstein (mais à direita)
  };

  // Encontra a posição do Einstein escolhido no array visível
  const posicaoNoGrid = einsteinVisiveis.indexOf(einsteinAleatorio);

  // Ajusta a posição baseada no número de Einsteins visíveis
  let arrowPosition: string;

  switch (einsteinVisiveis.length) {
    case 1:
      arrowPosition = '48%'; // Centralizado se só há 1
      break;
    case 2:
      arrowPosition = posicaoNoGrid === 0 ? '4%' : '56%';
      break;
    case 3:
      arrowPosition = ['30%', '48%', '70%'][posicaoNoGrid];
      break;
    case 4:
    default:
      arrowPosition = posicoes[einsteinAleatorio as keyof typeof posicoes] || '50%';
      break;
  }

  return { einsteinIndex: einsteinAleatorio, arrowPosition };
};


const TituloAnimado = memo(({ tituloAnimando, onClick }: any) => {
  const letras = "EINSTEINS".split("");

  if (tituloAnimando) {
    return (
      <h1
        key="animating"
        className="font-bold tracking-widest select-none einsteins-title title-wave-animation"
        onClick={onClick}
      >
        {letras.map((letra, index) => (
          <span
            key={index}
            className="letter inline-block transition-transform duration-200 ease-in-out"
          >
            {letra}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <h1
      className="font-bold tracking-widest select-none einsteins-title"
      onClick={onClick}
    >
      EINSTEINS
    </h1>
  );
});

TituloAnimado.displayName = 'TituloAnimadoComponente'

const CaixaColaborador = ({ onClose }: any) => {
  const [ideia, setIdeia] = useState('');
  const [contato, setContato] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('https://formspree.io/f/mkgbzrob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideia, contato }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error('Falha no envio');
      }
    } catch (error) {
      console.error('Erro ao enviar ideia:', error);
      setStatus('error');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/60 p-4"
      onClick={onClose} // Adicionado para fechar ao clicar no fundo
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="relative bg-white p-6 shadow-2xl text-center w-full max-w-sm overflow-visible"
        onClick={(e) => e.stopPropagation()} // Impede que o clique na caixa a feche
        initial={{ scale: 0.1, y: 60, rotateZ: 0 }}
        animate={{ scale: 1, y: 0, rotateZ: 0 }}
        exit={{ opacity: 0, scale: 0.01, rotate: 0 }}

        transition={{
          type: "spring",
          damping: 13,
          stiffness: 100,
          mass: 1.1,
          duration: 1,
        }}
        style={{
          border: '5px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #7dd3fc, #fcd34d, #fda4af, #c4b5fd) border-box',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }}
      >
        <h2 className="text-2xl font-bold center bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent select-none font-extrabold mb-3">COMPARTILHE SUAS IDEIAS</h2>
        <p className="select-none text-gray-700 text-s mb-3">
          Envie sugestões de grupos ou palavras para os próximos enigmas.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            className={`w-full border border-gray-400 p-3 mb-4 h-32 resize-none transition-colors ${status === 'submitting' || status === 'success' ? 'text-gray-400' : 'text-black'
              }`}
            placeholder="Escreva aqui suas ideias..."
            value={ideia}
            onChange={(e) => setIdeia(e.target.value)}
            required
            disabled={status === 'submitting'}
          />
          <input
            type="text"
            className={`w-full border border-gray-400 p-3 mb-4 transition-colors ${status === 'submitting' || status === 'success' ? 'text-gray-400' : 'text-black'
              }`}
            placeholder="E‑mail ou telefone (opcional)"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            disabled={status === 'submitting'}
          />
          <motion.button
            type="submit"
            disabled={status === 'submitting' || !ideia}
            className={`w-full px-6 py-3 font-bold transition-all duration-300 disabled:opacity-60 ${status === 'success'
                ? 'bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 text-white'

                : 'bg-gray-800 text-white'
              }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {status === 'submitting' ? 'Quase lá...' : status === 'success' ? '✓ Ideia Enviada com Sucesso!' : 'ENVIAR IDEIA'}

          </motion.button>

        </form>
        <motion.button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Agora não
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const CaixaNotificacaoEmail = ({ onClose }: any) => {
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Função para detectar se é email ou telefone
  const detectContactType = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;

    if (emailRegex.test(value)) {
      return 'email';
    } else if (phoneRegex.test(value.replace(/\D/g, ''))) {
      return 'phone';
    }
    return 'email'; // padrão
  };

  const handleContactChange = (e: any) => {
    const value = e.target.value;
    setContact(value);

    if (value.length > 3) {
      setContactType(detectContactType(value));
    }
  };

  const validateContact = (contact: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;

    return emailRegex.test(contact) || phoneRegex.test(contact.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validateContact(contact)) {
      setStatus('error');
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch('https://formspree.io/f/mkgbzrob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact,
          contactType,
          [contactType]: contact // envia como 'email' ou 'phone'
        }),
      });

      if (response.ok) {
        setStatus('success');
        setTimeout(() => onClose(), 1000);
      } else {
        throw new Error('Falha no envio');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setStatus('error');
    }
  };

  const getPlaceholder = () => {
    if (contactType === 'phone') {
      return 'Telefone (ex: 11999999999)';
    }
    return 'E-mail ou telefone';
  };

  const getInputType = () => {
    if (contactType === 'phone') {
      return 'tel';
    }
    return 'email';
  };
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/60 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="relative bg-white p-6 shadow-2xl text-center w-full max-w-sm overflow-visible"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '5px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #7dd3fc, #fcd34d, #fda4af, #c4b5fd) border-box',
          willChange: 'transform',
        }}
        initial={{ scale: 0.1, y: 60, rotateZ: 0 }}
        animate={{ scale: 1, y: 0, rotateZ: 0 }}
        exit={{ opacity: 0, scale: 0.01, rotate: 0 }}
        transition={{
          type: "spring",
          damping: 13,
          stiffness: 100,
          mass: 1.4,
          duration: 1,
        }}
      >
        <h2 className="text-2xl select-none font-bold bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold mb-2">FIQUE POR DENTRO!</h2>
        <p className="select-none text-gray-700 text-L mb-6">
          Receba uma notificação quando o próximo enigma estiver disponível.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <input
              type={getInputType()}
              className={`w-full border p-3 transition-colors ${status === 'error' ? 'border-red-400 bg-red-50' : 'border-gray-400'
                } ${status === 'submitting' || status === 'success' ? 'text-gray-400' : 'text-black'
                }`}
              placeholder={getPlaceholder()}
              value={contact}
              onChange={handleContactChange}
              required
              disabled={status === 'submitting'}
            />
            {contactType === 'phone' && (
              <span className="absolute right-3 top-3 text-gray-500 text-sm"></span>
            )}
            {contactType === 'email' && (
              <span className="absolute right-3 top-3 text-gray-500 text-sm"></span>
            )}
          </div>

          {status === 'error' && (
            <p className="text-red-500 text-sm mb-4">
              Por favor, insira um {contactType === 'email' ? 'e-mail' : 'telefone'} válido.
            </p>
          )}

          <motion.button
            type="submit"
            disabled={status === 'submitting' || !contact}
            className={`w-full px-6 py-3 font-bold transition-all duration-300 disabled:opacity-60 ${status === 'success'
                ? 'bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 text-white'
                : 'bg-gray-800 text-white'
              }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {status === 'submitting' ? 'Quase lá...' : status === 'success' ? '✓ Enviado com sucesso!' : 'QUERO FICAR POR DENTRO!'}
          </motion.button>
        </form>

        <motion.button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Agora não
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default function Home() {

  const [einstein10Explodiu, setEinstein10Explodiu] = useState(false);

  const [isAnimatingLastLife, setIsAnimatingLastLife] = useState(false);

  const [clicksEinsteinFlutuante, setClicksEinsteinFlutuante] = useState(0);
  const [mostrarEinsteinFlutuante2, setMostrarEinsteinFlutuante2] = useState(false);
  const [mostrarEinsteinFlutuante3, setMostrarEinsteinFlutuante3] = useState(false);
  const [mostrarEinsteinFlutuante4, setMostrarEinsteinFlutuante4] = useState(false);
  const [mostrarEinsteinFlutuante5, setMostrarEinsteinFlutuante5] = useState(false);
  const [mostrarEinsteinFlutuante6, setMostrarEinsteinFlutuante6] = useState(false);
  const [mostrarEinsteinFlutuante7, setMostrarEinsteinFlutuante7] = useState(false);
  const [mostrarEinsteinFlutuante8, setMostrarEinsteinFlutuante8] = useState(false);
  const [mostrarEinsteinFlutuante9, setMostrarEinsteinFlutuante9] = useState(false);
  const [mostrarEinsteinFlutuante10, setMostrarEinsteinFlutuante10] = useState(false);

  const [clicksTituloQuadro, setClicksTituloQuadro] = useState(0);

  const [jogoTravadoCarregado, setJogoTravadoCarregado] = useState(false);

  const [waveDelayAtivo, setWaveDelayAtivo] = useState(true);

  const [waveMenuAtivo, setWaveMenuAtivo] = useState(false);

  const [mostrarBotaoFiquePorDentro, setMostrarBotaoFiquePorDentro] = useState(false);

  const [mostrarCaixaColaborador, setMostrarCaixaColaborador] = useState(false);

  const [mostrarMenuInicial, setMostrarMenuInicial] = useState(true);
  const [mostrarComoJogar, setMostrarComoJogar] = useState(false);

  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [acertos, setAcertos] = useState<Array<{ name: string, words: string[] }>>([])
  const [vidas, setVidas] = useState(4)
  const [palavrasExibidas, setPalavrasExibidas] = useState<string[]>([])
  const [embaralhando, setEmbaralhando] = useState(false)
  const [vidasOrdemExibição, setEinsteinOrder] = useState([0, 1, 2, 3]); // Controla a ordem de exibição dos "Einsteins" (vidas)

  const [palavrasAtivas, setPalavrasAtivas] = useState<string[]>([]);  // Palavras atualmente no jogo (não acertadas)
  const [palavraTransitionStates, setPalavraTransitionStates] = useState<Record<string, { opacity: number, transitionDelay: number, transitionDuration: number }>>({});

  const [balaoAtivo, setBalaoAtivo] = useState<{ frase: string; indexEinstein: number | null; arrowLeft: string | null } | null>(null);
  const [isBubbleFadingOut, setIsBubbleFadingOut] = useState(false);
  const onBubbleFullyDisappearedCallbackRef = useRef<(() => void) | null>(null);

  const gameOverProcessedRef = useRef(false);

  const [mostrarBotoes, setMostrarBotoes] = useState(true);

  const [frasesErroDisponiveis, setFrasesErroDisponiveis] = useState<string[]>([]);
  const [tremorBotoesErro, setErroAtivo] = useState(false); // Controla a animação de tremor nos botões de palavra
  const [processandoErro, setProcessandoErro] = useState(false); // Bloqueia ações enquanto um erro ou acerto está sendo processado

  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [modoVisualFinal, setModoVisualFinal] = useState(false);

  const [einsteinAnimations, setEinsteinAnimations] = useState<Record<number, string>>({});
  const [einsteinClickCooldowns, setEinsteinClickCooldowns] = useState<Record<number, boolean>>({});
  const einsteinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const einsteinContainerRef = useRef<HTMLDivElement | null>(null);
  const [mostrarMensagemMotivacao, setMostrarMensagemMotivacao] = useState(false);
  const [mensagemMotivacionalAtual, setMensagemMotivacionalAtual] = useState('');
  const [gridVisivel, setGridVisivel] = useState(true);
  const [gridTransitionClass, setGridTransitionClass] = useState('');
  const [MotivacaoTransition, setMessageTransitionClass] = useState('');
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [frasesQuaseAcertoDisponiveis, setFrasesQuaseAcertoDisponiveis] = useState<string[]>([]);
  const [gruposARevelar, setGruposARevelar] = useState<Array<{ name: string, words: string[], reveladoNoFinal?: boolean }>>([]);
  const [acertosOriginais, setAcertosOriginais] = useState<Array<{ name: string, words: string[] }>>([]);
  const [shufflePressCount, setShufflePressCount] = useState(0);
  if (process.env.NODE_ENV !== 'production') {
    console.log("-> COMPONENTE CARREGADO/RENDERIZADO: shufflePressCount inicial:", shufflePressCount);
  }
  const [palavrasComAnimacaoSalto, setPalavrasComAnimacaoSalto] = useState<string[]>([]);
  const [fraseFinal, setFraseFinal] = useState<string | null>(null);
  const [epilogoEncerrado, setEpilogoEncerrado] = useState(false);

  const [tituloAnimando, setTituloAnimando] = useState(false);
  const [estatisticas, setEstatisticas] = useState({ vitorias: 0, totalJogos: 0 });

  const taxaSucesso = estatisticas.totalJogos > 0
    ? ((estatisticas.vitorias / estatisticas.totalJogos) * 100).toFixed(1)
    : '0.0';

  // Estados para o Quadro de Vencedores
  const [vencedores, setVencedores] = useState<{ nome: string; data: string }[]>([]);
  const [mostrarInputNome, setMostrarInputNome] = useState(false);
  const [nomeAtual, setNomeAtual] = useState('');
  const [mostrarCaixaEmail, setMostrarCaixaEmail] = useState(false);

  const defaultTransitionState = memo(() => ({
    opacity: 1,
    transitionDelay: 0,
    transitionDuration: 400
  } as any), [] as any);
  defaultTransitionState.displayName = 'DefaultTransitionStateComponent'

  const [ordemOriginalEinsteins, setOrdemOriginalEinsteins] = useState<number[] | null>(null);

  useEffect(() => {
    const dados = {
      vidas,
      acertos,
      palavrasAtivas,
      palavrasExibidas,
      shufflePressCount,
      vidasOrdemExibição,
    };

    localStorage.setItem('einsteins_progressoAtual', JSON.stringify(dados));
  }, [vidas, acertos, palavrasAtivas, palavrasExibidas, shufflePressCount, vidasOrdemExibição]);

  useEffect(() => {
    console.log("Estado de tituloAnimando mudou para:", tituloAnimando);
  }, [tituloAnimando]);

  const calcularRanking = (erros: any) => {
    const rankings: any = {
      0: {
        titulo: "GENIAL",
        subtitulo: "(0 ERROS)",
        descricao: "Com uma mente à frente do seu tempo, você desvendou o enigma sem cometer um único erro. Uma performance digna de um verdadeiro gênio!",
        cor: "text-amber-500",
        corBarra: "bg-amber-300",
        bgCor: "bg-whitw-50",
        borderCor: "border-gray-200"
      },
      1: {
        titulo: "ADMIRÁVEL",
        subtitulo: "(1 ERRO)",
        descricao: "Com apenas um erro, para mostrar que é humano, você analisou cada uma das pistas e resolveu o desafio com pura maestria. Uma conquista e tanto!",
        cor: "text-sky-300",
        corBarra: "bg-sky-300",
        bgCor: "bg-white-50",
        borderCor: "border-gray-200"
      },
      2: {
        titulo: "PERSPICAZ",
        subtitulo: "(2 ERROS)",
        descricao: "Seus erros não foram tropeços, mas valiosos aprendizados! Com inigualável perspicácia, você superou os desafios e desvendou o enigma final com destreza.",
        cor: "text-rose-400",
        corBarra: "bg-rose-400",
        bgCor: "bg-white-50",
        borderCor: "border-gray-200"
      },
      3: {
        titulo: "INABALÁVEL",
        subtitulo: "(3 ERROS)",
        descricao: "Você ousou explorar todas as possibilidades sem medo de errar. Mesmo que isso tenha te custado algumas tentivas, sua ousadia foi recompensada. A vitória é sua.",
        cor: "text-purple-400",
        corBarra: "bg-purple-400",
        bgCor: "bg-white-50",
        borderCor: "border-gray-200"
      }
    };

    return rankings[erros] || rankings[3]; // Se tiver mais de 3 erros, usa o último
  };

  const registrarResultado = (vitoria: boolean, erros: number) => {
    try {
      const totalJogos = parseInt(localStorage.getItem('totalJogosEinsteins') || '0', 10) + 1;
      localStorage.setItem('totalJogosEinsteins', totalJogos.toString());

      if (vitoria) {
        const vitorias = parseInt(localStorage.getItem('vitoriasEinsteins') || '0', 10) + 1;
        localStorage.setItem('vitoriasEinsteins', vitorias.toString());

        const ranking = calcularRanking(erros);
        const rankingAtual = ranking.titulo;
        const rankingsSalvos = JSON.parse(localStorage.getItem('rankingsEinsteins') || '{}');
        rankingsSalvos[rankingAtual] = (rankingsSalvos[rankingAtual] || 0) + 1;
        localStorage.setItem('rankingsEinsteins', JSON.stringify(rankingsSalvos));

        setEstatisticas({ vitorias, totalJogos });
      } else {
        setEstatisticas(prev => ({ ...prev, totalJogos }));
      }
    } catch (error) {
      console.error("Erro ao registrar resultado", error);
    }
  };

  const handleClickEinstein10 = () => {
    setEinstein10Explodiu(true); // inicia "explosão"

    setTimeout(() => {
      setEinstein10Explodiu(false); // reaparece após tempo
    }, 1000); // tempo da explosão em ms
  };

  const handleClickEinsteinFlutuante = () => {
    const novoClick = clicksEinsteinFlutuante + 1;
    setClicksEinsteinFlutuante(novoClick);

    if (novoClick === 1) {
      setMostrarEinsteinFlutuante2(true);
    } else if (novoClick === 2) {
      setMostrarEinsteinFlutuante3(true);
    } else if (novoClick === 3) {
      setMostrarEinsteinFlutuante4(true);
    } else if (novoClick === 4) { // Começa a partir do 4º clique para o 5º Einstein
      setMostrarEinsteinFlutuante5(true);
    } else if (novoClick === 5) {
      setMostrarEinsteinFlutuante6(true);
    } else if (novoClick === 6) {
      setMostrarEinsteinFlutuante7(true);
    } else if (novoClick === 7) {
      setMostrarEinsteinFlutuante8(true);
    } else if (novoClick === 8) {
      setMostrarEinsteinFlutuante9(true);
    } else if (novoClick === 9) {
      setMostrarEinsteinFlutuante10(true);
    }
  };

  const handleIniciarJogo = () => {
    try {
      // Pega os valores atuais do localStorage
      const vitorias = parseInt(localStorage.getItem('vitoriasEinsteins') || '0', 10);
      const totalJogos = parseInt(localStorage.getItem('totalJogosEinsteins') || '0', 10);
      setEstatisticas({ vitorias, totalJogos });

      // Opcional: mantém a flag 'jaJogou' se quiser usar para outra finalidade,
      // mas ela não interfere mais na contagem de jogos.
      if (!localStorage.getItem('jaJogouEinsteins')) {
        localStorage.setItem('jaJogouEinsteins', 'true');
      }

      // Atualiza o estaaado com os novos dados para refletir na UI
      setEstatisticas({ vitorias, totalJogos });

    } catch (error) {
      console.error("Falha ao processar estatísticas do jogo", error);
    }

    // Esconde o menu inicial para começar o jogo
    setMostrarMenuInicial(false);
  };

  const tituloAnimacaoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animarTitulo = useCallback(() => {
    if (tituloAnimacaoTimeoutRef.current) {
      clearTimeout(tituloAnimacaoTimeoutRef.current);
    }

    setTituloAnimando(true);
    tituloAnimacaoTimeoutRef.current = setTimeout(() => {
      setTituloAnimando(false);
      tituloAnimacaoTimeoutRef.current = null;
    }, 4000); // ajuste conforme o tempo real da animação CSS
  }, []);

  const [mostrarEinsteinFinal, setMostrarEinsteinFinal] = useState(false);
  const [mostrarBalaoFinal, setMostrarBalaoFinal] = useState(false);

  useEffect(() => {
    const fimDeJogo = localStorage.getItem('einsteins_fimDeJogo');
    if (fimDeJogo === 'true') {
      setModoVisualFinal(true);
      setMostrarMenuInicial(false);
      setMostrarBotoes(false);
      setGridVisivel(false);
      setJogoFinalizado(true);
      setMostrarBotaoFiquePorDentro(true);

      const dadosVencedores = localStorage.getItem('quadroVencedoresEinsteins');
      if (dadosVencedores) {
        setVencedores(JSON.parse(dadosVencedores));
      }

      const vitorias = parseInt(localStorage.getItem('vitoriasEinsteins') || '0', 10);
      const totalJogos = parseInt(localStorage.getItem('totalJogosEinsteins') || '0', 10);
      setEstatisticas({ vitorias, totalJogos });

      const acertosSalvos = JSON.parse(localStorage.getItem('einsteins_acertos') || '[]');
      if (acertosSalvos.length > 0) {
        setAcertos(acertosSalvos);
      } else {
        setAcertos(Grupos);
      }

      const vidasSalvas = parseInt(localStorage.getItem('einsteins_vidas') || '0', 10);
      setVidas(vidasSalvas);

      setJogoTravadoCarregado(true);

      // ================= RESTAURAR PROGRESSO SE NÃO FOR FIM DE JOGO =================
      if (fimDeJogo !== 'true') {
        const progresso = localStorage.getItem('einsteins_progressoAtual');
        if (progresso) {
          try {
            const {
              vidas,
              acertos,
              palavrasAtivas,
              palavrasExibidas,
              shufflePressCount,
              vidasOrdemExibição
            } = JSON.parse(progresso);

            setMostrarMenuInicial(false);
            setVidas(vidas);
            setAcertos(acertos);
            setPalavrasAtivas(palavrasAtivas);
            setPalavrasExibidas(palavrasExibidas);
            setShufflePressCount(shufflePressCount);
            setEinsteinOrder(vidasOrdemExibição);
            setGridVisivel(true);
            setMostrarBotoes(true);
          } catch (error) {
            console.error("Erro ao restaurar progresso do jogador:", error);
          }
        }
      }

    }

    // Função de inicialização otimizada
    const initializeGame = () => {
      // Inicialização das frases de erro (memoizada)
      const shuffledErrorPhrases = shuffleArray([...frasesErro]);
      setFrasesErroDisponiveis(shuffledErrorPhrases);

      // Inicialização otimizada das palavras
      const shuffledInitialWords = shuffleArray([...todasPalavrasDoJogo]);

      // Batch de estados relacionados às palavras
      setPalavrasAtivas(todasPalavrasDoJogo);
      setPalavrasExibidas(shuffledInitialWords);

      // Estados de transição otimizados com reduce
      const initialTransitionStates = shuffledInitialWords.reduce((acc, palavra) => {
        acc[palavra] = {
          opacity: 1,
          transitionDelay: 0,
          transitionDuration: 800
        };
        return acc;
      }, {} as Record<string, { opacity: number, transitionDelay: number, transitionDuration: number }>);

      setPalavraTransitionStates(initialTransitionStates);
    };

    // Inicialização das refs otimizada
    const initializeRefs = () => {
      einsteinRefs.current = Array(4).fill(null);
    };

    // Execução das inicializações
    initializeGame();
    initializeRefs();

    // Cleanup function otimizada
    return () => {
      // Cleanup de refs
      einsteinRefs.current = [];
    };
  }, []); // Array de dependências vazio - executa apenas uma vez

  const jogoPerdido = vidas === 0;
  const jogoGanho = acertos.length === Grupos.length;

  const triggerBubbleVisualDisappearance = useCallback(() => {

    if (balaoAtivo) {
      setBalaoAtivo(null);

      if (onBubbleFullyDisappearedCallbackRef.current) {
        onBubbleFullyDisappearedCallbackRef.current();
        onBubbleFullyDisappearedCallbackRef.current = null;
      }
    }

  }, [balaoAtivo]);

  useEffect(() => {
    const handleGlobalClick = (event: any) => {
      // Verifica se há um balão ativo
      if (balaoAtivo) {
        // Opcional: Verificar se o clique NÃO foi no próprio balão
        // para evitar fechar acidentalmente ao clicar no balão
        const balaoElement = event.target.closest('.balao-fala'); // ajuste a classe conforme necessário

        if (!balaoElement) {
          triggerBubbleVisualDisappearance();
        }
      }
    };

    // Adiciona o listener quando há um balão ativo
    if (balaoAtivo) {
      document.addEventListener('click', handleGlobalClick);
    }

    // Cleanup: remove o listener
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [balaoAtivo, triggerBubbleVisualDisappearance]);

  const showBubble = useCallback((frase: string, indexEinstein: number | null, arrowLeft: string | null, callbackToExecuteAfterBubbleDisappears: (() => void) | null = null) => {

    // 2. Armazena o callback para ser executado após o balão desaparecer por clique
    onBubbleFullyDisappearedCallbackRef.current = callbackToExecuteAfterBubbleDisappears;

    // 3. Define a função interna que efetivamente mostrará o balão
    const executeShowNewBubble = () => {
      const finalBubbleLeft: string | null = null;
      const finalArrowLeft: string | null = arrowLeft;

      // B. ATUALIZA O ESTADO DO BALÃO APENAS UMA VEZ, com os valores finais calculados
      setBalaoAtivo({
        frase,
        indexEinstein,
        arrowLeft: finalArrowLeft,
        bubbleLeft: finalBubbleLeft,
        bubbleRight: null,
      } as any);

    };

    if (balaoAtivo) { // Se já existe um balão ATIVO (balaoAtivo não é null)
      setIsBubbleFadingOut(true); // Ativa a classe 'fade-out' para o balão atual


      setTimeout(() => {
        setBalaoAtivo(null);
        setIsBubbleFadingOut(false); // Limpa o estado de "fade-out"
        executeShowNewBubble(); // E só então mostra o novo balão
      }, FADE_OUT_DURATION_MS);
    } else { // Se não há balão ativo, mostra o novo imediatamente
      executeShowNewBubble();
    }
  }, [balaoAtivo]);

  const [agrupando, setAgrupando] = useState(false);

  const handleAgrupar = useCallback(() => {
    // 1. Verificações de segurança: não executa se outra ação estiver em andamento
    // ou se menos de 2 palavras estiverem selecionadas.
    if (agrupando || embaralhando || processandoErro || jogoPerdido || jogoGanho || selecionadas.length < 2) return;

    setAgrupando(true);

    // 2. Animação de Fade-Out (igual ao embaralhar)
    const palavrasParaAgrupar = [...palavrasExibidas];
    const fadeOutDelays = palavrasParaAgrupar.map(() => Math.random() * 400); // Mais rápido que embaralhar
    const maxOverallFadeOutDelay = Math.max(...fadeOutDelays.map(delay => delay + 300));

    const fadeOutStates = gerarTransitionStates(palavrasParaAgrupar, { opacity: 0, duration: 300 }, i => fadeOutDelays[i]);
    setPalavraTransitionStates(prev => ({ ...prev, ...fadeOutStates }));

    // 3. Lógica de Reordenação (O núcleo da funcionalidade)
    setTimeout(() => {
      // Separa as palavras não selecionadas das selecionadas
      const naoSelecionadas = palavrasAtivas.filter(p => !selecionadas.includes(p));

      // Embaralha apenas as palavras NÃO selecionadas para manter o resto aleatório
      const naoSelecionadasEmbaralhadas = shuffleArray(naoSelecionadas);

      // ALTERAÇÃO PRINCIPAL: Agrupa as palavras selecionadas sempre no final da lista.
      const novasPalavrasExibidas = [...naoSelecionadasEmbaralhadas, ...selecionadas];

      setPalavrasExibidas(novasPalavrasExibidas);

      // 4. Animação de Fade-In
      const fadeInDelays = novasPalavrasExibidas.map(() => Math.random() * 400);
      const maxOverallFadeInDelay = Math.max(...fadeInDelays.map(delay => delay + 300));
      const fadeInStates = gerarTransitionStates(novasPalavrasExibidas, { opacity: 1, duration: 300 }, i => fadeInDelays[i]);

      requestAnimationFrame(() => {
        setPalavraTransitionStates(prev => ({ ...prev, ...fadeInStates }));
      });

      // 5. Finaliza o estado de "agrupando"
      setTimeout(() => {
        setAgrupando(false);
      }, maxOverallFadeInDelay + 100);

    }, maxOverallFadeOutDelay + 50);

  }, [
    agrupando, embaralhando, processandoErro, jogoPerdido, jogoGanho,
    selecionadas, palavrasExibidas, palavrasAtivas
  ]);

  const handleLimpar = useCallback(() => {
    // Se o jogo estiver em um estado que bloqueia ações, não faz nada.
    if (jogoPerdido || jogoGanho || processandoErro || embaralhando || mostrarMensagemMotivacao) return;

    // A única ação é redefinir o array de palavras selecionadas.
    setSelecionadas([]);

  }, [jogoPerdido, jogoGanho, processandoErro, embaralhando, mostrarMensagemMotivacao]);

  // Mova esta função para FORA de verificar e coloque junto com as outras funções principais:

  const handleEinsteinClick = useCallback((einsteinIndex: number) => {
    // Previne clique se está em cooldown ou se o jogo acabou
    if (einsteinClickCooldowns[einsteinIndex] || jogoPerdido || jogoGanho) return;

    // Array de animações possíveis (memoizado)
    const animations = ['bounce', 'heartbeat', 'swing', 'shake', 'jello', 'rubber', 'tada', 'slide-out', 'spin', 'wiggle', 'pulse', 'flip'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

    // Batch de mudanças de estado para reduzir re-renders
    setEinsteinAnimations(prev => ({
      ...prev,
      [einsteinIndex]: randomAnimation
    }));

    setEinsteinClickCooldowns(prev => ({
      ...prev,
      [einsteinIndex]: true
    }));

    // Cleanup otimizado com uma única operação
    const timeoutId = setTimeout(() => {
      // Batch cleanup para reduzir re-renders
      setEinsteinAnimations(prev => {
        const { [einsteinIndex]: removed, ...rest } = prev;
        return rest;
      });

      setEinsteinClickCooldowns(prev => {
        const { [einsteinIndex]: removed, ...rest } = prev;
        return rest;
      });
    }, 800);

    // Cleanup do timeout se o componente for desmontado
    return () => clearTimeout(timeoutId);
  }, [einsteinClickCooldowns, jogoPerdido, jogoGanho]);

  const handleBubbleClick = useCallback(() => {
    triggerBubbleVisualDisappearance();
  }, [triggerBubbleVisualDisappearance]);

  useEffect(() => {
    if (jogoPerdido && !jogoGanho && !gameOverProcessedRef.current) {

      // A animação de saída do Einstein tem 1.4s (1400ms).
      // Vamos esperar ela terminar antes de iniciar o "Game Over".
      setTimeout(() => {
        gameOverProcessedRef.current = true;
        setProcessandoErro(true);
        setAcertosOriginais([...acertos]);

        setGridTransitionClass('grid-fade-out');
        setTimeout(() => {
          setGridVisivel(false);
        }, MOTIVATION_TRANSITION_DURATION);

        // Grupos não acertados...
        const gruposNaoAcertados = Grupos.filter(
          g => !acertos.some(a => a.name === g.name)
        ).map((g, index) => {
          const indiceTotal = acertos.length + index;
          const cor = getGameOverColor(indiceTotal);

          const coresCSS = [
            { bg: 'bg-sky-200', border: 'border-sky-400' },
            { bg: 'bg-amber-200', border: 'border-amber-400' },
            { bg: 'bg-rose-200', border: 'border-rose-400' },
            { bg: 'bg-purple-200', border: 'border-purple-400' }
          ];

          const cssIndex = indiceTotal % coresCSS.length;
          const cssClasses = coresCSS[cssIndex];

          return {
            ...g,
            reveladoNoFinal: true,
            color: cor,
            backgroundColor: cor,
            cssClasses: cssClasses,
            debugIndex: index
          };
        });

        setTimeout(() => {
          setGruposARevelar(gruposNaoAcertados);
        }, 800);

        const totalGrupos = acertos.length + gruposNaoAcertados.length;
        const tempoAnimacaoBarras = 800 + (totalGrupos * 300);
        const tempoEsperaAdicional = 3500;

        setTimeout(() => {
          console.log("Mostrando Einstein final - jogo perdido!");
          setMostrarEinsteinFinal(true);
          localStorage.setItem('einsteins_fimDeJogo', 'true');
          localStorage.removeItem('einsteins_progressoAtual');
          localStorage.setItem('einsteins_acertos', JSON.stringify(acertos));
          registrarResultado(false, 4);
        }, tempoAnimacaoBarras + tempoEsperaAdicional);

        console.log("frasesFimDeJogo disponíveis:", frasesFimDeJogo);

        setTimeout(() => {
          if (!frasesFimDeJogo || frasesFimDeJogo.length === 0) {
            console.error("frasesFimDeJogo não está definido!");
            setFraseFinal("Que pena! Mas não desista, a ciência está cheia de tentativas!");
          } else {
            const fraseAleatoria = frasesFimDeJogo[Math.floor(Math.random() * frasesFimDeJogo.length)];
            setFraseFinal(fraseAleatoria);
          }
          console.log("Definindo mostrarBalaoFinal como true");
          setMostrarBalaoFinal(true);
        }, tempoAnimacaoBarras + tempoEsperaAdicional + 700);

      }, 750); // Atraso de 1.5 segundos para garantir que a animação termine.
    }
  }, [jogoPerdido, acertos, jogoGanho, registrarResultado]);

  // Efeito para carregar os vencedores do localStorage ao iniciar
  useEffect(() => {
    try {
      const dadosSalvos = localStorage.getItem('quadroVencedoresEinsteins');
      if (dadosSalvos) {
        setVencedores(JSON.parse(dadosSalvos));
      }
    } catch (error) {
      console.error("Falha ao carregar vencedores do localStorage", error);
    }
  }, []); // Array vazio para executar apenas uma vez

  // Efeito para salvar os vencedores no localStorage sempre que a lista for atualizada
  useEffect(() => {
    try {
      // Não salva um array vazio no início, apenas após a primeira vitória
      if (vencedores.length > 0) {
        localStorage.setItem('quadroVencedoresEinsteins', JSON.stringify(vencedores));
      }
    } catch (error) {
      console.error("Falha ao salvar vencedores no localStorage", error);
    }
  }, [vencedores]);


  useEffect(() => {
    // Reset de todos os estados relacionados ao final quando o jogo reinicia
    if (vidas === 4 && gameOverProcessedRef.current) {
      console.log("Resetando estados do Einstein final");
      gameOverProcessedRef.current = false;
      setMostrarEinsteinFinal(false);
      setMostrarBalaoFinal(false);
      setEpilogoEncerrado(false);
      setFraseFinal(null);
    }
  }, [vidas]);

  useEffect(() => {
    if (mostrarCaixaEmail || mostrarCaixaColaborador || mostrarEinsteinFinal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mostrarCaixaEmail, mostrarCaixaColaborador, mostrarEinsteinFinal]);

  useEffect(() => {
    if (mostrarInputNome) {
      // Bloqueia rolagem
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      // Restaura rolagem
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }

    // Cleanup quando componente desmonta
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [mostrarInputNome]);

  useEffect(() => {
    console.log("Estados Einstein Final:", {
      jogoPerdido,
      jogoGanho,
      vidas,
      mostrarEinsteinFinal,
      mostrarBalaoFinal,
      gameOverProcessed: gameOverProcessedRef.current
    });
  }, [jogoPerdido, jogoGanho, vidas, mostrarEinsteinFinal, mostrarBalaoFinal]);

  // Efeito 2: Processa a fila de revelação um por um

  // ADICIONE também um useEffect para resetar o gameOverProcessedRef quando necessário:
  useEffect(() => {
    // Reset da flag quando o jogo reinicia (vidas volta a 4)
    if (vidas === 4 && gameOverProcessedRef.current) {
      gameOverProcessedRef.current = false;
    }
  }, [vidas]);

  useEffect(() => {
    // Se não houver grupos na fila para revelar, não faz nada
    if (gruposARevelar.length === 0) {
      return;
    }

    // Configura um intervalo para revelar o próximo grupo a cada 0.7 segundos
    const timer = setInterval(() => {
      setGruposARevelar(prevFila => {
        // Se a fila está vazia, para o intervalo
        if (prevFila.length === 0) {
          clearInterval(timer);
          return prevFila;
        }

        // Pega o primeiro grupo da fila
        const proximoGrupo = prevFila[0];

        // 🔧 CORREÇÃO PRINCIPAL: Preservar TODAS as propriedades do grupo
        setAcertos(prevAcertos => {
          const jaExiste = prevAcertos.some(acerto => acerto.name === proximoGrupo.name);

          if (!jaExiste) {
            // 🔧 IMPORTANTE: Usar spread operator para manter TODAS as propriedades
            // incluindo 'color', 'reveladoNoFinal', etc.
            const grupoCompleto = {
              ...proximoGrupo, // Mantém todas as propriedades originais
              // Se necessário, você pode sobrescrever propriedades específicas aqui
            };

            console.log('Adicionando grupo aos acertos:', grupoCompleto);
            return [...prevAcertos, grupoCompleto];
          }

          return prevAcertos;
        });

        // Remove o grupo que acabamos de processar da fila
        return prevFila.slice(1);
      });

    }, 700); // Intervalo entre cada barra

    // Função de limpeza: para o intervalo se o componente for desmontado
    return () => clearInterval(timer);

  }, [gruposARevelar]);

  // 1. PRIMEIRO: Corrigir a função getGameOverColor para usar as mesmas cores das barras normais
  const getGameOverColor = (index: number): string => {
    // Usar as mesmas cores que são usadas nas barras normais de acerto
    const coresNormais = [
      { bg: 'bg-sky-200', border: 'border-sky-400', color: '#bae6fd' }, // sky-200
      { bg: 'bg-amber-200', border: 'border-amber-400', color: '#fcd34d' }, // amber-200
      { bg: 'bg-rose-200', border: 'border-rose-400', color: '#fda4af' }, // rose-200
      { bg: 'bg-purple-200', border: 'border-purple-400', color: '#e9d5ff' } // purple-200
    ];

    const colorIndex = index % coresNormais.length;
    const selectedColorObj = coresNormais[colorIndex];

    console.log(`Grupo ${index} recebeu cor ${selectedColorObj.color} (índice ${colorIndex})`);

    return selectedColorObj.color;
  };

  const cliquePalavras = useCallback((palavra: string) => {
    if (jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao) return;
    setSelecionadas(prev =>
      prev.includes(palavra)
        ? prev.filter(p => p !== palavra)
        : prev.length < 4
          ? [...prev, palavra]
          : prev
    )
  }, [jogoPerdido, jogoGanho, processandoErro, mostrarMensagemMotivacao]);

  useEffect(() => {
    let buffer = '';

    const handleKeyPress = (e: KeyboardEvent) => {
      buffer += e.key.toLowerCase();

      // Mantém só os últimos 10 caracteres para evitar acúmulo
      if (buffer.length > 10) {
        buffer = buffer.slice(-10);
      }

      // Verifica se a sequência para vencer foi digitada
      if (buffer.includes('dundies')) {
        console.log('CHEAT: vitória forçada via "dundies"!');
        setAcertos([...Grupos]);
        buffer = '';
      }

      // Verifica se a sequência para derrota foi digitada
      if (buffer.includes('ddmfateam')) {
        console.log('CHEAT: derrota forçada via "ddmfateam"!');
        setVidas(0);
        buffer = '';
      }
      if (buffer.includes('barra')) {
        console.log('CHEAT: Zerar estatísticas e quadro de vencedores via "zerarbarra"');
        localStorage.removeItem('vitoriasEinsteins');
        localStorage.removeItem('totalJogosEinsteins');
        localStorage.removeItem('rankingsEinsteins');
        localStorage.removeItem('quadroVencedoresEinsteins');
        setEstatisticas({ vitorias: 0, totalJogos: 0 });
        setVencedores([]);
        buffer = '';
      }
      if (buffer.includes('bloquear')) {
        console.log('CHEAT: resetando o jogo via "bloquear"');
        localStorage.removeItem('einsteins_fimDeJogo');
        window.location.reload();
        buffer = '';
      }
    };

    // Adiciona o listener apenas para a versão web (ignora mobile, pois sem teclado)
    window.addEventListener('keypress', handleKeyPress);

    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  useEffect(() => {
    let clickCount = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let holdTimeoutId: NodeJS.Timeout | null = null;

    const tituloElement = document.querySelector('.einsteins-title');

    if (!tituloElement) return;

    const handleClick = () => {
      clickCount++;

      // Reseta o contador de cliques após 3s de inatividade
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => (clickCount = 0), 3000);

      if (clickCount === 5) {
        console.log('CHEAT: vitória forçada via 5 cliques!');
        setAcertos([...Grupos]);
        clickCount = 0;
      }
    };

    const handleMouseDown = () => {
      holdTimeoutId = setTimeout(() => {
        console.log('CHEAT: derrota forçada ao segurar 3s!');
        setVidas(0);
        clickCount = 0;
      }, 3000);
    };

    const handleMouseUp = () => {
      if (holdTimeoutId) {
        clearTimeout(holdTimeoutId);
        holdTimeoutId = null;
      }
    };

    tituloElement.addEventListener('click', handleClick);
    tituloElement.addEventListener('mousedown', handleMouseDown);
    tituloElement.addEventListener('mouseup', handleMouseUp);
    tituloElement.addEventListener('mouseleave', handleMouseUp);

    // Suporte para toque em celular (touchstart/touchend)
    tituloElement.addEventListener('touchstart', handleMouseDown);
    tituloElement.addEventListener('touchend', handleMouseUp);
    tituloElement.addEventListener('touchcancel', handleMouseUp);

    return () => {
      tituloElement.removeEventListener('click', handleClick);
      tituloElement.removeEventListener('mousedown', handleMouseDown);
      tituloElement.removeEventListener('mouseup', handleMouseUp);
      tituloElement.removeEventListener('mouseleave', handleMouseUp);
      tituloElement.removeEventListener('touchstart', handleMouseDown);
      tituloElement.removeEventListener('touchend', handleMouseUp);
      tituloElement.removeEventListener('touchcancel', handleMouseUp);
      if (timeoutId) clearTimeout(timeoutId);
      if (holdTimeoutId) clearTimeout(holdTimeoutId);
    };
  }, []);

  const salvandoRef = useRef(false);

  // Função para salvar o nome do vencedor e reiniciar o jogo
  const handleSalvarVencedor = (e: any) => {
    e.preventDefault();

    // ⚠️ Impede execução múltipla instantânea
    if (salvandoRef.current) return;

    // ⚠️ Marca que está salvando
    salvandoRef.current = true;

    if (!nomeAtual.trim()) return;

    const errosRealizados = 4 - vidas;
    const ranking = calcularRanking(errosRealizados);
    const novoVencedor = {
      nome: nomeAtual.trim(),
      ranking: ranking.titulo,
      erros: errosRealizados,
      data: new Date().toLocaleDateString('pt-BR')

    };

    setVencedores(prev => [...prev, novoVencedor]);

    setMostrarInputNome(false);
    setNomeAtual('');
    setMostrarBotoes(false);
    setGridVisivel(false);
    setVidas(0);
    setModoVisualFinal(true);
    setMostrarBotaoFiquePorDentro(true);

    localStorage.setItem('einsteins_fimDeJogo', 'true');
    localStorage.setItem('einsteins_acertos', JSON.stringify(acertos));
    localStorage.setItem('einsteins_vidas', vidas.toString());
    localStorage.removeItem('einsteins_progressoAtual');

  };

  const handleFecharTelaFinal = useCallback(() => {
    // Apenas executa se o Einstein final estiver visível
    if (mostrarEinsteinFinal) {
      setMostrarEinsteinFinal(false);
      setMostrarBalaoFinal(false);
      setMostrarBotoes(false);

      // ADICIONA UM DELAY DE 1 SEGUNDOS ANTES DE MOSTRAR A CAIXA
      setTimeout(() => {
        setModoVisualFinal(true);
        setMostrarBotaoFiquePorDentro(true);

      }, 1000); // 1 segundo após o einstein final desaparecer
    }
  }, [mostrarEinsteinFinal]);

  const handleFecharInputNome = () => {
    setMostrarInputNome(false);
    setNomeAtual('');
    setMostrarBotoes(false);
    setGridVisivel(false);
    setVidas(0);
    setModoVisualFinal(true);
    setMostrarBotaoFiquePorDentro(true);

    // Salva o bloqueio do jogo
    localStorage.setItem('einsteins_fimDeJogo', 'true');
    localStorage.setItem('einsteins_acertos', JSON.stringify(acertos));
    localStorage.setItem('einsteins_vidas', vidas.toString());
  };


  // Função para controlar o fechamento da caixa de e-mail e o fluxo do jogo
  const handleFecharCaixaEmail = () => {
    setMostrarCaixaEmail(false);

    // Se o jogo foi ganho, agora sim ativamos o modo visual final
    if (jogoGanho) {
      setJogoFinalizado(true);
      localStorage.setItem('einsteins_fimDeJogo', 'true');

      setModoVisualFinal(true);
      localStorage.setItem('einsteins_fimDeJogo', 'true');

      localStorage.setItem('einsteins_acertos', JSON.stringify(acertos));
      localStorage.setItem('einsteins_vidas', vidas.toString());

    }
  };

  const calcularDistribuicaoRanking = () => {
    const dados = JSON.parse(localStorage.getItem('rankingsEinsteins') || '{}');
    const totalJogos = parseInt(localStorage.getItem('totalJogosEinsteins') || '0', 10);
    const totalVitorias:any = Object.values(dados).reduce((acc: any, val: any) => acc + val, 0);
    const derrotas = Math.max(totalJogos - totalVitorias, 0);

    const cores = {
      "GENIAL": "#facc15",
      "ADMIRÁVEL": "#38bdf8",
      "PERSPICAZ": "#FB7185",
      "INABALÁVEL": "#c084fc",
      "DERROTA": "#606B7F"
    };

    type Ranking = keyof typeof cores

    const distribuicaoBase = [
      ...Object.entries(dados).map(([ranking, qtd]: any) => ({
        ranking,
        cor: cores[ranking as Ranking] || "#d1d5db",
        largura: totalJogos > 0 ? ((qtd / totalJogos) * 100).toFixed(2) : '0.00'
      })),
      {
        ranking: "DERROTA",
        cor: cores["DERROTA"],
        largura: totalJogos > 0 ? ((derrotas / totalJogos) * 100).toFixed(2) : '0.00'
      }
    ];

    return distribuicaoBase;
  };
  // Efeito para mostrar o input de nome ao vencer
  useEffect(() => {
    if (jogoGanho && !processandoErro && !gameOverProcessedRef.current && !jogoTravadoCarregado) {
      registrarResultado(true, 4 - vidas);

      // Atraso para permitir que a última animação de acerto termine
      setTimeout(() => {
        setMostrarInputNome(true);
      }, 1500);
    }
  }, [jogoGanho, processandoErro]);
  const verificar = useCallback(() => {
    if (jogoPerdido || jogoGanho || selecionadas.length !== 4 || processandoErro || mostrarMensagemMotivacao) return;

    setMostrarMensagemMotivacao(false);

    // Verifica se o grupo está 100% correto (4 palavras certas)
    const grupoCorreto = Grupos.find(group =>
      selecionadas.filter(p => group.words.includes(p)).length === 4
    );

    // Verifica se o jogador acertou 3 palavras de um mesmo grupo
    const grupoParcial = Grupos.find(group =>
      selecionadas.filter(p => group.words.includes(p)).length === 3
    );

    // ========================== ACERTO COMPLETO (4 certas) ==========================
    if (grupoCorreto && !acertos.some(a => a.name === grupoCorreto.name)) {
      setProcessandoErro(true);
      setPalavrasComAnimacaoSalto(selecionadas);
      animarTitulo();

      setTimeout(() => {
        setPalavrasComAnimacaoSalto([]);
        triggerBubbleVisualDisappearance();
        setErroAtivo(false);
        setPalavraTransitionStates(prevStates => {
          const newStates = { ...prevStates };
          grupoCorreto.words.forEach(word => {
            newStates[word] = {
              opacity: 0,
              transform: 'scale(0.8)',
              transitionDuration: 1000,
              transitionDelay: 0,
              transitionProperty: 'opacity, transform'
            } as any;
          });
          return newStates;
        });
        setTimeout(() => {
          setSelecionadas([]);
          setAcertos(prev => [...prev, grupoCorreto]);
          const newPalavrasAtivas = palavrasAtivas.filter(p => !grupoCorreto.words.includes(p));
          setPalavrasAtivas(newPalavrasAtivas);
          setPalavrasExibidas(shuffleArray(newPalavrasAtivas));

          setPalavraTransitionStates(prevStates => {
            const newStates = { ...prevStates };
            grupoCorreto.words.forEach(word => delete newStates[word]);
            newPalavrasAtivas.forEach(word => {
              newStates[word] = {
                opacity: 1,
                transform: 'scale(1)',
                transitionDuration: 1200,
                transitionDelay: 0,
                transitionProperty: 'opacity, transform'
              } as any;
            });
            return newStates;
          });

          setProcessandoErro(false);
        }, 1000);
      }, 1000);
    }

    // ===================== [NOVO BLOCO] DERROTA NA ÚLTIMA VIDA =====================
    // Esta verificação agora tem prioridade sobre "quase acerto".
    // Se não foi um acerto completo E a vida é 1, o jogo acaba aqui.
    else if (vidas === 1) {
      setProcessandoErro(true);
      setErroAtivo(true); // Ativa o tremor

      setTimeout(() => {
        setErroAtivo(false); // Desativa o tremor

        setTimeout(() => {
          // Pega a função de perder vida que já criamos
          const handleLifeLossAndUnlockButtons = () => {
            const isLastLife = vidas === 1;
            if (isLastLife) {
              setIsAnimatingLastLife(true);
            }
            setVidas(prev => prev - 1);
            setTimeout(() => {
              if (isLastLife) {
                setIsAnimatingLastLife(false);
              } else {
                setProcessandoErro(false);
              }
            }, 900);
          };

          // Lógica das frases especiais de última vida
          const frasesUltimaVida = [
            "Você deu o seu melhor, isso é o que importa.",
            "Não deixe esse momento definir toda sua capacidade.",
            "A vida é mesmo cheia de surpresas.",
            "Clássico. Simplesmente clássico.",
            "Bom, isso não saiu como planejado,não é mesmo?",
            "Tem certeza que não foi de propósito?",
            "A lei de Murphy em ação, pessoal.",
            "O destino tem um senso de humor questionável.",
            "Houston, we've had a problem.",
            "Às vezes as coisas simplesmente acontecem.",
            "Você realmente se superou aí.",
            "Bem, isso esclarece algumas coisas."
          ];
          const fraseFinal = frasesUltimaVida[Math.floor(Math.random() * frasesUltimaVida.length)];

          // Mostra o balão com a frase final e encerra o jogo
          showBubble(fraseFinal, 0, '48%', handleLifeLossAndUnlockButtons);

        }, 100);
      }, TREMOR_DURATION_MS);
    }

    // ===================== QUASE ACERTO (3 palavras certas E vidas > 1) =====================
    else if (grupoParcial) {
      setProcessandoErro(true);
      setErroAtivo(true);

      setTimeout(() => {
        setErroAtivo(false);

        setTimeout(() => {
          let proximaFilaFrases = [...frasesQuaseAcertoDisponiveis];
          if (proximaFilaFrases.length === 0) {
            proximaFilaFrases = shuffleArray([...frasesQuaseAcerto]);
          }
          const fraseParaExibir = proximaFilaFrases.shift()!;
          setFrasesQuaseAcertoDisponiveis(proximaFilaFrases);

          const indexDaVidaASumir = vidas - 1;

          let arrowPosition: string;
          switch (indexDaVidaASumir) {
            case 3: arrowPosition = '83%'; break;
            case 2: arrowPosition = '68.5%'; break;
            case 1: arrowPosition = '56%'; break;
            default: arrowPosition = '50%';
          }

          const handleLifeLossAndUnlockButtons = () => {
            const isLastLife = vidas === 1;
            if (isLastLife) {
              setIsAnimatingLastLife(true);
            }
            setVidas(prev => prev - 1);
            setTimeout(() => {
              if (isLastLife) {
                setIsAnimatingLastLife(false);
              } else {
                setProcessandoErro(false);
              }
            }, 900);
          };

          showBubble(fraseParaExibir, indexDaVidaASumir, arrowPosition, handleLifeLossAndUnlockButtons);
        }, 100);
      }, TREMOR_DURATION_MS);
    }

    // ===================== ERRO COMUM (0-2 palavras certas E vidas > 1) =====================
    else {
      setProcessandoErro(true);
      setErroAtivo(true);
      setTimeout(() => {
        setErroAtivo(false);

        setTimeout(() => {
          const indexDaVidaASumir = vidas - 1;
          const handleLifeLossAndUnlockButtons = () => {
            const isLastLife = vidas === 1;
            if (isLastLife) {
              setIsAnimatingLastLife(true);
            }
            setVidas(prev => prev - 1);
            setTimeout(() => {
              if (isLastLife) {
                setIsAnimatingLastLife(false);
              } else {
                setProcessandoErro(false); // 
              }
            }, 900);
          };

          // ===== NOVA LÓGICA =====
          // Se for a primeira vida perdida (vidas ainda é 4), apenas perde a vida sem mostrar o balão.
          if (vidas === 4) {
            handleLifeLossAndUnlockButtons();
          } else {
            // Para as vidas subsequentes, mantém a lógica de mostrar o balão com probabilidade.
            if (Math.random() < 0.60) { // 
              let proximaFilaFrases = [...frasesErroDisponiveis];
              if (proximaFilaFrases.length === 0) {
                proximaFilaFrases = shuffleArray([...frasesErro]);
              }
              const fraseParaExibir = proximaFilaFrases.shift()!;
              setFrasesErroDisponiveis(proximaFilaFrases);

              let arrowPosition: string;
              switch (indexDaVidaASumir) {
                case 2: arrowPosition = '70.5%'; break;
                case 1: arrowPosition = '57%'; break;
                default: arrowPosition = '50%';
              }
              showBubble(fraseParaExibir, indexDaVidaASumir, arrowPosition, handleLifeLossAndUnlockButtons); // 
            } else {
              handleLifeLossAndUnlockButtons();  // Perde vida sem balão
            }
          }
        }, 100);
      }, TREMOR_DURATION_MS);
    }

  }, [
    jogoPerdido, jogoGanho, selecionadas, processandoErro, mostrarMensagemMotivacao,
    acertos, palavrasAtivas, vidas,
    frasesErroDisponiveis, frasesQuaseAcertoDisponiveis,
    triggerBubbleVisualDisappearance, showBubble, animarTitulo
  ]);

  const embaralhar = useCallback(() => {
    if (jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao) return;

    // Batch de estados iniciais para reduzir re-renders
    const updateInitialStates = () => {
      setShufflePressCount(prev => {
        const newCount = prev + 1;

        const frase = fraseDeEmbaralharPorCount.get(newCount);
        if (frase) {
          setTimeout(() => {
            const { einsteinIndex, arrowPosition } = calcularPosicaoSeta(vidas, vidasOrdemExibição);
            showBubble(frase, einsteinIndex, arrowPosition);
          }, 4200);
        }

        return newCount;
      });

      setEmbaralhando(true);
      triggerBubbleVisualDisappearance();
      setErroAtivo(false);
    };

    updateInitialStates();

    // Sistema de sorteio para os Einsteins 
    const einsteinWinChance = Math.random() < 0.65; // probabilidade dos einsteins embaralharem

    const fadeOutDurationPerItem = 250;
    const fadeInDurationPerItem = 300;
    const maxRandomDelay = 450;

    // Pré-computação de delays para melhor performance
    const palavrasParaShuffle = [...palavrasExibidas];
    const fadeOutDelays = palavrasParaShuffle.map(() => Math.random() * maxRandomDelay);
    const maxOverallFadeOutDelay = Math.max(...fadeOutDelays.map(delay => delay + fadeOutDurationPerItem));

    // As palavras sempre começam a embaralhar imediatamente
    const fadeOutStates = gerarTransitionStates(palavrasParaShuffle, { opacity: 0, duration: fadeOutDurationPerItem }, i => fadeOutDelays[i]);
    setPalavraTransitionStates(prev => ({ ...prev, ...fadeOutStates }));


    setOrdemOriginalEinsteins([...vidasOrdemExibição]);

    // Einstein shuffle com sorteio
    if (einsteinWinChance) {
      const einsteinShuffleDelay = Math.random() * (maxRandomDelay * 0.2);

      setOrdemOriginalEinsteins([...vidasOrdemExibição]); // SALVA a ordem original

      setTimeout(() => {
        const novaOrdem = shuffleArray([...vidasOrdemExibição]);
        setEinsteinOrder(novaOrdem);

        // Embaralhar Einsteins: volta após 1 segundo
        setTimeout(() => {
          setEinsteinOrder(ordemOriginalEinsteins ?? [0, 1, 2, 3]);
        }, 1000);
      }, einsteinShuffleDelay);

      setTimeout(reorganizePalavras, maxOverallFadeOutDelay + 50);
    } else {
      setTimeout(reorganizePalavras, maxOverallFadeOutDelay + 50);
    }
    // Função principal de reorganização (mantida igual)
    function reorganizePalavras() {
      const newPalavrasAtivas = [...palavrasAtivas];
      const newPalavrasExibidasShuffled = shuffleArray(newPalavrasAtivas);

      // Batch de atualizações
      setPalavrasExibidas(newPalavrasExibidasShuffled);

      // Estados iniciais otimizados
      const initialFadeInStates = newPalavrasExibidasShuffled.reduce((acc, palavra) => {
        acc[palavra] = { opacity: 0, transitionDelay: 0, transitionDuration: fadeInDurationPerItem };
        return acc;
      }, {} as Record<string, { opacity: number, transitionDelay: number, transitionDuration: number }>);

      setPalavraTransitionStates(initialFadeInStates);

      // Fade-in otimizado
      const fadeInDelays = newPalavrasExibidasShuffled.map(() => Math.random() * maxRandomDelay);
      const maxOverallFadeInDelay = Math.max(...fadeInDelays.map(delay => delay + fadeInDurationPerItem));

      const fadeInStates = newPalavrasExibidasShuffled.reduce((acc, palavra, index) => {
        acc[palavra] = {
          opacity: 1,
          transitionDelay: fadeInDelays[index],
          transitionDuration: fadeInDurationPerItem
        };
        return acc;
      }, {} as Record<string, { opacity: number, transitionDelay: number, transitionDuration: number }>);

      requestAnimationFrame(() => {
        setPalavraTransitionStates(prev => ({ ...prev, ...fadeInStates }));
      });

      // Cleanup final otimizado
      setTimeout(() => {
        // Batch de operações finais
        setEmbaralhando(false);
        setSelecionadas(prev => prev.filter(p => newPalavrasExibidasShuffled.includes(p)));

        setPalavraTransitionStates(prevStates => {
          const optimizedStates = { ...prevStates };
          Object.keys(optimizedStates).forEach(word => {
            optimizedStates[word] = {
              ...optimizedStates[word],
              transitionDelay: 0,
              transitionDuration: 400
            };
          });
          return optimizedStates;
        });
      }, maxOverallFadeOutDelay + maxOverallFadeInDelay + 100);
    }

  }, [
    jogoPerdido, jogoGanho, processandoErro, mostrarMensagemMotivacao,
    triggerBubbleVisualDisappearance, palavrasExibidas, palavrasAtivas,
    showBubble, vidas, vidasOrdemExibição, ordemOriginalEinsteins
  ]);

  const handleMotivacao = useCallback(() => {
    if (jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao) return;

    setProcessandoErro(true);
    triggerBubbleVisualDisappearance();
    setErroAtivo(false);

    setGridTransitionClass('grid-fade-out');
    const fraseAleatoria = frasesMotivacionais[Math.floor(Math.random() * frasesMotivacionais.length)];
    setMensagemMotivacionalAtual(fraseAleatoria);

    setTimeout(() => {
      setGridVisivel(false);
      setMostrarMensagemMotivacao(true);
      requestAnimationFrame(() => {
        setMessageTransitionClass('fade-in');
      });
    }, MOTIVATION_TRANSITION_DURATION);
  }, [
    jogoPerdido, jogoGanho, processandoErro, mostrarMensagemMotivacao,
    triggerBubbleVisualDisappearance,
  ]);

  const handleClickMensagemMotivacao = useCallback(() => {
    setMessageTransitionClass('fade-out');

    setTimeout(() => {
      setMostrarMensagemMotivacao(false);
      setMensagemMotivacionalAtual('');
      setGridVisivel(true);
      setGridTransitionClass('grid-fade-out');
      requestAnimationFrame(() => {
        setGridTransitionClass('grid-fade-in');
        setProcessandoErro(false);
      });
    }, MOTIVATION_TRANSITION_DURATION);
  }, []);

  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
    exit: {
      opacity: 0,
      y: -20, // Move para cima ao sair
    }
  };

  const animarWaveMenu = (comDelay = false) => {
    setWaveMenuAtivo(false);
    requestAnimationFrame(() => {
      setWaveDelayAtivo(comDelay);
      setWaveMenuAtivo(true);
    });
  };

  useEffect(() => {
    if (mostrarMenuInicial) {
      animarWaveMenu(true); // ativa com delay na primeira vez
    }
  }, [mostrarMenuInicial]);

  return (
    <>

      {/* ========== MENU INICIAL ========== */}
      <AnimatePresence>
        {mostrarMenuInicial && (
          <motion.div
            className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 px-4 py-8 text-center"
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <motion.h1
              className={`einsteins-title text-5xl font-bold tracking-widest mb-10 select-none ${waveMenuAtivo ? 'title-wave-animation' : ''}`}
              variants={menuItemVariants}
              onClick={() => animarWaveMenu(false)}
            >
              {"EINSTEINS".split("").map((letra, i) => (
                <span
                  key={i}
                  className="letter inline-block"
                  style={{ animationDelay: `${(waveDelayAtivo ? 1 : 0) + i * 0.1}s` }}
                >
                  {letra}
                </span>
              ))}
            </motion.h1>

            <motion.p
              className="select-none text-lg bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold tracking-widest -mb-7 mt-2"
              variants={menuItemVariants}
            >
              #01: o primeiro enigma
            </motion.p>
            <motion.button
              onClick={handleIniciarJogo} // << ALTERE AQUI
              className="w-full max-w-xs bg-gray-900 text-white px-6 py-3 font-bold mt-16 mb-4 border-2 border-gray-800 shadow transition-all duration-300"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              variants={menuItemVariants}
            >
              JOGAR
            </motion.button>

            <motion.button
              onClick={() => {

                setMostrarComoJogar(true);
              }}
              className="select-none w-full max-w-xs bg-white text-gray-800 hover:scale-[1.03] px-6 py-3 font-semibold border-2 border-gray-800 hover:bg-gray-100 transition-all duration-300"
              variants={menuItemVariants}
            >
              COMO JOGAR
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== CAIXA COMO JOGAR ========== */}
      <AnimatePresence>
        {mostrarComoJogar && (
          <motion.div
            className="select-none fixed inset-0 flex items-center justify-center z-50 bg-white/55 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            onClick={() => {
              setMostrarComoJogar(false);
              setMostrarMenuInicial(true);
            }}
          >
            <motion.div
              id="caixa-como-jogar"
              className="relative bg-white p-6 sm:p-8 shadow-2xl text-center w-full max-w-lg overflow-visible z-10 2xl"
              style={{
                border: '5px solid transparent',
                background:
                  'linear-gradient(white, white) padding-box, linear-gradient(90deg, #7dd3fc, #fcd34d, #fda4af, #c4b5fd) border-box',
                willChange: 'transform',
              }}
              initial={{ opacity: 1, scale: 0.01, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.01, rotate: 0, filter: "blur(10px)" }}
              transition={{
                type: "spring",
                damping: 13,
                stiffness: 100,
                mass: 1.4,
                duration: 3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold mb-4">COMO JOGAR</h2>
              <p className="text-gray-700 mb-4 leading-relaxed text-lg">
                Encontre <strong>grupos de 4 palavras</strong> que tenham algo em comum.
              </p>
              <ul className="text-center text-gray-600 space-y-12 mb-6 text-base">
                Toque em <em>“Verificar”</em> para conferir se sua combinação está correta.
              </ul>
              <ul className="text-center text-gray-600 space-y-12 mb-6 text-base">
                Você tem quatro chances para resolver o desafio.
              </ul>

              <motion.button
                onClick={() => {
                  setMostrarComoJogar(false);
                  setMostrarMenuInicial(false);
                }}
                className="mt-4 mx-auto bg-gray-900 text-white px-6 py-3 font-bold md hover:scale-100 transition-transform"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Entendi, vamos jogar!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <style jsx>{`
  .btn-press-effect {
    transition: opacity 0.15s ease-in-out;
  }

  .btn-press-effect:active {
    transform: scale(0.90) translateY(1px);
    transition: transform 0.2s ease-out;
  }

  .ocultar-suave {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}

  .einsteins-title .letter {
    display: inline-block;
   animation-fill-mode: forwards !important;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  contain: layout style paint;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transition: transform 0.3s ease-in-out;
}
.letra-animada-final {
  transform: translateY(1200px) rotate(12deg);
  opacity: 0;
  transition: transform 7s ease-out, opacity 7s ease-out;
}

@keyframes rainbowBorder {
  0% {
    border-color: red;
  }
  20% {
    border-color: orange;
  }
  40% {
    border-color: yellow;
  }
  60% {
    border-color: green;
  }
  80% {
    border-color: blue;
  }
  100% {
    border-color: violet;
  }
}

.rainbow-border {
  animation: rainbowBorder 1.2s linear infinite;
  border-width: 4px;
  border-style: solid;
  border-radius: 1rem; /* match rounded-2xl */
}

.title-wave-animation {
  animation: wave 4s ease-in-out;
}

css.theme-result-item {
  color: white !important;
  border: none !important;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  transition: all 0.6s ease-out;
}

/* Garantir que cores inline tenham prioridade */
.theme-result-item[style*="background-color"] {
  background: var(--bg-color) !important;
}

  .layout-shift-container {
    transition: transform 0.8s ease-in-out;
  }

  .layout-shift-down {
    transform: translateY(69px);
  }

  /* Para telas menores, pode precisar de um deslocamento diferente */
@media (max-width: 640px) {
  .layout-shift-down {
    transform: translateY(54px);
  }
}

/* Opcional: Suavizar a transição do próprio balão */
.speech-bubble {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}



`}</style>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap');
        body { background:#f5f5f5; font-family:'Oswald',sans-serif; color:#1a1a1a; }
        button {
          text-transform:uppercase;
          font-weight:900;
          letter-spacing:0.15em;
          user-select:none;
          cursor:pointer;
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, opacity ease-in-out;
          border-width: 2.8px;
          box-shadow: 5 9px 9px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: flex;
          justify-content: center;
          align-items: center;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
          overflow: show;
          text-overflow: ellipsis;
          padding: 0.5rem 1.3rem;
          min-height: 50px;
        font-size: clamp(0.75rem, 1.8vw, 1rem); /* <<< VALORES MENORES PARA MOBILE */
  /* ... */
  @media (min-width: 640px) {
    /* ... */
    font-size: clamp(0.8rem, 1.5vw, 1rem); /* <<< VALORES MENORES PARA WEB */
    
  }
}
        button:disabled { cursor:not-allowed; opacity:0.5; }
        .fade-out-text {
            opacity: 0;
            transition: opacity 0.8s ease-out;
        }
        .palavra-correta-perdeu { color:#d9534f; font-weight:700; border-color:#d9534f!important; background-color:#f9e6e6!important; }
        
            padding: 0.2rem; 
            font-size: 0.8rem; /* Fonte base menor */
        }
        .theme-result-item.fade-in-active {
            opacity: 1;
            transform: translateY(0);
        }
        /* NOVO: Ajustes para o título do grupo */
        .theme-result-item strong {
            font-size: 0.9rem; /* Fonte do título menor */
            margin-bottom: 0.1rem; /* Espaçamento menor abaixo do título */
        }
        /* NOVO: Ajustes para as palavras do grupo */
        .theme-result-item span {
            font-size: 0.75rem; /* AJUSTADO: Fonte das palavras um pouco maior */
            line-height: 1.2; /* Compacta mais as linhas */
        }
        /* NOVO: Media queries para telas maiores (desktop) */
        @media (min-width: 640px) {
            .theme-result-item {
                padding: 0.70rem; 
                font-size: 0.9rem; /
            }
            .theme-result-item strong {
                font-size: 1.1rem; /* Título maior em desktop */
            }
            .theme-result-item span {
                font-size: 0.95rem; /* AJUSTADO: Palavras maiores em desktop */
            }
        }
        /* FIM DOS AJUSTES PARA BARRA DE ACERTO */

/* Animações para os Einsteins clicáveis */
@keyframes einsteinBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.1); }
}

@keyframes einsteinSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes einsteinWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg) scale(1.1); }
  75% { transform: rotate(10deg) scale(1.1); }
}

@keyframes einsteinPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

@keyframes einsteinFlip {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg) scale(1.2); }
  100% { transform: rotateY(360deg); }
}

@keyframes doubleVerticalRise {
  /* O elemento está na base no início, no meio e no fim. */
  0%, 50%, 100% {
    transform: translateY(0);
  }
  /* Primeiro pico da animação */
  25% {
    transform: translateY(-15px);
  }
  /* Segundo pico, um pouco mais baixo para um efeito sutil */
  75% {
    transform: translateY(-7px);
  }
}

.word-jump-animation {
  animation-name: doubleVerticalRise;
  
  animation-duration: 0.6s; 

  animation-timing-function: ease-in-out;
  animation-fill-mode: both;
}

.einstein-bounce { animation: einsteinBounce 0.6s ease-in-out; }
.einstein-spin { animation: einsteinSpin 0.8s ease-in-out; }
.einstein-wiggle { animation: einsteinWiggle 0.6s ease-in-out; }
.einstein-pulse { animation: einsteinPulse 0.8s ease-in-out; }
.einstein-flip { animation: einsteinWiggle 0.8s ease-in-out; }
.einstein-shake { animation: einsteinShake 0.6s ease-in-out; }
.einstein-jello { animation: einsteinJello 1s ease-in-out; }
.einstein-rubber { animation: einsteinRubber 1s ease-out; }
.einstein-tada { animation: einsteinTada 1s ease-in-out; }
.einstein-swing { animation: einsteinSwing 0.8s ease-in-out; }
.einstein-heartbeat { animation: einsteinHeartbeat 2.5s ease-in-out infinite; }

.einstein-clickable {
  cursor: pointer;
  transition: filter 0.1s ease;
}

.einstein-clickable:hover {
  filter: brightness(1.05) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
}

.einstein-cooldown {
  pointer-events: none;
  opacity: 0.7;
}


@keyframes einsteinRubber {
  0% { transform: scaleX(1) scaleY(1); }
  30% { transform: scaleX(1.25) scaleY(0.75); }
  40% { transform: scaleX(0.75) scaleY(1.25); }
  50% { transform: scaleX(1.15) scaleY(0.85); }
  65% { transform: scaleX(0.95) scaleY(1.05); }
  75% { transform: scaleX(1.05) scaleY(0.95); }
  100% { transform: scaleX(1) scaleY(1); }
}

@keyframes einsteinTada {
  0% { transform: scale(1); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes einsteinJello {
  0%, 11.1%, 100% { transform: skewX(0deg) skewY(0deg); }
  22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
  33.3% { transform: skewX(6.25deg) skewY(6.25deg); }
  44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); }
  55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); }
  66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
  77.7% { transform: skewX(0.39063deg) skewY(0.39063deg); }
  88.8% { transform: skewX(-0.19531deg) skewY(-0.19531deg); }
}

@keyframes einsteinShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes einsteinHeartbeat {
  0%, 14%, 28%, 42%, 70%, 100% { transform: scale(1); }
  7%, 21%, 35% { transform: scale(1.1); }
}
        .grid-transition {
            transition: opacity var(--motivation-transition-duration, 0.8s) ease-out; /* Esta transição agora é para o grid */
        }
        @keyframes fadeInBubble { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOutBubble { from { opacity: 1; } to { opacity: 0; } }
        
        .speech-bubble {
            position: absolute; background: #fff; border: 3px solid #ccc; border-radius: 0.5rem;
            padding: 0.6rem 0.75rem; font-size: 0.8rem; color: #333; text-align: center;
            word-wrap: break-word; box-sizing: border-box; z-index: 10;
            bottom: calc(100% + 13px); box-shadow: 0 7px 8px rgba(0,0,0,0.2);
            pointer-events: none; left: 0; right: 0; transform: none;
            max-width: none; width: auto; min-width: 150px;
            @media (min-width: 640px) {
                left: 7%; right: auto; transform: translateX(-50%);
                max-width: 600px; width: auto; min-width: 460px;
                font-size: 1rem; padding: 0.95rem 1rem;
            }
        }
        .speech-bubble.active { pointer-events: auto; cursor: pointer; }
        .speech-bubble.fade-out { pointer-events: none; }
        .speech-bubble::after {
            content: ''; position: absolute; width: 0; height: 0;
            border-left: 8px solid transparent; border-right: 8px solid transparent;
            border-top: 8px solid #ccc; bottom: -8px;
            left: var(--arrow-left, 50%); transform: translateX(-50%);
        }
        .speech-bubble::before {
            content: ''; position: absolute; width: 0; height: 0;
            border-left: 8px solid transparent; border-right: 8px solid transparent;
            border-top: 8px solid #fff; bottom: -7px;
            left: var(--arrow-left, 50%); transform: translateX(-50%); z-index: 11;
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3px, -2px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translate(3px, 2px) rotate(1deg); }
        }
        .shake-animation {
            animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden; perspective: 1000px;
        }
        .vida-quebrando { animation: vidaQuebrandoAnim 5s ease-in-out forwards; }
        @keyframes vidaQuebrandoAnim {
            0% { transform: scale(1) rotate(0deg); opacity: 1; }
            100% { transform: scale(0.1) rotate(100deg); opacity: 0;}
        }

 /* --- ESTILOS PARA MENSAGEM DE MOTIVAÇÃO NA TELA --- */
.motivation-message-container { 
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 0.3rem;
    min-height: 225px;
    max-height: 280px;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    
    /* MUDANÇA: Estado inicial da animação */
    opacity: 0;
    transform: scale(0.98); /* Começa um pouco menor */
    
    /* MUDANÇA: Transição para opacity E transform */
    transition: opacity var(--motivation-transition-duration, 1.2s) ease-in-out, 
                transform var(--motivation-transition-duration, 1.2s) ease-in-out;
}

.motivation-message-container.fade-in {
    opacity: 1;
    transform: scale(1); /* Volta ao tamanho normal */
}

.motivation-message-container.fade-out {
    opacity: 0;
    transform: scale(0.98); /* Encolhe sutilmente ao sair */
}

        .motivation-message-text {
            font-size: clamp(1.1rem, 3.5vw, 1.8rem);
            font-weight: 700;
            color: #333;
            max-width: 90%;
            line-height: 1.35;
        }

        /* Classes para o fade do grid */
        .grid-fade-out {
            opacity: 0;
            transition: opacity var(--motivation-transition-duration, 0.8s) ease-out;
        }
        .grid-fade-in {
            opacity: 1;
            transition: opacity var(--motivation-transition-duration, 0.8s) ease-in;
        }

      .einsteins-title {
    will-change: auto;
    transform: translateZ(0);
    contain: layout;
    
    font-size: clamp(1.8rem, 6vw, 4.5rem);
    
    line-height: 1;
    margin-bottom: 0.5rem;
    box-sizing: border-box;
    padding-left: 0;
    padding-right: 0;
    letter-spacing: 0.50em;
    min-width: fit-content;
    
    /* Ajuste para telas pequenas (mobile) */
    transform: translateX(6px);

    /* Media query para telas maiores (desktop) */
    @media (min-width: 640px) {
        transform: translateX(12px);
    }
    
    /* NOVO: Media query específica para orientação paisagem em mobile */
    @media (max-height: 500px) and (orientation: landscape) {
        font-size: clamp( 1.2rem, 8vh, 2.5rem);
        margin-bottom: 0.8rem;
    }
    
    /* NOVO: Para telas muito pequenas */
    @media (max-width: 360px) {
        font-size: clamp(1.5rem, 7vw, 3rem);
        letter-spacing: 0.3em;
        transform: translateX(4px);
    }
}

/* Estilo para o container do título para alinhamento */
.title-container {
    width: 100%;
    max-width: 48rem;
    margin: auto;
    
    display: flex;
    justify-content: center;
    align-items: center;
    
    text-align: center;
    
    padding-top: 0.6rem;
    padding-bottom: 0.1rem;
    
    /* NOVO: Ajuste para orientação paisagem */
    @media (max-height: 500px) and (orientation: landscape) {
        padding-top: 0.8rem;
        padding-bottom: 0.05rem;
    }
}
            

 @keyframes waveAnimation {
  0%   { transform: translateY(0px) translateZ(0); }
  10%  { transform: translateY(-10px) translateZ(0); }
  20%  { transform: translateY(2px) translateZ(0); }
  30%  { transform: translateY(-6px) translateZ(0); }
  40%  { transform: translateY(1px) translateZ(0); }
  50%  { transform: translateY(-4px) translateZ(0); }
  60%  { transform: translateY(0px) translateZ(0); }
  70%  { transform: translateY(-2px) translateZ(0); }
  80%  { transform: translateY(0px) translateZ(0); }
  90%  { transform: translateY(-1px) translateZ(0); }
  100% { transform: translateY(0px) translateZ(0); }
}

/* DELAYS OTIMIZADOS - Calculados para suavidade máxima */
.title-wave-animation .letter:nth-child(1) { animation-delay: 0s; }
.title-wave-animation .letter:nth-child(2) { animation-delay: 0.1s; }
.title-wave-animation .letter:nth-child(3) { animation-delay: 0.2s; }
.title-wave-animation .letter:nth-child(4) { animation-delay: 0.3s; }
.title-wave-animation .letter:nth-child(5) { animation-delay: 0.4s; }
.title-wave-animation .letter:nth-child(6) { animation-delay: 0.5s; }
.title-wave-animation .letter:nth-child(7) { animation-delay: 0.6s; }
.title-wave-animation .letter:nth-child(8) { animation-delay: 0.7s; }
.title-wave-animation .letter:nth-child(9) { animation-delay: 0.8s; }

  .einsteins-title {
    font-size: clamp(3.9rem, 9vw, 3.5rem);
  }
    
  @media (max-width: 480px) and (orientation: portrait) {
  .einsteins-title {
    font-size: clamp(2.5rem, 7.5vw, 2.7rem);
    letter-spacing: 0.4em;
    transform: translateX(2px);
  }
}

@media (min-width: 481px) and (max-width: 767px) {
  .einsteins-title {
    font-size: clamp(3.7rem, 9vw, 4.2rem) !important;
    letter-spacing: 0.4em !important;
  }
}
  .title-wave-animation .letter {
  animation-name: waveAnimation !important;
  animation-duration: 3.2s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  animation-timing-function: ease-in-out;
  display: inline-block !important;
  will-change: transform !important;
}

.speech-bubble-final {
  position: relative; /* Changed from absolute */
  background: #fff;
  border: 3px solid #ccc;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: #333; 
  text-align: center;
  word-wrap: break-word; 
  box-sizing: border-box;
  z-index: 10;
  box-shadow: 0 4px 5px rgba(0,0,0,0.2);
  pointer-events: auto;
  cursor: pointer;
  max-width: 450px; /*  */
  width: auto; /*  */
  min-width: 300px;
  /* REMOVED top and transform properties */
}

@media (max-width: 640px) {
  .speech-bubble-final {
    max-width: 90%; /* Adjusted for better fit on small screens */
    min-width: auto;
    /* REMOVED top and transform properties */
  }
}

.speech-bubble-final::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #fff; /* seta para baixo (mesma cor do balão) */
  bottom: -7px; /* alinha para criar o contorno */
  left: 47%;
  transform: translateX(-50%);
  z-index: 11;
}

  // Ref para guardar o timer que zera a contagem de toques
const cheatResetTimer = useRef(null);

// useEffect para ativar os cheats baseados nos toques no título
useEffect(() => {
  // Se não houver toques, não faz nada.
  if (tituloTapCount === 0) return;

  // Limpa o timer anterior sempre que um novo toque é registrado
  if (cheatResetTimer.current) {
    clearTimeout(cheatResetTimer.current);
  }

  // Lógica de ativação do cheat
  if (tituloTapCount === 5) {
    forcarVitoria();
  } else if (tituloTapCount === 10) {
    forcarDerrota();
  }

  import { useEffect } from "react";

useEffect(() => {
  if (!mostrarComoJogar) {
    // quando começa a sair, adiciona arco-íris
    const caixa = document.getElementById("caixa-como-jogar");
    if (caixa) {
      caixa.classList.add("rainbow-border");
    }
  }
}, [mostrarComoJogar]);

  // Cria um novo timer. Se o usuário não tocar novamente em 2 segundos,
  // a contagem é zerada.
  cheatResetTimer.current = setTimeout(() => {
    console.log('Contador de cheat zerado por inatividade.');
  }, 2000); // 2 segundos de tempo limite

}, [tituloTapCount, forcarVitoria, forcarDerrota]);

import { AnimatePresence } from 'framer-motion';

      `}</style>
      <AnimatePresence>
        {!mostrarMenuInicial && (
          <motion.div
            key="main-game-screen"
            initial={{
              opacity: 0,
              y: -50,
              scale: 0.15
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            transition={{
              duration: 2.1,
              ease: [0.16, 1, 0.3, 1],
              delay: 1.3
            }}
          >
            {/* Container para o título fora do main */}
            <div
              className="title-container"
            >
              {!mostrarMenuInicial && (
                <TituloAnimado tituloAnimando={tituloAnimando} onClick={animarTitulo} />
              )}
            </div>

            {/* LINHA GRADIENTE */}
            {!mostrarMenuInicial && (
              <div className="h-[7px] w-[376px] sm:w-[576px] md:w-[576px] mx-auto -mt-0.5 mb-0 bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400" />
            )}

            <AnimatePresence>
              {mostrarEinsteinFinal && !epilogoEncerrado && (
                <motion.div
                  className="fixed inset-0 flex items-center justify-center z-50 bg-white/90 cursor-pointer p-4" // Added padding for safety
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 1.2,
                    filter: "blur(10px)",
                    transition: {
                      duration: 1.2, ease: "easeOut"
                    } /* [cite: 396] */
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  onClick={handleFecharTelaFinal}
                >

                  {/* NEW: Wrapper for content alignment */}
                  <div className="flex flex-col-reverse items-center justify-center gap-4">
                    {/* Einstein (now first in markup but appears below balloon) */}
                    <motion.img
                      layout
                      src="/einstein_final.png"
                      alt="Einstein Final"
                      className="w-34 sm:w-40 select-none pointer-events-none"
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    />

                    {/* Balão */}
                    {mostrarBalaoFinal && (
                      <motion.div
                        className="speech-bubble-final" // Removed mb-6
                        initial={{ opacity: 0, filter: "blur(8px)", y: 20 }}
                        animate={{
                          opacity: 1, filter: "blur(0px)",
                          y: 0
                        }}
                        exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
                        transition={{
                          duration: 1,
                          ease: "easeOut",
                          delay: 0.1
                        }}
                      >
                        {fraseFinal}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!mostrarMenuInicial && (
              <main ref={mainContainerRef} className="select-none p-4 max-w-xl mx-auto min-h-screen flex flex-col justify-start bg-white border border-gray-300 shadow-lg sm:p-6">


                {/* BARRAS DE ACERTO */}
                <div
                  className="slect-none -mb-2 -mt-2 space-y-2 sm:-mb-0 sm:-mt-1 sm:space-y-2"
                  style={{
                    minHeight: `${acertos.length * 60}px`,
                    transition: 'min-height 0.8s ease-out'
                  }}
                >
                  {acertos.map((g: any, i) => {
                    const cores = [
                      'bg-sky-200 border-sky-400',
                      'bg-amber-200 border-amber-400',
                      'bg-rose-200 border-rose-400',
                      'bg-purple-200 border-purple-400'
                    ];

                    const marginForLastItem = i === acertos.length - 1 ? ' mb-4 sm:mb-3' : '';

                    // 🔧 CORREÇÃO PRINCIPAL: Usar as classes CSS corretas mesmo para grupos revelados
                    const foiAcertoDoJogador = acertosOriginais.some(a => a.name === g.name);

                    let classeDeFundo;
                    if (jogoPerdido && !foiAcertoDoJogador) {
                      // Se o grupo foi revelado no final, usar as classes CSS que foram definidas
                      classeDeFundo = g.cssClasses ? `${g.cssClasses.bg} ${g.cssClasses.border}` : cores[i % cores.length];
                    } else {
                      // Acerto normal do jogador
                      classeDeFundo = cores[i % cores.length];
                    }

                    return (
                      <motion.div
                        key={g.name}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          scale: [1, 1.2, 0.8, 0],
                          rotate: [0, 180, 360],
                          opacity: [1, 1, 0],
                          x: 0,
                          y: 0,
                        }}
                        transition={{
                          duration: 1.2,
                          ease: "easeOut",
                          delay: 0.3,
                          type: "spring",
                          damping: 40,
                          stiffness: 80
                        }}
                        className={`p-2 border ${classeDeFundo} flex flex-col items-center text-center rounded${marginForLastItem}`}
                      >
                        <strong className="mb-1 text-sm sm:text-base font-bold">
                          {g.name.toUpperCase()}
                        </strong>
                        <span className="text-xs sm:text-sm">
                          {g.words.map((w: any) => w.toUpperCase()).join(', ')}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>


                {gridVisivel && !jogoFinalizado && (
                  <motion.div
                    layout
                    transition={{
                      type: "spring",
                      delay: 0,
                      stiffness: 85,
                      damping: 15,
                      duration: 1,
                      ease: "easeOut",
                    }}
                    className={`grid grid-cols-4 mt-2.5 gap-2.5 mb-3 grid-transition sm:gap-3 sm:mb-5 sm:mt-0 ${gridTransitionClass}`}
                    style={{ '--motivation-transition-duration': `${MOTIVATION_TRANSITION_DURATION}ms` } as React.CSSProperties}
                  >
                    {palavrasExibidas.map((palavra) => {
                      const state = palavraTransitionStates[palavra] || defaultTransitionState;
                      const shakeClass = tremorBotoesErro && selecionadas.includes(palavra) ? 'shake-animation' : '';


                      // NOVO: Verifica se a palavra deve ter animação de salto
                      const jumpClass = palavrasComAnimacaoSalto.includes(palavra)
                        ? `word-jump-animation word-jump-delay-${(selecionadas.indexOf(palavra) % 4) + 1}`
                        : '';

                      return (
                        <motion.button
                          key={palavra}
                          layout
                          initial={{ opacity: 0, scale: 0.2 }}
                          animate={{
                            opacity: state.opacity, // CORRIGIDO: Obedece ao estado de opacidade
                            scale: 1
                          }}
                          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
                          transition={{
                            type: "spring",
                            duration: 0.6,
                            stiffness: 50,
                            damping: 20,
                            layout: {
                              type: "spring",
                              duration: 0.8,
                              stiffness: 100,
                              damping: 35,
                            },
                            opacity: {

                              duration: (state.transitionDuration / 1000),
                              delay: (state.transitionDelay / 1000),
                              ease: "easeInOut"
                            }
                          }}
                          onClick={() => cliquePalavras(palavra)}
                          disabled={jogoPerdido || jogoGanho || !palavrasAtivas.includes(palavra) || processandoErro || embaralhando || mostrarMensagemMotivacao}
                          className={`p-3 border-2 sm:border-8 shadow-lg text-xs hover:scale-[1.03]
    ${selecionadas.includes(palavra) ? 'bg-gray-900 text-gray-100 border-gray-800' : 'bg-white text-gray-900 border-gray-500 hover:bg-gray-100'}
    ${jogoPerdido && todasPalavrasDoJogo.includes(palavra) ? 'palavra-correta-perdeu' : ''}
    sm:p-4 sm:text-lg ${shakeClass} ${jumpClass}`}
                        >
                          {palavra}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {mostrarMensagemMotivacao && (
                  <div
                    className={`motivation-message-container ${MotivacaoTransition}`}
                    onClick={handleClickMensagemMotivacao}
                    style={{ '--motivation-transition-duration': `${MOTIVATION_TRANSITION_DURATION}ms` } as React.CSSProperties}
                  >
                    <p className="motivation-message-text">{mensagemMotivacionalAtual}</p>
                  </div>
                )}


                {!modoVisualFinal && (vidas > 0 || isAnimatingLastLife) && (
                  <div
                    ref={einsteinContainerRef}
                    className={`flex justify-center items-center gap-3 mb-2 sm:gap-5 sm:mb-5 relative w-full layout-shift-container ${balaoAtivo ? 'layout-shift-down' : ''
                      }`}

                  >
                    {/* Seu código dos Einsteins aqui */}
                    <AnimatePresence mode="popLayout">
                      {vidasOrdemExibição.map((originalIndex) => (
                        originalIndex < vidas && (
                          <motion.div
                            key={originalIndex}
                            layoutId={`einstein-${originalIndex}`}
                            ref={(el: any) => einsteinRefs.current[originalIndex] = el}
                            className={`relative flex justify-center items-center w-16 h-16 sm:w-24 sm:h-24
            einstein-clickable
            ${einsteinAnimations[originalIndex] ? `einstein-${einsteinAnimations[originalIndex]}` : ''}
            ${einsteinClickCooldowns[originalIndex] ? 'einstein-cooldown' : ''}
            ${tremorBotoesErro ? 'shake-animation' : ''}
          `}
                            initial={{ opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.2, rotate: 100, transition: { duration: 1.4 } }}
                            transition={{ layout: { type: "spring", stiffness: 159, damping: 72 } }}
                            onClick={() => handleEinsteinClick(originalIndex)}
                          >
                            <img
                              src="/einstein_final.png"
                              alt="Vida"
                              className="w-full h-full select-none hover:scale-[1.04]"
                              loading="lazy"
                            />
                          </motion.div>
                        )
                      ))}
                    </AnimatePresence>

                    <AnimatePresence>
                      {balaoAtivo && (
                        <motion.div
                          ref={bubbleRef}
                          className={`speech-bubble ${isBubbleFadingOut ? 'fade-out' : 'active'}`}
                          style={{
                            '--arrow-left': balaoAtivo.arrowLeft,
                          } as any}

                          initial={{ opacity: 0, y: 1 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 1, transition: { duration: FADE_OUT_DURATION_MS / 1200 } }}
                          transition={{ duration: FADE_IN_DURATION_MS / 800, delay: 0, ease: "easeOut" }}
                          onClick={handleBubbleClick}
                        >
                          <p>{balaoAtivo.frase}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {modoVisualFinal && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      overflow: 'visible',
                      zIndex: 1,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                      }}
                      transition={{
                        opacity: { duration: 1.5 }
                      }}
                      className="absolute pointer-events-none w-26 h-26 md:w-40 md:h-40"
                      style={{
                        left: 'calc(50vw - 64px)',
                        top: 'calc(50vh - 64px)',
                      }}
                    >
                      <motion.div
                        animate={{
                          x: [
                            0, 160, -110, 170, -50, 150, -130, 80, 160, -110,
                            170, -70, 60, 150, -120, 90, -55, 140, -140, 85,
                            -35, 160, -100, 70, 145, -80, 170, -65, 110, -130,
                            75, 155, -85, 50, 140, -75, 165, -115, 80, 150, 140, -90,
                            120, 80, 40, 10, 0
                          ],

                          y: [
                            0, -80, -120, -60, -180, 160, 90, -200, -160, -40,
                            20, 60, 120, 110, -60, 220, -60, -180, 260, 300,
                            400, 360, 320, 280, 240, -120, -60, -180, -140, 200, 160, 120, 80, 40,
                            -40, -80, -120, -160, -200, -200, -180, -140, -100, -60
                          ],
                          rotate: [
                            0, 2, -1.5, 3, -2.5, 1.5, -2, 1, -1, 0.5, -0.5, 0
                          ],
                          scale: [
                            1, 1.012, 1.025, 1.018, 1.03, 1.015, 1, 0.988, 0.995, 1.01, 0.98, 1
                          ]
                        }}
                        transition={{
                          x: {
                            duration: 95,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1],
                            repeatType: "loop"
                          },
                          y: {
                            duration: 88,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1],
                            repeatType: "loop"
                          },
                          rotate: {
                            duration: 120,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1],
                            repeatType: "loop"
                          },
                          scale: {
                            duration: 100,
                            repeat: Infinity,
                            ease: [0.42, 0, 0.58, 1],
                            repeatType: "loop"
                          }
                        }}
                        whileHover={{
                          scale: 1.3,
                          rotate: 0,
                          transition: {
                            duration: 2.5,
                            ease: "easeOut"
                          }
                        }}
                        whileTap={{
                          scale: 0.9,
                          rotate: 360,
                          transition: {
                            duration: 0.6,
                            ease: "easeInOut"
                          }
                        }}
                        onClick={handleClickEinsteinFlutuante}
                        className="relative pointer-events-auto cursor-pointer"
                      >
                        <motion.div
                          animate={{
                            zIndex: [10, 5, 50, 3, 60, 8, 70, 4, 90, 2]
                          }}
                          transition={{
                            zIndex: {
                              duration: 40,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          }}
                          className="relative select-none"
                        >
                          <motion.div
                            animate={{
                              filter: [
                                "blur(0px) brightness(1)",
                                "blur(1px) brightness(1.1)",
                                "blur(0.5px) brightness(0.9)",
                                "blur(1.5px) brightness(1.2)",
                                "blur(0px) brightness(1)"
                              ]
                            }}
                            transition={{
                              filter: {
                                duration: 60,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }
                            }}
                          >
                          </motion.div>
                          <Image
                            src="/einstein_final.png"
                            alt="Einstein pós"
                            width={120}
                            height={120}
                            className="rounded-full pointer-events-none w-22 h-22 md:w-27 md:h-27"
                            style={{ background: 'none' }}
                          />
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {mostrarEinsteinFlutuante2 && (
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{
                          rotate: 0,
                          scale: 1,
                          x: [0, -80, 10, 90, 87, -70, 12, 80, 93, 0, -10, -50, -90, 81, -50, 80, -80, 33, 0],
                          y: [0, 100, 300, -160, 400, -120, 180, -60, 90, 0, 100, 300, -160, 400, -120, 180, -60, 90, 0]
                        }}
                        transition={{
                          rotate: { duration: 0.8 },
                          scale: { duration: 0.8 },
                          x: { duration: 85, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 85, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-36 md:h-36"
                        style={{ left: 'calc(50% - 70px)', top: 'calc(50% - 60px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 2" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante3 && (
                      <motion.div
                        initial={{ scale: 0, y: -100 }}
                        animate={{
                          scale: 1,
                          y: [0, -100, 300, -160, 400, 0, -100, 300, -160, 400, 0],
                          x: [0, 94, -10, 81, -90, 87, -80, 29, -70, 0, 71, -40, 83, -90, 44, -80, 88, -70, 0],
                        }}
                        transition={{
                          scale: { duration: 0.6 },
                          x: { duration: 88, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
                          y: { duration: 88, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-36 md:h-36"
                        style={{ left: 'calc(50% - 20px)', top: 'calc(50% - 50px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 3" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante4 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, rotate: 270 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          x: [0, -78, 93, -60, 81, -90, 89, -80, 11, 0, -10, 16, -7, 14, 77, 45, -80, 10, 0],
                          y: [0, -160, 400, 200, -100, 380, -90, 240, 300, 0, -160, 400, 200, -100, 380, -90, 240, 300, 0]
                        }}
                        transition={{
                          opacity: { duration: 0.4 },
                          scale: { duration: 0.6 },
                          rotate: { duration: 0.6 },
                          x: { duration: 90, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 90, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-40 md:h-40"
                        style={{ left: 'calc(50% - 30px)', top: 'calc(50% + 10px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 4" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante5 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: [0, 79, -11, 29, 40, 45, -20, 40, -60, 0, 13, -10, 34, 44, 58, -70, 30, -60, 0],
                          y: [0, 150, 300, -160, 400, 220, 170, 90, 200, 0, 150, 300, -160, 400, 220, 170, 90, 200, 0]
                        }}
                        transition={{
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.5 },
                          x: { duration: 88, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 88, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-36 md:h-36"
                        style={{ left: 'calc(50% + 40px)', top: 'calc(50% - 70px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 5" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante6 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          x: [0, -40, 39, -30, 10, -50, 60, 0, -10, 69, -60, 11, -80, 43, 0],
                          y: [0, -160, 200, -140, 300, -100, 400, 0, -160, 200, -140, 300, -100, 400, 0]
                        }}
                        transition={{
                          scale: { duration: 0.6 },
                          rotate: { duration: 0.6 },
                          x: { duration: 86, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 86, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-40 md:h-40"
                        style={{ left: 'calc(50% + 20px)', top: 'calc(50% + 50px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 6" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante7 && (
                      <motion.div
                        initial={{ scale: 0.5, rotate: -90 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          x: [0, 20, -22, 39, -30, 20, -25, 33, 0, 40, -33, 36, -33, 40, -10, 43, 0],
                          y: [0, -100, 180, -160, 300, -140, 250, -120, 0, -100, 180, -160, 300, -140, 250, -120, 0]
                        }}
                        transition={{
                          scale: { duration: 0.7 },
                          rotate: { duration: 0.6 },
                          x: { duration: 90, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 90, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-40 md:h-40"
                        style={{ left: 'calc(50% - 40px)', top: 'calc(50% + 60px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 7" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante8 && (
                      <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                          x: [0, 30, 11, -10, 31, -20, 44, -50, 34, 0, -40, 32, -40, 35, -50, 44, -60, 43, 0],
                          y: [0, 180, -160, 300, -140, 250, -120, 200, -100, 0, 180, -160, 300, -140, 250, -120, 200, -100, 0]
                        }}
                        transition={{
                          scale: { duration: 0.8 },
                          opacity: { duration: 0.6 },
                          x: { duration: 92, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
                          y: { duration: 92, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-40 md:h-40"
                        style={{ left: 'calc(50% + 40px)', top: 'calc(50% - 30px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 8" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    {mostrarEinsteinFlutuante9 && (
                      <motion.div
                        initial={{ scale: 0.3, rotate: 180 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          x: [0, 51, -40, 40, -30, 52, -40, 42, 0, 44, -30, 13, -50, 23, -25, 55, 0],
                          y: [0, -140, 300, -160, 280, -120, 240, -100, 0, -140, 300, -160, 280, -120, 240, -100, 0]
                        }}
                        transition={{
                          scale: { duration: 0.7 },
                          rotate: { duration: 0.7 },
                          x: { duration: 94, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                          y: { duration: 94, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                        }}
                        className="absolute pointer-events-none w-22 h-22 md:w-40 md:h-40"
                        style={{ left: 'calc(50% + 20px)', top: 'calc(50% + 20px)' }}
                      >
                        <Image src="/einstein_final.png" alt="Einstein 9" width={120} height={120} className="rounded-full" />
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {mostrarEinsteinFlutuante10 && !einstein10Explodiu && (
                        <motion.div
                          key="einstein10"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: 2,
                            opacity: 1,
                            x: [0, -10, 65, -70, 42, -40, 27, -10, 11, 0, -60, 32, -30, 44, -40, 31, -66, 44, 0],
                            y: [0, 133, -130, 100, -120, 140, -140, 180, -90, 0, 50, -160, 400, -120, 240, -100, 180, -90, 0]
                          }}
                          exit={{
                            y: 2500,
                            rotate: 1080,
                            scale: 0.1,
                            transition: { duration: 1.7, ease: "easeIn" }
                          }}
                          transition={{
                            scale: { duration: 1.5 },
                            opacity: { duration: 0.9 },
                            x: { duration: 96, repeat: Infinity, ease: "easeInOut", repeatType: "loop" },
                            y: { duration: 96, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }
                          }}
                          onClick={handleClickEinstein10}
                          className="absolute pointer-events-auto cursor-pointer w-22 h-22 md:w-45 md:h-45 sm:h-45 sm:w-45"
                          style={{ left: 'calc(50% - 120px)', top: 'calc(50% - 90px)' }}
                        >
                          <Image src="/einstein_final.png"
                            alt="Einstein 10"
                            width={120}
                            height={120}
                            className="select-none rounded-full"
                            style={{
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              pointerEvents: 'none'
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <AnimatePresence>

                  {mostrarBotaoFiquePorDentro && (
                    <motion.div
                      className="w-full sm:w-full mx-auto flex flex-col sm:flex-row justify-center gap-4 mt-1 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.7, ease: "easeOut", delay: 0.5 }}
                    >
                      <motion.button
                        key="fique-por-dentro"
                        className={`select-none w-full text-base sm:text-sm py-4 sm:py-3 px-6 font-bold bg-gray-900 text-white transition-all duration-500 ease-in-out ${mostrarCaixaEmail ? 'opacity-0 pointer-events-none' : 'opacity-100'
                          }`}
                        onClick={() => setMostrarCaixaEmail(true)}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        FIQUE POR DENTRO!
                      </motion.button>

                      <motion.button
                        key="colaborador"
                        className={`w-full select-none -mt-2 sm:mt-0 text-base sm:text-sm py-4 sm:py-3 px-6 font-bold bg-white text-gray-900 transition-all duration-500 ease-in-out ${mostrarCaixaColaborador ? 'opacity-0 pointer-events-none' : 'opacity-100'
                          }`}
                        onClick={() => setMostrarCaixaColaborador(true)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        COMPARTILHE SUAS IDEIAS
                      </motion.button>

                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!modoVisualFinal && mostrarBotoes && (
                    <motion.div
                      key="botoes"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: balaoAtivo ? 69 : 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        y: {
                          type: "spring",
                          stiffness: 30,
                          damping: 10,
                          duration: 0.6,
                        },
                        opacity: { duration: 0.5, ease: "easeInOut" },
                        layout: {
                          type: "spring",
                          stiffness: 85,
                          damping: 15,
                          duration: 1.5,
                        },
                      }}
                      className="flex flex-col items-center gap-2 mb-6 mt-2"
                    >

                      {/* LINHA 1: Embaralhar e Motivação */}
                      <div className="flex w-full gap-2.5 sm:gap-3.4">
                        <motion.button
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 85,
                            damping: 15,
                            duration: 1
                          }}
                          onClick={embaralhar}
                          disabled={embaralhando || jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao || agrupando}
                          className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border hover:scale-[1.02] border-gray-800 shadow-lg btn-press-effect ${(!embaralhando && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 'hover:bg-gradient-to-br hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} sm:px-7 sm:py-3 sm:text-lg`}
                        >
                          Embaralhar
                        </motion.button>

                        <motion.button
                          layout
                          transition={{ type: "spring", stiffness: 85, damping: 15, duration: 0.3 }}
                          onClick={handleMotivacao}
                          disabled={jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao || embaralhando || agrupando}
                          className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border hover:scale-[1.02] border-gray-800 shadow-lg btn-press-effect ${(!jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 'hover:bg-gradient-to-br hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} sm:px-7 sm:py-3 sm:text-lg`}
                        >
                          Motivação
                        </motion.button>
                      </div>

                      {/* LINHA 2: Limpar e Agrupar */}
                      <div className="flex w-full gap-2.5 sm:gap-3.4">
                        <motion.button
                          layout
                          transition={{
                            layout: {
                              type: "spring",
                              stiffness: 85,
                              damping: 15,
                              duration: 1
                            }
                          }}
                          onClick={handleLimpar}
                          disabled={selecionadas.length === 0 || jogoPerdido || jogoGanho || processandoErro || embaralhando || agrupando || mostrarMensagemMotivacao}
                          className={`w-full px-5 py-2 text-base bg-white text-gray-900 hover:scale-[1.02] border border-gray-500 shadow-lg btn-press-effect sm:px-7 sm:py-3 sm:text-lg transition-opacity duration-1550 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${selecionadas.length > 0 && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao ? 'hover:bg-gray-100' : ''}`}
                        >
                          Limpar
                        </motion.button>

                        <motion.button
                          layout
                          transition={{ type: "spring", stiffness: 85, damping: 15, duration: 1 }}
                          onClick={handleAgrupar}
                          disabled={selecionadas.length < 2 || agrupando || embaralhando || jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao}
                          className={`w-full px-5 py-2 text-base bg-white text-gray-900 hover:scale-[1.02] border border-gray-500 shadow-lg btn-press-effect sm:px-7 sm:py-3 sm:text-lg transition-opacity duration-1550 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${selecionadas.length >= 2 && !embaralhando && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao ? 'hover:bg-gray-100' : ''}`}
                        >
                          Agrupar
                        </motion.button>
                      </div>

                      {/* LINHA 3: Verificar */}
                      <motion.button
                        layout
                        transition={{ type: "spring", stiffness: 85, damping: 15, duration: 1 }}
                        onClick={verificar}
                        disabled={selecionadas.length !== 4 || jogoPerdido || jogoGanho || processandoErro || embaralhando || agrupando}
                        className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border border-gray-800 shadow-lg btn-press-effect 
    ${selecionadas.length === 4 && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao ?
                            'hover:bg-gradient-to-br hover:scale-[1.02] hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} 
    sm:px-7 sm:py-3 sm:text-lg`}
                      >
                        Verificar
                      </motion.button>
                      { }
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  layout
                  animate={{ y: balaoAtivo ? 69 : 0, opacity: 1 }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 65,
                      damping: 15,
                      duration: 1
                    }
                  }}

                  className="-mt-2 pt-4 border-t-3 border-gray-200"
                >

                  <h2
                    className="relative select-none hover:scale-[1.02] text-l font-bold text-center mb-4 bg-gradient-to-r from-amber-300 via-rose-300 via-pink-400 via-purple-300 to-blue-300 bg tracking-wider text-gray-900 flex items-center justify-center gap-2 py-3 px-6 shadow-lg"
                    onClick={() => {
                      setClicksTituloQuadro(prev => {
                        const novoValor = prev + 1;
                        if (novoValor >= 10) {
                          console.log('CHEAT: resetando o jogo via clique no título do quadro!');
                          localStorage.removeItem('einsteins_fimDeJogo');
                          window.location.reload();
                          return 0; // reseta o contador
                        }
                        return novoValor;
                      });
                    }}
                  >
                    <span className="text-green-600"></span>
                    <span className="mx-2">QUADRO DE VENCEDORES</span>
                    <span className="text-green-600 scale-x-[-1]"></span>
                  </h2>


                  {/* ========== CÓDIGO DAS ESTATÍSTICAS ========== */}
                  {estatisticas.totalJogos > 0 && !mostrarMenuInicial && (() => {
                    const distribuicao = calcularDistribuicaoRanking();

                    const gradientes:string[] = [];
                    let acumulado = 0;

                    distribuicao.forEach(({ cor, largura }) => {
                      const inicio = acumulado;
                      const fim = acumulado + parseFloat(largura);

                      // Cria uma margem de transição suave entre cores
                      const suavizacao = 1; // em %

                      gradientes.push(
                        `${cor} ${Math.max(inicio - suavizacao, 0)}%`,
                        `${cor} ${fim + suavizacao}%`
                      );

                      acumulado = fim;
                    });

                    const estiloBarra: React.CSSProperties = {
                      backgroundImage: `linear-gradient(to right, ${gradientes.join(', ')})`,
                      height: '22px',
                      borderRadius: '2px',
                      opacity: 0.8,
                      width: '100%',
                      boxShadow: '0 9px 8px rgba(36, 15, 15, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    };

                    return (
                      <div className="w-full max-w-screen-lg mx-auto px-3 -mt-2 mb-2">
                        <p className="text-sm text-center font-extrabold mt-1 mb-2">
                          <span className=" select-none font-bold bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
                            Percentual de Vitórias: {taxaSucesso}%
                          </span>
                        </p>

                        {/* Barra de ranking no topo */}
                        <div style={estiloBarra} title="Distribuição dos rankings e derrotas" />

                        <div className="select-none flex flex-wrap gap-3 sm:gap-9 items-center justify-center text-sm mt-3">
                          {[
                            { cor: 'bg-amber-300', opacity: '80%', nome: 'Genial' },
                            { cor: 'bg-sky-300', opacity: '80%', nome: 'Admirável' },
                            { cor: 'bg-rose-400', opacity: '80%', nome: 'Perspicaz' },
                            { cor: 'bg-purple-400', opacity: '80%', nome: 'Inabalável' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-1">
                              <div className={`w-4 h-4 rounded-sm ${item.cor}`} />
                              <span className="text-gray-700 font-medium">{item.nome}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {vencedores.length > 0 ? (
                    <ul className=" select-none sm:z-40 relative  bg-transparent sm:bg-transparent backdrop-blur-sm w-90 -mx-2.5 sm:w-137 space-y-2 max-h-70 overflow-y-auto p-2 shadow-xl border border-gray-200/50 ring-1 ring-gray-100/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {vencedores.slice().reverse().map((vencedor: any, index) => {

                        const ranking = calcularRanking(vencedor.erros || 0);
                        return (
                          <li key={index} className="z-30 bg-transparent shadow-sm animate-fade-in border border-gray-300 overflow-visible hover:shadow-lg hover:scale-[1.01] hover:bg-gray-50 transition-all duration-300 ease-in-out ">
                            <div className="flex items-center bg-transparent p-2">
                              <div className={`w-2 h-5 rounded-r-sm ${ranking.corBarra} mr-3 relative`}>

                                {/* Ranking dentro da barra */}
                                <div className=" absolute inset-0 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                                    {ranking.nivel}
                                  </span>
                                </div>
                              </div>
                              <div className=" flex justify-between items-center flex-1">
                                <span className="font-semibold text-sm text-gray-800" style={{ letterSpacing: '0.06em' }}>
                                  {vencedor.nome}
                                </span>
                                <span className=" text-sm text-gray-700">{vencedor.data}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 italic mt-4">Ninguém venceu ainda. Mostre o quanto você é capaz!</p>
                  )}
                </motion.div>

              </main>

            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      <AnimatePresence>
        {mostrarInputNome && (
          <motion.div
            className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/75 p-4"

            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{
                scale: 0.1,
                boxShadow: '0 0 0 rgba(255,255,255,0)',
                rotate: 0,
                x: 0,
                y: 0

              }}
              animate={{
                scale: 1,
                boxShadow: '0 0 50px rgba(255,255,255,0.3)',
                rotate: 0,
                x: 0,
                y: 0
              }}
              style={{
                border: '5px solid transparent',
                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #7dd3fc, #fcd34d, #fda4af, #c4b5fd) border-box',
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d'
              }}
              exit={{
                scale: 0.2,
                rotate: 1880, // 4 voltas
                opacity: 0,
                borderRadius: '50%',
                boxShadow: '0 0 0 100px rgba(113, 59, 163, 0.5)',
                filter: 'hue-rotate(360deg) brightness(5)',
                overflow: 'hidden'
              }}
              transition={{
                duration: 1.8,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="w-full max-w-md overflow: 'hidden' "
            >
              {(() => {
                const errosRealizados = 4 - vidas;
                const ranking = calcularRanking(errosRealizados);

                return (
                  // Adicionado "relative" para posicionar o botão 'X'
                  <div className={`relative bg-white p-6 sm:p-8 shadow-xl text-center border-4 ${ranking.borderCor} ${ranking.bgCor}`}>

                    {/* NOVO: Botão de fechar (X) */}
                    <button
                      onClick={handleFecharInputNome}
                      className="absolute top-1 right-1 bg-gray-400 text-white hover:bg-gray-700 hover:scale-107 transition-all duration-200 z-10 shadow-lg hover:shadow-xl"
                      aria-label="Fechar"
                    >
                      <svg
                        className="w-4 h-4 -m-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {/* Título você venceu */}
                    <motion.h2
                      className="select-none text-3xl sm:text-4xl font-extrabold mb-3 text-gray-800"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      VOCÊ VENCEU!
                    </motion.h2>

                    {/* Ranking */}
                    <motion.div
                      className="mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}

                    >
                      <h3 className={`select-none text-[23px] sm:text-2xl font-bold ${ranking.cor} mb-1`}>
                        {ranking.titulo}
                      </h3>
                      <p className={`select-none text-sm ${ranking.cor} font-semibold mb-3`}>
                        {ranking.subtitulo}
                      </p>
                      <p className=" select-none text-gray-700 text-[17px] sm:text-[10x] leading-relaxed mb-9 text-justify">
                        {ranking.descricao}
                      </p>
                    </motion.div>
                    {/* Formulário */}
                    <motion.form
                      onSubmit={handleSalvarVencedor}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <p className="mb-4 text-[20px] select-none text-transparent sm:text-[22px] bg-gradient-to-r from-amber-400 via-rose-400 via-pink-500 via-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
                        QUADRO DE VENCEDORES
                      </p>

                      <input
                        type="text"
                        value={nomeAtual}
                        onChange={(e) => setNomeAtual(e.target.value)}
                        className="w-full border-2 border-gray-400 p-3 mb-4 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                        style={{ fontSize: '16px', }}
                        placeholder="Deixe sua marca"
                        maxLength={25}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <button
                        type="submit"
                        className="w-full bg-gray-900 text-white px-6 py-3 font-bold hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!nomeAtual.trim()}
                      >
                        Entrar para a história
                      </button>
                    </motion.form>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADICIONE O CÓDIGO ABAIXO AQUI */}
      <AnimatePresence>
        {mostrarCaixaEmail && (
          <CaixaNotificacaoEmail onClose={handleFecharCaixaEmail} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarCaixaColaborador && (
          <CaixaColaborador onClose={() => setMostrarCaixaColaborador(false)} />
        )}
      </AnimatePresence>

    </>
  )
}