import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  ChevronDown,
  ClipboardList,
  Pencil,
} from 'lucide-react'
import { Logo } from '../ui/Logo'
import { useAuthStore } from '../../store/authStore'
import avatarImg from '../../assets/avatar.jpeg'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3, end: true },
  { to: '/tests/create', label: 'Test Creation', icon: Pencil, end: false },
  { to: '/tests/tracking', label: 'Test Tracking', icon: ClipboardList, end: true },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  breadcrumbs?: string[]
}

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-[15.4px] border-b border-gray-100">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative cursor-pointer ${isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
                  )}
                  <item.icon size={18} className="shrink-0" />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <p className="text-sm text-gray-500">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb}>
                    {i > 0 && <span className="mx-2 text-gray-300">/</span>}
                    <span
                      className={
                        i === breadcrumbs.length - 1
                          ? 'text-gray-800 font-medium'
                          : ''
                      }
                    >
                      {crumb}
                    </span>
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                <img
                  src={avatarImg}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.name || user?.userId || 'Alex Wando'}
                </p>
                <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="User menu"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
