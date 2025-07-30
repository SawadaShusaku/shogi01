import { useState } from 'react';
import { GameEngine } from '../services/gameEngine';

export type AILevel = 'beginner' | 'intermediate' | 'advanced';

export const useAI = (gameEngine: GameEngine) => {
  const [aiLevel, setAILevel] = useState<AILevel>('beginner');
  const [isThinking, setIsThinking] = useState(false);

  const getAIMove = async (): Promise<any | null> => {
    setIsThinking(true);
    
    try {
      // AIの思考時間をシミュレート
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      
      // レベルに応じた AI ロジック
      const move = getBestMoveForLevel(gameEngine, aiLevel);
      return move;
    } catch (error) {
      console.error('AI move failed:', error);
      return gameEngine.getRandomLegalMove(); // フォールバック
    } finally {
      setIsThinking(false);
    }
  };

  return {
    aiLevel,
    setAILevel,
    isThinking,
    getAIMove
  };
};

// 駒の価値テーブル
const PIECE_VALUES: { [key: string]: number } = {
  'FU': 100,   // 歩
  'KY': 350,   // 香
  'KE': 400,   // 桂
  'GI': 500,   // 銀
  'KI': 600,   // 金
  'KA': 900,   // 角
  'HI': 1000,  // 飛
  'OU': 10000, // 王
  // 成駒
  'TO': 600,   // と金
  'NY': 600,   // 成香
  'NK': 600,   // 成桂
  'NG': 600,   // 成銀
  'UM': 1300,  // 馬
  'RY': 1400   // 龍
};

// 盤面評価関数
function evaluatePosition(gameEngine: GameEngine): number {
  const board = gameEngine.getBoard();
  let score = 0;
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece) {
        const pieceType = piece.substring(1);
        const pieceValue = PIECE_VALUES[pieceType] || 0;
        
        // 先手（人間）の駒は負の値、後手（AI）の駒は正の値
        if (piece.startsWith('+')) {
          score -= pieceValue;
        } else if (piece.startsWith('-')) {
          score += pieceValue;
        }
      }
    }
  }
  
  // 持ち駒も評価に加える
  const humanHand = gameEngine.getHandPieces('human');
  const aiHand = gameEngine.getHandPieces('ai');
  
  humanHand.forEach(piece => {
    score -= (PIECE_VALUES[piece.kind] || 0) * 0.8; // 持ち駒は少し価値を下げる
  });
  
  aiHand.forEach(piece => {
    score += (PIECE_VALUES[piece.kind] || 0) * 0.8;
  });
  
  return score;
}

// 王の位置を見つける
function findKingPosition(gameEngine: GameEngine, player: 'human' | 'ai'): { x: number, y: number } | null {
  const board = gameEngine.getBoard();
  const targetPrefix = player === 'human' ? '+' : '-';
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.startsWith(targetPrefix) && piece.substring(1) === 'OU') {
        // UI座標をshogi.js座標に変換
        return { x: 9 - col, y: row + 1 };
      }
    }
  }
  return null;
}

// 位置価値テーブル（駒種別）
function getPositionValue(x: number, y: number, pieceType: string): number {
  // 中央重視の基本価値
  const centerX = 5, centerY = 5;
  const distanceFromCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
  let baseValue = Math.max(0, 40 - distanceFromCenter * 5);
  
  // 駒種別の位置価値
  switch (pieceType) {
    case 'FU': // 歩
      // 歩は前進するほど価値が高い
      return baseValue + (9 - y) * 15;
    case 'KY': // 香
      // 香は縦のラインで価値が高い
      return baseValue + (x === 1 || x === 9 ? 30 : 0);
    case 'KE': // 桂
      // 桂は中央付近で価値が高い
      return baseValue + (Math.abs(x - 5) <= 2 ? 25 : 0);
    case 'GI': // 銀
      // 銀は前方で価値が高い
      return baseValue + (y <= 6 ? 20 : 0);
    case 'KI': // 金
      // 金は王の周りで価値が高い
      return baseValue + 15;
    case 'KA': // 角
      // 角は対角線の長い位置で価値が高い
      return baseValue + (Math.abs(x - y) <= 1 ? 35 : 0);
    case 'HI': // 飛
      // 飛は縦横のラインで価値が高い
      return baseValue + (x === 5 || y === 5 ? 40 : 0);
    default:
      return baseValue;
  }
}

// 王手かどうかチェック（簡易実装）
function isCheckMove(gameEngine: GameEngine, move: any): boolean {
  try {
    // 実際の実装では手を実行して王手になるかチェックする必要があるが、
    // 現在は簡易的に王に近づく手を王手として扱う
    const humanKingPos = findKingPosition(gameEngine, 'human');
    if (!humanKingPos) return false;
    
    const distance = Math.abs(move.to.x - humanKingPos.x) + Math.abs(move.to.y - humanKingPos.y);
    
    // 王の隣接位置への移動は王手の可能性が高い
    return distance === 1;
  } catch (error) {
    return false;
  }
}

// 防御的な手かどうか（簡易実装）
function isDefensiveMove(gameEngine: GameEngine, move: any): boolean {
  try {
    const aiKingPos = findKingPosition(gameEngine, 'ai');
    if (!aiKingPos) return false;
    
    // AIの王の近くに駒を配置する手は防御的
    const distance = Math.abs(move.to.x - aiKingPos.x) + Math.abs(move.to.y - aiKingPos.y);
    return distance <= 2 && distance > 0;
  } catch (error) {
    return false;
  }
}

