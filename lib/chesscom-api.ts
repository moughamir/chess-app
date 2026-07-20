export interface Archive {
  url: string;
  year: number;
  month: number;
}

export interface ChessComGame {
  pgn: string;
  opponent: string;
  result: string;
  date: string;
  timeControl: string;
}

const BASE = "https://api.chess.com/pub";

export async function fetchArchives(username: string): Promise<{ archives: Archive[]; error?: string }> {
  try {
    const res = await fetch(`${BASE}/player/${encodeURIComponent(username)}/games/archives`);
    if (res.status === 404) {
      return { archives: [], error: "Player not found" };
    }
    if (!res.ok) {
      return { archives: [], error: "Could not connect to Chess.com" };
    }
    const data = await res.json();
    const archives: Archive[] = (data.archives || []).reverse().map((url: string) => {
      const match = url.match(/\/(\d{4})\/(\d{2})$/);
      return {
        url,
        year: match ? parseInt(match[1]) : 0,
        month: match ? parseInt(match[2]) : 0,
      };
    });
    return { archives };
  } catch {
    return { archives: [], error: "Could not connect to Chess.com" };
  }
}

export async function fetchGames(archiveUrl: string): Promise<{ games: ChessComGame[]; error?: string }> {
  try {
    const res = await fetch(archiveUrl);
    if (!res.ok) {
      return { games: [], error: "Could not load games" };
    }
    const data = await res.json();
    const player = extractUsername(archiveUrl);
    const games: ChessComGame[] = (data.games || []).map((g: any) => {
      const headers = parseHeaders(g.pgn);
      const opponent = headers["White"] === player
        ? headers["Black"] || "Unknown"
        : headers["White"] || "Unknown";
      return {
        pgn: g.pgn || "",
        opponent,
        result: headers["Result"] || "*",
        date: headers["Date"] || "Unknown",
        timeControl: headers["TimeControl"] || "Unknown",
      };
    });
    return { games };
  } catch {
    return { games: [], error: "Could not load games" };
  }
}

function parseHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = regex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

function extractUsername(archiveUrl: string): string {
  const match = archiveUrl.match(/\/player\/([^/]+)\//);
  return match ? match[1] : "";
}
