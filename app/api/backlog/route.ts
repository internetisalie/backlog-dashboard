import { getIndex, getBacklogConfigs } from '@/lib/backlog-watcher';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('[API] GET /api/backlog - returning cached data from file');
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('project');

    const allItems = getIndex();
    const configs = getBacklogConfigs();

    const items = projectName
      ? allItems.filter((item) => item.backlogName === projectName)
      : allItems;

    console.log(`[API] Items: ${items.length}/${allItems.length}, Configs: ${configs.length}, Project: ${projectName || 'all'}`);
    return NextResponse.json({ items, configs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
