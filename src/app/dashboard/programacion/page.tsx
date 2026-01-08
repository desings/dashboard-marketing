'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import FacebookConfig from '@/components/FacebookConfig'

interface SocialAccount {
  platform: string
  name: string
  connected: boolean
}

interface ScheduledPost {
  id: string
  content: string
  date: string
  time: string
  platforms: string[]
  type: 'post'
  media?: any[]
  status: 'pending' | 'published' | 'failed'
  facebookPostId?: string
  createdAt?: string
  updatedAt?: string
}

interface MediaFile {
  id: string
  file?: File
  preview: string
  type: 'image' | 'video'
  fileName?: string
  originalName?: string
  url?: string
  size?: number
  cloudinaryId?: string
  cloudinaryUrl?: string
  isCloudinary?: boolean
}

export default function ProgramacionPage() {
  const [postText, setPostText] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showFacebookConfig, setShowFacebookConfig] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activeView, setActiveView] = useState<'scheduled' | 'calendar'>('scheduled')
  const [postType, setPostType] = useState<'post'>('post')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  
  // Filter states
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])

  // Cargar datos al inicializar
  useEffect(() => {
    loadScheduledPosts()
    checkAndExecuteDuePosts() // Verificar inmediatamente al cargar
  }, [])

  // Auto-refresh cada 30 segundos para mostrar cambios de estado automáticos
  useEffect(() => {
    const interval = setInterval(() => {
      loadScheduledPosts()
      checkAndExecuteDuePosts() // Agregar ejecución automática
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [])

  // Función para verificar y ejecutar posts que están listos
  const checkAndExecuteDuePosts = async () => {
    try {
      const localPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]')
      const now = new Date()
      
      console.log('📋 Verificando posts programados:', {
        total: localPosts.length,
        pendientes: localPosts.filter((p: any) => p.status === 'pending').length,
        hora_actual: now.toLocaleString()
      })
      
      // Log de todos los posts para debugging
      localPosts.forEach((post: any, index: number) => {
        console.log(`📝 Post ${index + 1}:`, {
          id: post.id.substring(0, 10) + '...',
          status: post.status,
          fecha_programada: `${post.date} ${post.time}`,
          tiene_media: post.media && post.media.length > 0,
          media_count: post.media ? post.media.length : 0
        })
      })
      
      // Filtrar solo posts PENDIENTES
      const pendingPosts = localPosts.filter((post: any) => post.status === 'pending')
      console.log(`🔍 Posts pendientes a verificar: ${pendingPosts.length} de ${localPosts.length} total`)
      
      for (const post of pendingPosts) {
        const scheduledTime = new Date(`${post.date}T${post.time}`)
        const timeDiff = scheduledTime.getTime() - now.getTime()
        
        console.log('⏰ Verificando post:', {
          id: post.id.substring(0, 10) + '...',
          status: post.status, // Re-verificar status
          programado_para: scheduledTime.toLocaleString(),
          hora_actual: now.toLocaleString(),
          diferencia_ms: timeDiff,
          diferencia_minutos: Math.round(timeDiff / 60000),
          debe_ejecutarse: scheduledTime <= now,
          tiene_media: post.media && post.media.length > 0
        })
        
        // Si la hora programada ya pasó, ejecutar el post
        if (scheduledTime <= now) {
          console.log('🕒 Ejecutando post programado:', post.id)
          await executeScheduledPost(post)
        } else {
          console.log('⏳ Post aún no está listo para ejecutar:', {
            id: post.id.substring(0, 10) + '...',
            faltan_minutos: Math.round(timeDiff / 60000)
          })
        }
      }
    } catch (error) {
      console.error('Error checking due posts:', error)
    }
  }

  // Función para ejecutar un post programado específico
  const executeScheduledPost = async (post: any) => {
    try {
      console.log('🚀 Iniciando ejecución de post:', {
        id: post.id,
        contenido: post.content.substring(0, 50) + '...',
        fecha: `${post.date} ${post.time}`
      })

      // Obtener cuentas conectadas
      const connectedAccounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
      const fbAccount = connectedAccounts.find((acc: any) => acc.provider === 'facebook')
      
      console.log('🔑 Verificando cuenta de Facebook:', {
        tiene_cuenta: !!fbAccount,
        tiene_token: !!fbAccount?.pageToken,
        page_id: fbAccount?.pageId,
        token_preview: fbAccount?.pageToken ? fbAccount.pageToken.substring(0, 20) + '...' : 'N/A'
      })

      if (!fbAccount?.pageToken) {
        console.error('❌ No hay cuenta de Facebook conectada para ejecutar:', post.id)
        updatePostStatus(post.id, 'failed', 'Facebook no conectado')
        return
      }

      console.log('📤 Enviando a Facebook...')

      // Preparar medios si los hay
      const postMedia = post.media || []
      
      // Log detallado de media
      if (postMedia.length > 0) {
        console.log('📸 Media detectado:', {
          count: postMedia.length,
          tipos: postMedia.map((m: any) => m.type),
          es_cloudinary: postMedia.map((m: any) => m.isCloudinary || !!m.cloudinaryUrl),
          urls: postMedia.map((m: any) => (m.cloudinaryUrl || m.url || '').substring(0, 50) + '...')
        })
      }
      
      const requestData = {
        content: post.content,
        pageToken: fbAccount.pageToken,
        pageId: fbAccount.pageId,
        media: postMedia,
        type: post.type || 'post' // Agregar tipo de publicación, default a 'post'
      }
      
      console.log('📊 Datos de request a Facebook:', {
        content_length: post.content?.length || 0,
        pageId: fbAccount.pageId,
        token_preview: fbAccount.pageToken.substring(0, 20) + '...',
        media_count: postMedia.length
      })

      // Ejecutar publicación en Facebook
      const response = await fetch('/api/facebook-publish-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      console.log('📬 Respuesta de Facebook:', result)

      if (result.success) {
        console.log('✅ Post ejecutado exitosamente:', post.id, result.postId)
        updatePostStatus(post.id, 'published', null, result.postId)
      } else {
        console.error('❌ Error ejecutando post:', post.id, result.error)
        updatePostStatus(post.id, 'failed', result.error)
      }
    } catch (error) {
      console.error('Error executing scheduled post:', error)
      updatePostStatus(post.id, 'failed', error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  // Función para actualizar el estado de un post
  const updatePostStatus = (postId: string, status: string, error?: string | null, facebookPostId?: string) => {
    try {
      const localPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]')
      const updatedPosts = localPosts.map((post: any) => {
        if (post.id === postId) {
          return {
            ...post,
            status,
            error,
            facebookPostId,
            updatedAt: new Date().toISOString(),
            executedAt: new Date().toISOString()
          }
        }
        return post
      })
      
      localStorage.setItem('scheduled_posts', JSON.stringify(updatedPosts))
      
      // Recargar la lista para mostrar cambios
      loadScheduledPosts()
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

  const loadScheduledPosts = async () => {
    try {
      setLoading(true)
      
      let allPosts: ScheduledPost[] = []

      // Primero intentar cargar desde localStorage
      try {
        const localPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]')
        allPosts = localPosts.map((post: any) => ({
          ...post,
          date: post.date,
          time: post.time,
          platforms: post.platforms || [],
          status: post.status || 'pending'
        }))
        console.log('✅ Posts cargados desde localStorage:', allPosts.length)
      } catch (localError) {
        console.error('Error cargando desde localStorage:', localError)
      }

      // Si localStorage está vacío, intentar cargar desde el sistema viejo
      if (allPosts.length === 0) {
        try {
          // Solo cargar del sistema nuevo (execute-scheduled) para evitar duplicaciones
          const response = await fetch('/api/execute-scheduled?tenantId=demo-tenant')
          const data = await response.json()
          
          if (data.success) {
            // Convertir posts del sistema nuevo al formato del dashboard
            const newSystemPosts = [
              // Posts programados
              ...data.posts.scheduled.map((post: any) => ({
                id: post.id,
                content: post.content,
                date: post.scheduledFor.split('T')[0],
                time: post.scheduledFor.split('T')[1].slice(0, 5),
                platforms: post.platforms,
                type: 'post' as const,
                media: post.media || [],
                status: 'pending' as const,
                createdAt: post.createdAt,
                updatedAt: post.createdAt
              })),
              // Posts publicados exitosamente
              ...data.posts.published.map((post: any) => ({
                id: post.id,
                content: post.content,
                date: post.scheduledFor.split('T')[0],
                time: post.scheduledFor.split('T')[1].slice(0, 5),
                platforms: post.platforms,
                type: 'post' as const,
                media: post.media || [],
                status: (post.publishResult?.success !== false) ? 'published' as const : 'failed' as const,
                facebookPostId: post.publishResult?.results?.facebook?.postId,
                createdAt: post.createdAt,
                updatedAt: post.publishedAt || post.failedAt
              })),
              // Posts que fallaron
              ...data.posts.failed.map((post: any) => ({
                id: post.id,
                content: post.content,
                date: post.scheduledFor.split('T')[0],
                time: post.scheduledFor.split('T')[1].slice(0, 5),
                platforms: post.platforms,
                type: 'post' as const,
                media: post.media || [],
                status: 'failed' as const,
                createdAt: post.createdAt,
                updatedAt: post.failedAt
              }))
            ]
            
            if (newSystemPosts.length > 0) {
              allPosts = newSystemPosts
            }
          }
        } catch (apiError) {
          console.error('Error cargando desde API:', apiError)
        }
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      allPosts.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      
      setScheduledPosts(allPosts)
    } catch (error) {
      console.error('Error loading scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveScheduledPost = async (postData: any) => {
    try {
      // Usar localStorage en lugar de API backend (compatible con Vercel)
      const existingPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]')
      
      const newPost = {
        ...postData,
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      existingPosts.push(newPost)
      localStorage.setItem('scheduled_posts', JSON.stringify(existingPosts))
      
      console.log('✅ Post guardado en localStorage:', newPost.id)
      return newPost
    } catch (error) {
      console.error('Error saving scheduled post to localStorage:', error)
      throw error
    }
  }

  const updateScheduledPost = async (postId: string, updateData: any) => {
    try {
      const response = await fetch('/api/programming-posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: postId, ...updateData })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadScheduledPosts()
        return data.post
      } else {
        console.error('Error updating post:', data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error updating scheduled post:', error)
      throw error
    }
  }

  const deleteScheduledPost = async (postId: string) => {
    try {
      // Primero intentar eliminar desde localStorage
      const localPosts = JSON.parse(localStorage.getItem('scheduled_posts') || '[]')
      const postExistsInLocal = localPosts.find((p: any) => p.id === postId)
      
      if (postExistsInLocal) {
        // Post existe en localStorage - eliminarlo de ahí
        const filteredLocalPosts = localPosts.filter((p: any) => p.id !== postId)
        localStorage.setItem('scheduled_posts', JSON.stringify(filteredLocalPosts))
        console.log('✅ Post eliminado desde localStorage:', postId)
        await loadScheduledPosts()
        return true
      }
      
      // Si no está en localStorage, intentar eliminar desde la API
      const response = await fetch(`/api/programming-posts?id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Post eliminado desde API:', postId)
        await loadScheduledPosts()
        return true
      } else {
        console.error('Error deleting post:', data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting scheduled post:', error)
      throw error
    }
  }

  const mockAccounts: SocialAccount[] = [
    { platform: 'facebook', name: 'Mi Empresa - Facebook', connected: true },
    { platform: 'instagram', name: 'Mi Empresa - Instagram', connected: false },
    { platform: 'twitter', name: 'Mi Empresa - Twitter', connected: false },
    { platform: 'linkedin', name: 'Mi Empresa - LinkedIn', connected: false }
  ]

  const handleAccountToggle = (platform: string) => {
    if (selectedAccounts.includes(platform)) {
      setSelectedAccounts(selectedAccounts.filter(p => p !== platform))
    } else {
      setSelectedAccounts([...selectedAccounts, platform])
    }
  }

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      
      console.log('☁️ Iniciando upload directo a Cloudinary:', files.length)
      
      // Solo advertencia para archivos muy grandes (>100MB)
      const allowedTypes = ['image/', 'video/']
      
      for (const file of files) {
        const sizeInMB = Math.round(file.size / 1024 / 1024)
        
        // Advertencia para archivos muy grandes (>200MB)
        if (file.size > 200 * 1024 * 1024) {
          const confirmUpload = confirm(`⚠️ El archivo "${file.name}" es muy grande (${sizeInMB}MB).\n\n¿Estás seguro de que quieres subirlo?\n\nPuede tardar varios minutos.`)
          if (!confirmUpload) return
        }
        
        if (!allowedTypes.some(type => file.type.startsWith(type))) {
          alert(`⚠️ El archivo "${file.name}" no es válido.\n\nTipos permitidos:\n• Imágenes: JPG, PNG, GIF, WebP, etc.\n• Videos: MP4, MOV, AVI, etc.`)
          return
        }
      }

      const uploadedFiles: MediaFile[] = []

      for (const file of files) {
        console.log(`📤 Subiendo "${file.name}" directamente a Cloudinary...`)
        
        try {
          // Obtener firma para upload seguro
          const signatureResponse = await fetch('/api/cloudinary-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: Math.round(new Date().getTime() / 1000),
              folder: 'dashboard-marketing'
            })
          })

          if (!signatureResponse.ok) {
            throw new Error('Error obteniendo firma de Cloudinary')
          }

          const signatureData = await signatureResponse.json()

          // Upload directo a Cloudinary
          const formData = new FormData()
          formData.append('file', file)
          formData.append('signature', signatureData.signature)
          formData.append('timestamp', signatureData.timestamp.toString())
          formData.append('api_key', signatureData.api_key)
          formData.append('folder', signatureData.folder)

          console.log('🚀 Enviando a Cloudinary (upload directo)...')

          const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/upload`, {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            throw new Error(`Error en Cloudinary: ${uploadResponse.status}`)
          }

          const result = await uploadResponse.json()

          console.log('✅ Upload exitoso:', result.secure_url)

          uploadedFiles.push({
            id: `cloudinary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: file.name,
            originalName: file.name,
            url: result.secure_url,
            preview: result.secure_url,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            size: file.size,
            cloudinaryId: result.public_id,
            cloudinaryUrl: result.secure_url,
            isCloudinary: true
          })

        } catch (fileError) {
          console.error(`❌ Error subiendo ${file.name}:`, fileError)
          alert(`Error subiendo "${file.name}":\n\n${fileError instanceof Error ? fileError.message : 'Error desconocido'}`)
          setUploading(false)
          return
        }
      }
      
      setMediaFiles(prev => [...prev, ...uploadedFiles])
      console.log('✅ Todos los archivos subidos a Cloudinary:', uploadedFiles)
      alert(`✅ ${uploadedFiles.length} archivo(s) subido(s) a Cloudinary exitosamente\n\n🚀 Upload directo - Sin límites del servidor`)
      
    } catch (error) {
      console.error('❌ Error en upload directo:', error)
      alert('Error general en upload:\n\n' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setUploading(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: (
        <img 
          src="/logos/facebook.svg" 
          alt="Facebook" 
          className="w-6 h-6 inline-block"
          title="Facebook"
        />
      ),
      instagram: (
        <div 
          className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center"
          title="Instagram"
        >
          <span className="text-white text-xs font-bold">IG</span>
        </div>
      ),
      twitter: (
        <img 
          src="/logos/twitter.svg" 
          alt="Twitter/X" 
          className="w-6 h-6 inline-block"
          title="Twitter"
        />
      ),
      linkedin: (
        <img 
          src="/logos/linkedin.svg" 
          alt="LinkedIn" 
          className="w-6 h-6 inline-block"
          title="LinkedIn"
        />
      )
    }
    return icons[platform as keyof typeof icons] || (
      <div 
        className="w-6 h-6 rounded bg-gray-400 flex items-center justify-center"
        title={platform}
      >
        <span className="text-white text-xs">📱</span>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      published: { text: 'Publicado', color: 'bg-green-100 text-green-800' },
      failed: { text: 'Falló', color: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  // Calendar functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentMonth(newDate)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return scheduledPosts.filter(post => post.date === dateStr)
  }

  // Modal functions
  const openEditModal = (post: ScheduledPost) => {
    setSelectedPost(post)
    setPostText(post.content)
    setSelectedAccounts([...post.platforms])
    setPublishDate(post.date)
    setPublishTime(post.time)
    setPostType(post.type)
    setShowEditModal(true)
  }

  const openDeleteModal = (post: ScheduledPost) => {
    setSelectedPost(post)
    setShowDeleteModal(true)
  }

  const openCalendarModal = (post: ScheduledPost) => {
    setSelectedPost(post)
    setShowCalendarModal(true)
  }

  const closeModals = () => {
    setShowEditModal(false)
    setShowDeleteModal(false)
    setShowCalendarModal(false)
    setShowCreateModal(false)
    setSelectedPost(null)
    setPostText('')
    setSelectedAccounts([])
    setPublishDate('')
    setPublishTime('')
    setMediaFiles([])
  }

  const saveEditedPost = async () => {
    if (!selectedPost) return
    
    try {
      setPublishing(true)
      
      const mediaData = mediaFiles.map(file => ({
        id: file.id,
        fileName: file.fileName,
        url: file.url,
        type: file.type
      }))

      const updateData = {
        content: postText,
        platforms: [...selectedAccounts],
        date: publishDate,
        time: publishTime,
        type: postType,
        media: mediaData
      }

      await updateScheduledPost(selectedPost.id, updateData)
      
      closeModals()
      alert('Publicación actualizada exitosamente!')
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Error al actualizar la publicación')
    } finally {
      setPublishing(false)
    }
  }

  const deletePost = async () => {
    if (!selectedPost) return
    
    // Confirmar eliminación con el usuario
    const postStatus = selectedPost.status === 'pending' ? 'pendiente' : 
                       selectedPost.status === 'published' ? 'publicada' : 'fallida'
    
    const confirmMessage = selectedPost.status === 'published' 
      ? `¿Estás seguro de que quieres eliminar esta publicación ${postStatus}?\n\nContenido: "${selectedPost.content.slice(0, 50)}..."\n\n⚠️ IMPORTANTE: Esto también eliminará el post de Facebook.\n\nEsta acción no se puede deshacer.`
      : `¿Estás seguro de que quieres eliminar esta publicación ${postStatus}?\n\nContenido: "${selectedPost.content.slice(0, 50)}..."\n\nEsta acción no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    try {
      // Si el post está publicado en Facebook, intentar eliminarlo de Facebook primero
      if (selectedPost.status === 'published' && selectedPost.facebookPostId) {
        console.log('🗑️ Eliminando post de Facebook:', selectedPost.facebookPostId)
        
        try {
          // Obtener token de Facebook desde localStorage
          const fbAccounts = JSON.parse(localStorage.getItem('facebook_accounts') || '{}')
          const fbAccount = fbAccounts.default || fbAccounts[Object.keys(fbAccounts)[0]]
          
          // Debug mejorado
          console.log('🔍 [DEBUG] localStorage facebook_accounts raw:', localStorage.getItem('facebook_accounts'))
          console.log('🔍 [DEBUG] Facebook accounts parsed:', fbAccounts)
          console.log('🔍 [DEBUG] Facebook accounts keys:', Object.keys(fbAccounts))
          console.log('🔍 [DEBUG] Selected account:', fbAccount ? 'Found' : 'Not found')
          console.log('🔍 [DEBUG] Post ID a eliminar:', selectedPost.facebookPostId)
          
          if (!fbAccount?.pageToken) {
            const continueAnyway = confirm(
              `⚠️ No se encontró token de Facebook para eliminar el post.\n\n¿Quieres continuar y eliminar solo del dashboard?`
            )
            if (!continueAnyway) {
              return
            }
          } else {
            console.log('🌐 [DEBUG] Enviando petición de eliminación...')
            
            const facebookResponse = await fetch('/api/facebook-delete-post', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                postId: selectedPost.facebookPostId,
                pageToken: fbAccount.pageToken
              })
            })
            
            console.log('📡 [DEBUG] Response status:', facebookResponse.status)
            const facebookResult = await facebookResponse.json()
            console.log('📄 [DEBUG] Response body:', facebookResult)
            
            if (!facebookResult.success && !facebookResult.alreadyDeleted) {
              const continueAnyway = confirm(
                `⚠️ No se pudo eliminar de Facebook: ${facebookResult.error}\n\n¿Quieres continuar y eliminar solo del dashboard?`
              )
              if (!continueAnyway) {
                return
              }
            } else {
              console.log('✅ Post eliminado de Facebook exitosamente')
            }
          }
        } catch (facebookError) {
          console.error('Error eliminando de Facebook:', facebookError)
          const continueAnyway = confirm(
            `⚠️ Error al conectar con Facebook para eliminar el post.\n\n¿Quieres continuar y eliminar solo del dashboard?`
          )
          if (!continueAnyway) {
            return
          }
        }
      }
      
      // Eliminar del dashboard local
      await deleteScheduledPost(selectedPost.id)
      
      closeModals()
      
      if (selectedPost.status === 'published' && selectedPost.facebookPostId) {
        alert(`✅ Publicación ${postStatus} eliminada exitosamente del dashboard y Facebook!`)
      } else {
        alert(`✅ Publicación ${postStatus} eliminada exitosamente!`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('❌ Error al eliminar la publicación: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  // Filter function
  const getFilteredPosts = () => {
    return scheduledPosts.filter(post => {
      const platformMatch = platformFilter === 'all' || post.platforms.includes(platformFilter)
      const statusMatch = statusFilter === 'all' || post.status === statusFilter
      const typeMatch = typeFilter === 'all' || post.type === typeFilter
      return platformMatch && statusMatch && typeMatch
    })
  }

  const publishNow = async () => {
    if (!postText.trim()) {
      alert('Por favor escribe el contenido del post')
      return
    }

    if (selectedAccounts.length === 0) {
      alert('Por favor selecciona al menos una red social')
      return
    }

    try {
      setPublishing(true)
      
      let facebookPostId: string | undefined // Para capturar ID del post de Facebook
      
      // Preparar URLs de multimedia
      const mediaUrls = mediaFiles.map(file => ({
        url: file.cloudinaryUrl || file.url,
        type: file.type,
        fileName: file.fileName,
        isCloudinary: file.isCloudinary || !!file.cloudinaryUrl,
        cloudinaryUrl: file.cloudinaryUrl
      }))
      
      // Obtener cuentas conectadas desde localStorage
      const connectedAccounts = JSON.parse(localStorage.getItem('connected_accounts') || '[]')
      
      for (const platform of selectedAccounts) {
        console.log(`Publicando en ${platform}: ${postText}`)
        console.log('Con multimedia:', mediaUrls)
        
        if (platform === 'facebook') {
          // Usar OAuth para Facebook
          const fbAccount = connectedAccounts.find((acc: any) => acc.provider === 'facebook')
          
          console.log('🔑 Facebook account para publicación inmediata:', {
            tiene_cuenta: !!fbAccount,
            tiene_token: !!fbAccount?.pageToken,
            page_id: fbAccount?.pageId,
            token_preview: fbAccount?.pageToken ? fbAccount.pageToken.substring(0, 20) + '...' : 'N/A',
            token_length: fbAccount?.pageToken ? fbAccount.pageToken.length : 0,
            token_full: fbAccount?.pageToken // TEMPORAL para debug
          })
          
          if (!fbAccount?.pageToken) {
            alert(`❌ Facebook no está conectado.\n\nVe a Settings → Cuentas Conectadas → Conectar Facebook`)
            setPublishing(false)
            return
          }
          
          const requestData = {
            content: postText,
            pageToken: fbAccount.pageToken,
            pageId: fbAccount.pageId,
            media: mediaUrls,
            type: postType // Agregar tipo de publicación
          }
          
          console.log('📊 Datos de request inmediato a Facebook:', {
            content_length: postText?.length || 0,
            pageId: fbAccount.pageId,
            token_preview: fbAccount.pageToken.substring(0, 20) + '...',
            media_count: mediaUrls.length
          })
          
          const response = await fetch('/api/facebook-publish-oauth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          })
          
          const result = await response.json()
          console.log(`Resultado de ${platform}:`, result)
          
          if (!result.success) {
            console.error(`Error detallado de ${platform}:`, result)
            alert(`❌ Error en Facebook: ${result.error}`)
            setPublishing(false)
            return
          }

          // Capturar ID del post para guardarlo en historial
          facebookPostId = result.postId

          // Mostrar mensaje específico según el resultado
          if (result.warning) {
            alert(`⚠️ Publicado con advertencia:\n${result.message}\n\nAdvertencia: ${result.warning}`)
          } else {
            alert(`✅ ¡Publicación exitosa en Facebook!\n\n${result.message}\n\nID del post: ${result.postId}`)
          }
        } else {
          // Para otras plataformas, usar endpoint directo
          const endpoint = '/api/publish-real'
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              platform: platform,
              content: postText,
              publishNow: true,
              media: mediaUrls
            }),
          })

          const result = await response.json()
          console.log(`Resultado de ${platform}:`, result)
          
          if (!result.success) {
            console.error(`Error detallado de ${platform}:`, result)
            alert(`❌ Error en ${platform}: ${result.error || 'Error desconocido'}`)
            setPublishing(false)
            return
          }
        }
      }

      // Guardar el post en el historial como "publicado"
      try {
        const now = new Date()
        const mediaData = mediaFiles.map(file => ({
          id: file.id,
          fileName: file.fileName,
          url: file.cloudinaryUrl || file.url,
          type: file.type,
          isCloudinary: file.isCloudinary || !!file.cloudinaryUrl,
          cloudinaryUrl: file.cloudinaryUrl
        }))

        const publishedPost = {
          content: postText,
          date: now.toISOString().split('T')[0], // Fecha actual
          time: now.toTimeString().slice(0, 5),  // Hora actual (HH:MM)
          platforms: [...selectedAccounts],
          type: postType,
          media: mediaData,
          status: 'published' as const,
          facebookPostId: facebookPostId, // Incluir ID del post de Facebook
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        }

        await saveScheduledPost(publishedPost)
        console.log('✅ Post guardado en historial como publicado:', publishedPost)
      } catch (saveError) {
        console.error('⚠️ Error guardando post en historial:', saveError)
        // No fallar la publicación por esto
      }

      alert(`✅ Post publicado exitosamente!`)
      setPostText('')
      setSelectedAccounts([])
      setMediaFiles([]) // Limpiar archivos multimedia
      setShowCreateModal(false) // Cerrar el modal
      
      // Recargar la lista para mostrar el nuevo post publicado
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error al publicar:', error)
      alert('Error al publicar el post: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    } finally {
      setPublishing(false)
    }
  }

  const schedulePost = async () => {
    if (!postText.trim()) {
      alert('Por favor escribe el contenido del post')
      return
    }

    if (selectedAccounts.length === 0) {
      alert('Por favor selecciona al menos una red social')
      return
    }

    if (!publishDate || !publishTime) {
      alert('Por favor selecciona fecha y hora de publicación')
      return
    }

    const scheduledDateTime = new Date(`${publishDate}T${publishTime}`)
    if (scheduledDateTime <= new Date()) {
      alert('La fecha y hora debe ser en el futuro')
      return
    }

    try {
      setPublishing(true)
      
      // Preparar datos del post para guardar
      const mediaData = mediaFiles.map(file => ({
        id: file.id,
        fileName: file.fileName,
        url: file.cloudinaryUrl || file.url,
        type: file.type,
        isCloudinary: file.isCloudinary || !!file.cloudinaryUrl,
        cloudinaryUrl: file.cloudinaryUrl
      }))

      const newPostData = {
        content: postText,
        date: publishDate,
        time: publishTime,
        platforms: [...selectedAccounts],
        type: postType,
        media: mediaData // Incluir multimedia
      }

      // Guardar en la base de datos/archivo
      const savedPost = await saveScheduledPost(newPostData)
      console.log('✅ Post guardado:', savedPost)
      
      // Para posts programados, solo guardamos la información
      // El sistema de cron se encargará de ejecutarlos con los tokens OAuth
      console.log(`Post programado para ${selectedAccounts.join(', ')} el ${publishDate} a las ${publishTime}`)

      alert('Post programado exitosamente!')
      setPostText('')
      setSelectedAccounts([])
      setPublishDate('')
      setPublishTime('')
      setMediaFiles([])
      setShowScheduleForm(false)
      setShowCreateModal(false) // Cerrar el modal
      
      // Recargar la lista de posts programados
      await loadScheduledPosts()
    } catch (error) {
      console.error('Error al programar:', error)
      alert('Error al programar el post')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando publicaciones...</p>
            </div>
          </div>
        </div>
      ) : (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Programación de Publicaciones</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('scheduled')}
              className={`py-2 px-4 rounded-md font-medium transition-colors ${
                activeView === 'scheduled'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Posts Programados ({scheduledPosts.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`py-2 px-4 rounded-md font-medium transition-colors ${
                activeView === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📅 Calendario
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
          >
            <span>➕</span>
            Crear Post
          </button>
        </div>

        {/* Create Publication Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Crear Nueva Publicación</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">

            {/* Content Input - Improved visibility */}
            <div className="mb-6">
              <label htmlFor="postContent" className="block text-sm font-medium text-gray-900 mb-2">
                Contenido del post
              </label>
              
              <textarea
                id="postContent"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="¿Qué quieres publicar hoy?"
                className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                style={{ fontSize: '16px' }}
              />
              <div className="mt-2 text-sm text-gray-600">
                {postText.length}/280 caracteres
              </div>
            </div>

            {/* Media Upload */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm font-medium text-gray-900">
                  Multimedia
                </label>
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-gray-600">Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="mediaUpload"
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="mediaUpload" 
                      className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <span className="text-lg mr-1">📎</span>
                      Agregar
                    </label>
                  </>
                )}
              </div>

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {mediaFiles.map((media) => (
                    <div key={media.id} className="relative group">
                      {media.type === 'image' ? (
                        <img
                          src={media.preview}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={media.preview}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <button
                        onClick={() => removeMediaFile(media.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Networks Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Redes Sociales
              </label>
              <div className="flex flex-wrap gap-2">
                {mockAccounts.map((account) => (
                  <button
                    key={account.platform}
                    type="button"
                    onClick={() => account.connected && handleAccountToggle(account.platform)}
                    disabled={!account.connected}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedAccounts.includes(account.platform)
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : account.connected
                        ? 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 border-2 border-transparent cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm">{getPlatformIcon(account.platform)}</span>
                    <span>{account.name}</span>
                    {account.connected ? (
                      selectedAccounts.includes(account.platform) ? (
                        <span className="text-blue-600">✓</span>
                      ) : null
                    ) : (
                      <span className="text-red-400 text-xs">○</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={publishNow}
                disabled={publishing}
                className={`px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700`}
              >
                {publishing 
                  ? 'Publicando...' 
                  : 'Publicar AHORA'
                }
              </button>
              
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                disabled={publishing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                📅 Programar Post
              </button>
            </div>

            {/* Schedule Form - Improved visibility */}
            {showScheduleForm && (
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Programar publicación</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="publishDate" className="block text-sm font-medium text-gray-900 mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      id="publishDate"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="publishTime" className="block text-sm font-medium text-gray-900 mb-2">
                      Hora
                    </label>
                    <input
                      type="time"
                      id="publishTime"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <button
                  onClick={schedulePost}
                  disabled={publishing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {publishing ? 'Programando...' : '✅ Confirmar Programación'}
                </button>
              </div>
            )}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Content Table View */}
        {activeView === 'scheduled' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Contenido Programado</h2>
                
                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las plataformas</option>
                    <option value="facebook">📘 Facebook</option>
                    <option value="instagram">📷 Instagram</option>
                    <option value="twitter">🐦 Twitter</option>
                    <option value="linkedin">💼 LinkedIn</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="published">Publicado</option>
                    <option value="failed">Falló</option>
                  </select>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="post">📝 Post</option>
                  </select>
                </div>
              </div>
            </div>
            
            {getFilteredPosts().length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contenido que coincida con los filtros</h3>
                <p className="text-gray-500">Ajusta los filtros o crea nueva publicación.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Publicación
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contenido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Media
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plataformas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredPosts().map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(post.date)}
                          </div>
                          <div className="text-sm text-gray-500">{post.time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={post.content}>
                            {post.content}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {post.media && post.media.length > 0 ? (
                            <div className="flex gap-2">
                              {post.media.slice(0, 3).map((media: any, index: number) => {
                                const mediaUrl = media.cloudinaryUrl || media.url;
                                const isVideo = media.type === 'video' || media.isVideo || mediaUrl?.includes('.mp4') || mediaUrl?.includes('.mov');
                                
                                return (
                                  <div key={index} className="relative">
                                    {isVideo ? (
                                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                        <span className="text-xs text-gray-500">🎥</span>
                                      </div>
                                    ) : (
                                      <img
                                        src={mediaUrl}
                                        alt="Vista previa"
                                        className="w-12 h-12 object-cover rounded border"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {post.media.length > 3 && (
                                <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{post.media.length - 3}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Sin multimedia</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.type === 'post' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            📝 Post
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            {post.platforms.map((platform) => (
                              <span key={platform} className="text-lg" title={platform}>
                                {getPlatformIcon(platform)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(post.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => openEditModal(post)}
                            className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => openDeleteModal(post)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Vista Calendario</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-1 font-medium text-gray-900 min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const isToday = day.toDateString() === new Date().toDateString()
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const dayPosts = getPostsForDate(day)
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 rounded ${
                      !isCurrentMonth
                        ? 'bg-gray-50 text-gray-400' 
                        : isToday 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                    {dayPosts.length > 0 && isCurrentMonth && (
                      <div className="space-y-1">
                        {dayPosts.slice(0, 2).map((post) => (
                          <div
                            key={post.id}
                            onClick={() => openCalendarModal(post)}
                            className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate ${
                              post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              post.status === 'published' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}
                            title={post.content}
                          >
                            {post.time} - {post.type === 'post' ? '📝' : '📸'} {post.content.slice(0, 15)}...
                          </div>
                        ))}
                        {dayPosts.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayPosts.length - 2} más
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span>Publicado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>Falló</span>
                </div>
              </div>
              <div>
                Total: {scheduledPosts.length} publicaciones programadas
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Editar Publicación</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Content Input */}
              <div>
                <label htmlFor="editPostContent" className="block text-sm font-medium text-gray-900 mb-2">
                  Contenido del post
                </label>
                <textarea
                  id="editPostContent"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="¿Qué quieres publicar hoy?"
                  className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500 shadow-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Social Networks Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Seleccionar redes sociales</h4>
                <div className="grid grid-cols-2 gap-3">
                  {mockAccounts.map((account) => (
                    <div
                      key={account.platform}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        selectedAccounts.includes(account.platform)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : account.connected
                          ? 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                      onClick={() => account.connected && handleAccountToggle(account.platform)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{account.name}</div>
                            <div className={`text-xs ${account.connected ? 'text-green-600' : 'text-red-600'}`}>
                              {account.connected ? 'Conectado' : 'Desconectado'}
                            </div>
                          </div>
                        </div>
                        {account.connected && (
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.platform)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editPublishDate" className="block text-sm font-medium text-gray-900 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="editPublishDate"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label htmlFor="editPublishTime" className="block text-sm font-medium text-gray-900 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    id="editPublishTime"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedPost}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div>
                  <p className="text-gray-900 font-medium">¿Estás seguro de que quieres eliminar esta publicación?</p>
                  <p className="text-gray-600 text-sm mt-1">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-700 font-medium mb-1">
                  📝 Post - {formatDate(selectedPost.date)} a las {selectedPost.time}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {selectedPost.content}
                </div>
                <div className="flex gap-1 mt-2">
                  {selectedPost.platforms.map((platform) => (
                    <span key={platform} className="text-sm" title={platform}>
                      {getPlatformIcon(platform)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModals}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deletePost}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Eliminar {selectedPost?.status === 'pending' ? 'Pendiente' : 
                           selectedPost?.status === 'published' ? 'Publicada' : 'Publicación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Detail Modal */}
      {showCalendarModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Detalles de la Publicación</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      📝 Post
                    </span>
                    {getStatusBadge(selectedPost.status)}
                  </div>
                  <h4 className="font-medium text-gray-900">Contenido:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">{selectedPost.content}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Programado para:</h4>
                  <div className="text-gray-700">
                    📅 {formatDate(selectedPost.date)} a las {selectedPost.time}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Plataformas:</h4>
                  <div className="flex gap-2">
                    {selectedPost.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                      >
                        {getPlatformIcon(platform)} {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={closeModals}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCalendarModal(false)
                    openEditModal(selectedPost)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    setShowCalendarModal(false)
                    openDeleteModal(selectedPost)
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Eliminar {selectedPost?.status === 'pending' ? 'Pendiente' : 
                           selectedPost?.status === 'published' ? 'Publicada' : 'Publicación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFacebookConfig && (
        <FacebookConfig
          onClose={() => setShowFacebookConfig(false)}
          onSave={(config) => {
            console.log('Facebook config saved:', config)
            setShowFacebookConfig(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}