import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Configuração do Firebase
// As credenciais podem ser definidas via variáveis de ambiente (.env) ou diretamente aqui
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA2gPFFQ3nciLrJNJ1JLHZ39nkJ6CzB_OU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sistema-clientes-cab76.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sistema-clientes-cab76",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sistema-clientes-cab76.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "413092474188",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:413092474188:web:3dac8150dbe55de4f6f3e9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EV812QEX3F"
}

// Verificar se Firebase está configurado
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "your-api-key" && 
         firebaseConfig.projectId && 
         firebaseConfig.projectId !== "your-project-id"
}

// Inicializar Firebase apenas se estiver configurado
let app = null
let db = null
let auth = null
let analytics = null

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    
    // Inicializar Analytics (apenas no browser e se suportado)
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app)
          console.log('Firebase Analytics inicializado')
        }
      }).catch((error) => {
        console.warn('Analytics não disponível:', error)
      })
    }
    
    // Habilitar persistência offline
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Persistência offline já está habilitada em outra aba')
      } else if (err.code === 'unimplemented') {
        console.warn('Persistência offline não é suportada neste navegador')
      }
    })
    
    console.log('Firebase inicializado com sucesso!')
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error)
    console.warn('Sistema funcionará apenas com LocalStorage (offline)')
  }
} else {
  console.warn('Firebase não configurado. Sistema funcionará apenas com LocalStorage.')
  console.info('Para habilitar sincronização, configure as variáveis de ambiente. Veja README_FIREBASE.md')
}

// Exportar db, auth e analytics (serão null se Firebase não estiver configurado)
export { db, auth, analytics }

export default app

