'use client';

import {
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  UploadCloud,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  abortMultipart,
  completeMultipart,
  initMultipart,
  multipartStatus,
  presignMultipartPart,
  publishPost,
  requestDirectUpload,
} from '@/lib/uploads/client';
import type { MultipartPart, UploadedMediaInput } from '@/lib/uploads/types';

const DIRECT_THRESHOLD = 100 * 1024 * 1024;
const MAX_FILES = 20;

type UploadStatus = 'queued' | 'uploading' | 'paused' | 'uploaded' | 'failed';

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  message?: string;
  key?: string;
};

type MultipartRuntime = {
  key: string;
  uploadId: string;
  partSize: number;
};

class PausedError extends Error {}

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function xhrPut(
  url: string,
  body: Blob,
  options: {
    contentType?: string;
    onProgress: (loaded: number) => void;
    register: (xhr: XMLHttpRequest | null) => void;
    isPaused: () => boolean;
  },
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    options.register(xhr);
    xhr.open('PUT', url);
    if (options.contentType) xhr.setRequestHeader('Content-Type', options.contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress(event.loaded);
    };
    xhr.onload = () => {
      options.register(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader('ETag'));
      } else {
        reject(new Error(`R2 upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      options.register(null);
      reject(new Error('Network error while uploading to R2'));
    };
    xhr.onabort = () => {
      options.register(null);
      reject(options.isPaused() ? new PausedError('Upload paused') : new Error('Upload aborted'));
    };
    xhr.send(body);
  });
}

async function retry<T>(fn: () => Promise<T>, isPaused: () => boolean, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (isPaused()) throw new PausedError('Upload paused');
    try {
      return await fn();
    } catch (error) {
      if (error instanceof PausedError) throw error;
      lastError = error;
      if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 700 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Upload failed');
}

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'>('PUBLIC');
  const [publishing, setPublishing] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const pausedRef = useRef(new Set<string>());
  const xhrRef = useRef(new Map<string, XMLHttpRequest>());
  const multipartRef = useRef(new Map<string, MultipartRuntime>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const busy = items.some((item) => item.status === 'uploading') || publishing;

  function patch(id: string, value: Partial<UploadItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...value } : item));
  }

  function addFiles(files: File[]) {
    setGlobalError(null);
    setPublishedPostId(null);
    const mediaFiles = files.filter((file) => /^(image|video)\//.test(file.type));
    setItems((current) => {
      const remaining = Math.max(0, MAX_FILES - current.length);
      return [
        ...current,
        ...mediaFiles.slice(0, remaining).map((file) => ({
          id: crypto.randomUUID(),
          file,
          status: 'queued' as const,
          progress: 0,
        })),
      ];
    });
  }

  async function uploadDirect(item: UploadItem): Promise<UploadedMediaInput> {
    const isPaused = () => pausedRef.current.has(item.id);
    const signed = await requestDirectUpload(item.file);
    patch(item.id, { key: signed.key });

    await retry(() => xhrPut(signed.uploadUrl, item.file, {
      contentType: item.file.type,
      isPaused,
      register: (xhr) => {
        if (xhr) xhrRef.current.set(item.id, xhr);
        else xhrRef.current.delete(item.id);
      },
      onProgress: (loaded) => patch(item.id, {
        progress: Math.min(99, Math.round((loaded / item.file.size) * 100)),
      }),
    }), isPaused);

    return {
      key: signed.key,
      originalName: item.file.name,
      mimeType: item.file.type,
      size: item.file.size,
      type: item.file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    };
  }

  async function uploadMultipart(item: UploadItem): Promise<UploadedMediaInput> {
    const isPaused = () => pausedRef.current.has(item.id);
    let runtime = multipartRef.current.get(item.id);
    if (!runtime) {
      const started = await initMultipart(item.file);
      runtime = { key: started.key, uploadId: started.uploadId, partSize: started.partSize };
      multipartRef.current.set(item.id, runtime);
      patch(item.id, { key: runtime.key });
    }

    const status = await multipartStatus({ key: runtime.key, uploadId: runtime.uploadId });
    const completed = new Map<number, string>(status.parts.map((part) => [part.partNumber, part.etag]));
    const totalParts = Math.ceil(item.file.size / runtime.partSize);

    const bytesForPart = (partNumber: number) => {
      const start = (partNumber - 1) * runtime!.partSize;
      return Math.min(runtime!.partSize, item.file.size - start);
    };
    const completedBytes = () => [...completed.keys()].reduce((sum, partNumber) => sum + bytesForPart(partNumber), 0);

    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (completed.has(partNumber)) continue;
      if (isPaused()) throw new PausedError('Upload paused');

      const start = (partNumber - 1) * runtime.partSize;
      const end = Math.min(start + runtime.partSize, item.file.size);
      const blob = item.file.slice(start, end);
      const { uploadUrl } = await presignMultipartPart({
        key: runtime.key,
        uploadId: runtime.uploadId,
        partNumber,
      });

      const etag = await retry(() => xhrPut(uploadUrl, blob, {
        isPaused,
        register: (xhr) => {
          if (xhr) xhrRef.current.set(item.id, xhr);
          else xhrRef.current.delete(item.id);
        },
        onProgress: (loaded) => {
          const uploaded = completedBytes() + loaded;
          patch(item.id, { progress: Math.min(99, Math.round((uploaded / item.file.size) * 100)) });
        },
      }), isPaused);

      if (!etag) {
        throw new Error('R2 did not expose ETag. Add ETag to your bucket CORS ExposeHeaders.');
      }
      completed.set(partNumber, etag);
      patch(item.id, { progress: Math.min(99, Math.round((completedBytes() / item.file.size) * 100)) });
    }

    const parts: MultipartPart[] = [...completed.entries()].map(([partNumber, etag]) => ({ partNumber, etag }));
    await completeMultipart({ key: runtime.key, uploadId: runtime.uploadId, parts });
    multipartRef.current.delete(item.id);

    return {
      key: runtime.key,
      originalName: item.file.name,
      mimeType: item.file.type,
      size: item.file.size,
      type: item.file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    };
  }

  async function startUpload(id: string): Promise<UploadedMediaInput> {
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item) throw new Error('Upload item not found');
    if (item.status === 'uploaded' && item.key) {
      return {
        key: item.key,
        originalName: item.file.name,
        mimeType: item.file.type,
        size: item.file.size,
        type: item.file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      };
    }

    pausedRef.current.delete(id);
    patch(id, { status: 'uploading', message: undefined });
    try {
      const result = item.file.size > DIRECT_THRESHOLD
        ? await uploadMultipart(item)
        : await uploadDirect(item);
      patch(id, { status: 'uploaded', progress: 100, key: result.key, message: undefined });
      return result;
    } catch (error) {
      if (error instanceof PausedError) {
        patch(id, { status: 'paused', message: 'Paused — resume when ready.' });
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Upload failed';
      patch(id, { status: 'failed', message });
      throw error;
    }
  }

  function pause(id: string) {
    pausedRef.current.add(id);
    xhrRef.current.get(id)?.abort();
    patch(id, { status: 'paused', message: 'Paused — resume when ready.' });
  }

  async function cancelAndRemove(id: string) {
    pausedRef.current.add(id);
    xhrRef.current.get(id)?.abort();
    const runtime = multipartRef.current.get(id);
    if (runtime) {
      await abortMultipart({ key: runtime.key, uploadId: runtime.uploadId }).catch(() => undefined);
      multipartRef.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handlePublish() {
    if (!items.length || publishing) return;
    setPublishing(true);
    setGlobalError(null);
    setPublishedPostId(null);
    try {
      const uploaded: UploadedMediaInput[] = [];
      for (const item of itemsRef.current) {
        uploaded.push(await startUpload(item.id));
      }
      const result = await publishPost({ caption, visibility, media: uploaded });
      setPublishedPostId(result.postId);
    } catch (error) {
      if (!(error instanceof PausedError)) {
        setGlobalError(error instanceof Error ? error.message : 'Could not publish post');
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <section
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className="group grid min-h-[470px] cursor-pointer place-items-center rounded-[32px] border border-dashed border-white/14 bg-gradient-to-b from-white/[.055] to-white/[.025] p-8 text-center transition hover:border-white/25 hover:bg-white/[.06]"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(event) => addFiles(Array.from(event.target.files || []))}
        />
        <div>
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-white text-black shadow-2xl">
            <UploadCloud size={30} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Drop photos & videos here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Files under 100 MiB upload directly. Large videos switch to resumable 10 MiB multipart chunks automatically.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-2.5 text-sm">Choose files</div>
          <div className="mt-3 text-xs text-zinc-600">Up to {MAX_FILES} files per post</div>
        </div>
      </section>

      <section className="glass rounded-[32px] p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">Create post</div>
          <div className="text-xs text-zinc-600">{items.length} files · {mb(totalSize)}</div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Write a caption..."
            className="min-h-28 w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 p-4 text-sm">
            <div className="mb-1 text-xs uppercase tracking-wider text-zinc-600">Upload mode</div>
            <div>Direct + resumable multipart</div>
          </div>
          <label className="rounded-2xl border border-white/8 p-4 text-sm">
            <div className="mb-1 text-xs uppercase tracking-wider text-zinc-600">Privacy</div>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as typeof visibility)}
              className="w-full bg-transparent outline-none"
            >
              <option className="bg-zinc-950" value="PUBLIC">Public</option>
              <option className="bg-zinc-950" value="FOLLOWERS">Followers</option>
              <option className="bg-zinc-950" value="PRIVATE">Private</option>
            </select>
          </label>
        </div>

        <div className="mt-4 max-h-[380px] overflow-y-auto rounded-2xl border border-white/8 p-3">
          <div className="mb-3 px-1 text-xs uppercase tracking-wider text-zinc-600">Selected</div>
          {items.length === 0 ? (
            <div className="px-1 py-3 text-sm text-zinc-600">Your uploads will appear here.</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div className="rounded-xl bg-white/5 p-3" key={item.id}>
                  <div className="flex items-center gap-3 text-sm">
                    {item.file.type.startsWith('video/') ? <Video size={18} /> : <ImagePlus size={18} />}
                    <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                    <span className="text-xs text-zinc-600">{mb(item.file.size)}</span>
                    {item.status === 'uploading' && <LoaderCircle className="animate-spin" size={17} />}
                    {item.status === 'uploaded' && <CheckCircle2 size={17} />}
                    {item.status === 'failed' && <XCircle size={17} />}
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full bg-white transition-[width]" style={{ width: `${item.progress}%` }} />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-xs text-zinc-600">
                      {item.message || (item.status === 'uploaded' ? 'Uploaded to R2' : `${item.progress}%`)}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.status === 'uploading' && (
                        <button onClick={() => pause(item.id)} className="rounded-lg p-1.5 hover:bg-white/8" title="Pause">
                          <Pause size={15} />
                        </button>
                      )}
                      {item.status === 'paused' && (
                        <button onClick={() => void startUpload(item.id).catch(() => undefined)} className="rounded-lg p-1.5 hover:bg-white/8" title="Resume">
                          <Play size={15} />
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <button onClick={() => void startUpload(item.id).catch(() => undefined)} className="rounded-lg p-1.5 hover:bg-white/8" title="Retry">
                          <RotateCcw size={15} />
                        </button>
                      )}
                      {!busy && item.status !== 'uploaded' && (
                        <button onClick={() => void cancelAndRemove(item.id)} className="rounded-lg p-1.5 hover:bg-white/8" title="Remove">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {globalError && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">{globalError}</div>}
        {publishedPostId && (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-100">
            Published successfully. Post ID: <span className="font-mono text-xs">{publishedPostId}</span>
          </div>
        )}

        <button
          onClick={() => void handlePublish()}
          className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!items.length || publishing || items.some((item) => item.status === 'paused')}
        >
          {publishing ? 'Uploading & publishing…' : 'Publish'}
        </button>
      </section>
    </div>
  );
}
