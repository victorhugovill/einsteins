'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  "É mais fácil tentar entender a teoria da relatividade do que esse seu raciocínio de agora.",
  "Ah, a mente humana... Cheia de limitações, não é mesmo?",
  "Achava que o óbvio dispensava explicações, mas parece que eu estava enganado.",
  "Impressionante. Não no bom sentido, claro.",
  "Errar é humano. Mas essa foi de outro planeta.",
  "Talvez tenha sido um erro... ou uma arte conceitual. Difícil dizer.",
  "É bom errar de vez em quando. Assim você valoriza quando acerta.",
  "Você está quase lá! Só precisa ir na direção oposta dessa última jogada.",
  "Essa tentativa foi... diferente. Diferente de \"certo\", por exemplo.",
  "A complexidade desta tarefa é diretamente proporcional ao seu desempenho."
];

const frasesQuaseAcerto = [
  "Quase lá! Só uma escapou...",
  "Você está no caminho certo!",
  "Foi por pouco. Repare bem nas palavras.",
  "Você enxergou o padrão — só uma peça está fora do lugar.",
  "Quase lá! Um pouco mais de atenção e você acerta tudo...",
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
  "Embaralhar é o primeiro passo para fingir que você sabe o que está fazendo.",
  "Eu já estou começando a ficar tonto!"
];

const frasesFimDeJogo = [
  "Você fracassou gloriosamente. Nos vemos no próximo enigma.",
  "A derrota é também uma forma de aprendizado. Não pare de tentar!",
  "Seu esforço hoje prepara as vitórias de amanhã. Não desista!",
  "Lembre-se que a jornada vale mais do que o resultado. Até breve.",
  "A persintência é o que transforma sonhos em conquistas.",
  "Seu esforço vale ouro. Continue tentando, o sucesso está próximo!",
  "A mente que persiste sempre encontra o caminho. Nos vemos em breve!",
  "A mente descansa, o jogo espera. Nos vemos em breve."
];

// ========== CONSTANTES DE ANIMAÇÃO ==========
const FADE_IN_DURATION_MS = 500;
const FADE_OUT_DURATION_MS = 1000;
const TREMOR_DURATION_MS = 800;
const VIDA_FADE_OUT_DURATION = 700;
const MOTIVATION_TRANSITION_DURATION = 800;

const fraseDeEmbaralharPorCount = new Map<number, string>([
  [3, frasesEmbaralhar[0]],
  [8, frasesEmbaralhar[1]],
  [14, frasesEmbaralhar[2]],
  [20, frasesEmbaralhar[3]],
]);

// 1. PRIMEIRO: Adicione esta função auxiliar logo após as constantes de animação (linha ~87)
// Coloque esta função depois da linha: const fraseDeEmbaralharPorCount = new Map<number, string>([...

const calcularPosicaoSeta = (vidas: number, vidasOrdemExibicao: number[]): { einsteinIndex: number, arrowPosition: string } => {
  // Filtra apenas os Einsteins visíveis (que ainda têm vida)
  const einsteinVisiveis = vidasOrdemExibicao.filter(originalIndex => originalIndex < vidas);
  
  if (einsteinVisiveis.length === 0) {
    return { einsteinIndex: 0, arrowPosition: '50%' }; // Fallback
  }
  
  // Escolhe um Einstein aleatório entre os visíveis
  const einsteinAleatorio = einsteinVisiveis[Math.floor(Math.random() * einsteinVisiveis.length)];
  
  // Calcula a posição da seta baseada na posição do Einstein escolhido
  // As posições são baseadas no layout atual do grid de Einsteins
  const posicoes = {
    0: '20%',   // Primeiro Einstein (mais à esquerda)
    1: '41%',   // Segundo Einstein  
    2: '59%',   // Terceiro Einstein
    3: '85%'    // Quarto Einstein (mais à direita)
  };
  
  // Encontra a posição do Einstein escolhido no array visível
  const posicaoNoGrid = einsteinVisiveis.indexOf(einsteinAleatorio);
  
  // Ajusta a posição baseada no número de Einsteins visíveis
  let arrowPosition: string;
  
  switch (einsteinVisiveis.length) {
    case 1:
      arrowPosition = '50%'; // Centralizado se só há 1
      break;
    case 2:
      arrowPosition = posicaoNoGrid === 0 ? '35%' : '65%';
      break;
    case 3:
      arrowPosition = ['30%', '50%', '70%'][posicaoNoGrid];
      break;
    case 4:
    default:
      arrowPosition = posicoes[einsteinAleatorio as keyof typeof posicoes] || '50%';
      break;
  }
  
  return { einsteinIndex: einsteinAleatorio, arrowPosition };
};

const TituloAnimado = memo(({ tituloAnimando }:any) => {
  const letras = "EINSTEINS".split("");
  if (tituloAnimando) { 
    return (
      <h1 
       key="animating" 
       className="font-bold tracking-widest select-none einsteins-title title-wave-animation">
        {letras.map((letra, index) => (
          <span key={index} className="letter">{letra}</span>
        ))}
      </h1>
    );
  }
  return (
    <h1 className="font-bold tracking-widest select-none einsteins-title">
      EINSTEINS
    </h1>
  );
});

