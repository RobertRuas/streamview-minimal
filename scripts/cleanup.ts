import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Iniciando limpeza de usuários...')

  // 1. Garantir que o admin existe
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      role: 'ADMIN',
      active: true,
      maxDevices: 10
    },
    create: {
      email: 'admin@admin.com',
      passwordHash: adminPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      active: true,
      maxDevices: 10
    }
  })
  console.log('✅ Usuário admin@admin.com garantido.')

  // 2. Remover todos os outros usuários
  const result = await prisma.user.deleteMany({
    where: {
      NOT: {
        email: 'admin@admin.com'
      }
    }
  })

  console.log(`✅ Removidos ${result.count} usuários adicionais.`)
  console.log('✨ Limpeza concluída!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a limpeza:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
