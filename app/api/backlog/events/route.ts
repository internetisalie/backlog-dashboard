import { ensureInitialized, getVersion, watcherEvents } from '@/lib/backlog-watcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  ensureInitialized();

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
          // Controller might be closed
        }
      };

      // Send initial version
      const currentVersion = getVersion();
      sendEvent(JSON.stringify({ version: currentVersion }), 'connected');

      const onUpdate = (version: number) => {
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
    },
  });
}