export default function Home() {
 const [selecionadas, setSelecionadas] = useState<string[]>([])
const [acertos, setAcertos] = useState<Array<{name: string, words: string[]}>>([])
  const [vidas, setVidas] = useState(4)
  const [palavrasExibidas, setPalavrasExibidas] = useState<string[]>([])
  const [vidasVisiveis, setVidasVisiveis] = useState([true, true, true, true])
  const [embaralhando, setEmbaralhando] = useState(false)
  const [palavrasAcertoFadeOut, setPalavrasEmFadeOut] = useState<string[]>([]) // Usado para marcar palavras que estão desaparecendo após acerto
  const [grupoAcertoSurgindo, setGrupoSurgindo] = useState<string | null>(null); // Controla a animação do grupo de acerto surgindo
  const [vidasOrdemExibição, setEinsteinOrder] = useState([0, 1, 2, 3]); // Controla a ordem de exibição dos "Einsteins" (vidas)

  const [palavrasAtivas, setPalavrasAtivas] = useState<string[]>([]);  // Palavras atualmente no jogo (não acertadas)
  const [palavraTransitionStates, setPalavraTransitionStates] = useState<Record<string, { opacity: number, transitionDelay: number, transitionDuration: number }>>({});

  const [balaoAtivo, setBalaoAtivo] = useState<{ frase: string; indexEinstein: number | null; arrowLeft: string | null } | null>(null);
  const [isBubbleFadingOut, setIsBubbleFadingOut] = useState(false);

  const onBubbleFullyDisappearedCallbackRef = useRef<(() => void) | null>(null);

  const gameOverProcessedRef = useRef(false);

  const [frasesErroDisponiveis, setFrasesErroDisponiveis] = useState<string[]>([]);
  const [tremorBotoesErro, setErroAtivo] = useState(false); // Controla a animação de tremor nos botões de palavra
  const [processandoErro, setProcessandoErro] = useState(false); // Bloqueia ações enquanto um erro ou acerto está sendo processado

  const [einsteinAnimations, setEinsteinAnimations] = useState<Record<number, string>>({});
const [einsteinClickCooldowns, setEinsteinClickCooldowns] = useState<Record<number, boolean>>({});
  const einsteinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const einsteinContainerRef = useRef<HTMLDivElement | null>(null);
  const risadaAudioRef = useRef<HTMLAudioElement | null>(null);
  const buzinaAudioRef = useRef<HTMLAudioElement | null>(null);
  const [mostrarMensagemMotivacao, setMostrarMensagemMotivacao] = useState(false);
  const [mensagemMotivacionalAtual, setMensagemMotivacionalAtual] = useState('');
  const [gridVisivel, setGridVisivel] = useState(true);
  const [gridTransitionClass, setGridTransitionClass] = useState('');
  const [MotivacaoTransition, setMessageTransitionClass] = useState('');
const mainContainerRef = useRef<HTMLDivElement>(null); 
const bubbleRef = useRef<HTMLDivElement>(null); 
const [bubbleWidth, setBubbleWidth] = useState(0);
const [frasesQuaseAcertoDisponiveis, setFrasesQuaseAcertoDisponiveis] = useState<string[]>([]);
const [gruposARevelar, setGruposARevelar] = useState<Array<{name: string, words: string[], reveladoNoFinal?: boolean}>>([]);
const [acertosOriginais, setAcertosOriginais] = useState<Array<{name: string, words: string[]}>>([]);
  const [shufflePressCount, setShufflePressCount] = useState(0); 
if (process.env.NODE_ENV !== 'production') {
  console.log("-> COMPONENTE CARREGADO/RENDERIZADO: shufflePressCount inicial:", shufflePressCount);
}
const [palavrasComAnimacaoSalto, setPalavrasComAnimacaoSalto] = useState<string[]>([]);
const [mostrarEpílogo, setMostrarEpílogo] = useState(false);
const [fraseFinal, setFraseFinal] = useState<string | null>(null);
const [epilogoEncerrado, setEpilogoEncerrado] = useState(false);

const [tituloAnimando, setTituloAnimando] = useState(false);

const [tituloTapCount, setTituloTapCount] = useState(0);

// Estados para o Quadro de Vencedores
const [vencedores, setVencedores] = useState<{ nome: string; data: string }[]>([]);
const [mostrarInputNome, setMostrarInputNome] = useState(false);
const [nomeAtual, setNomeAtual] = useState('');

const defaultTransitionState = memo(() => ({
  opacity: 1,
  transitionDelay: 0,
  transitionDuration: 400
}as any), [] as any );

const animationsEinstein = memo(() => ['bounce', 'spin', 'heartbeat', 'swing',  'shake',   'jello', 'rubber', 'tada', 'slide-out', 'wiggle', 'pulse', 'flip'], [] as any );

const [ordemOriginalEinsteins, setOrdemOriginalEinsteins] = useState<number[] | null>(null);

  useEffect(() => {
    console.log("Estado de tituloAnimando mudou para:", tituloAnimando);
  }, [tituloAnimando]);

 const calcularRanking = (erros:any) => {
    const rankings:any = {
      0: {
        titulo: "GENIAL",
        subtitulo: "(0 ERROS)",
        descricao: "Com uma mente à frente do seu tempo, você desvendou o enigma sem cometer um único erro. Uma performance verdadeiramente admirável!",
        cor: "text-yellow-600",
        bgCor: "bg-whitw-50",
        borderCor: "border-gray-200"
      },
      1: {
        titulo: "ADMIRÁVEL", 
        subtitulo: "(1 ERRO)",
        descricao: "Um pequeno lapso de memória, mas seu conhecimento é inquestionável! Com apenas um erro, para mostrar que é humano, você juntou as pistas e resolveu o desafio com maestria.",
        cor: "text-blue-400",
        bgCor: "bg-white-50", 
        borderCor: "border-gray-200"
      },
      2: {
        titulo: "PERSPICAZ",
        subtitulo: "(2 ERROS)", 
        descricao: "Seus erros não foram tropeços, mas valiosos aprendizados! Com inigualável perspicácia, você analisou os resultados, superou os desafios e desvendou o enigma final com destreza.",
        cor: "text-green-400", 
        bgCor: "bg-white-50",
        borderCor: "border-gray-200"
      },
      3: {
        titulo: "DESTEMIDO",
        subtitulo: "(3 ERROS)",
        descricao: "Você ousou explorar todas as possibilidades sem medo de errar. Mesmo que isso tenha custado algumas tentativas, sua curiosidade e determinação foram recompensadas. A vitória é sua.",
        cor: "text-purple-400", 
        bgCor: "bg-white-50",
        borderCor: "border-gray-200"
      }
    };
    
    return rankings[erros] || rankings[3]; // Se tiver mais de 3 erros, usa o último
  };

  const cheatResetTimer = useRef(null);


 const animarTitulo = useCallback(() => {
      console.log("animarTitulo chamada!");
  setTituloAnimando(true);
  setTimeout(() => {
    setTituloAnimando(false);
    console.log("tituloAnimando setado para false após timeout.");
  }, 3000); 
}, []);

const [mostrarEinsteinFinal, setMostrarEinsteinFinal] = useState(false);
const [mostrarBalaoFinal, setMostrarBalaoFinal] = useState(false);

useEffect(() => {
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


    // Inicialização do áudio com error handling melhorado
    const initializeAudio = () => {
        if (typeof Audio === 'undefined') return;

        try {
            const audioConfigs = [
                { ref: risadaAudioRef, src: '/risada.mp3', volume: 0.8 },
                { ref: buzinaAudioRef, src: '/buzina.mp3', volume: 0.6 }
            ];

            audioConfigs.forEach(({ ref, src, volume }) => {
                const audio = new Audio(src);
                audio.preload = 'auto';
                audio.volume = volume;
                
                // Error handling para áudio
                audio.addEventListener('error', (e) => {
                    console.warn(`Erro ao carregar áudio ${src}:`, e);
                });
                
                ref.current = audio;
            });
        } catch (error) {
            console.warn('Erro na inicialização do áudio:', error);
        }
    };

    // Execução das inicializações
    initializeGame();
    initializeRefs();
    initializeAudio();

    // Cleanup function otimizada
    return () => {
        // Cleanup de áudios
        [risadaAudioRef.current, buzinaAudioRef.current].forEach(audio => {
            if (audio) {
                audio.pause();
                audio.removeEventListener('error', () => {});
            }
        });
        
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
  const handleGlobalClick = (event:any) => {
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
        let finalBubbleLeft: string | null = null;
        let finalArrowLeft: string | null = arrowLeft;

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
}, [balaoAtivo, isBubbleFadingOut, triggerBubbleVisualDisappearance, einsteinRefs, einsteinContainerRef, FADE_OUT_DURATION_MS]);

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
  const animations = ['bounce', 'heartbeat', 'swing',  'shake',   'jello', 'rubber', 'tada', 'slide-out', 'spin', 'wiggle', 'pulse', 'flip'];
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
  if (jogoPerdido && !gameOverProcessedRef.current) {
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
    const tempoEsperaAdicional = 3500; // TEMPO PARA O EINSTEIN FINAL APARECER
    
    setTimeout(() => {
      console.log("Mostrando Einstein final - jogo perdido!");
      setMostrarEinsteinFinal(true);
    }, tempoAnimacaoBarras + tempoEsperaAdicional);

console.log("frasesFimDeJogo disponíveis:", frasesFimDeJogo);

setTimeout(() => {
      // 🔧 CORREÇÃO: Verificar se o array existe antes de usar
      if (!frasesFimDeJogo || frasesFimDeJogo.length === 0) {
        console.error("frasesFimDeJogo não está definido!");
        // Fallback com frase padrão
        setFraseFinal("Que pena! Mas não desista, a ciência está cheia de tentativas!");
      } else {
        const fraseAleatoria = frasesFimDeJogo[Math.floor(Math.random() * frasesFimDeJogo.length)];
        setFraseFinal(fraseAleatoria);
      }
      
      console.log("Definindo mostrarBalaoFinal como true");
      setMostrarBalaoFinal(true);
    }, tempoAnimacaoBarras + tempoEsperaAdicional + 700);
  }
}, [jogoPerdido, acertos, Grupos, frasesFimDeJogo]);

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
    setMostrarEpílogo(false);
    setEpilogoEncerrado(false);
    setFraseFinal(null);
  }
}, [vidas]);

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
}, [jogoPerdido, jogoGanho, processandoErro, mostrarMensagemMotivacao, agrupando]); // Adicione agrupando às dependências

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
  };

  // Adiciona o listener apenas para a versão web (ignora mobile, pois sem teclado)
  window.addEventListener('keypress', handleKeyPress);

  return () => window.removeEventListener('keypress', handleKeyPress);
}, [Grupos]);

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
}, [Grupos]);

