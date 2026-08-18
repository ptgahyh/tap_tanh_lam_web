import { MediaCard } from '@/components/media-card';import { posts } from '@/lib/mock-data';
export default function Videos(){return <div className="mx-auto max-w-2xl px-4 py-7"><h1 className="mb-6 text-4xl font-semibold">Videos</h1><div className="space-y-7">{posts.filter(p=>p.type==='video').map(p=><MediaCard key={p.id} post={p}/>)}</div></div>}
