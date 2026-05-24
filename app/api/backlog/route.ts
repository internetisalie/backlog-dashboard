import { getIndex, refreshIndex, getBacklogConfigs } from '@/lib/backlog-watcher';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[API] GET /api/backlog - returning cached data from file');
    const items = getIndex();
    const configs = getBacklogConfigs();
    console.log(`[API] Items: ${items.length}, Configs: ${configs.length}`);
    return NextResponse.json({ items, configs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('[API] POST /api/backlog - forcing refresh');
    const items = refreshIndex();
    const configs = getBacklogConfigs();
    console.log(`[API] Items: ${items.length}, Configs: ${configs.length}`);
    return NextResponse.json({ items, configs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
