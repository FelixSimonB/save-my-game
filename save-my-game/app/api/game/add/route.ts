import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGameFolder } from "@/lib/drive";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("/api/game/add session:", session);

    const body = await req.json();
    const gameName = String(body.gameName || "").trim();
    const thumb = body.thumb ? String(body.thumb) : undefined;

    if (!gameName) {
      return NextResponse.json({ error: "Missing gameName" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, "games.json");

    let games: any[] = [];
    try {
      const existing = await fs.readFile(filePath, "utf8");
      games = JSON.parse(existing);
    } catch (e) {
      games = [];
    }

    let folderId: string | null = null;
    let savedLocally = false;

    if (session && session.accessToken) {
      folderId = await createGameFolder(session.accessToken, gameName);
    } else {
      savedLocally = true;
      folderId = `local-${Date.now()}`;
    }

    const newGame: any = {
      id: folderId,
      name: gameName,
      folderId: session?.accessToken ? folderId : null,
      savedLocally,
    };

    if (thumb) {
      newGame.thumb = thumb;
    }

    const duplicate = games.some((game) => game.id === newGame.id || game.name === newGame.name);
    if (!duplicate) {
      games.push(newGame);
      await fs.writeFile(filePath, JSON.stringify(games, null, 2), "utf8");
    }

    return NextResponse.json({ ok: true, folderId, savedLocally });
  } catch (err: any) {
    console.error("/api/game/add error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) || "Internal Server Error" },
      { status: 500 }
    );
  }
}