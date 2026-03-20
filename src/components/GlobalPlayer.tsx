import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, ArrowLeft } from 'lucide-react';

interface GlobalPlayerProps {
  streamUrl: string;
  title?: string;
  onClose: () => void;
}

/**
 * GlobalPlayer
 * Reprodutor de vídeo de alta performance operando em tela cheia via CSS (fixed inset-0).
 * Não usa a API de Fullscreen do navegador — ocupa 100% da viewport por estilo.
 * Preserva o estado da UI por trás enquanto exibe o conteúdo.
 */
export function GlobalPlayer({ streamUrl, title, onClose }: GlobalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const showControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isBuffering, setIsBuffering] = useState(true);
  const [isUIVisible, setIsUIVisible] = useState(true);

  // Flag para suprimir erros de rede após o vídeo já ter iniciado reprodução
  const hasStartedPlaying = useRef(false);

  // Sumiço automático da UI após 3 segundos sem interação
  const handleMouseMove = () => {
    setIsUIVisible(true);
    if (showControlsTimer.current) clearTimeout(showControlsTimer.current);
    showControlsTimer.current = setTimeout(() => setIsUIVisible(false), 3000);
  };

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (showControlsTimer.current) clearTimeout(showControlsTimer.current);
    };
  }, []);

  // Inicialização e configuração do HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configurações agressivas de buffer para alta performance com IPTV
    const hlsConfig = {
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      enableWorker: true,
      lowLatencyMode: false,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      manifestLoadingMaxRetry: 5,
      manifestLoadingRetryDelay: 2000,
      levelLoadingMaxRetry: 4,
    };

    const initializePlayer = () => {
      if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
        const hls = new Hls(hlsConfig);
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setTimeout(() => {
            video.play().catch(e => console.error('Auto-play prevented:', e));
          }, 300);
        });

        // Força play na troca de fragmento se o vídeo ficou pausado
        hls.on(Hls.Events.FRAG_CHANGED, () => {
          if (video.paused) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;

          // Se já está rodando, ignora erros de rede para não interromper com mensagem
          if (hasStartedPlaying.current && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            console.warn('Erro de rede ignorado (streams já iniciado):', data.details);
            hls.startLoad();
            return;
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Media error, recovering...');
              hls.recoverMediaError();
              break;
            default:
              console.error('HLS Fatal error:', data);
              hls.destroy();
              break;
          }
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl') || !streamUrl.includes('.m3u8')) {
        // Fallback para Safari/HLS nativo ou MP4 direto
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.error('Auto-play prevented:', e));
        });
      }
    };

    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Eventos de estado do vídeo (buffering)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => {
      // Só mostra buffering se ainda não começou de verdade
      if (!hasStartedPlaying.current) setIsBuffering(true);
    };
    const handlePlaying = () => {
      hasStartedPlaying.current = true;
      setIsBuffering(false);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Controle remoto / teclado para fechar o player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape (PC), Backspace, teclas back de Samsung Tizen (10009) e LG WebOS (461)
      if (
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        e.keyCode === 10009 ||
        e.keyCode === 461
      ) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center ${isUIVisible ? 'cursor-default' : 'cursor-none'}`}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* Vídeo nativo ocupa 100% do espaço */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={isUIVisible}
        autoPlay
        playsInline
      />

      {/* Overlay de carregamento — só aparece antes do vídeo iniciar */}
      {isBuffering && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
          <Loader2 className="w-14 h-14 text-white animate-spin opacity-80" />
          <p className="text-white/50 uppercase tracking-widest text-xs mt-5 font-bold animate-pulse">
            Carregando...
          </p>
        </div>
      )}

      {/* Header com botão Voltar — some após inatividade */}
      <div
        className={`absolute top-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-6 transition-opacity duration-500 pointer-events-none ${
          isUIVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-12 h-12 rounded-full bg-black/50 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-md transition-all border border-white/10 hover:scale-110 active:scale-95"
          title="Sair do Player (Esc / Voltar)"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {title && (
          <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-xl line-clamp-1">
            {title}
          </h1>
        )}
      </div>
    </div>
  );
}
