import React from 'react';
import { PIECE_KANJI_MAP } from '../utils/constants';

interface Props {
  piece: string;
}

export const Piece: React.FC<Props> = ({ piece }) => {
  const pieceType = piece.substring(1);
  const kanji = PIECE_KANJI_MAP[pieceType] || pieceType;
  
  // 後手の駒（'-'で始まる）は180度回転
  const isGote = piece.startsWith('-');
  
  // 2文字の場合は文字サイズを小さくする
  const fontSize = kanji.length > 1 ? '20px' : '28px';

  return (
    <div 
      className="piece"
      style={{
        transform: isGote ? 'rotate(180deg)' : 'none',
        fontSize: fontSize
      }}
    >
      {kanji}
    </div>
  );
};
