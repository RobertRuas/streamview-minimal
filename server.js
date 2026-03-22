import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Proxy reverso para a API Xtream IPTV (equivalente ao proxy do Vite em produção)
if (process.env.VITE_XTREAM_HOST) {
  app.use('/api-proxy', createProxyMiddleware({
    target: process.env.VITE_XTREAM_HOST,
    changeOrigin: true,
    pathRewrite: { '^/api-proxy': '' },
  }));
}

// Proxy reverso para imagens (equivalente ao proxy do Vite em produção)
if (process.env.VITE_IMAGE_PROXY_TARGET) {
  app.use('/image-proxy', createProxyMiddleware({
    target: process.env.VITE_IMAGE_PROXY_TARGET,
    changeOrigin: true,
    secure: false,
    pathRewrite: { '^/image-proxy': '' },
  }));
}

// Servir arquivos estáticos do Frontend (Vite Build)
app.use(express.static(path.join(__dirname, 'dist')));

const JWT_SECRET = process.env.JWT_SECRET || 'super-super-secret-key-123';

// ==========================================
// 🔐 Autenticação e Devices (Fingerprint)
// ==========================================

// 1. Cadastro de Usuário Simples
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ success: false, error: 'E-mail indisponível.' });

    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const isFirstUser = adminCount === 0;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        passwordHash,
        role: 'USER',
        active: false // Todos os usuários começam suspensos por padrão
      },
    });
    res.json({ success: true, message: 'Conta criada com sucesso! Aguarde a aprovação do Administrador.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro no servidor' });
  }
});

