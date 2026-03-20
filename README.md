# Project Freedom

Aplicação web em React para navegação e reprodução de conteúdos IPTV via protocolo Xtream. Interface escura, responsiva, com suporte a Smart TV, player HLS integrado e busca global em tempo real.

## Sumário

1. [Visão geral](#visão-geral)
2. [Arquitetura da aplicação](#arquitetura-da-aplicação)
3. [Stack tecnológica](#stack-tecnológica)
4. [Estrutura de pastas](#estrutura-de-pastas)
5. [Configuração de ambiente](#configuração-de-ambiente)
6. [Instalação e execução](#instalação-e-execução)
7. [Scripts disponíveis](#scripts-disponíveis)
8. [Como criar novas funcionalidades](#como-criar-novas-funcionalidades)
9. [Como alterar módulos existentes sem quebrar a arquitetura](#como-alterar-módulos-existentes-sem-quebrar-a-arquitetura)
10. [Guia de contribuição interna](#guia-de-contribuição-interna)
11. [Build e deploy](#build-e-deploy)
12. [Docker](#docker)
13. [Boas práticas adotadas e recomendadas](#boas-práticas-adotadas-e-recomendadas)
14. [Checklist final para novas features](#checklist-final-para-novas-features)

---

## Visão geral

SPA (Single Page Application) construída com React + Vite, integrada à API Xtream IPTV. Recursos entregues:

- navegação lateral entre TV ao vivo, filmes e séries
- busca global em tempo real com resultados divididos em 3 seções (TV, Filmes, Séries)
- player HLS integrado para streams ao vivo e VOD
- visualização em lista e grade
- favoritos gerenciados em estado local por sessão
- página de detalhes com episódios de séries
- miniaturas inteligentes com fallback automático para TMDB
- suporte a Smart TV (controle remoto, modo TV dedicado)
- layout responsivo com fontes adaptadas por dispositivo (PC, mobile, TV)

**Estado atual:**

- integração ativa com API Xtream IPTV (TV ao vivo, filmes, séries)
- integração com TMDB para capas e metadados
- player HLS via `hls.js` com suporte a múltiplos formatos
- favoritos não persistem após recarregar a página (estado em memória)
- não existe suíte de testes automatizados no momento
- `@google/genai` e `motion` estão declarados mas não utilizados

---

## Arquitetura da aplicação

### Visão de alto nível

```
Usuário
  ├── Sidebar (navegação + busca)
  └── Header (título + modo de visualização)
        └── App.tsx (orquestrador principal)
              ├── Home
              ├── ContentPage
              ├── DetailsPage / DetailsSeriesPage
              ├── Settings
              ├── GlobalSearch (busca global: TV + Filmes + Séries)
              └── GlobalPlayer (player HLS sobreposto)
                    └── ContentList → ContentPoster → TMDB API
                          └── XtreamService → API Xtream IPTV
```

### Camadas

| Camada           | Localização                 | Responsabilidade                                          |
| ---------------- | --------------------------- | --------------------------------------------------------- |
| Shell            | `src/App.tsx`               | Estado global, navegação, cache de busca, player          |
| Páginas          | `src/pages/`                | Orquestração de tela (Home, Listagens, Detalhes)          |
| Componentes      | `src/components/`           | UI reutilizável (listas, player, busca, header, sidebar)  |
| Serviços         | `src/services/`             | Clientes de API (Xtream, TMDB) e adaptadores              |
| Configurações    | `src/config/`               | Credenciais e configurações de APIs externas              |
| Tipos de domínio | `src/types/app.types.ts`    | Contratos internos da aplicação                           |
| Tipos de API     | `src/types/xtream.types.ts` | Contratos da API Xtream                                   |


### Decisões de arquitetura a preservar

- `App.tsx` orquestra, páginas contextualizam, componentes renderizam
- chamadas de API ficam **sempre** nos services, nunca nas páginas ou componentes
- estado global externo (Context, Zustand) só deve ser introduzido quando `App.tsx` ficar inviável
- `src/types.ts` é um barrel de re-exportação — não adicionar lógica nele

---

## Stack tecnológica

### Frontend

| Tecnologia             | Versão      | Finalidade                      |
| ---------------------- | ----------- | ------------------------------- |
| React                  | `^19.0.0`   | Renderização da interface       |
| React DOM              | `^19.0.0`   | Montagem da SPA no DOM          |
| Vite                   | `^6.2.0`    | Bundler e dev server            |
| `@vitejs/plugin-react` | `^5.0.4`    | Suporte React no Vite           |
| Tailwind CSS           | `^4.1.14`   | Estilização utility-first       |
| Lucide React           | `^0.546.0`  | Ícones da interface             |
| `hls.js`               | `^1.6.15`   | Reprodução de streams HLS       |
| `@iptv/xtream-api`     | `^1.4.1`    | Cliente da API Xtream IPTV      |
| TypeScript             | `~5.8.2`    | Tipagem estática                |

### Dependências declaradas mas não utilizadas

| Pacote          | Observação                                  |
| --------------- | ------------------------------------------- |
| `express`       | Base para futura API local                  |
| `dotenv`        | Útil para futura camada backend             |
| `tsx`           | Execução de scripts Node/TypeScript         |
| `@google/genai` | Remover se IA generativa não for prioridade |
| `motion`        | Pode ser usado futuramente para animações   |

---

## Estrutura de pastas

Apenas arquivos e diretórios relevantes (excluídos pelo `.gitignore`: `node_modules/`, `dist/`, `.env*`, `tests/`).

```
project-freedom/
├── src/
│   ├── components/
│   │   ├── ContentList.tsx         # Lista reutilizável (modo grid e lista)
│   │   ├── ContentPoster.tsx       # Thumbnail inteligente com fallback TMDB
│   │   ├── GlobalPlayer.tsx        # Player HLS global (sobreposição)
│   │   ├── GlobalSearch.tsx        # Busca global com 3 seções
│   │   ├── Header.tsx              # Cabeçalho fixo
│   │   ├── NavItem.tsx             # Item de navegação da sidebar
│   │   ├── Sidebar.tsx             # Navegação + campo de busca com botão limpar
│   │   └── TypeIcon.tsx            # Ícone por tipo de conteúdo
│   ├── config/
│   │   ├── tmdb.config.ts          # Configuração da API TMDB
│   │   └── xtream.config.ts        # Configuração da API Xtream IPTV
│   ├── pages/
│   │   ├── ContentPage.tsx         # Listagem com categorias e paginação
│   │   ├── DetailsPage.tsx         # Detalhes de filmes e canais
│   │   ├── DetailsSeriesPage.tsx   # Detalhes e episódios de séries
│   │   ├── Home.tsx                # Página inicial com seções de destaque
│   │   └── Settings.tsx            # Configurações
│   ├── services/
│   │   ├── tmdb.service.ts         # Integração com TMDB API
│   │   ├── xtream.adapter.ts       # Adaptador de dados da API Xtream
│   │   └── xtream.service.ts       # Cliente da API Xtream IPTV
│   ├── types/
│   │   ├── app.types.ts            # Tipos do domínio da aplicação
│   │   └── xtream.types.ts         # Tipos da API Xtream
│   ├── App.tsx                     # Shell principal
│   ├── index.css                   # Estilos globais com Tailwind v4
│   ├── main.tsx                    # Ponto de entrada
│   ├── types.ts                    # Barrel de re-exportação dos tipos
│   └── vite-env.d.ts               # Tipagem das variáveis de ambiente
├── .env.example                    # Exemplo de variáveis de ambiente
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Configuração de ambiente

### Variáveis obrigatórias

| Variável               | Uso                                  |
| ---------------------- | ------------------------------------ |
| `VITE_XTREAM_USERNAME` | Usuário da conta IPTV                |
| `VITE_XTREAM_PASSWORD` | Senha da conta IPTV                  |
| `VITE_XTREAM_HOST`     | URL do servidor Xtream IPTV          |

### Variáveis opcionais

| Variável                    | Uso                                                      |
| --------------------------- | -------------------------------------------------------- |
| `VITE_TMDB_API_KEY`         | Chave TMDB para busca automática de capas                |
| `VITE_TMDB_ACCESS_TOKEN`    | Token de acesso alternativo da API TMDB                  |
| `VITE_PLACEHOLDER_IMAGE`    | URL de imagem padrão quando não há capa disponível       |
| `VITE_ALLOWED_PROXY_DOMAINS`| Domínios que passam pelo proxy local (separados por `,`) |
| `VITE_IMAGE_PROXY_TARGET`   | Destino do proxy de imagens                              |
| `DISABLE_HMR`               | Desativa Hot Module Replacement no Vite                  |

### Como criar o arquivo local

```bash
cp .env.example .env.local
# preencha as credenciais do servidor IPTV
```

---

## Instalação e execução

```bash
npm install
npm run dev
# disponível em http://localhost:3000
```

### Build de produção

```bash
npm run build   # gera artefatos em dist/
npm run preview # serve a build localmente
```

---

## Scripts disponíveis

| Script    | Comando                           | Finalidade                   |
| --------- | --------------------------------- | ---------------------------- |
| `dev`     | `vite --port=3000 --host=0.0.0.0` | Ambiente local com recarga   |
| `build`   | `vite build`                      | Gera build de produção       |
| `preview` | `vite preview`                    | Serve a build localmente     |
| `clean`   | `rm -rf dist`                     | Remove artefatos de build    |
| `lint`    | `tsc --noEmit`                    | Checagem de tipos TypeScript |

> **Observação:** `lint` verifica apenas tipos. ESLint e Prettier não estão configurados ainda.

---

## Como criar novas funcionalidades

### Regra geral

`App.tsx` orquestra → páginas contextualizam → componentes renderizam → services acessam dados externos.

### Passo a passo

1. **Tipos:** atualize `src/types/app.types.ts` se introduzir novos contratos de domínio
2. **Camada:** defina onde a funcionalidade vive:
   - UI reutilizável → `src/components/`
   - nova tela → `src/pages/` + registrar no `switch` de `App.tsx`
   - nova API externa → `src/services/` + `src/config/`
3. **Navegação:** atualize `Sidebar.tsx` e o tipo `Page` se necessário
4. **Responsividade:** valide em mobile, desktop e simulação de TV
   - Use prefixo `lg:` para desktop
   - Use a prop `isTV` para o modo TV
5. **Regressão:** teste busca global, player, favoritos, troca lista/grade e detalhes

### Exemplo: nova página

```
1. Adicionar valor ao tipo Page em src/types/app.types.ts
2. Criar src/pages/NomeDaPagina.tsx
3. Registrar no switch de renderPage() em App.tsx
4. Adicionar item na Sidebar.tsx se necessário
```

---

## Como alterar módulos existentes sem quebrar a arquitetura

### `App.tsx`
- trate como camada de orquestração; se crescer demais, extraia para um custom hook
- o cache de busca global (`globalSearchData`) deve ser atualizado junto com `setChannels/setMovies/setSeries`

### Services (`src/services/`)
- qualquer mudança de contrato em `XtreamService` deve ser refletida no adapter
- não espalhe chamadas HTTP nas páginas ou componentes

### Componentes
- componentes visuais devem ser puros; eventos sobem via callbacks
- nunca acesse `xtreamService` ou `tmdbService` diretamente em componentes de UI

### Modo TV
- use a prop `isTV` para adaptar layouts, fontes e foco
- a detecção automática ocorre no `useEffect` de inicialização de `App.tsx`
- teste navegação por teclado (Tab, Enter, setas) e o botão Voltar

---

## Guia de contribuição interna

### Estratégia de branches

| Prefixo     | Uso                              |
| ----------- | -------------------------------- |
| `main`      | Branch estável                   |
| `feature/`  | Novas funcionalidades            |
| `fix/`      | Correções de bug                 |
| `refactor/` | Refatorações sem mudança funcional |
| `docs/`     | Documentação                     |
| `chore/`    | Manutenção técnica               |

### Conventional Commits

```
feat(search): adiciona busca global com 3 seções
fix(player): corrige reprodução HLS no WebOS
refactor(app): extrai cache de busca para estado separado
docs(readme): atualiza variáveis de ambiente
```

### Checklist mínimo para PR

- branch atualizada com `main`
- sem imports não utilizados e sem código morto
- `npm run lint` sem erros
- busca global, player e navegação validados manualmente
- README atualizado se a arquitetura ou comandos mudarem

---

## Build e deploy

### Nginx (servidor Ubuntu)

```nginx
server {
  listen 80;
  server_name seudominio.com;

  root /var/www/project-freedom;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Variáveis de produção

Defina no ambiente de CI/CD ou servidor:

```
VITE_XTREAM_USERNAME=...
VITE_XTREAM_PASSWORD=...
VITE_XTREAM_HOST=...
VITE_TMDB_API_KEY=...        # opcional
VITE_PLACEHOLDER_IMAGE=...   # opcional
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `docker-compose.yml`

```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: project_freedom
      POSTGRES_USER: project_freedom
      POSTGRES_PASSWORD: project_freedom
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
docker compose up --build
# aplicação: http://localhost:8080
```

---

## Boas práticas adotadas e recomendadas

- UI desacoplada da origem de dados via services
- ponto único de verdade para tipos de domínio (`src/types/app.types.ts`)
- chamadas HTTP centralizadas em `src/services/`
- preferir composição a componentes gigantes
- validar sempre mobile, desktop e modo TV
- usar prefixos de responsividade Tailwind (`lg:`, `xl:`)
- usar a prop `isTV` para adaptações de Smart TV
- remover dependências não utilizadas periodicamente
- registrar no README qualquer mudança operacional ou de arquitetura

---

## Checklist final para novas features

- [ ] respeita separação `App` → `pages` → `components` → `services`
- [ ] tipos atualizados em `src/types/app.types.ts`
- [ ] sem duplicação de estado
- [ ] responsivo em mobile, desktop e TV
- [ ] busca global, player, favoritos e detalhes funcionando
- [ ] `npm run lint` sem erros
- [ ] validado manualmente
- [ ] README atualizado se necessário

---

> **Próximos passos recomendados (ordem de prioridade):**
> 1. Adicionar ESLint + Prettier
> 2. Introduzir testes unitários com Vitest
> 3. Implementar persistência de favoritos (localStorage ou backend)
> 4. Implementar API Express + Prisma para histórico e perfis
> 5. Containerizar e publicar com logs estruturados
