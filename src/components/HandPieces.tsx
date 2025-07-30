import React from 'react';
import { PIECE_KANJI_MAP } from '../utils/constants';
import type { Player } from '../types/game';

interface Props {
  player: Player;
  handPieces: any[];
  onPieceClick?: (pieceKind: string) => void;
  selectedPieceKind?: string | null;
}

export const HandPieces: React.FC<Props> = ({ 
  player, 
  handPieces, 
  onPieceClick, 
  selectedPieceKind 
}) => {
  // 駒の種類別に集計
  const pieceCounts: { [key: string]: number } = {};
  handPieces.forEach(piece => {
    const kind = piece.kind;
    pieceCounts[kind] = (pieceCounts[kind] || 0) + 1;
  });

  return (
    <div className={`hand-pieces ${player === 'ai' ? 'hand-pieces-ai' : 'hand-pieces-human'}`}>
      <h4>{player === 'human' ? 'あなたの持ち駒' : 'AIの持ち駒'}</h4>
      <div className="hand-pieces-container">
        {Object.entries(pieceCounts).map(([kind, count]) => (
          <div 
            key={kind}
            className={`hand-piece ${selectedPieceKind === kind ? 'selected' : ''} ${onPieceClick ? 'clickable' : ''}`}
            onClick={() => onPieceClick?.(kind)}
            style={{
              transform: player === 'ai' ? 'rotate(180deg)' : 'none'
            }}
          >
            <div 
              className="hand-piece-kanji"
              style={{
                fontSize: (PIECE_KANJI_MAP[kind] || kind).length > 1 ? '14px' : '18px'
              }}
            >
              {PIECE_KANJI_MAP[kind] || kind}
            </div>
            {count > 1 && (
              <div className="hand-piece-count">
                {count}
              </div>
            )}
          </div>
        ))}
        {Object.keys(pieceCounts).length === 0 && (
          <div className="hand-pieces-empty">
            持ち駒なし
          </div>
        )}
      </div>
    </div>
  );
};