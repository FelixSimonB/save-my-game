export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  const res = await fetch(
    `https://www.cheapshark.com/api/1.0/games?title=${query}`
  );

  const data = await res.json();

  return Response.json(
    data.map((game: any) => ({
      gameID: game.gameID,  
      external: game.external,
      thumb: game.thumb,
    }))
  );
}