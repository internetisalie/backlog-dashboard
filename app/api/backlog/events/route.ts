import { ensureInitialized, getVersion, watcherEvents } from '@/lib/backlog-watcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  ensureInitialized();
  console.log('[SSE] New connection request');

  const stream = new ReadableStream({
    _cleanup: null as any,
    start(controller: ReadableStreamDefaultController) {
      const sendEvent = (data: string, event?: string, id?: string) => {
        let msg = '';
        if (id) msg += `id: ${id}\n`;
        if (event) msg += `event: ${event}\n`;
        msg += `data: ${data}\n\n`;
        try {
          controller.enqueue(new TextEncoder().encode(msg));
        } catch (e) {
          console.error('[SSE] Enqueue error:', e);
        }
      };

      // Send initial version
      const currentVersion = getVersion();
      console.log(`[SSE] Sending initial version: ${currentVersion}`);
      sendEvent(JSON.stringify({ version: currentVersion }), 'connected');

      const onUpdate = (version: number) => {
        console.log(`[SSE] Sending update event: ${version}`);
        sendEvent(JSON.stringify({ version }), 'update');
      };

      watcherEvents.on('update', onUpdate);

      // Keep-alive heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        sendEvent(': heartbeat', 'ping');
      }, 30000);

      const cleanup = () => {
        console.log('[SSE] Cleaning up connection');
        watcherEvents.off('update', onUpdate);
        clearInterval(heartbeat);
      };

      request.signal.addEventListener('abort', cleanup);
      
      this._cleanup = cleanup;
    },
    cancel() {
      if (this._cleanup) {
        this._cleanup();
      }
    }
  } as any);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx/proxies
    },
  });
}
