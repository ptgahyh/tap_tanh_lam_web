import { MediaCard } from '@/components/media-card';
import { posts } from '@/lib/mock-data';

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-7 flex items-end justify-between">
        <div><div className="text-xs uppercase tracking-[.32em] text-zinc-600">Your visual world</div><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Made to be seen.</h1></div>
        <div className="hidden rounded-full border border-white/8 p-1 text-xs sm:flex"><button className="rounded-full bg-white px-4 py-2 text-black">For you</button><button className="px-4 py-2 text-zinc-500">Following</button></div>
      </div>
      <div className="space-y-7">{posts.slice(0,4).map(p => <MediaCard key={p.id} post={p}/>)}</div>
    </div>
  );
}
