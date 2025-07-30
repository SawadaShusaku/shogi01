import { Shogi } from 'shogi.js';
import type { Player } from '../types/game';

export class GameEngine {
  private shogi: Shogi;

  constructor() {
    this.shogi = new Shogi();
  }

  // 盤面を2次元配列で取得（UI用の座標系に変換）
  getBoard(): string[][] {
    const board: string[][] = [];
    // UI座標: board[row][col] where row=0-8, col=0-8
    // shogi.js座標: x=1-9 (筋), y=1-9 (段)
    // 変換: UI(row,col) -> shogi.js(9-col, row+1)
    for (let row = 0; row < 9; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < 9; col++) {
        const shogiX = 9 - col;  // 筋：右から左へ
        const shogiY = row + 1;  // 段：上から下へ
        const piece = this.shogi.get(shogiX, shogiY);
        const pieceStr = piece ? piece.toCSAString() : '';
        rowData.push(pieceStr);
      }
      board.push(rowData);
    }
    // console.log('Generated board (first few pieces):', board[0], board[6]);
    return board;
  }

  // 現在の手番を取得（0=先手/人間, 1=後手/AI）
  getTurn(): Player {
    return this.shogi.turn === 0 ? 'human' : 'ai';
  }

  // 指定した位置の駒の手番を取得（0=先手, 1=後手）
  getPieceTurn(x: number, y: number): number | null {
    const piece = this.shogi.get(x, y);
    if (!piece) return null;
    // CSA形式: '-'で始まる=後手, '+'で始まる=先手
    const csaString = piece.toCSAString();
    // console.log(`getPieceTurn(${x}, ${y}): piece="${csaString}"`);
    return csaString.startsWith('-') ? 1 : 0;
  }

  // 指定した位置から移動可能なすべての指し手を取得
  getLegalMoves(from: { x: number; y: number }): any[] {
    return this.shogi.getMovesFrom(from.x, from.y);
  }

  // 現在の手番の全ての合法手を取得
  getAllLegalMoves(): any[] {
    const moves: any[] = [];
    for (let y = 1; y <= 9; y++) {
      for (let x = 1; x <= 9; x++) {
        const piece = this.shogi.get(x, y);
        if (piece) {
          const csaString = piece.toCSAString();
          const pieceColor = csaString.startsWith('-') ? 1 : 0;
          if (pieceColor === this.shogi.turn) {
            const movesFromPosition = this.shogi.getMovesFrom(x, y);
            moves.push(...movesFromPosition);
          }
        }
      }
    }
    return moves;
  }

  // 指し手を実行
  makeMove(from: { x: number; y: number }, to: { x: number; y: number }, promote?: boolean): boolean {
    try {
      this.shogi.move(from.x, from.y, to.x, to.y, promote);
      return true;
    } catch (e) {
      console.error('Move failed:', e);
      return false;
    }
  }

  // 指し手を実行（Move形式）
  makeMoveFromMove(move: any): boolean {
    try {
      if (!move.from || !move.to) return false;
      this.shogi.move(move.from.x, move.from.y, move.to.x, move.to.y, move.promote);
      return true;
    } catch (e) {
      console.error('Move failed:', e);
      return false;
    }
  }

  // 王が盤上にいるかチェック
  private hasKing(turn: number): boolean {
    for (let y = 1; y <= 9; y++) {
      for (let x = 1; x <= 9; x++) {
        const piece = this.shogi.get(x, y);
        if (piece) {
          const csaString = piece.toCSAString();
          const pieceType = csaString.substring(1);
          const pieceTurn = csaString.startsWith('-') ? 1 : 0;
          
          if (pieceType === 'OU' && pieceTurn === turn) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // ゲーム終了を判定
  isGameOver(): boolean {
    // 1. 王が取られたかチェック（即座に終了）
    if (!this.hasKing(0) || !this.hasKing(1)) {
      console.log('王が取られました');
      return true;
    }
    
    // 2. 合法手がないかどうかで判定（詰み状態）
    const legalMoves = this.getAllLegalMoves();
    console.log(`合法手数: ${legalMoves.length}`);
    return legalMoves.length === 0;
  }

  // 勝者を取得
  getWinner(): Player | null {
    if (!this.isGameOver()) return null;
    
    // 王が取られた場合の勝者判定
    if (!this.hasKing(0)) {
      console.log('先手の王が取られました - AIの勝ち');
      return 'ai';
    }
    if (!this.hasKing(1)) {
      console.log('後手の王が取られました - Humanの勝ち');
      return 'human';
    }
    
    // 詰みの場合：現在の手番が詰まされているので、相手の勝ち
    return this.shogi.turn === 0 ? 'ai' : 'human';
  }

  // 王手かどうかを判定
  isInCheck(): boolean {
    // 簡易実装：合法手の存在で判定
    return this.getAllLegalMoves().length > 0;
  }

  // ランダムな合法手を取得（AI用）
  getRandomLegalMove(): any | null {
    const moves = this.getAllLegalMoves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  // ゲームを初期化
  reset(): void {
    this.shogi = new Shogi();
  }

  // 持ち駒を取得
  getHandPieces(player: Player): any[] {
    const turn = player === 'human' ? 0 : 1;
    return this.shogi.hands[turn] || [];
  }

  // 持ち駒を盤面に打つ
  dropPiece(x: number, y: number, pieceKind: string): boolean {
    try {
      this.shogi.drop(x, y, pieceKind as any);
      return true;
    } catch (e) {
      console.error('Drop failed:', e);
      return false;
    }
  }

  // 指定位置に持ち駒を打てるかチェック
  canDropPiece(x: number, y: number, _pieceKind: string): boolean {
    try {
      // 簡易実装: 空いているマスかチェック
      return this.shogi.get(x, y) === null;
    } catch (e) {
      return false;
    }
  }

  // デバッグ用: 盤面の状態を表示
  debugBoard(): void {
    console.log('Current turn:', this.shogi.turn === 0 ? 'Sente (Human)' : 'Gote (AI)');
    console.log('Is in check:', this.isInCheck());
    console.log('Is game over:', this.isGameOver());
    console.log('Legal moves count:', this.getAllLegalMoves().length);
    console.log('Human hand pieces:', this.getHandPieces('human'));
    console.log('AI hand pieces:', this.getHandPieces('ai'));
  }
}
