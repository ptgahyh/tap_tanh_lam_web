'use client';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Play, Send } from 'lucide-react';
import { useState } from 'react';

export function MediaCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="media-hover overflow-hidden rounded-[28px] border border-white/8 bg-[#0f1014]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 via-pink-400 to-orange-300" />
        <div className="min-w-0 flex-1"><div className="text-sm font-medium">{post.user}</div><div className="text-xs text-zinc-500">{post.handle}</div></div>
        <button className="text-zinc-500 hover:text-white"><MoreHorizontal size={20}/></button>
      </div>
      <div className={`group relative overflow-hidden bg-zinc-900 ${post.aspect}`}>
        <img src={post.src} alt={post.caption} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
        {post.type === 'video' && <div className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-black/25 backdrop-blur-xl"><Play className="ml-1 fill-white" size={24}/></span></div>}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent"/>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-center gap-1">
          <button onClick={()=>setLiked(!liked)} className={`grid h-10 w-10 place-items-center rounded-full hover:bg-white/7 ${liked?'text-pink-400':'text-zinc-200'}`}><Heart size={20} className={liked?'fill-current':''}/></button>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/7"><MessageCircle size={20}/></button>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/7"><Send size={19}/></button>
          <button className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-white/7"><Bookmark size={20}/></button>
        </div>
        <div className="mt-1 text-sm font-semibold">{post.likes} likes</div>
        <p className="mt-2 text-sm leading-6 text-zinc-300"><span className="mr-2 font-semibold text-white">{post.handle}</span>{post.caption}</p>
        <button className="mt-2 text-xs text-zinc-600">View all {post.comments} comments</button>
      </div>
    </article>
  );
}
