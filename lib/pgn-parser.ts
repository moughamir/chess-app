export interface ParsedGame {
  headers: Record<string, string>;
  moves: string[];
  fen: string;
  moveCount: number;
}

export function parsePGN(pgn: string): { games: ParsedGame[]; error?: string } {
  if (!pgn || !pgn.trim()) {
    return { games: [], error: "PGN is empty" };
  }

  const Chess = (window as any).Chess;
  if (!Chess) {
    return { games: [], error: "Chess library not loaded" };
  }

  const games: ParsedGame[] = [];
  const chunks = pgn.split(/\n\n\n+/).filter(c => c.trim());

  for (const chunk of chunks) {
    const chess = new Chess();
    if (chess.load_pgn(chunk.trim())) {
      const headers = chess.header();
      const moves = chess.history();
      const fen = chess.fen();
      games.push({
        headers,
        moves,
        fen,
        moveCount: moves.length,
      });
    }
  }

  if (games.length === 0) {
    return { games: [], error: "Could not parse PGN" };
  }

  return { games };
}

export function getGamePreview(game: ParsedGame): string {
  const white = game.headers["White"] || "Unknown";
  const black = game.headers["Black"] || "Unknown";
  const result = game.headers["Result"] || "*";
  return `${white} vs ${black} — ${game.moveCount} moves — ${result}`;
}
