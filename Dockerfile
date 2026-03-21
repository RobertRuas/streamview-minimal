# ==========================================
# 🐳 Dockerfile - Build Direto no Servidor
# ==========================================

FROM node:20-alpine

WORKDIR /app

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl

# Copia manifesto de dependências
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia o restante do código-fonte (Isso vai copiar o .env criado no servidor)
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Compila o Frontend React (Vite)
# O Vite lerá automaticamente as variáveis "VITE_" do arquivo .env local do servidor
RUN npm run build

# Variáveis de runtime
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Inicia o servidor Express
CMD ["node", "server.js"]
