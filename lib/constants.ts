export const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

export const CENTER_SQUARES = [
  [3, 3], [3, 4], [4, 3], [4, 4]
];

const PIECE_INDEX: Record<string, number> = {
  p: 0, n: 1, b: 2, r: 3, q: 4, k: 5
};

export function initZobristKeys(): bigint[][][] {
  const keys: bigint[][][] = [];
  for (let color = 0; color < 2; color++) {
    keys[color] = [];
    for (let piece = 0; piece < 6; piece++) {
      keys[color][piece] = [];
      for (let sq = 0; sq < 64; sq++) {
        const lo = Math.floor(Math.random() * 2147483647);
        const hi = Math.floor(Math.random() * 2147483647);
        keys[color][piece][sq] = BigInt.asUintN(64,
          BigInt(lo) | (BigInt(hi) << BigInt(32))
        );
      }
    }
  }
  return keys;
}

export const ZOBRIST_KEYS = initZobristKeys();
