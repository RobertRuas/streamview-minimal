import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Script de Seed (Semeamento)
 * Cria usuários padrão (Admin e User) para inicializar o sistema.
 */
async function main() {
  console.log('🌱 Iniciando semeamento do banco de dados...')

  // 1. Criar usuário Admin padrão
  // Senha: admin123
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      passwordHash: adminPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      active: true,
      maxDevices: 10,
      defaultTV: 'all',
      defaultMovie: 'all',
      defaultSeries: 'all'
    }
  })
  console.log(`✅ Admin criado/atualizado: ${admin.email}`)

  // 2. Criar usuário Comum padrão
  // Senha: user123
  const userPassword = await bcrypt.hash('user123', 10)
  const userItem = await prisma.user.upsert({
    where: { email: 'user@user.com' },
    update: {},
    create: {
      email: 'user@user.com',
      passwordHash: userPassword,
      name: 'Usuário de Teste',
      role: 'USER',
      active: true,
      maxDevices: 2,
      defaultTV: 'all',
      defaultMovie: 'all',
      defaultSeries: 'all'
    }
  })
  console.log(`✅ Usuário criado/atualizado: ${userItem.email}`)

  console.log('\n✨ Semeamento concluído com sucesso!')
  console.log('🔑 Credenciais:')
  console.log('   - Admin: admin@admin.com / admin123')
  console.log('   - Usuário: user@user.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o semeamento:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
