import { useState, useEffect, useMemo, useRef } from 'react';
import { Page, ViewMode, ContentItem } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ContentPage } from './pages/ContentPage';
import { DetailsPage } from './pages/DetailsPage';
import { Settings } from './pages/Settings';
import { GlobalPlayer } from './components/GlobalPlayer';
import { useAuthStore } from './store/auth.store';
import { useToastStore } from './store/toast.store';
import { ToastContainer } from './components/ToastContainer';
import { xtreamService } from './services/xtream.service';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { API_BASE_URL } from './config/api';

/**
 * Componente Principal (App)
 * Gerencia o estado global, navegação e layout principal.
 */
export default function App() {
  const mainRef = useRef<HTMLElement>(null);

  // Autenticação
  const { user, isAuthenticated, token, updateUser } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const { showToast } = useToastStore();

  // Estados para controlar a página ativa, modo de visualização e busca
  const [activePage, setActivePage] = useState<Page>('Inicio');
  const [previousPage, setPreviousPage] = useState<Page>('Inicio');
  const [viewMode, setViewMode] = useState<ViewMode>((user?.viewMode as ViewMode) || 'grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isTV, setIsTV] = useState(false);

  interface PlayingPlaylist {
    items: { 
      url: string; 
      title: string; 
      streamId: string; 
      contentType: 'TV' | 'MOVIE' | 'SERIES' | 'EPISODE';
      seriesId?: string;
      seasonId?: string;
      episodeNum?: number;
      startAt?: number;
    }[];
    currentIndex: number;
  }
  const [playingStream, setPlayingStream] = useState<PlayingPlaylist | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewModeChange = async (mode: ViewMode) => {
    setViewMode(mode);
    if (isAuthenticated && token && user) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ viewMode: mode })
        });
        const data = await res.json();
        if (data.success) {
          updateUser({ ...user, viewMode: mode });
          showToast(`Modo de exibição ${mode === 'grid' ? 'Grade' : 'Lista'} salvo com sucesso!`, 'success');
        }
      } catch (err) {
        console.error('Erro ao salvar viewMode:', err);
        showToast('Erro ao salvar preferência de visualização.', 'error');
      }
    }
  };

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
  const [hiddenCategories, setHiddenCategories] = useState<{ categoryId: string, contentType: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Estados para Categorias (Filtradas)
  const [liveCategories, setLiveCategories] = useState<{ id: string, name: string }[]>([]);
  const [movieCategories, setMovieCategories] = useState<{ id: string, name: string }[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<{ id: string, name: string }[]>([]);

  // Categorias Reais (Sem filtro) para a página de Ajustes
  const [allLiveCategories, setAllLiveCategories] = useState<{ id: string, name: string }[]>([]);
  const [allMovieCategories, setAllMovieCategories] = useState<{ id: string, name: string }[]>([]);
  const [allSeriesCategories, setAllSeriesCategories] = useState<{ id: string, name: string }[]>([]);

  // Estado para gerenciar os itens favoritados pelo usuário
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cache global para garantir que a busca funcione sempre em todo o conteúdo carregado
  const [globalSearchData, setGlobalSearchData] = useState<{
    channels: ContentItem[],
    movies: ContentItem[],
    series: ContentItem[]
  }>({ channels: [], movies: [], series: [] });

  // Carrega categorias, dados iniciais e detecta TV, apenas se Autenticado
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

    if (!isAuthenticated) return;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const xtream = xtreamService;
        
        // ==========================================
        // 🚀 OTIMIZAÇÃO: BUSCA PARALELA (Promise.all)
        // ==========================================
        // Em vez de fazer 5 requisições "uma por uma" (o que causaria lentidão e cachoeira de requests),
        // disparamos todas de uma vez só. O tempo final será o tempo da requisição mais lenta, 
        // economizando preciosos milissegundos na tela de Loading Inicial.
        const [liveCats, movieCats, seriesCats, userFavorites, hiddenCats] = await Promise.all([
          xtream.getLiveCategories(),
          xtream.getVODCategories(),
          xtream.getSeriesCategories(),
          fetch(`${API_BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API_BASE_URL}/hidden-categories`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        ]);

        if (userFavorites.success) setFavorites(userFavorites.data);
        const hiddenData = hiddenCats.success ? hiddenCats.data : [];
        setHiddenCategories(hiddenData);

        // Guardar originais para Settings
        setAllLiveCategories(liveCats.map((c: any) => ({ id: String(c.category_id), name: c.category_name })));
        setAllMovieCategories(movieCats.map((c: any) => ({ id: String(c.category_id), name: c.category_name })));
        setAllSeriesCategories(seriesCats.map((c: any) => ({ id: String(c.category_id), name: c.category_name })));

        // Filtrar categorias visíveis
        const filteredLive = liveCats.filter((c: any) => !hiddenData.some((h: any) => h.categoryId === String(c.category_id) && h.contentType === 'TV'))
                                    .map((c: any) => ({ id: String(c.category_id), name: c.category_name }));
        const filteredMovie = movieCats.filter((c: any) => !hiddenData.some((h: any) => h.categoryId === String(c.category_id) && h.contentType === 'MOVIE'))
                                     .map((c: any) => ({ id: String(c.category_id), name: c.category_name }));
        const filteredSeries = seriesCats.filter((c: any) => !hiddenData.some((h: any) => h.categoryId === String(c.category_id) && h.contentType === 'SERIES'))
                                       .map((c: any) => ({ id: String(c.category_id), name: c.category_name }));

        setLiveCategories(filteredLive);
        setMovieCategories(filteredMovie);
        setSeriesCategories(filteredSeries);

        // 2. Carregar conteúdo inicial
        const [liveData, moviesData, seriesData] = await Promise.all([
          xtream.getLiveStreams('all'),
          xtream.getVODStreams('all'),
          xtream.getSeries('all')
        ]);

        // Filtrar conteúdo de categorias ocultas
        const isHidden = (cid: string | number, type: string) => hiddenData.some((h: any) => h.categoryId === String(cid) && h.contentType === type);
        
        const fLive = (liveData as any[]).filter(c => !isHidden((c as any).categoryId, 'TV'));
        const fMovies = (moviesData as any[]).filter(m => !isHidden((m as any).categoryId, 'MOVIE'));
        const fSeries = (seriesData as any[]).filter(s => !isHidden((s as any).categoryId, 'SERIES'));

        setChannels(fLive);
        setMovies(fMovies);
        setSeries(fSeries);
        
        // Populando busca global para resultados imediatos
        setGlobalSearchData({ channels: fLive, movies: fMovies, series: fSeries });

      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showToast('Erro ao carregar dados do servidor.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Sincronizar viewMode do usuário ao carregar
    if (user?.viewMode) {
      setViewMode(user.viewMode as ViewMode);
    }
  }, [isAuthenticated, token, user?.id, showToast]);

  /**
   * Gerencia a mudança de categoria e busca os itens correspondentes
   */
  const handleCategoryChange = async (type: 'TV' | 'Movie' | 'Series', categoryId: string) => {
    try {
      setIsLoading(true);
      const xtream = xtreamService;
      let data: ContentItem[] = [];

      if (type === 'TV') {
        data = (await xtream.getLiveStreams(categoryId)) as any;
        const filtered = data.filter(c => !hiddenCategories.some(h => h.categoryId === String((c as any).categoryId) && h.contentType === 'TV'));
        setChannels(filtered);
      } else if (type === 'Movie') {
        data = (await xtream.getVODStreams(categoryId)) as any;
        const filtered = data.filter(c => !hiddenCategories.some(h => h.categoryId === String((c as any).categoryId) && h.contentType === 'MOVIE'));
        setMovies(filtered);
      } else {
        data = (await xtream.getSeries(categoryId)) as any;
        const filtered = data.filter(c => !hiddenCategories.some(h => h.categoryId === String((c as any).categoryId) && h.contentType === 'SERIES'));
        setSeries(filtered);
      }
    } catch (error) {
      showToast('Erro ao carregar categoria.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Alterna favorito no backend e no estado local
   */
  const toggleFavorite = async (streamId: string | number, type: 'TV' | 'MOVIE' | 'SERIES') => {
    const sId = String(streamId);
    const isFav = favorites.includes(sId);

    try {
      if (isFav) {
        setFavorites(prev => prev.filter(id => id !== sId));
        await fetch(`${API_BASE_URL}/favorites/${sId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        setFavorites(prev => [...prev, sId]);
        await fetch(`${API_BASE_URL}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ streamId: sId, type })
        });
      }
    } catch (err) {
      showToast('Erro ao atualizar favoritos.', 'error');
    }
  };

  /**
   * Navegação e Histórico
   */
  const handlePageChange = (page: Page) => {
    if (mainRef.current) {
      setScrollPositions(prev => ({ ...prev, [activePage]: mainRef.current?.scrollTop || 0 }));
    }
    setPreviousPage(activePage);
    setActivePage(page);
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setActivePage(previousPage);
    setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo(0, scrollPositions[previousPage] || 0);
      }
    }, 100);
  };

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    setSearchQuery('');
    handlePageChange('Detalhes');
  };

  const updatePageState = (type: 'TV' | 'Movie' | 'Series', state: any) => {
    if (type === 'TV') setTvState(state);
    else if (type === 'Movie') setMovieState(state);
    else setSeriesState(state);
  };

  // Gerencia o loop do player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePage === 'Detalhes' && e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, playingStream]);

  // --- Lógica de Filtragem de Categorias Ocultas ---
  const isCatHidden = (id: string, type: string) => 
    hiddenCategories.some(h => h.categoryId === String(id) && h.contentType === type);

  const filteredLiveCategories = useMemo(() => 
    allLiveCategories.filter(c => !isCatHidden(c.id, 'TV')), [allLiveCategories, hiddenCategories]);

  const filteredMovieCategories = useMemo(() => 
    allMovieCategories.filter(c => !isCatHidden(c.id, 'MOVIE')), [allMovieCategories, hiddenCategories]);

  const filteredSeriesCategories = useMemo(() => 
    allSeriesCategories.filter(c => !isCatHidden(c.id, 'SERIES')), [allSeriesCategories, hiddenCategories]);

  // Filtros de Conteúdo Baseados em Categorias Ocultas
  const filteredChannelsInternal = useMemo(() => 
    channels.filter(c => !isCatHidden((c as any).categoryId, 'TV')), [channels, hiddenCategories]);

  const filteredMoviesInternal = useMemo(() => 
    movies.filter(c => !isCatHidden((c as any).categoryId, 'MOVIE')), [movies, hiddenCategories]);

  const filteredSeriesInternal = useMemo(() => 
    series.filter(c => !isCatHidden((c as any).categoryId, 'SERIES')), [series, hiddenCategories]);

  // Busca Global Filtrada
  const filteredGlobalSearchData = useMemo(() => ({
    channels: globalSearchData.channels.filter(c => !isCatHidden((c as any).categoryId, 'TV')),
    movies: globalSearchData.movies.filter(c => !isCatHidden((c as any).categoryId, 'MOVIE')),
    series: globalSearchData.series.filter(c => !isCatHidden((c as any).categoryId, 'SERIES'))
  }), [globalSearchData, hiddenCategories]);

  const handleToggleCategory = (categoryId: string, type: string) => {
    setHiddenCategories(prev => {
      const exists = prev.find(h => h.categoryId === String(categoryId) && h.contentType === type);
      if (exists) {
        return prev.filter(h => !(h.categoryId === String(categoryId) && h.contentType === type));
      } else {
        return [...prev, { categoryId: String(categoryId), contentType: type }];
      }
    });
  };

  /**
   * Renderiza o componente da página correspondente
   */
  const renderPage = () => {
    switch (activePage) {
      case 'Inicio':
        return (
          <Home
            channels={filteredGlobalSearchData.channels}
            movies={filteredGlobalSearchData.movies}
            series={filteredGlobalSearchData.series}
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
            items={showOnlyFavorites ? filteredGlobalSearchData.channels : filteredChannelsInternal}
            type="TV"
            categories={filteredLiveCategories}
            initialCategoryId={tvState.categoryId}
            initialPage={tvState.page}
            initialCatPage={tvState.catPage}
            onStateChange={(state) => updatePageState('TV', state)}
            onCategoryChange={(catId) => handleCategoryChange('TV', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={(id) => toggleFavorite(id, 'TV')}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
            showOnlyFavorites={showOnlyFavorites}
            onBack={handleBack}
          />
        );
      case 'Filmes':
        return (
          <ContentPage
            items={showOnlyFavorites ? filteredGlobalSearchData.movies : filteredMoviesInternal}
            type="Movie"
            categories={filteredMovieCategories}
            initialCategoryId={movieState.categoryId}
            initialPage={movieState.page}
            initialCatPage={movieState.catPage}
            onStateChange={(state) => updatePageState('Movie', state)}
            onCategoryChange={(catId) => handleCategoryChange('Movie', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={(id) => toggleFavorite(id, 'MOVIE')}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
            showOnlyFavorites={showOnlyFavorites}
            onBack={handleBack}
          />
        );
      case 'Series':
        return (
          <ContentPage
            items={showOnlyFavorites ? filteredGlobalSearchData.series : filteredSeriesInternal}
            type="Series"
            categories={filteredSeriesCategories}
            initialCategoryId={seriesState.categoryId}
            initialPage={seriesState.page}
            initialCatPage={seriesState.catPage}
            onStateChange={(state) => updatePageState('Series', state)}
            onCategoryChange={(catId) => handleCategoryChange('Series', catId)}
            viewMode={viewMode}
            searchQuery={searchQuery}
            favorites={favorites}
            onToggleFavorite={(id) => toggleFavorite(id, 'SERIES')}
            onItemClick={handleItemClick}
            isLoading={isLoading}
            isTV={isTV}
            showOnlyFavorites={showOnlyFavorites}
            onBack={handleBack}
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
            refreshTrigger={refreshTrigger}
            onPlay={(items, index) => setPlayingStream({ 
              items: items as any,
              currentIndex: index
            })}
          />
        ) : (
          <Home
            channels={filteredChannelsInternal}
            movies={filteredMoviesInternal}
            series={filteredSeriesInternal}
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
        return (
          <Settings 
            liveCategories={allLiveCategories}
            movieCategories={allMovieCategories}
            seriesCategories={allSeriesCategories}
            hiddenCategories={hiddenCategories}
            onToggleCategory={handleToggleCategory}
          />
        );
      default:
        return null;
    }
  };

  // Se não estiver autenticado, mostra login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {isRegistering ? (
          <Register onLoginClick={() => setIsRegistering(false)} />
        ) : (
          <Login onRegisterClick={() => setIsRegistering(true)} />
        )}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex select-none overflow-hidden">
      {/* Sidebar Fixo */}
      <Sidebar 
        activePage={activePage} 
        onPageChange={handlePageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={() => {
          setShowOnlyFavorites(!showOnlyFavorites);
          setSearchQuery('');
        }}
      />
      
      {/* Conteúdo Principal */}
      <main ref={mainRef} className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth">
        <Header activePage={activePage} viewMode={viewMode} setViewMode={handleViewModeChange} />
        <div className="pt-4 px-4 md:px-8 pb-32">
          {renderPage()}
        </div>
      </main>

      {/* Player (Overlay) */}
      {playingStream && (
        <GlobalPlayer 
          streamUrl={playingStream.items[playingStream.currentIndex].url}
          title={playingStream.items[playingStream.currentIndex].title}
          streamId={playingStream.items[playingStream.currentIndex].streamId}
          contentType={playingStream.items[playingStream.currentIndex].contentType}
          seriesId={playingStream.items[playingStream.currentIndex].seriesId}
          seasonId={playingStream.items[playingStream.currentIndex].seasonId}
          episodeNum={playingStream.items[playingStream.currentIndex].episodeNum}
          startAt={playingStream.items[playingStream.currentIndex].startAt}
          onClose={() => {
            setPlayingStream(null);
            setRefreshTrigger(prev => prev + 1); // Força refresh de progresso nos detalhes
          }}
          onNext={() => {
            if (playingStream.currentIndex < playingStream.items.length - 1) {
              setPlayingStream({ ...playingStream, currentIndex: playingStream.currentIndex + 1 });
            }
          }}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex flex-col items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white font-medium tracking-wider">Carregando...</p>
        </div>
      )}

      <MobileNav activePage={activePage} onPageChange={handlePageChange} />

      <ToastContainer />
    </div>
  );
}
