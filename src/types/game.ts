export type Player = 'human' | 'ai';
export type Position = [number, number]; // [row, col]

export interface GameState {
  board: string[][]; // 9x9 配列
  turn: Player;
  selectedPosition: Position | null;
  gameOver: boolean;
  winner: Player | null;
}

export interface Move {
  from: Position;
  to: Position;
}
