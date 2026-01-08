import { Worker, Queue } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { JobController } from '@/controllers/jobController'

// Configuración de Redis
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
}

// Queue para jobs de scraping
export const jobScrapingQueue = new Queue('job-scraping', { 
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
})

const prisma = new PrismaClient()

// Worker para procesar jobs de scraping
export const jobScrapingWorker = new Worker(
  'job-scraping',
  async (job) => {
    console.log(`🔄 Procesando job de scraping: ${job.id}`)
    
    try {
      const { jobSearchId, type } = job.data
      
      if (type === 'scheduled-scraping') {
        console.log(`📋 Ejecutando scraping programado para: ${jobSearchId}`)
        
        const result = await JobController.executeJobSearch(jobSearchId)
        
        console.log(`✅ Scraping completado:`, {
          jobSearchId,
          newOffersCount: result.newOffersCount,
          keywords: result.keywords
        })
        
        return {
          success: true,
          jobSearchId,
          newOffersCount: result.newOffersCount,
          message: `${result.newOffersCount} nuevas ofertas encontradas`
        }
      }
      
      throw new Error(`Tipo de job desconocido: ${type}`)
      
    } catch (error) {
      console.error(`❌ Error en worker de scraping:`, error)
      throw error
    }
  },
  { 
    connection: redisConnection,
    concurrency: 2 // Máximo 2 jobs simultáneos
  }
)

// Manejar eventos del worker
jobScrapingWorker.on('completed', (job, result) => {
  console.log(`✅ Job completado: ${job.id}`, result)
})

jobScrapingWorker.on('failed', (job, err) => {
  console.error(`❌ Job falló: ${job?.id}`, err)
})

jobScrapingWorker.on('error', (err) => {
  console.error('❌ Error en worker:', err)
})

// Función para programar scraping automático
export async function schedulePeriodicScraping() {
  try {
    console.log('🔄 Configurando scraping automático...')
    
    // Obtener todas las búsquedas activas
    const activeSearches = await prisma.jobSearch.findMany({
      where: { isActive: true }
    })
    
    console.log(`📊 ${activeSearches.length} búsquedas activas encontradas`)
    
    // Limpiar jobs existentes para evitar duplicados
    await jobScrapingQueue.obliterate({ force: true })
    
    // Programar cada búsqueda
    for (const search of activeSearches) {
      const jobId = `scraping-${search.id}`
      
      await jobScrapingQueue.add(
        'scheduled-scraping',
        {
          jobSearchId: search.id,
          type: 'scheduled-scraping',
          keywords: search.keywords
        },
        {
          jobId,
          repeat: {
            every: search.frequencyMinutes * 60 * 1000 // Convertir minutos a ms
          }
        }
      )
      
      console.log(`⏰ Job programado: ${search.keywords} (cada ${search.frequencyMinutes} min)`)
    }
    
    console.log('✅ Scraping automático configurado correctamente')
    
  } catch (error) {
    console.error('❌ Error configurando scraping automático:', error)
  }
}

// Función para agregar un job de scraping manual
export async function addManualScrapingJob(jobSearchId: string) {
  try {
    const job = await jobScrapingQueue.add(
      'manual-scraping',
      {
        jobSearchId,
        type: 'scheduled-scraping' // Usar el mismo tipo
      },
      {
        priority: 10 // Mayor prioridad para scraping manual
      }
    )
    
    console.log(`🚀 Job de scraping manual agregado: ${job.id}`)
    return job
    
  } catch (error) {
    console.error('❌ Error agregando job manual:', error)
    throw error
  }
}

// Función para actualizar la programación cuando cambia una búsqueda
export async function updateJobSchedule(jobSearchId: string) {
  try {
    console.log(`🔄 Actualizando programación para: ${jobSearchId}`)
    
    // Remover job existente
    const existingJobs = await jobScrapingQueue.getJobs(['delayed', 'waiting', 'active'])
    for (const job of existingJobs) {
      if (job.data.jobSearchId === jobSearchId) {
        await job.remove()
        console.log(`🗑️ Job anterior removido: ${job.id}`)
      }
    }
    
    // Obtener datos actualizados
    const search = await prisma.jobSearch.findUnique({
      where: { id: jobSearchId }
    })
    
    if (!search) {
      console.log('⏭️ Búsqueda no encontrada, no se programa')
      return
    }
    
    if (!search.isActive) {
      console.log('⏭️ Búsqueda inactiva, no se programa')
      return
    }
    
    // Programar nuevo job
    await jobScrapingQueue.add(
      'scheduled-scraping',
      {
        jobSearchId: search.id,
        type: 'scheduled-scraping',
        keywords: search.keywords
      },
      {
        jobId: `scraping-${search.id}`,
        repeat: {
          every: search.frequencyMinutes * 60 * 1000
        }
      }
    )
    
    console.log(`✅ Nueva programación configurada: ${search.keywords}`)
    
  } catch (error) {
    console.error('❌ Error actualizando programación:', error)
  }
}

// Función para remover jobs de una búsqueda
export async function removeJobSchedule(jobSearchId: string) {
  try {
    console.log(`🗑️ Removiendo programación para: ${jobSearchId}`)
    
    const jobs = await jobScrapingQueue.getJobs(['delayed', 'waiting', 'active'])
    for (const job of jobs) {
      if (job.data.jobSearchId === jobSearchId) {
        await job.remove()
        console.log(`🗑️ Job removido: ${job.id}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error removiendo jobs:', error)
  }
}

// Función para obtener estadísticas de la queue
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      jobScrapingQueue.getWaiting(),
      jobScrapingQueue.getActive(),
      jobScrapingQueue.getCompleted(),
      jobScrapingQueue.getFailed(),
      jobScrapingQueue.getDelayed()
    ])
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return null
  }
}

// Función de cleanup para desarrollo
export async function cleanup() {
  try {
    await jobScrapingWorker.close()
    await jobScrapingQueue.close()
    console.log('🔒 Conexiones cerradas correctamente')
  } catch (error) {
    console.error('❌ Error en cleanup:', error)
  }
}

// Inicializar en el arranque (solo en production)
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Inicializando sistema de jobs programados...')
  
  // Esperar un poco para que la DB esté lista
  setTimeout(() => {
    schedulePeriodicScraping().catch(error => {
      console.error('❌ Error iniciando jobs programados:', error)
    })
  }, 5000)
}

export default {
  queue: jobScrapingQueue,
  worker: jobScrapingWorker,
  schedulePeriodicScraping,
  addManualScrapingJob,
  updateJobSchedule,
  removeJobSchedule,
  getQueueStats,
  cleanup
}