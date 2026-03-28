import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { API_BASE_URL } from '../config/api';

interface GlobalPlayerProps {
  streamUrl: string;
  title?: string;
  streamId?: string;
  contentType?: 'TV' | 'MOVIE' | 'SERIES' | 'EPISODE';
  seriesId?: string;
  seasonId?: string;
  episodeNum?: number;
  startAt?: number;
  onClose: () => void;
  onNext?: () => void;
}

/**
 * GlobalPlayer
 * Reprodutor de vídeo de alta performance operando em tela cheia via CSS (fixed inset-0).
 * Não usa a API de Fullscreen do navegador — ocupa 100% da viewport por estilo.
 * Preserva o estado da UI por trás enquanto exibe o conteúdo.
 */
export function GlobalPlayer({ streamUrl, title, streamId, contentType, seriesId, seasonId, episodeNum, startAt, onClose, onNext }: GlobalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const showControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const [isBuffering, setIsBuffering] = useState(true);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(30);

  // Flag para suprimir erros de rede após o vídeo já ter iniciado reprodução
  const hasStartedPlaying = useRef(false);
  const hasTriggeredNext = useRef(false);

  // Inteceptação de Progresso (Assistindo)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !streamId || !contentType) return;

    const currentTime = video.currentTime;
    const duration = video.duration || 0;

    // Apenas sincroniza com o Backend a cada 10 segundos para não floodar a API
    if (currentTime - lastSyncTimeRef.current >= 10) {
      syncProgress(currentTime, duration);
    }

    // Lógica da contagem regressiva para o próximo episódio
    if (onNext && duration > 0 && contentType === 'EPISODE') {
      const timeLeft = duration - currentTime;
      if (timeLeft <= 30 && timeLeft > 0) {
        setShowCountdown(true);
        setCountdownSeconds(Math.ceil(timeLeft));

        if (timeLeft <= 0.5 && !hasTriggeredNext.current) {
          hasTriggeredNext.current = true;
          onNext();
        }
      } else {
        setShowCountdown(false);
      }
    }
  };

  const syncProgress = (currentTime: number, duration: number) => {
    if (!streamId || !contentType) return;
    
    // Evita resetar o progresso se o vídeo acabou de abrir (antes de 1s) ou se não tem duração válida
    if (currentTime < 1 || duration <= 0 || !hasStartedPlaying.current) return;

    lastSyncTimeRef.current = currentTime;
    
    const token = useAuthStore.getState().token;

    if (token) {
      fetch(`${API_BASE_URL}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            streamId,
            contentType,
            seriesId,
            seasonId,
            episodeNum,
            progressSecs: Math.floor(currentTime),
            durationSecs: Math.floor(duration)
          })
      }).catch(err => console.error('Erro silencioso de progresso', err));
    }
  };

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
    hasTriggeredNext.current = false;
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
      startPosition: startAt && startAt > 0 ? startAt : -1,
    };

    const initializePlayer = () => {
      if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
        const hls = new Hls(hlsConfig);
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (startAt && startAt > 0) {
            video.currentTime = startAt;
          }
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
        // Fallback para Safari/HLS nativo ou MP4 direto. Hash #t= resolve a seek inicial em MP4/MKV.
        let sourceUrl = streamUrl;
        if (startAt && startAt > 0 && !streamUrl.includes('.m3u8')) {
          sourceUrl = `${streamUrl}#t=${startAt}`;
        }
        
        video.src = sourceUrl;
        video.addEventListener('loadedmetadata', () => {
          if (startAt && startAt > 0 && streamUrl.includes('.m3u8')) {
            video.currentTime = startAt;
          }
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Sincronização final ao fechar o player
      if (videoRef.current) {
        syncProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
      }
    };
  }, [onClose, streamId, contentType]); // Adicionado deps para o sync final

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
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          if (onNext) onNext();
          else onClose();
        }}
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

      {/* Countdown UI */}
      {showCountdown && onNext && countdownSeconds > 0 && (
        <div className="absolute bottom-16 right-16 bg-black/80 border border-white/20 p-6 rounded-xl backdrop-blur-md flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Próximo episódio em</p>
          <div className="text-4xl font-black text-white">{countdownSeconds}</div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="mt-2 px-6 py-2 bg-white text-black font-bold text-xs uppercase rounded-sm hover:scale-105 active:scale-95 transition-all outline-none"
          >
            Pular
          </button>
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
