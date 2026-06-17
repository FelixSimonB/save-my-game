import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listGameFolders } from "@/lib/drive";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "games.json");

    let localGames: any[] = [];
    try {
      const existing = await fs.readFile(filePath, "utf8");
      localGames = JSON.parse(existing);
    } catch (e) {
      localGames = [];
    }

    if (session && session.accessToken) {
      const driveGames = await listGameFolders(session.accessToken);

      // Preserve thumbs (and any other local metadata) from localGames when merging with drive results.
      const mappedDrive = (driveGames || []).map((dg: any) => {
        const match = localGames.find((lg) => lg.id === dg.id || lg.folderId === dg.folderId || lg.name === dg.name);
        return {
          id: dg.id,
          name: dg.name,
          folderId: dg.folderId,
          thumb: match?.thumb ?? dg.thumb ?? null,
          savedLocally: false,
        };
      });

      const localOnly = localGames.filter(
        (game) => !mappedDrive.some((driveGame: any) => driveGame.name === game.name || driveGame.id === game.id || driveGame.folderId === game.folderId)
      );

      const mergedGames = [...mappedDrive, ...localOnly];

      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(mergedGames, null, 2), 'utf8');

      return NextResponse.json({ ok: true, games: mergedGames });
    }

    return NextResponse.json({ ok: true, games: localGames });
  } catch (err: any) {
    console.error("/api/game/list error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