// 2. Login com Fingerprint (Checagem de Dispositivo Único)
app.post('/api/auth/login', async (req, res) => {
  const { email, password, fingerprint, deviceName } = req.body;
  try {
    if (!fingerprint) return res.status(400).json({ success: false, error: 'Identificação de dispositivo (Fingerprint) ausente.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });

    if (!user.active) return res.status(403).json({ success: false, error: 'Sua conta foi desativada.' });

    // ==========================================
    // 🛡️ REGRA DE SEGURANÇA: MÚLTIPLOS DISPOSITIVOS COM LIMITE
    // ==========================================
    // Verificamos o limite de dispositivos permitidos para este usuário (definido pelo Admin).
    // Se o dispositivo atual não está cadastrado e o limite foi atingido, 
    // removemos o dispositivo mais antigo (FIFO) para dar lugar ao novo.
    
    let device = await prisma.device.findUnique({ where: { fingerprint } });

    if (!device) {
      const deviceCount = await prisma.device.count({ where: { userId: user.id } });
      
      if (deviceCount >= user.maxDevices) {
        // Encontra o dispositivo menos utilizado (mais antigo pelo lastSeen)
        const oldestDevice = await prisma.device.findFirst({
          where: { userId: user.id },
          orderBy: { lastSeen: 'asc' }
        });

        if (oldestDevice) {
          await prisma.device.delete({ where: { id: oldestDevice.id } });
        }
      }

      device = await prisma.device.create({
        data: {
          fingerprint,
          name: deviceName || 'SmartTV / Navegador',
          userId: user.id,
          isApproved: true,
          sessionActive: true
        }
      });
    } else {
      if (device.userId !== user.id) {
        return res.status(403).json({ success: false, error: 'Este dispositivo está atrelado a outra conta.' });
      }
      device = await prisma.device.update({
        where: { fingerprint },
        data: { lastSeen: new Date(), name: deviceName || device.name, isApproved: true, sessionActive: true }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, viewMode: user.viewMode, paymentDate: user.paymentDate, maxDevices: user.maxDevices },
        device: { autoLogin: device.autoLogin }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Erro Interno do Servidor' });
  }
});

// 3. Logout (Remove o vínculo do dispositivo para permitir novo login)
app.post('/api/auth/logout', async (req, res) => {
  const { fingerprint } = req.body;
  try {
    if (fingerprint) {
      await prisma.device.updateMany({ 
        where: { fingerprint },
        data: { sessionActive: false }
      });
    }
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  } catch (error) {
    // Se o device não existir mais, apenas ignora
    res.json({ success: true });
  }
});
// 4. Login Automático por Dispositivo (Auto Login Oculto)
app.post('/api/auth/auto-login', async (req, res) => {
  const { fingerprint } = req.body;
  try {
    if (!fingerprint) return res.status(400).json({ success: false, error: 'Fingerprint ausente' });

    const device = await prisma.device.findUnique({
      where: { fingerprint },
      include: { user: true }
    });

    if (!device || !device.isApproved || !device.autoLogin || !device.user.active) {
      return res.status(401).json({ success: false, error: 'Login automático indisponível' });
    }

    // No auto-login, apenas garantimos que o dispositivo ainda está vinculado ao usuário
    if (device.userId !== device.userId) { // redundante mas seguro
       return res.status(403).json({ success: false, error: 'Dispositivo inválido' });
    }

    // Atualiza a sessão deste device
    await prisma.device.update({
      where: { fingerprint },
      data: { lastSeen: new Date(), sessionActive: true }
    });

    const user = device.user;
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, viewMode: user.viewMode, paymentDate: user.paymentDate, maxDevices: user.maxDevices },
        device: { autoLogin: device.autoLogin }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

app.use(cors());
// Middleware de Autenticação para proteger rotas Privadas
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// ==========================================
// ❤️ Favoritos Persistentes
// ==========================================

// 1. Obter Favoritos do Usuário Logado
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      select: { streamId: true }
    });
    const parsedFavorites = favorites.map(f => f.streamId);
    res.json({ success: true, data: parsedFavorites });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar favoritos.' });
  }
});

// 2. Adicionar Item aos Favoritos
app.post('/api/favorites', authMiddleware, async (req, res) => {
  const { streamId, type } = req.body;
  try {
    await prisma.favorite.create({
      data: { streamId: String(streamId), contentType: type, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar favorito:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar favorito.' });
  }
});

// 3. Remover Item dos Favoritos
app.delete('/api/favorites/:streamId', authMiddleware, async (req, res) => {
  const { streamId } = req.params;
  try {
    await prisma.favorite.deleteMany({
      where: { streamId, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao remover favorito.' });
  }
});

// ==========================================
// 📺 Continuar Assistindo (Progresso)
// ==========================================

// 1. Obter o Histórico do Usuário
app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const history = await prisma.progress.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      take: 20 // Pega os 20 vídeos mais recentes
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar progresso.' });
  }
});

// 2. Salvar ou Atualizar Progresso (Ping a cada 10s)
app.post('/api/progress', authMiddleware, async (req, res) => {
  const { streamId, progressSecs, durationSecs, contentType, seriesId, seasonId, episodeNum } = req.body;
  
  if (!streamId || progressSecs === undefined || !contentType) {
    return res.status(400).json({ error: 'Faltam campos obrigatórios' });
  }

  try {
    // Upsert: Se existe, atualiza; senão, cria.
    await prisma.progress.upsert({
      where: {
        userId_streamId_contentType: {
          userId: req.userId,
          streamId: String(streamId),
          contentType: contentType
        }
      },
      update: {
        progressSecs,
        durationSecs,
        seriesId: seriesId ? String(seriesId) : undefined,
        seasonId: seasonId ? String(seasonId) : undefined,
        episodeNum: episodeNum ? Number(episodeNum) : undefined,
        updatedAt: new Date()
      },
      create: {
        userId: req.userId,
        streamId: String(streamId),
        contentType: contentType,
        seriesId: seriesId ? String(seriesId) : undefined,
        seasonId: seasonId ? String(seasonId) : undefined,
        episodeNum: episodeNum ? Number(episodeNum) : undefined,
        progressSecs,
        durationSecs
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar progresso', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar progresso.' });
  }
});

// ==========================================
// 🚫 Categorias Ocultas
// ==========================================

// 1. Obter Categorias Ocultas
app.get('/api/hidden-categories', authMiddleware, async (req, res) => {
  try {
    const hidden = await prisma.hiddenCategory.findMany({
      where: { userId: req.userId },
      select: { categoryId: true, contentType: true }
    });
    res.json({ success: true, data: hidden });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar categorias ocultas.' });
  }
});

// 2. Ocultar/Desocultar Categoria
app.post('/api/hidden-categories/toggle', authMiddleware, async (req, res) => {
  const { categoryId, type } = req.body;
  try {
    const existing = await prisma.hiddenCategory.findUnique({
      where: {
        userId_categoryId_contentType: {
          userId: req.userId,
          categoryId: String(categoryId),
          contentType: type
        }
      }
    });
    if (existing) {
      await prisma.hiddenCategory.delete({
        where: { id: existing.id }
      });
      return res.json({ success: true, hidden: false });
    } else {
      await prisma.hiddenCategory.create({
        data: {
          userId: req.userId,
          categoryId: String(categoryId),
          contentType: type
        }
      });
      return res.json({ success: true, hidden: true });
    }
  } catch (error) {
    console.error('Erro ao alternar categoria oculta:', error);
    res.status(500).json({ success: false, error: 'Erro ao alternar categoria oculta.' });
  }
});

// ==========================================
// ⚙️ Preferências de Dispositivo
// ==========================================
app.patch('/api/devices/auto-login', authMiddleware, async (req, res) => {
  const { fingerprint, autoLogin } = req.body;
  try {
    const device = await prisma.device.findUnique({ where: { fingerprint } });
    if (!device || device.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Dispositivo inválido ou sem permissão.' });
    }
    
    await prisma.device.update({
      where: { fingerprint },
      data: { autoLogin }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar preferência do dispositivo.' });
  }
});

// Middleware de checagem de Admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro de permissão' });
  }
};

// Listar Todos os Usuários
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, paymentDate: true, maxDevices: true }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar usuários.' });
  }
});

// Aprovar Usuário
app.put('/api/admin/approve-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao aprovar usuário.' });
  }
});