// ミニマックス法（3手先読み）
function minimax(gameEngine: GameEngine, depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity): { score: number, move: any } {
  // 終端条件
  if (depth === 0 || gameEngine.isGameOver()) {
    return { score: evaluatePosition(gameEngine), move: null };
  }
  
  const moves = gameEngine.getAllLegalMoves();
  let bestMove = null;
  
  if (isMaximizing) {
    // AIの手番（スコアを最大化）
    let maxScore = -Infinity;
    
    for (const move of moves) {
      // 手を実行（仮想的に）
      const originalState = gameEngine.getBoard(); // 簡易実装用
      const success = gameEngine.makeMoveFromMove(move);
      
      if (success) {
        const result = minimax(gameEngine, depth - 1, false, alpha, beta);
        
        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, result.score);
        
        // 手を戻す（簡易実装では新しいゲームエンジンインスタンスが必要）
        // 現在は簡略化
      }
      
      // アルファベータカット
      if (beta <= alpha) {
        break;
      }
    }
    
    return { score: maxScore, move: bestMove };
  } else {
    // 人間の手番（スコアを最小化）
    let minScore = Infinity;
    
    for (const move of moves) {
      const success = gameEngine.makeMoveFromMove(move);
      
      if (success) {
        const result = minimax(gameEngine, depth - 1, true, alpha, beta);
        
        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }
        
        beta = Math.min(beta, result.score);
      }
      
      // アルファベータカット
      if (beta <= alpha) {
        break;
      }
    }
    
    return { score: minScore, move: bestMove };
  }
}

// レベル別のAI思考
function getBestMoveForLevel(gameEngine: GameEngine, level: AILevel): any | null {
  const allMoves = gameEngine.getAllLegalMoves();
  if (allMoves.length === 0) return null;

  switch (level) {
    case 'beginner':
      // 70%でランダム、30%で駒取り優先
      const captureMoves = allMoves.filter(move => move.capture);
      if (captureMoves.length > 0 && Math.random() < 0.3) {
        return captureMoves[Math.floor(Math.random() * captureMoves.length)];
      }
      return allMoves[Math.floor(Math.random() * allMoves.length)];
      
    case 'intermediate':
      // 駒取り優先、無ければ中央重視
      const captureMovesInt = allMoves.filter(move => move.capture);
      if (captureMovesInt.length > 0) {
        return captureMovesInt[Math.floor(Math.random() * captureMovesInt.length)];
      }
      // 中央に近い手を優先
      const centerMoves = allMoves.sort((a, b) => {
        const aDist = Math.abs(a.to.x - 5) + Math.abs(a.to.y - 5);
        const bDist = Math.abs(b.to.x - 5) + Math.abs(b.to.y - 5);
        return aDist - bDist;
      });
      return centerMoves[0];
      
    case 'advanced':
      // 高度な評価関数による強化AI
      try {
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of allMoves) {
          let score = 0;
          
          // 1. 駒取りボーナス（大幅強化）
          if (move.capture) {
            const capturedPiece = move.capture.substring(1);
            score += (PIECE_VALUES[capturedPiece] || 0) * 2; // ボーナス倍増
          }
          
          // 2. 成駒チェック
          if (move.promote) {
            score += 300; // 成駒ボーナス
          }
          
          // 3. 王に近づく手を避ける（守備的）
          const humanKingPos = findKingPosition(gameEngine, 'human');
          if (humanKingPos) {
            const distanceToHumanKing = Math.abs(move.to.x - humanKingPos.x) + Math.abs(move.to.y - humanKingPos.y);
            if (distanceToHumanKing <= 3) {
              score += 150; // 王に近づく手にボーナス
            }
          }
          
          // 4. AI王の安全性チェック
          const aiKingPos = findKingPosition(gameEngine, 'ai');
          if (aiKingPos) {
            const distanceFromAIKing = Math.abs(move.from.x - aiKingPos.x) + Math.abs(move.from.y - aiKingPos.y);
            if (distanceFromAIKing <= 2) {
              score -= 100; // 王の近くの駒を動かすのはリスキー
            }
          }
          
          // 5. 持ち駒を使う手を優先
          if (move.drop) {
            score += 200; // 持ち駒を使う手にボーナス
            
            // 重要な場所への持ち駒打ちはさらにボーナス
            if (move.to.y <= 3 || move.to.y >= 7) { // 敵陣・自陣
              score += 100;
            }
          }
          
          // 6. 位置価値テーブル
          const positionValue = getPositionValue(move.to.x, move.to.y, move.piece?.substring(1) || '');
          score += positionValue;
          
          // 7. 敵陣進入ボーナス
          if (move.to.y <= 3) { // 敵陣（1-3段目）
            score += 120;
          }
          
          // 8. 王手チェック（簡易）
          if (isCheckMove(gameEngine, move)) {
            score += 500; // 王手は高得点
          }
          
          // 9. 相手の駒取りを防ぐ（防御的要素）
          if (isDefensiveMove(gameEngine, move)) {
            score += 250;
          }
          
          // 10. ランダム要素を小さく
          score += Math.random() * 20; // 大幅削減
          
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        
        return bestMove;
      } catch (error) {
        console.error('Advanced AI error:', error);
        return allMoves[Math.floor(Math.random() * allMoves.length)];
      }
      
    default:
      return allMoves[Math.floor(Math.random() * allMoves.length)];
  }
}

