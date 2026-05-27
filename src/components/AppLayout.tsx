import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/**
 * Layout das rotas autenticadas: conteúdo + bottom nav fixo.
 */
export function AppLayout() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
