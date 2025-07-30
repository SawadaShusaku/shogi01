import React from 'react';
import type { Position } from '../types/game';
import { Piece } from './Piece';

interface Props {
  board: string[][];
  onSquareClick: (position: Position) => void;
  selectedPosition: Position | null;
}

export const ShogiBoard: React.FC<Props> = ({ board, onSquareClick, selectedPosition }) => {
  const renderSquare = (piece: string, row: number, col: number) => {
    const isSelected = selectedPosition && selectedPosition[0] === row && selectedPosition[1] === col;

    return (
      <div 
        key={`${row}-${col}`}
        className={`square ${isSelected ? 'selected' : ''}`}
        onClick={() => onSquareClick([row, col])}
      >
        {piece && <Piece piece={piece} />}
      </div>
    );
  };

  return (
    <div className="shogi-board">
      {/* 盤面を上から下へ、左から右へレンダリング */}
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((piece, colIndex) => renderSquare(piece, rowIndex, colIndex))}
        </div>
      ))}
    </div>
  );
};
