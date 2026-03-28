# Lista de Tarefas

## Concluído ✅
- [x] Configuração inicial do projeto React com Vite e Tailwind v4.
- [x] Integração com API Xtream IPTV (serviços e adaptadores).
- [x] Player HLS integrado com `hls.js`.
- [x] Busca global por canais, filmes e séries.
- [x] Layout responsivo (Mobile, Desktop, TV).
- [x] Integração com TMDB para metadados e capas.
- [x] Sistema de autenticação de usuário (Login e Cadastro).
- [x] Gerenciamento de estado global com Zustand (Autenticação e Notificações).
- [x] Backend Express com Prisma para persistência de dados.
- [x] Refatoração das páginas de detalhes para suportar múltiplos tipos de conteúdo.
- [x] Componentes de configuração (Gerenciamento de perfil e usuários).
- [x] Adição do campo de data de pagamento ao perfil do usuário (Frontend & Backend).
- [x] Atualização do esquema Prisma com o campo `paymentDate`.
- [x] Clonagem do repositório `streamview-minimal`.
- [x] Remoção de usuários adicionais e configuração para manter apenas o admin.
- [x] Desativação da opção de cadastro de novos usuários.
- [x] Envio das alterações para o repositório.
- [x] Implementação de autoplay para o próximo episódio com contagem regressiva de 30s.
- [x] Modificação do layout da lista de episódios para apenas 1 coluna.
- [x] Ajuste do tamanho do botão "Continuar de onde parou" para ficar do mesmo tamanho do "Ver Episódios".
- [x] Melhoria do contraste do texto e cor da barra de progresso.
- [x] Atualização automática e invisível (sem loading bloqueante) da lista de episódios ao fechar o player.
- [x] Correção de race condition no salvamento persistente real do progresso de episódios ao fechar o player.
- [x] Remoção do limite de 20 itens no progresso, permitindo que todos os episódios de uma série exibam a barra verde.
- [x] Refaturo visual da barra de progresso para contraste máximo (Verde Neon com fundo Preto).
- [x] Compatibilidade Global com WebOS/Tizen (Fallback de cores Tailwind v4 OKLCH para HEX).

## Pendente ⏳
- [ ] Persistência de favoritos no banco de dados.
- [ ] Sistema de "Continuar Assistindo" (Progresso).
- [ ] Aprovação de dispositivos por administrador (Fingerprint).
- [ ] Suporte a múltiplos perfis por usuário.
- [ ] Testes unitários e de integração.
- [ ] Internacionalização (Multi-idioma).
