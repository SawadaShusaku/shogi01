import React from 'react';
import type { AILevel } from '../hooks/useAI';

interface Props {
  onNewGame: () => void;
  aiLevel: AILevel;
  onAILevelChange: (level: AILevel) => void;
}

export const GameControls: React.FC<Props> = ({ onNewGame, aiLevel, onAILevelChange }) => {
  return (
    <div className="game-controls">
      <div className="control-group">
        <label htmlFor="ai-level">AI難易度:</label>
        <select 
          id="ai-level"
          value={aiLevel} 
          onChange={(e) => onAILevelChange(e.target.value as AILevel)}
        >
          <option value="beginner">初級</option>
          <option value="intermediate">中級</option>
          <option value="advanced">上級</option>
        </select>
      </div>
      <button onClick={onNewGame} className="new-game-button">
        新しいゲーム
      </button>
    </div>
  );
};
