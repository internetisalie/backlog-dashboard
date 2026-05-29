import { ensureInitialized, getVersion, watcherEvents } from '@/lib/backlog-watcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  ensureInitialized();
  const id = Math.random().toString(36).substring(7);
  console.log(`[SSE][${id}] New connection`);

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string, event?: string) => {
        let msg = '';
        if (event) msg += `event: ${event}\n`;
        msg += `data: ${data}\n\n`;
        try {
          controller.enqueue(new TextEncoder().encode(msg));
        } catch (e) {}
      };

      // Initial state
      send(JSON.stringify({ version: getVersion() }), 'connected');

      const onUpdate = (version: number) => {
        console.log(`[SSE][${id}] Sending update: ${version}`);
        send(JSON.stringify({ version }), 'update');
      };

      watcherEvents.on('update', onUpdate);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch (e) {}
      }, 15000);

      const cleanup = () => {
        console.log(`[SSE][${id}] Cleanup`);
        watcherEvents.off('update', onUpdate);
        clearInterval(heartbeat);
      };

      request.signal.addEventListener('abort', cleanup);
      (this as any)._cleanup = cleanup;
    },
    cancel() {
      if ((this as any)._cleanup) (this as any)._cleanup();
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
