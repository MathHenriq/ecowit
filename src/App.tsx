import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Splash } from './screens/Splash'
import { Login } from './screens/Login'
import { Onboarding } from './screens/Onboarding'
import { Feed } from './screens/Feed'
import { Jardim } from './screens/Jardim'
import { Catalogo } from './screens/Catalogo'
import { Navigate } from 'react-router-dom'
import { Scan } from './screens/Scan'
import { ScanResult } from './screens/ScanResult'
import { Streak } from './screens/Streak'
import { Rega } from './screens/Rega'
import { Perfil } from './screens/Perfil'
import { Ranking } from './screens/Ranking'
import { Notificacoes } from './screens/Notificacoes'
import { Config } from './screens/Config'
import { PlantaDetalhe } from './screens/PlantaDetalhe'
import { PostDetalhe } from './screens/PostDetalhe'
import { Placeholder } from './screens/Placeholder'
import { AppLayout } from './components/AppLayout'

/**
 * Roteamento principal do EcoWit.
 * - Rotas "públicas" (Splash, Login, Onboarding): tela cheia, sem nav.
 * - Rotas "autenticadas": dentro de AppLayout (com BottomNav).
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto w-full max-w-[440px] min-h-svh flex flex-col bg-[var(--color-cream)] shadow-xl">
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Autenticadas (com BottomNav) */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Feed />} />
            <Route path="/jardim" element={<Jardim />} />
            <Route path="/jardim/:speciesId" element={<PlantaDetalhe />} />
            <Route path="/catalogo" element={<Catalogo />} />
            {/* a antiga Plantação virou o próprio Jardim 3D */}
            <Route path="/plantacao" element={<Navigate to="/jardim" replace />} />
            <Route path="/streak" element={<Streak />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          {/* Telas modais / full-screen sem nav */}
          <Route path="/scan" element={<Scan />} />
          <Route path="/scan/resultado" element={<ScanResult />} />
          <Route path="/streak/rega" element={<Rega />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/config" element={<Config />} />
          <Route path="/post/:postId" element={<PostDetalhe />} />

          <Route
            path="*"
            element={<Placeholder title="404 — caminho não encontrado" next={{ label: 'Voltar ao início', to: '/' }} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
