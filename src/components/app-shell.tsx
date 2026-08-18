'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Bookmark, Compass, Home, Image as ImageIcon, MessageCircle,
  Plus, Search, Settings, UserRound, Video, Sparkles
} from 'lucide-react';
import { ReactNode } from 'react';

const nav = [
  ['/', 'Home', Home],
  ['/explore', 'Explore', Compass],
  ['/videos', 'Videos', Video],
  ['/photos', 'Photos', ImageIcon],
  ['/saved', 'Saved', Bookmark],
  ['/notifications', 'Notifications', Bell],
  ['/messages', 'Messages', MessageCircle],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:border-r lg:border-white/8 lg:px-5 lg:py-6">
        <Link href="/" className="mb-9 flex items-center gap-3 px-3 text-lg font-semibold tracking-[.22em]">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-black"><Sparkles size={17}/></span>
          LUMA
        </Link>
        <nav className="space-y-1.5">
          {nav.map(([href, label, Icon]) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${active ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/6 hover:text-white'}`}>
                <Icon size={19}/><span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <Link href="/create" className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold shadow-[0_16px_45px_rgba(155,70,255,.18)]">
          <Plus size={18}/> Create
        </Link>
        <div className="mt-auto space-y-1.5">
          <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/6 hover:text-white"><Settings size={19}/>Settings</Link>
          <Link href="/profile" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm hover:bg-white/6"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-bold text-black">CX</span><div><div className="font-medium">Creator</div><div className="text-xs text-zinc-500">@creator</div></div></Link>
        </div>
      </aside>

      <main className="min-w-0 pb-24 lg:pb-0">
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/7 bg-[#08090be6] px-4 py-3 backdrop-blur-xl md:px-7">
          <div className="lg:hidden grid h-9 w-9 place-items-center rounded-2xl bg-white text-black"><Sparkles size={17}/></div>
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={17}/>
            <input placeholder="Search people, photos, videos..." className="h-11 w-full rounded-full border border-white/8 bg-white/5 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-600 focus:border-white/18 focus:bg-white/7" />
          </div>
          <Link href="/create" className="lg:hidden grid h-10 w-10 place-items-center rounded-full bg-white text-black"><Plus size={18}/></Link>
        </div>
        {children}
      </main>

      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:border-l lg:border-white/8 lg:p-5">
        <div className="glass rounded-3xl p-4">
          <div className="mb-4 text-sm font-semibold">Suggested creators</div>
          {['Mina Park','Alex Chen','Nora Lee'].map((name, i) => (
            <div key={name} className="flex items-center gap-3 py-2.5">
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${i===0?'from-pink-400 to-orange-300':i===1?'from-cyan-300 to-violet-400':'from-emerald-300 to-blue-400'}`}/>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{name}</div><div className="text-xs text-zinc-500">Digital creator</div></div>
              <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs hover:bg-white hover:text-black">Follow</button>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-3xl border border-white/8 p-4">
          <div className="mb-3 text-sm font-semibold">Trending now</div>
          {['#cinematic','#streetphoto','#taipei','#travelvideo'].map((x, i) => <div key={x} className="flex justify-between py-2 text-sm"><span>{x}</span><span className="text-xs text-zinc-600">{(12-i*2)}k</span></div>)}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/8 bg-[#0b0c0feF] px-2 py-2 backdrop-blur-2xl lg:hidden">
        {[
          ['/', Home], ['/explore', Compass], ['/create', Plus], ['/notifications', Bell], ['/profile', UserRound]
        ].map(([href, Icon]: any) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return <Link key={href} href={href} className={`mx-auto grid h-11 w-11 place-items-center rounded-2xl ${active?'bg-white text-black':'text-zinc-500'}`}><Icon size={20}/></Link>;
        })}
      </nav>
    </div>
  );
}
