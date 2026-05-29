import { ensureInitialized, getVersion, watcherEvents } from '@/lib/backlog-watcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  ensureInitialized();
  const id = Math.random().toString(36).substring(7);
  console.log(`[SSE][${id}] New connection request`);

  let cleanupFn: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      const sendEvent = (data: string, event?: string) => {
        let msg = '';
        if (event) msg += `event: ${event}\n`;
        msg += `data: ${data}\n\n`;
        try {
          controller.enqueue(new TextEncoder().encode(msg));
        } catch (e) {
          // Stream might be closed
        }
      };

      // Preamble & initial ping
      controller.enqueue(new TextEncoder().encode(': ' + ' '.repeat(2048) + '\n\n'));
      sendEvent(': initial ping', 'ping');

      const onUpdate = (version: number) => {
        console.log(`[SSE][${id}] Sending update event: ${version}`);
        sendEvent(JSON.stringify({ version }), 'update');
      };

      console.log(`[SSE][${id}] Subscribing to watcherEvents`);
      watcherEvents.on('update', onUpdate);

      const heartbeat = setInterval(() => {
        sendEvent(': heartbeat', 'ping');
      }, 15000);

      cleanupFn = () => {
        console.log(`[SSE][${id}] Cleaning up connection`);
        watcherEvents.off('update', onUpdate);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (e) {}
      };

      request.signal.addEventListener('abort', () => {
        console.log(`[SSE][${id}] Request aborted`);
        if (cleanupFn) cleanupFn();
      });
    },
    cancel() {
      console.log(`[SSE][${id}] Stream cancelled`);
      if (cleanupFn) cleanupFn();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
