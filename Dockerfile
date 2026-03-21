# ==========================================
# 🐳 Dockerfile - Produção (Single Stage)
# Build o frontend + roda o backend Express
# ==========================================

FROM node:20-alpine

WORKDIR /app

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl

# Copia manifesto de dependências
COPY package*.json ./

# Instala TODAS as dependências (dev também, necessário para vite build e prisma)
RUN npm install

# Copia o restante do código-fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila o Frontend React (Vite)
# As variáveis VITE_* são passadas como build args
ARG VITE_XTREAM_HOST
ARG VITE_XTREAM_USERNAME
ARG VITE_XTREAM_PASSWORD
ARG VITE_TMDB_ACCESS_TOKEN
ARG VITE_API_BASE_URL=http://localhost:3001

ENV VITE_XTREAM_HOST=$VITE_XTREAM_HOST
ENV VITE_XTREAM_USERNAME=$VITE_XTREAM_USERNAME
ENV VITE_XTREAM_PASSWORD=$VITE_XTREAM_PASSWORD
ENV VITE_TMDB_ACCESS_TOKEN=$VITE_TMDB_ACCESS_TOKEN
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Variáveis de runtime
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Inicia o servidor Express (serve API + frontend estático)
CMD ["node", "server.js"]
