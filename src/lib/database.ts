// Función centralizada para verificar disponibilidad de base de datos
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error)
    return false
  }
}