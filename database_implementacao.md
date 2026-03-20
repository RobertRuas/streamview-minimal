# Plano de Implementação do Banco de Dados

## 1. Visão Geral e Arquitetura

Para atender a todos os requisitos solicitados de forma estruturada, eficiente e escalável, a sugestão é utilizarmos **PostgreSQL** em conjunto com **Prisma ORM**. 
O Prisma facilita a tipagem ponta a ponta (completamente compatível com TypeScript), a criação de migrações (`migrations`) e torna as consultas ao banco extremamente simples e legíveis.

### Requisitos Atendidos:
- Sistema de usuário (autenticação/login).
- Configurações dinâmicas (chave/valor) amarradas ao usuário.
- Favoritos (TV, Filmes, Séries).
- Progresso (Continuar assistindo filmes e episódios de uma determinada temporada de uma série).
- Dispositivos (Fingerprint com necessidade de aprovação pelo admin).

---

## 2. Esquema do Banco de Dados (Prisma Schema)

Abaixo está a estrutura proposta do arquivo `schema.prisma`. 

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// Enumeradores Globais
// ==========================================

enum Role {
  USER
  ADMIN
}

enum ContentType {
  TV
  MOVIE
  SERIES
  EPISODE // Útil para separar o progresso de uma série (que é medido por episódio)
}

// ==========================================
// 1. Sistema de Usuário
// ==========================================
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String         // Senha criptografada (ex: bcrypt)
  name          String?
  role          Role           @default(USER) // Identifica se é usuário comum ou Admin
  active        Boolean        @default(true) // Admin pode inativar um usuário
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // Relacionamentos
  settings      UserSetting[]
  favorites     Favorite[]
  progress      Progress[]
  devices       Device[]
}

// ==========================================
// 2. Configurações Básicas (Chave/Valor)
// ==========================================
model UserSetting {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  key       String   // Identificador da config (ex: "theme", "language", "default_view_mode")
  value     String   // O valor correspondente (pode armazenar JSON stringificado se for complexo)
  
  // Garante que o usuário não tenha duas chaves iguais
  @@unique([userId, key]) 
}

// ==========================================
// 3. Sistema de Fingerprint e Dispositivos
// ==========================================
model Device {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fingerprint String   @unique // Hash/Identificador gerado pelo frontend (ClientJS/FingerprintJS)
  name        String?  // Nome amigável (ex: "Smart TV Sala", "Chrome PC")
  isApproved  Boolean  @default(false) // Por padrão entra bloqueado, Admin libera
  lastSeen    DateTime @default(now())
  
  createdAt   DateTime @default(now())
}

// ==========================================
// 4. Favoritos (TV, Filme, Série)
// ==========================================
model Favorite {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  streamId    String      // ID originário da API Xtream
  contentType ContentType // TV, MOVIE ou SERIES
  addedAt     DateTime    @default(now())

  // Garante que não duplique favorito do mesmo conteúdo para o mesmo usuário
  @@unique([userId, streamId, contentType]) 
}

// ==========================================
// 5. Continuar de Onde Parou (Progresso)
// ==========================================
model Progress {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  streamId       String      // ID do filme ou do episódio
  contentType    ContentType // MOVIE ou EPISODE
  seriesId       String?     // Opcional: ID da série pai, útil para buscar "último eps assistido de X série"
  
  progressSecs   Int         // Em qual segundo o usuário pausou
  durationSecs   Int         // Duração total do vídeo
  isCompleted    Boolean     @default(false) // Uma flag para indicar que ele já assistiu até o fim (ex: 95%+)
  
  updatedAt      DateTime    @default(now()) @updatedAt

  // Garante apenas 1 registro de progresso por conteúdo por usuário
  @@unique([userId, streamId, contentType])
}
```

---

## 3. Explicação das Entidades e Regras de Negócio

### 🧩 `User` e `Role`
O usuário possui nome, e-mail e senha (armazenada de forma segura usando bcrypt ou argon2). O sistema de roles permite termos o `ADMIN` que gerenciará a aprovação dos dispositivos (Fingerprints) e a atividade geral, e o `USER` (usuário padrão).

### ⚙️ `UserSetting` (Chave/Valor)
Usada para salvar as preferências. Se você quiser criar uma opção "autoplay_next_episode" e guardar o valor "true", ou "theme" "dark". Ela é totalmente flexível pois depende apenas das chaves (`key`). A `@@unique` garante que um `user` nunca crie uma configuração conflituosa.

### 📱 `Device` (Fingerprint)
Essa tabela armazena cada dispositivo que tenta se conectar. 
- O frontend envia um hash único do aparelho (`fingerprint`).
- Se não for reconhecido, salva no banco com `isApproved: false`.
- Sempre que houver login, checa o dispositivo: se estiver bloqueado (`false`), não permite o streaming de vídeos.
- O administrador vê uma lista e altera `isApproved: true` para liberar o aparelho do cliente.
- `lastSeen` é atualizado a cada requisição ou login, permitindo desativar dispositivos parados há muito tempo.

### ⭐ `Favorite`
Simples e direta. Salva quem favoritou e qual o ID do Xtream. Separamos via `ContentType` para evitar conflitos (ex: canal ID 12 e filme ID 12). A query é muito eficiente graças aos índices.

### ⏯️ `Progress` (Continue Assistindo)
Serve apenas para `MOVIE` ou `EPISODE` (Canais de TV não salvam progresso). 
Foi adicionado o campo `seriesId` condicional para quando é um EPISODE. Isso é um truísmo valioso: para listar "Continuar Assistindo" nas séries para um usuário, você precisa saber não só qual episódio ele estava, mas relacionar isso à série inteira de forma rápida. E o campo `isCompleted` marca a verificação quando atinge o final do conteúdo (por exemplo: 95% do tempo corrido).

---

## 4. Próximos Passos (Workflow)

Se você aprovar esta arquitetura, os passos para implementarmos são:

1. **Instalar Dependências:**
   `npm install @prisma/client`
   `npm install -D prisma`
   
2. **Inicializar o Prisma e Criar Migrations:**
   Rodar `npx prisma init`, colocar sua URL do PostgreSQL, colar o schema acima e gerar o banco no seu servidor DB.

3. **Backend/Rotas Next.js / API Routes:**
   Se decidir modernizar com um Next.js (já que as suas regras globais pedem *Next.js e Tailwind*), começaremos a escrever as `app/api/...` ou `pages/api/...` para manipular os dados através dos *Prisma Clients*.
   
4. **Implementar Login e Geração de Fingerprints:**
   Adoção de bibliotecas como o `NextAuth` ou fluxos JWT nativos e a criação do Fingerprint do lado do client.

Por favor, revise o documento e as entidades criadas e me avise se devo cobrir mais alguma regra de negócio.
