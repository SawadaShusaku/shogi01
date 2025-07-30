import { GameEngine } from './gameEngine';

export type AILevel = 'beginner' | 'intermediate' | 'advanced';

export class AIEngine {
  private gameEngine: GameEngine;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  // レベルに応じてAIの手を取得
  async getBestMove(level: AILevel = 'beginner'): Promise<any | null> {
    const allMoves = this.gameEngine.getAllLegalMoves();
    
    if (allMoves.length === 0) {
      return null;
    }

    switch (level) {
      case 'beginner':
        return this.getBeginnerMove(allMoves);
      case 'intermediate':
        return this.getIntermediateMove(allMoves);
      case 'advanced':
        return this.getAdvancedMove(allMoves);
      default:
        return this.getBeginnerMove(allMoves);
    }
  }

  // 初心者レベル: ランダムに指す（ただし、駒を取れる手があれば優先）
  private getBeginnerMove(moves: any[]): any {
    // 駒を取る手があるかチェック
    const captureMoves = moves.filter(move => move.capture);
    
    if (captureMoves.length > 0 && Math.random() < 0.7) {
      // 70%の確率で駒取りの手を選ぶ
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    
    // ランダムな手を選ぶ
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // 中級者レベル: より戦略的な思考（シンプルな評価）
  private getIntermediateMove(moves: any[]): any {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      let score = 0;
      
      // 駒取りにボーナス
      if (move.capture) {
        score += this.getPieceValue(move.capture.kind) * 10;
      }
      
      // 成りにボーナス
      if (move.promote) {
        score += 50;
      }
      
      // 中央に近いほど高評価
      const centerDistance = Math.abs(move.to.x - 5) + Math.abs(move.to.y - 5);
      score += (10 - centerDistance) * 2;
      
      // ランダム要素を追加（同じ評価値の手があっても選択にばらつきを持たせる）
      score += Math.random() * 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // 上級者レベル: より高度な評価（将来的にはMinimax等を実装）
  private getAdvancedMove(moves: any[]): any {
    // 現在は中級者と同じロジック（将来的にはより高度なアルゴリズムを実装）
    return this.getIntermediateMove(moves);
  }

  // 駒の価値を取得（一般的な将棋の駒価値）
  private getPieceValue(pieceKind: string): number {
    const values: { [key: string]: number } = {
      'FU': 1,   // 歩
      'KY': 3,   // 香
      'KE': 4,   // 桂
      'GI': 5,   // 銀
      'KI': 6,   // 金
      'KA': 8,   // 角
      'HI': 10,  // 飛
      'OU': 1000, // 王
      'TO': 6,   // と
      'NY': 6,   // 成香
      'NK': 6,   // 成桂
      'NG': 6,   // 成銀
      'UM': 12,  // 馬
      'RY': 15   // 龍
    };
    
    return values[pieceKind] || 1;
  }
}