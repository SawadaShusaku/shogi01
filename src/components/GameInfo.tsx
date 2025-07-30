import React from 'react';
import type { Player } from '../types/game';

interface Props {
  turn: Player;
  gameOver?: boolean;
  winner?: Player | null;
  isThinking?: boolean;
}

export const GameInfo: React.FC<Props> = ({ turn, gameOver, winner, isThinking }) => {
  const getStatusMessage = () => {
    if (gameOver && winner) {
      return `🎉 ${winner === 'human' ? 'あなた' : 'AI'}の勝ちです！`;
    }
    
    if (isThinking && turn === 'ai') {
      return '🤔 AIが考え中...';
    }
    
    return `${turn === 'human' ? 'あなた' : 'AI'}の番です`;
  };

  return (
    <div className="game-info">
      <h2>将棋ゲーム</h2>
      <p className="status-message">{getStatusMessage()}</p>
      {gameOver && (
        <p className="game-over-message">新しいゲームを開始してください</p>
      )}
    </div>
  );
};