// Função para resetar o jogo para o estado inicial
const reiniciarJogo = useCallback(() => {
    // Reseta as palavras e frases
    setFrasesErroDisponiveis(shuffleArray([...frasesErro]));
    setFrasesQuaseAcertoDisponiveis(shuffleArray([...frasesQuaseAcerto]));
    const palavrasIniciais = shuffleArray([...todasPalavrasDoJogo]);
    setPalavrasExibidas(palavrasIniciais);
    setPalavrasAtivas(todasPalavrasDoJogo);
    setPalavraTransitionStates(gerarTransitionStates(palavrasIniciais, { opacity: 1, duration: 800 }));

    // Reseta o estado do jogo
    setSelecionadas([]);
    setAcertos([]);
    setAcertosOriginais([]);
    setVidas(4);
    setVidasVisiveis([true, true, true, true]);
    setEinsteinOrder([0, 1, 2, 3]);
    
    // Reseta flags de controle
    setProcessandoErro(false);
    setEmbaralhando(false);
    setAgrupando(false);
    gameOverProcessedRef.current = false;
    setShufflePressCount(0);

    // Reseta UI
    setGridVisivel(true);
    setMostrarInputNome(false);
    setNomeAtual('');
}, []); // Dependências vazias, é uma função autocontida

// Função para salvar o nome do vencedor e reiniciar o jogo
const handleSalvarVencedor = (e:any) => {
  e.preventDefault();
  if (nomeAtual.trim()) {
    const errosRealizados = 4 - vidas;
    const ranking = calcularRanking(errosRealizados);
    const novoVencedor = {
      nome: nomeAtual.trim(),
      ranking: ranking.titulo, // Adiciona o título do ranking
      erros: errosRealizados,  // Adiciona a quantidade de erros
      data: new Date().toLocaleDateString('pt-BR')
    };
    
    setVencedores(prev => [...prev, novoVencedor]);
    setMostrarInputNome(false);
    setNomeAtual('');
  }
};
// Efeito para mostrar o input de nome ao vencer
useEffect(() => {
  if (jogoGanho && !processandoErro) {
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
      setPalavrasEmFadeOut(grupoCorreto.words);
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
        setPalavrasEmFadeOut([]);

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

  // ===================== QUASE ACERTO (3 palavras certas) =====================
  else if (grupoParcial) {
    setProcessandoErro(true);
    setErroAtivo(true);

    setTimeout(() => {
      setErroAtivo(false);

      setTimeout(() => {
        if (vidas > 0) {
          let fraseParaExibir: string;
          let proximaFilaFrases = [...frasesQuaseAcertoDisponiveis];
          if (proximaFilaFrases.length === 0) {
            proximaFilaFrases = shuffleArray([...frasesQuaseAcerto]);
          }
          fraseParaExibir = proximaFilaFrases.shift()!;
          setFrasesQuaseAcertoDisponiveis(proximaFilaFrases);

          const indexDaVidaASumir = vidas - 1;

          let arrowPosition: string;
          switch (indexDaVidaASumir) {
            case 3: arrowPosition = '83%'; break;
            case 2: arrowPosition = '68.5%'; break;
            case 1: arrowPosition = '56%'; break;
            case 0: arrowPosition = '47%'; break;
            default: arrowPosition = '50%';
          }

          const handleLifeLossAndUnlockButtons = () => {
            setVidas(prev => Math.max(prev - 1, 0));
            setTimeout(() => {
              setVidasVisiveis(prev => {
                const copy = [...prev];
                if (indexDaVidaASumir >= 0 && einsteinRefs.current?.[indexDaVidaASumir]) {
                  einsteinRefs.current[indexDaVidaASumir]!.classList.add('vida-quebrando');
                  setTimeout(() => {
                    copy[indexDaVidaASumir] = false;
                    setProcessandoErro(false);
                  }, VIDA_FADE_OUT_DURATION);
                } else {
                  copy[indexDaVidaASumir] = false;
                  setProcessandoErro(false);
                }
                return copy;
              });
            }, 1000);
          };

          showBubble(fraseParaExibir, indexDaVidaASumir, arrowPosition, handleLifeLossAndUnlockButtons);
        } else {
          setProcessandoErro(false);
        }
      }, 100);
    }, TREMOR_DURATION_MS);
  }

  // ===================== ERRO COMUM (0, 1 ou 2 palavras certas) =====================
   else {
    setProcessandoErro(true); 
    setErroAtivo(true); 

    setTimeout(() => {
      setErroAtivo(false); 

      setTimeout(() => {
        if (vidas > 0) { 
          const indexDaVidaASumir = vidas - 1; 

          // Define a função de perder vida, que será usada em ambos os casos (com ou sem balão)
          const handleLifeLossAndUnlockButtons = () => {
            setVidas(prev => Math.max(prev - 1, 0)); 
            setTimeout(() => {
              setVidasVisiveis(prev => { 
                const copy = [...prev]; 
                if (indexDaVidaASumir >= 0 && einsteinRefs.current?.[indexDaVidaASumir]) { 
                  einsteinRefs.current[indexDaVidaASumir]!.classList.add('vida-quebrando'); 
                  setTimeout(() => {
                    copy[indexDaVidaASumir] = false; 
                    setProcessandoErro(false); 
                  }, VIDA_FADE_OUT_DURATION); 
                } else {
                  copy[indexDaVidaASumir] = false; 
                  setProcessandoErro(false); 
                }
                return copy; 
              });
            }, 1000); 
          };

          // NOVO: Condição para mostrar a frase de erro com 70% de chance
          if (Math.random() < 0.35) {
            // Comportamento original: Mostra o balão com a frase
            let fraseParaExibir: string;
            let proximaFilaFrases = [...frasesErroDisponiveis]; 
            if (proximaFilaFrases.length === 0) {
              proximaFilaFrases = shuffleArray([...frasesErro]); 
            }
            fraseParaExibir = proximaFilaFrases.shift()!; 
            setFrasesErroDisponiveis(proximaFilaFrases); 

            let arrowPosition: string; 
            switch (indexDaVidaASumir) {
              case 3: arrowPosition = '83%'; break; 
              case 2: arrowPosition = '68.5%'; break; 
              case 1: arrowPosition = '56%'; break; 
              case 0: arrowPosition = '47%'; break; 
              default: arrowPosition = '50%'; 
            }
            
            showBubble(fraseParaExibir, indexDaVidaASumir, arrowPosition, handleLifeLossAndUnlockButtons); 
          } else {
            // NOVO: Comportamento para os 30% restantes: Apenas perde a vida, sem balão.
            handleLifeLossAndUnlockButtons();
          }

        } else {
          setProcessandoErro(false); 
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

    // Pausa áudios de forma otimizada
    const pauseAudios = () => {
        [risadaAudioRef.current, buzinaAudioRef.current].forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    };
    pauseAudios();

    // Sistema de sorteio para os Einsteins 
    const einsteinWinChance = Math.random() < 0.55; // probabilidade dos einsteins embaralharem

    const fadeOutDurationPerItem = 300;
    const fadeInDurationPerItem = 300;
    const maxRandomDelay = 550;

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

        // Restaura após 2.2 segundos
        setTimeout(() => {
          setEinsteinOrder(ordemOriginalEinsteins ?? [0, 1, 2, 3]);
        }, 2200);
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
    showBubble, frasesEmbaralhar, vidas, vidasOrdemExibição // ADICIONADO: vidas e vidasOrdemExibição
]);

  const handleMotivacao = useCallback(() => {
    if (jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao) return;

    setProcessandoErro(true);
    triggerBubbleVisualDisappearance();
    setErroAtivo(false);

    if (risadaAudioRef.current && !risadaAudioRef.current.paused) {
      risadaAudioRef.current.pause();
      risadaAudioRef.current.currentTime = 0;
    }
    if (buzinaAudioRef.current && !buzinaAudioRef.current.paused) {
      buzinaAudioRef.current.pause();
      buzinaAudioRef.current.currentTime = 0;
    }

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

  const iniciarDesabamento = () => {
  console.log('Iniciando desabamento...'); // Debug
  
  // Função auxiliar para encontrar letras
  const encontrarLetras = () => {
    // Tentar diferentes seletores
    const seletores = [
      '.einsteins-title .letter',
      '.title-wave-animation .letter',
      '.einsteins-title span',
      '.title-container .letter'
    ];
    
    for (const seletor of seletores) {
      const letras = document.querySelectorAll(seletor);
      if (letras.length > 0) {
        console.log(`Letras encontradas com seletor: ${seletor}`);
        return letras;
      }
    }
    
    return null;
  };

  // Função para criar letras se não existirem
  const criarLetrasSeNecessario = () => {
    const titulo: any = document.querySelector('.einsteins-title');
    if (!titulo) {
      console.error('Título não encontrado');
      return null;
    }

    const texto = titulo.textContent || titulo.innerText;
    if (!texto) {
      console.error('Texto do título não encontrado');
      return null;
    }

    // Criar estrutura de letras
    titulo.innerHTML = texto.split('').map((char:any) => 
      `<span class="letter" style="display: inline-block; transform-origin: center bottom;">${char}</span>`
    ).join('');
    
    return titulo.querySelectorAll('.letter');
  };

  // 1. Tentar encontrar ou criar as letras
  let letras = encontrarLetras();
  
  if (!letras || letras.length === 0) {
    console.log('Letras não encontradas, tentando criar...');
    letras = criarLetrasSeNecessario();
  }

  // 2. Animar letras individualmente
  if (letras && letras.length > 0) {
    console.log(`Animando ${letras.length} letras`);
    
    letras.forEach((letra, i) => {
      const elemento = letra as HTMLElement;
      
      // Garantir propriedades necessárias
      elemento.style.display = 'inline-block';
      elemento.style.transformOrigin = 'bottom';
      
      // Aplicar animação
      elemento.style.transition = 'transform 7s ease-out, opacity 7s ease-out';
      elemento.style.transitionDelay = `${i * 100}ms`;
      
      // Usar requestAnimationFrame para garantir que a transição seja aplicada
      requestAnimationFrame(() => {
        elemento.style.transform = `translateY(${Math.random() * 300 + 1000}px) rotate(${Math.random() * 30 - 15}deg)`;
        elemento.style.opacity = '0';
      });
    });
  } else {
    // Fallback: animar título inteiro
    console.log('Fallback: animando título inteiro');
    const titulo = document.querySelector('.einsteins-title');
    if (titulo) {
      const elemento = titulo as HTMLElement;
      elemento.style.transition = 'transform 3s ease-out, opacity 0.8s ease-out';
      requestAnimationFrame(() => {
        elemento.style.transform = 'translateY(200px) rotate(15deg) scale(0.8)';
        elemento.style.opacity = '0';
      });
    }
  }

  // 3. Após animação do título, animar o main
  setTimeout(() => {
    console.log('Animando container principal...');
    const main = document.querySelector('main');
    if (main) {
      const elemento = main as HTMLElement;
      elemento.style.transition = 'transform 4s ease-in, opacity 1s ease-in';
      elemento.style.transformOrigin = 'center top';
      
      requestAnimationFrame(() => {
        elemento.style.transform = 'translateY(500px) scale(0.9)';
        elemento.style.opacity = '0';
      });
    }
    
    // 4. Finalizar após todas as animações
    setTimeout(() => {
      console.log('Desabamento concluído');
      setEpilogoEncerrado(true);
    }, 1200);
  }, 800);
};

  return ( 
     <>
       
<style jsx>{`
  .btn-press-effect {
    transition: opacity 0.15s ease-in-out;
  }

  .btn-press-effect:active {
    transform: scale(0.90) translateY(1px);
    transition: transform 0.2s ease-out;
  }

  .einsteins-title .letter {
    display: inline-block;
    animation-fill-mode: both;
    will-change: transform;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
    contain: layout style paint;
    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  🔧 Guia de Implementação - Correção das Cores das Barras
Problema Identificado
As barras de acerto estão aparecendo cinzas quando o jogador perde porque:

As cores estão sendo definidas no JavaScript, mas não aplicadas no CSS
Pode haver conflito entre estilos CSS e inline styles
A propriedade color não está sendo convertida para backgroundColor no CSS

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
        body { margin:0; background:#f5f5f5; font-family:'Oswald',sans-serif; color:#1a1a1a; }
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
            padding: 0.5rem 0.75rem; font-size: 0.8rem; color: #333; text-align: center;
            word-wrap: break-word; box-sizing: border-box; z-index: 10;
            bottom: calc(100% + 10px); box-shadow: 0 4px 5px rgba(0,0,0,0.2);
            pointer-events: none; left: 0; right: 0; transform: none;
            max-width: none; width: auto; min-width: 150px;
            @media (min-width: 640px) {
                left: 7%; right: auto; transform: translateX(-50%);
                max-width: 600px; width: auto; min-width: 460px;
                font-size: 1rem; padding: 0.75rem 1rem;
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
  0% {
    transform: translateY(0px) translateZ(0); /* Valores explícitos em px */
  }
  20% {
    transform: translateY(-8px) translateZ(0);
  }
  40% {
    transform: translateY(0px) translateZ(0);
  }
  60% {
    transform: translateY(-4px) translateZ(0);
  }
  80% {
    transform: translateY(0px) translateZ(0);
  }
  100% {
    transform: translateY(0px) translateZ(0); /* Estado final explícito */
  }
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
  .title-wave-animation .letter {
  animation-name: waveAnimation !important;
  animation-duration: 1.5s !important;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: both !important;
  display: inline-block !important;
  
  /* NOVO: Força otimização durante a animação */
  will-change: transform !important;
}

.speech-bubble-final {
  position: absolute;
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
  max-width: 450px;
  width: auto;
  min-width: 300px;
  top: 24%;
  transform: translateY(-15px); /* faz o balão “subir” sempre 15px, independente da altura */
}

@media (max-width: 640px) {
  .speech-bubble-final {
    top: 20%;
    max-width: 78%;
    min-width: auto;
    transform: translateY(-15px); /* igual no mobile! */
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
  left: 50%;
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
    setTituloTapCount(0); // Zera o contador após ativar
  } else if (tituloTapCount === 10) {
    forcarDerrota();
    setTituloTapCount(0); // Zera o contador após ativar
  }

  // Cria um novo timer. Se o usuário não tocar novamente em 2 segundos,
  // a contagem é zerada.
  cheatResetTimer.current = setTimeout(() => {
    console.log('Contador de cheat zerado por inatividade.');
    setTituloTapCount(0);
  }, 2000); // 2 segundos de tempo limite

}, [tituloTapCount, forcarVitoria, forcarDerrota]);

import { AnimatePresence } from 'framer-motion';

      `}</style>
      {/* Container para o título fora do main */}
       <div 
        className="title-container"
        onClick={() => setTituloTapCount(prev => prev + 1)}
      >
        <TituloAnimado tituloAnimando={tituloAnimando} />
      </div>
{mostrarEinsteinFinal && !epilogoEncerrado && (
  <motion.div 
    className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white/90"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.img 
      src="/einstein_final.png"
      alt="Einstein Final"
      className="w-28 sm:w-40 mb-4"
      initial={{ scale: 0.7 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    />

    {mostrarBalaoFinal && (
   <motion.div 
  className="speech-bubble-final"
  onClick={() => {
    setMostrarEinsteinFinal(false);
    setMostrarBalaoFinal(false);
    setMostrarEpílogo(false);
    iniciarDesabamento();
  }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6, duration: 1.5 }}
>
  {fraseFinal}
</motion.div>
    )}
  </motion.div>
)}

<main ref={mainContainerRef} className="p-4 max-w-xl mx-auto min-h-screen flex flex-col justify-start bg-white border border-gray-300 shadow-lg sm:p-6">
       
       
        {/* BARRAS DE ACERTO */}
        <div
          className=" -mb-2 space-y-2 sm:-mb-0 sm: mt-0 sm:space-y-2"
          style={{
            minHeight: `${acertos.length  * 60}px`, 
            transition: 'min-height 0.8s ease-out'
          }}
        >
 {acertos.map((g:any, i) => {
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
      exit={{ opacity: 0, x: -50 }}
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
        {g.words.map((w:any)=> w.toUpperCase()).join(', ')}
      </span>
    </motion.div>
  );
})}
        </div>
        

{gridVisivel && (
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
    className={`grid grid-cols-4 mt-2.5 gap-2.5 mb-5 grid-transition sm:gap-3 sm:mb-6 sm:mt-1 ${gridTransitionClass}`}
    style={{ '--motivation-transition-duration': `${MOTIVATION_TRANSITION_DURATION}ms` } as React.CSSProperties}
  >
   {palavrasExibidas.map((palavra, index) => {
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
  className={`p-3 border-2 sm:border-8 shadow-lg text-xs
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
        
<div 
  ref={einsteinContainerRef} 
  className={`flex justify-center items-center gap-3 mb-2 sm:gap-5 sm:mb-5 relative w-full layout-shift-container ${
    balaoAtivo ? 'layout-shift-down' : ''
  }`}
>
  {/* Seu código dos Einsteins aqui */}
  <AnimatePresence mode="popLayout">
    {vidasOrdemExibição.map((originalIndex) => (
      originalIndex < vidas && (
        <motion.div
          key={originalIndex} 
          layoutId={`einstein-${originalIndex}`}
          ref={(el:any) => einsteinRefs.current[originalIndex] = el}
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
            src="https://www.pngplay.com/wp-content/uploads/6/Albert-Einstein-Tongue-PNG.png"
            alt="Vida"
            className="w-full h-full select-none" 
            draggable={false}
            loading="lazy"
          />
        </motion.div>
      )
    ))}
  </AnimatePresence>

  <AnimatePresence>
    {mostrarEinsteinFinal && (
      <motion.div 
        className="einstein-final"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 0.8,
          transition: { 
            duration: 1.2, // Aumentado para transição mais suave
            ease: "easeInOut" 
          }
        }}
        transition={{ duration: 0.8 }}
      >
        {/* Conteúdo do Einstein */}
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {mostrarBalaoFinal && (
      <motion.div 
        className="speech-bubble-final"
        onClick={() => { 
          setMostrarEinsteinFinal(false); 
          setMostrarBalaoFinal(false); 
          setMostrarEpílogo(false); 
          // Aumentar o delay para permitir a transição completa
          setTimeout(() => iniciarDesabamento(), 1400); // 1400ms para dar tempo da animação de 1.2s completar
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ 
          opacity: 0, 
          y: -20,
          transition: { 
            duration: 1.2, // Aumentado para transição mais suave
            ease: "easeInOut" 
          }
        }}
        transition={{ duration: 0.8 }}
      >
        {fraseFinal}
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {balaoAtivo && (
       <motion.div
        ref={bubbleRef}
        className={`speech-bubble ${isBubbleFadingOut ? 'fade-out' : 'active'}`}
        style={{
            '--arrow-left': balaoAtivo.arrowLeft,
        }}
        initial={{ opacity: 0, y: 1 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 1, transition: { duration: FADE_OUT_DURATION_MS / 1200 }, delay: 0,  ease: "easeOut" }} 
        transition={{ duration: FADE_IN_DURATION_MS / 800, delay: 0, ease: "easeOut" }}
        onClick={handleBubbleClick}
        >
          <p>{balaoAtivo.frase}</p>
        </motion.div>
    )}
  </AnimatePresence>
</div>

{/* SEÇÃO DOS BOTÕES - Usando apenas Framer Motion */}
<motion.div 
  layout
  animate={{
    y: balaoAtivo ? 69 : 0, // Movimento vertical
  }}
  transition={{
    // Configurações específicas para o movimento y
    y: {
      type: "spring",
      stiffness: 30,  // ⬆️ Aumentar = mais rápido
      damping: 10, // ⬆️ Aumentar = menos oscilação
      duration: 4,
    },
    // Configurações para layout (quando elementos aparecem/desaparecem)
    layout: {
      type: "spring",
      stiffness: 85,
      damping: 15,
      duration: 1.5,
    }
  }}
  className={`flex flex-col items-center gap-2 mb-6 mt-2`} // Remover layout-shift-container
>
  {/* Seu conteúdo dos botões aqui */}
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
      onClick={verificar}
      disabled={selecionadas.length !== 4 || jogoPerdido || jogoGanho || processandoErro || embaralhando || agrupando}
      className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border border-gray-800 shadow-lg btn-press-effect 
        ${(selecionadas.length === 4 && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 
          'hover:bg-gradient-to-br hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} 
          sm:px-7 sm:py-3 sm:text-lg`}
    >
      Verificar
    </motion.button>
    
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
      className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border border-gray-800 shadow-lg btn-press-effect ${(selecionadas.length > 0 && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 
        'hover:bg-gradient-to-br hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} sm:px-7 sm:py-3 sm:text-lg`}
    >
      Limpar
    </motion.button>
  </div>

  {/* LINHA 2: Embaralhar e Agrupar */}
  <div className="flex w-full gap-2.5 sm:gap-3.4">
    <motion.button
      layout
      transition={{ type: "spring", stiffness: 85, damping: 15, duration: 1 }}
      onClick={embaralhar}
      disabled={embaralhando || jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao || agrupando}
      className={`w-full px-5 py-2 text-base bg-white text-gray-900 border border-gray-500 shadow-lg btn-press-effect sm:px-7 sm:py-3 sm:text-lg transition-opacity duration-1550 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${(!embaralhando && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 'hover:bg-gray-100' : ''}`}
    >
      Embaralhar
    </motion.button>

    <motion.button
      layout
      transition={{ type: "spring", stiffness: 85, damping: 15, duration: 1 }}
      onClick={handleAgrupar}
      disabled={selecionadas.length < 2 || agrupando || embaralhando || jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao}
      className={`w-full px-5 py-2 text-base bg-white text-gray-900 border border-gray-500 shadow-lg btn-press-effect sm:px-7 sm:py-3 sm:text-lg transition-opacity duration-1550 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${(!embaralhando && !jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao && selecionadas.length >= 2) ? 'hover:bg-gray-100' : ''}`}
    >
      Agrupar
    </motion.button>
  </div>

  {/* LINHA 3: Motivação */}
  <motion.button
    layout
    transition={{ type: "spring", stiffness: 85, damping: 15, duration: 1 }}
    onClick={handleMotivacao}
    disabled={jogoPerdido || jogoGanho || processandoErro || mostrarMensagemMotivacao || embaralhando || agrupando}
    className={`w-full px-5 py-2 text-base bg-gray-900 text-gray-100 border border-gray-800 shadow-lg btn-press-effect ${(!jogoPerdido && !jogoGanho && !processandoErro && !mostrarMensagemMotivacao) ? 'hover:bg-gradient-to-br hover:from-black hover:to-gray-900' : 'opacity-50 cursor-not-allowed'} sm:px-7 sm:py-3 sm:text-lg`}
  >
    Motivação
  </motion.button>
</motion.div>
 <div className="mt-6 pt-4 border-t-2 border-gray-200">
        <h2 className="text-l font-bold text-center mb-4 text-gray-700 tracking-wider">
          QUADRO DE VENCEDORES
        </h2>
        {vencedores.length > 0 ? (
<ul className="space-y-2 max-h-48 overflow-y-auto p-4 bg-gray-50/90 backdrop-blur-sm shadow-xl border border-gray-200/50 ring-1 ring-gray-100/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
{vencedores.slice().reverse().map((vencedor, index) => (
<li key={index} className="flex justify-between items-center bg-white p-1.5 shadow-sm animate-fade-in border border-gray-300">
                        <span className="font-semibold text-sm text-gray-800">{vencedor.nome}</span>
                        <span className="text-sm text-gray-700">{vencedor.data}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-gray-500 italic mt-4">Ninguém venceu ainda. Seja o primeiro!</p>
        )}
    </div>
    { }

</main> 

{/* =================================================================== */}
<AnimatePresence>
  {mostrarInputNome && (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: -50, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        className="w-full max-w-md"
      >
        {(() => {
          const errosRealizados = 4 - vidas; // Calcula quantos erros foram feitos
          const ranking = calcularRanking(errosRealizados);
          
          return (
            <div className={`bg-white p-6 sm:p-8 shadow-xl text-center border-4 ${ranking.borderCor} ${ranking.bgCor}`}>
              {/* Título de Parabéns */}
      <motion.h2 
  className="text-3xl sm:text-4xl font-extrabold mb-3 text-gray-800"
  animate={{
    scale: [1, 1.05, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
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
                <h3 className={`text-[23px] sm:text-2xl font-bold ${ranking.cor} mb-1`}>
                  {ranking.titulo}
                </h3>
                <p className={`text-sm ${ranking.cor} font-semibold mb-3`}>
                  {ranking.subtitulo}
                </p>
                <p className="text-gray-700 text-[17px] sm:text-[10x] leading-relaxed mb-9">
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
                <p className="mb-4 text-gray-900 text-[17px] sm:text-[20px] ">
                  Deixe sua marca no Quadro de Vencedores
                </p>
                <input
                  type="text"
                  value={nomeAtual}
                  onChange={(e) => setNomeAtual(e.target.value)}
                  className="w-full text-[13px] sm:text-[16px] border-2 border-gray-400 p-1 mb-4 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                  placeholder="Saindo do anonimato"
                  maxLength={25}
                  autoFocus
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
    </>
  )  }
