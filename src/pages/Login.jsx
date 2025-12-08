import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Spline from '@splinetool/react-spline'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSplineLoaded, setIsSplineLoaded] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    const success = login(username, password)
    if (success) {
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } else {
      toast.error('Usuário ou senha incorretos')
    }
  }

  const handleSplineLoad = () => {
    setIsSplineLoaded(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Tela de Loading */}
      {!isSplineLoaded && (
        <div className="absolute inset-0 w-full h-full z-20 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      )}

      {/* Cena do Spline ao fundo */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Suspense fallback={<div className="w-full h-full bg-background" />}>
          <Spline 
            scene="https://prod.spline.design/UGQQDavymkJuRLwQ/scene.splinecode"
            className="w-full h-full"
            onLoad={handleSplineLoad}
          />
        </Suspense>
      </div>
      
      {/* Card de login com overlay */}
      <div className={`relative z-10 w-full max-w-md transition-opacity duration-500 ${isSplineLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <Card className="w-full backdrop-blur-md bg-background/80 border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sistema de Gestão de Clientes
            </CardTitle>
            <CardDescription className="text-center">
              Faça login para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

