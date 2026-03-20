import { useState, useEffect } from 'react';
import { Page, ViewMode, ContentItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ContentPage } from './pages/ContentPage';
import { Settings } from './pages/Settings';
import { DetailsPage } from './pages/DetailsPage';
import { GlobalPlayer } from './components/GlobalPlayer';
import { xtreamService } from './services/xtream.service';
import { GlobalSearch } from './components/GlobalSearch';

/**
 * Componente Principal da Aplicação (App)
 * Gerencia o estado global, navegação e layout principal.
 */
export default function App() {
  // Estados para controlar a página ativa, modo de visualização e busca
  const [activePage, setActivePage] = useState<Page>('Inicio');
  const [previousPage, setPreviousPage] = useState<Page>('Inicio');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isTV, setIsTV] = useState(false);
  const [playingStream, setPlayingStream] = useState<{ url: string; title?: string } | null>(null);

  // Estados de persistência para as páginas de conteúdo (Categoria e Página atual)
  const [tvState, setTvState] = useState({ categoryId: 'all', page: 1, catPage: 1 });
  const [movieState, setMovieState] = useState({ categoryId: 'all', page: 1, catPage: 1 });
  const [seriesState, setSeriesState] = useState({ categoryId: 'all', page: 1, catPage: 1 });

  // Memória de scroll para cada página
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  // Estados para dados reais da API
  const [channels, setChannels] = useState<ContentItem[]>([]);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para Categorias
  const [liveCategories, setLiveCategories] = useState<{ id: string, name: string }[]>([]);
  const [movieCategories, setMovieCategories] = useState<{ id: string, name: string }[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<{ id: string, name: string }[]>([]);

  // Estado para gerenciar os itens favoritados pelo usuário
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cache global para garantir que a busca funcione sempre em todo o conteúdo carregado
  const [globalSearchData, setGlobalSearchData] = useState<{
    channels: ContentItem[],
    movies: ContentItem[],
    series: ContentItem[]
  }>({ channels: [], movies: [], series: [] });

  // Carrega categorias, dados iniciais e detecta TV
  useEffect(() => {
    // Adiciona classe global 'is-tv' para adaptar via CSS o foco em TVs antigas
    const ua = navigator.userAgent.toLowerCase();
    const isDetectedTV = [
      'tv', 'smarttv', 'googletv', 'appletv', 'webos', 'tizen',
      'hbbtv', 'netcast', 'viera', 'aquos', 'bravia', 'roku',
      'firetv', 'chromecast', 'mibox', 'shield'
    ].some(keyword => ua.includes(keyword));

    setIsTV(isDetectedTV);
    if (isDetectedTV) {
      document.body.classList.add('is-tv');
    }

    async function loadInitialData() {
      setIsLoading(true);
      try {

        // 1. Primeiro buscamos todas as categorias
        const [
          liveCats, movieCats, seriesCats
        ] = await Promise.all([
          xtreamService.getLiveCategories(),
          xtreamService.getVODCategories(),
          xtreamService.getSeriesCategories(),
        ]);

        const mappedLiveCats = liveCats.map(c => ({ id: c.category_id, name: c.category_name }));
        const mappedMovieCats = movieCats.map(c => ({ id: c.category_id, name: c.category_name }));
        const mappedSeriesCats = seriesCats.map(c => ({ id: c.category_id, name: c.category_name }));

        setLiveCategories(mappedLiveCats);
        setMovieCategories(mappedMovieCats);
        setSeriesCategories(mappedSeriesCats);

        // 2. Agora buscamos o conteúdo inicial para alimentar a busca global.
        // Buscamos sem categoria definida para pegar de todas as categorias, com um limite maior.
        const [
          liveData, movieData, seriesData
        ] = await Promise.all([
          xtreamService.getLiveStreams(undefined, 2000), // Carrega até 2000 canais para busca global
          xtreamService.getVODStreams(undefined, 2000),  // Carrega até 2000 filmes para busca global
          xtreamService.getSeries(undefined, 1000)       // Carrega até 1000 séries para busca global
        ]);

        setChannels(liveData as ContentItem[]);
        setMovies(movieData as ContentItem[]);
        setSeries(seriesData as ContentItem[]);

        // Alimenta o cache global de busca
        setGlobalSearchData({
          channels: liveData as ContentItem[],
          movies: movieData as ContentItem[],
          series: seriesData as ContentItem[]
        });
      } catch (error) {
        console.error('Falha ao carregar dados iniciais da Xtream API:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  /**
   * Monitora a mudança de página para restaurar o scroll
   */
  useEffect(() => {
    // Restaurar scroll após a renderização da página
    if (activePage !== 'Detalhes') {
      const scrollPos = scrollPositions[activePage] || 0;
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // Delay para garantir que o conteúdo terminou de renderizar (especialmente em listas longas)
        const timeout = setTimeout(() => {
          mainElement.scrollTo({ top: scrollPos, behavior: 'instant' });
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [activePage, scrollPositions]);

  /**
   * Recarrega dados de uma categoria específica e o persiste no estado da página
   */
  const handleCategoryChange = async (type: 'TV' | 'Movie' | 'Series', categoryId: string) => {
    setIsLoading(true);

    // Atualiza o estado persistente da categoria
    if (type === 'TV') setTvState(prev => ({ ...prev, categoryId, page: 1 }));
    else if (type === 'Movie') setMovieState(prev => ({ ...prev, categoryId, page: 1 }));
    else if (type === 'Series') setSeriesState(prev => ({ ...prev, categoryId, page: 1 }));

    try {
      if (type === 'TV') {
        const id = categoryId === 'all' ? liveCategories[0]?.id : categoryId;
        const data = await xtreamService.getLiveStreams(id, 100);
        setChannels(data as ContentItem[]);
      } else if (type === 'Movie') {
        const id = categoryId === 'all' ? movieCategories[0]?.id : categoryId;
        const data = await xtreamService.getVODStreams(id, 100);
        setMovies(data as ContentItem[]);
      } else if (type === 'Series') {
        const id = categoryId === 'all' ? seriesCategories[0]?.id : categoryId;
        const data = await xtreamService.getSeries(id, 100);
        setSeries(data as ContentItem[]);
      }
    } catch (error) {
      console.error(`Erro ao carregar categoria ${categoryId} para ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza o estado de paginação/navegação de um tipo de conteúdo
   */
  const updatePageState = (type: 'TV' | 'Movie' | 'Series', newState: Partial<{ categoryId: string, page: number, catPage: number }>) => {
    if (type === 'TV') setTvState(prev => ({ ...prev, ...newState }));
    else if (type === 'Movie') setMovieState(prev => ({ ...prev, ...newState }));
    else if (type === 'Series') setSeriesState(prev => ({ ...prev, ...newState }));
  };

  /**
   * Alterna o status de favorito de um item
   */
  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  /**
   * Altera a página atual e salva o scroll
   */
  const handlePageChange = (page: Page) => {
    // Limpa a busca ao navegar entre páginas principais
    setSearchQuery('');

    const mainElement = document.querySelector('main');
    if (mainElement && activePage !== 'Detalhes') {
      setScrollPositions(prev => ({ ...prev, [activePage]: mainElement.scrollTop }));
    }

    if (activePage !== 'Detalhes') {
      setPreviousPage(activePage);
    }
    setActivePage(page);
    if (page !== 'Detalhes') {
      setSelectedItem(null);
    }
  };

  /**
   * Abre a página de detalhes de um item e salva o scroll
   */
  const handleItemClick = (item: ContentItem) => {
    setSearchQuery('');
    const mainElement = document.querySelector('main');
    if (mainElement) {
      setScrollPositions(prev => ({ ...prev, [activePage]: mainElement.scrollTop }));
    }

    setPreviousPage(activePage);
    setSelectedItem(item);
    setActivePage('Detalhes');
  };

  /**
   * Volta para a página anterior, recuperando o contexto
   */
  const handleBack = () => {
    setSearchQuery('');
    setSelectedItem(null);
    setActivePage(previousPage);
  };

  /**
   * Intercepta o botão Voltar do controle remoto da TV via History API.
   *
   * O navegador de Smart TVs (Tizen, WebOS, HbbTV) trata o botão Voltar como
   * um "history.back()" nativo, o que faria o usuário sair do site.
   *
   * Estratégia: mantemos sempre uma entrada extra no histórico com pushState.
   * Quando o browser dispara "popstate" (botão Voltar pressionado), nós:
   *   1. Reimpostamos imediatamente a entrada no histórico (para não sair do site)
   *   2. Executamos nossa lógica de navegação interna
   *
   * Também mantemos o listener de keydown como fallback para PC (Backspace/Esc).
   */
  useEffect(() => {
    // Injeta a entrada de guarda no histórico do browser
    window.history.pushState({ streamviewApp: true }, '');

    const handlePopState = () => {
      // Reimpostar imediatamente para que o próximo Voltar também seja interceptado
      window.history.pushState({ streamviewApp: true }, '');

      // Lógica de navegação interna (mesma prioridade do keydown)
      if (playingStream) {
        setPlayingStream(null);
      } else if (activePage === 'Detalhes') {
        handleBack();
      } else if (activePage !== 'Inicio') {
        handlePageChange('Inicio');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isBackKey =
        e.key === 'Backspace' ||
        e.keyCode === 10009 ||
        e.keyCode === 461;

      // Esc só fecha o player, não navega entre páginas
      if (e.key === 'Escape' && playingStream) {
        e.preventDefault();
        setPlayingStream(null);
        return;
      }

      if (!isBackKey) return;
      // Não interferêtil em inputs de texto
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      e.preventDefault();

      if (playingStream) {
        setPlayingStream(null);
      } else if (activePage === 'Detalhes') {
        handleBack();
      } else if (activePage !== 'Inicio') {
        handlePageChange('Inicio');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePage, playingStream]);

  /**
   * Renderiza o componente da página correspondente
   */
  const renderPage = () => {
    switch (activePage) {
      case 'Inicio':
        return (
          <Home
            channels={channels}
            movies={movies}
            series={series}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            onSeeMore={(page) => handlePageChange(page)}
            isLoading={isLoading}
            isTV={isTV}
          />
        );
      case 'TV':
        return (
          <ContentPage
            items={channels}
            type="TV"
            categories={liveCategories}
            initialCategoryId={tvState.categoryId}
            initialPage={tvState.page}
            initialCatPage={tvState.catPage}
            onStateChange={(state) => updatePageState('TV', state)}
            onCategoryChange={(catId) => handleCategoryChange('TV', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
          />
        );
      case 'Filmes':
        return (
          <ContentPage
            items={movies}
            type="Movie"
            categories={movieCategories}
            initialCategoryId={movieState.categoryId}
            initialPage={movieState.page}
            initialCatPage={movieState.catPage}
            onStateChange={(state) => updatePageState('Movie', state)}
            onCategoryChange={(catId) => handleCategoryChange('Movie', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
          />
        );
      case 'Series':
        return (
          <ContentPage
            items={series}
            type="Series"
            categories={seriesCategories}
            initialCategoryId={seriesState.categoryId}
            initialPage={seriesState.page}
            initialCatPage={seriesState.catPage}
            onStateChange={(state) => updatePageState('Series', state)}
            onCategoryChange={(catId) => handleCategoryChange('Series', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
          />
        );
      case 'Detalhes':
        return selectedItem ? (
          <DetailsPage
            item={selectedItem}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onBack={handleBack}
            isTV={isTV}
            onPlay={(url, title) => setPlayingStream({ url, title })}
          />
        ) : (
          <Home
            channels={channels}
            movies={movies}
            series={series}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            onSeeMore={(page) => handlePageChange(page)}
            isLoading={isLoading}
            isTV={isTV}
          />
        );
      case 'Configuracoes':
        return <Settings />;
      default:
        return (
          <Home
            channels={channels}
            movies={movies}
            series={series}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onItemClick={handleItemClick}
            onSeeMore={(page) => handlePageChange(page)}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <div className={`flex h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-white/10 overflow-hidden relative ${isTV ? 'pt-[60px]' : ''}`}>
      {/* Barra Lateral de Navegação (Fixa para PC) */}
      <Sidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCollapsed={activePage === 'Detalhes'}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
        {/* Cabeçalho com título e controles de visualização */}
        <Header
          activePage={activePage}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />

        {/* Área de renderização das páginas ou Busca Global */}
        <div className="px-8 pb-12">
          {searchQuery && activePage !== 'Detalhes' ? (
            <GlobalSearch
              channels={globalSearchData.channels}
              movies={globalSearchData.movies}
              series={globalSearchData.series}
              searchQuery={searchQuery}
              viewMode={viewMode}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onItemClick={handleItemClick}
              onSeeMore={handlePageChange}
              isTV={isTV}
            />
          ) : (
            renderPage()
          )}
        </div>
      </main>

      {/* Reprodutor Global de Vídeo (Sobrepõe toda a UI preservando o estado) */}
      {playingStream && (
        <GlobalPlayer
          streamUrl={playingStream.url}
          title={playingStream.title}
          onClose={() => setPlayingStream(null)}
        />
      )}
    </div>
  );
}
