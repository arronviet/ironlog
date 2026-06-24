'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  History,
  Calendar,
  BarChart3,
  Dumbbell,
  Trophy,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

// ─── Next.js <Link> tự động prefetch khi hover → navigate tức thì ─────────────
// Thêm prefetch={true} explicit cho các route hay dùng
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workout/new', label: 'Ghi Workout', icon: Dumbbell },
  { href: '/history', label: 'Lịch sử', icon: History },
  { href: '/calendar', label: 'Lịch', icon: Calendar },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/dashboard/prs', label: 'PRs', icon: Trophy },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-white/[0.02] border-r border-white/[0.05]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <span className="text-white font-bold text-lg tracking-tight">IronLog</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/workout/new' && pathname.startsWith(href))
          return (
            <Link
              key={href} 
              href={href}
              prefetch={true} // Preload JS chunk khi hover, không cần chờ khi click
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                         transition-all duration-150 group
                         ${active
                           ? 'bg-white/[0.08] text-white'
                           : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                         }`}
            >
              <Icon
                size={17}
                className={active ? 'text-white' : 'text-white/40 group-hover:text-white/60 transition-colors'}
              />
              {label}
              {href === '/dashboard/prs' && active && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md">
                  NEW
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/[0.05]">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       text-white/30 hover:text-white/60 hover:bg-white/[0.04]
                       transition-all duration-150"
          >
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  )
}
