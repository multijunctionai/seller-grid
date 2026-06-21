'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Package, Image, Search, BarChart3, Settings, LogOut, Sparkles } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/listings', label: 'Listings', icon: Package },
  { href: '/dashboard/image-gen', label: 'Image Gen', icon: Image },
  { href: '/dashboard/scout', label: 'Scout', icon: Search },
  { href: '/dashboard/tracking', label: 'Tracking', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="mx-auto flex h-full max-w-[1500px] items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-950">
            Seller<span className="text-emerald-600">Grid</span>
          </span>
        </Link>

        {session && (
          <div className="hidden items-center gap-1 rounded-full border border-slate-200/75 bg-slate-50/70 p-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href));
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
                    active
                      ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        {session && (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
              {(session.user as any)?.credits ?? 0} credits
            </span>
            <button
              onClick={() => signOut()}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.7} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
