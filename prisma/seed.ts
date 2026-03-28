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
  console.log('\n✨ Semeamento concluído com sucesso!')
  console.log('🔑 Credenciais:')
  console.log('   - Admin: admin@admin.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o semeamento:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
