import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, id, folderId, thumb } = body;
    if (!thumb) {
      return NextResponse.json({ error: 'Missing thumb' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'games.json');

    let games: any[] = [];
    try {
      const existing = await fs.readFile(filePath, 'utf8');
      games = JSON.parse(existing);
    } catch (e) {
      games = [];
    }

    const idx = games.findIndex((g) => (id && g.id === id) || (folderId && g.folderId === folderId) || (name && g.name === name));
    if (idx === -1) {
      // if not found, append
      const newGame: any = { id: id || folderId || `local-${Date.now()}`, name: name || 'Unknown', folderId: folderId || id || null, thumb };
      games.push(newGame);
    } else {
      games[idx].thumb = thumb;
    }

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(games, null, 2), 'utf8');

    return NextResponse.json({ ok: true, games });
  } catch (err: any) {
    console.error('/api/game/update-thumb error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