// Revogar Acesso de Usuário (Suspender)
app.put('/api/admin/revoke-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao suspender usuário.' });
  }
});

// Rejeitar (Deletar) Usuário Pendente
app.delete('/api/admin/reject-user/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Apaga dependências primeiro via onDelete na db se houver, ou explicitamente.
    // Presumindo Cascata ou que o usuário não tem devices/favoritos ainda.
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao rejeitar usuário.' });
  }
});

// Editar Usuário (Próprio ou via Admin)
app.patch('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password, paymentDate } = req.body;

  try {
    // Busca o usuário que está fazendo a requisição para checar Role
    const requestingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    
    // Se não for admin e tentar editar outro ID, nega
    if (requestingUser.role !== 'ADMIN' && req.userId !== id) {
      return res.status(403).json({ success: false, error: 'Acesso negado.' });
    }

    // Se tentar mudar o email, verifica se já existe em outro usuário
    if (email) {
      const emailCheck = await prisma.user.findFirst({
        where: { email, NOT: { id } }
      });
      if (emailCheck) return res.status(400).json({ success: false, error: 'Este e-mail já está em uso.' });
    }

    // Prepara os dados para update
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (paymentDate !== undefined) {
      updateData.paymentDate = (paymentDate && paymentDate !== '') ? new Date(paymentDate) : null;
    }
    
    // Processa a senha se enviada
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Persistir viewMode (List vs Grid)
    if (req.body.viewMode !== undefined) updateData.viewMode = req.body.viewMode;

    // Apenas Admins podem mudar o Role e o Limite de Dispositivos
    if (role !== undefined && requestingUser.role === 'ADMIN') updateData.role = role;
    if (req.body.maxDevices !== undefined && requestingUser.role === 'ADMIN') {
      updateData.maxDevices = Number(req.body.maxDevices);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true, viewMode: true, paymentDate: true, maxDevices: true }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao editar usuário.' });
  }
});

// Rota para listar conteúdos e confirmar que o DB está operando
app.get('/api/admin/db-preview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const settings = await prisma.userSetting.findMany();
    const devices = await prisma.device.findMany();
    const favorites = await prisma.favorite.findMany();
    const progress = await prisma.progress.findMany();

    res.json({
      success: true,
      data: {
        users,
        settings,
        devices,
        favorites,
        progress
      }
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// SPA fallback: Todas as rotas que não são da API retornam o index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Backend Server rodando na porta ${PORT}`);
});
