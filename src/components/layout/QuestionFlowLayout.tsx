import { Bell, ChevronDown } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { useAuthStore } from '../../store/authStore'
import avatarImg from '../../assets/avatar.jpeg'

interface QuestionFlowLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  headerAction?: React.ReactNode
  breadcrumb?: string
}

export function QuestionFlowLayout({
  sidebar,
  children,
  footer,
  headerAction,
  breadcrumb = 'Test Creation / Create Test / Chapter Wise',
}: QuestionFlowLayoutProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex overflow-hidden">
      {sidebar}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <Logo />
          <p className="text-sm text-gray-500 hidden lg:block">{breadcrumb}</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                  <img
                    src={avatarImg}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold">{user?.name || 'Alex Wando'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
            {headerAction}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>

        {footer && (
          <footer className="h-16 bg-white border-t border-gray-200 px-6 flex items-center shrink-0 w-full">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
