import { useState, useMemo } from 'react';
import type { GameState, Position } from '../types/game';
import { GameEngine } from '../services/gameEngine';
import { useAI } from './useAI';

export const useGame = () => {
  const gameEngine = useMemo(() => new GameEngine(), []);
  const { getAIMove, isThinking, aiLevel, setAILevel } = useAI(gameEngine);
  const [gameState, setGameState] = useState<GameState>({
    board: gameEngine.getBoard(),
    turn: gameEngine.getTurn(),
    selectedPosition: null,
    gameOver: false,
    winner: null,
  });
  
  // 持ち駒の状態
  const [humanHandPieces, setHumanHandPieces] = useState<any[]>([]);
  const [aiHandPieces, setAIHandPieces] = useState<any[]>([]);
  const [selectedHandPiece, setSelectedHandPiece] = useState<string | null>(null);

  const updateGameState = () => {
    const newGameState = {
      board: gameEngine.getBoard(),
      turn: gameEngine.getTurn(),
      gameOver: gameEngine.isGameOver(),
      winner: gameEngine.getWinner(),
      selectedPosition: null,
    };
    
    console.log('updateGameState:', {
      turn: newGameState.turn,
      gameOver: newGameState.gameOver,
      winner: newGameState.winner
    });
    
    setGameState(newGameState);
    
    // 持ち駒の状態も更新
    setHumanHandPieces(gameEngine.getHandPieces('human'));
    setAIHandPieces(gameEngine.getHandPieces('ai'));
    
    // デバッグ情報を出力
    gameEngine.debugBoard();
    
    return newGameState;
  };

  const handleSquareClick = (position: Position) => {
    const [row, col] = position;
    // UI座標(row, col)をshogi.js座標(x, y)に変換
    // xは筋（9から1）、yは段（1から9）
    const shogiJsX = 9 - col;
    const shogiJsY = row + 1;
    
    console.log(`クリック位置: UI(${row}, ${col}) -> shogi.js(${shogiJsX}, ${shogiJsY})`);
    
    // 持ち駒を打つ場合
    if (selectedHandPiece && gameState.turn === 'human') {
      const clickedPiece = gameState.board[row][col];
      if (!clickedPiece) { // 空のマスの場合
        const success = gameEngine.dropPiece(shogiJsX, shogiJsY, selectedHandPiece);
        if (success) {
          console.log(`持ち駒 ${selectedHandPiece} を (${shogiJsX}, ${shogiJsY}) に打ちました`);
          setSelectedHandPiece(null);
          const newState = updateGameState();
          
          // AIの手番に移行
          if (!newState.gameOver && newState.turn === 'ai') {
            setTimeout(async () => {
              await makeAIMove();
            }, 500);
          }
        } else {
          console.log('持ち駒を打てませんでした');
        }
      }
      return;
    }
    
    // クリックした位置の駒を確認
    const clickedPiece = gameState.board[row][col];
    console.log(`クリックした駒: "${clickedPiece}"`);
    
    if (clickedPiece) {
      const pieceTurn = gameEngine.getPieceTurn(shogiJsX, shogiJsY);
      console.log(`駒の手番: ${pieceTurn} (0=先手, 1=後手)`);
      console.log(`現在の手番: ${gameState.turn}`);
    }

    if (gameState.selectedPosition) {
      // 移動先を選択した場合
      const [fromRow, fromCol] = gameState.selectedPosition;
      const shogiJsFromX = 9 - fromCol;
      const shogiJsFromY = fromRow + 1;

      // 合法手判定
      const legalMoves = gameEngine.getLegalMoves({ x: shogiJsFromX, y: shogiJsFromY });
      const targetMove = legalMoves.find(move => 
        move.to.x === shogiJsX && move.to.y === shogiJsY
      );

      if (targetMove) {
        console.log('選択された手:', targetMove);
        
        // 成りが可能かどうか確認してpromoteフラグを設定
        let shouldPromote = false;
        if (targetMove.promote !== undefined) {
          shouldPromote = targetMove.promote;
        } else {
          // 敵陣（1-3段目）に進入する場合は成りを確認
          const isInEnemyTerritory = targetMove.to.y <= 3 || targetMove.from.y <= 3;
          if (isInEnemyTerritory) {
            // 成ることができる駒かチェック
            const piece = gameState.board[gameState.selectedPosition[0]][gameState.selectedPosition[1]];
            const pieceType = piece.substring(1);
            const canPromote = ['FU', 'KY', 'KE', 'GI', 'KA', 'HI'].includes(pieceType);
            
            if (canPromote) {
              shouldPromote = window.confirm('成りますか？');
            }
          }
        }
        
        const success = gameEngine.makeMove(
          { x: shogiJsFromX, y: shogiJsFromY },
          { x: shogiJsX, y: shogiJsY },
          shouldPromote
        );
        
        if (success) {
          const newState = updateGameState();
          
          // ゲームが終了していない場合、AIの手を実行
          if (!newState.gameOver && newState.turn === 'ai') {
            console.log('AI手番に移行します');
            setTimeout(async () => {
              await makeAIMove();
            }, 500); // 0.5秒後にAIが指す
          }
        }
      } else {
        console.log("Illegal move!");
      }
      setGameState(prev => ({ ...prev, selectedPosition: null }));
    } else {
      // 駒を選択する場合
      const pieceTurn = gameEngine.getPieceTurn(shogiJsX, shogiJsY);
      
      if (pieceTurn === null) {
        // 空のマスをクリックした場合は何もしない
        return;
      }

      // 現在の手番と駒の手番が一致する場合のみ選択可能
      if (gameState.turn === 'human' && pieceTurn === 0) {
        setGameState(prev => ({ ...prev, selectedPosition: position }));
      } else {
        console.log("Cannot select this piece!");
        return;
      }
    }
  };

  const handleHandPieceClick = (pieceKind: string) => {
    if (gameState.turn === 'human') {
      setSelectedHandPiece(selectedHandPiece === pieceKind ? null : pieceKind);
      // 盤面の選択をクリア
      setGameState(prev => ({ ...prev, selectedPosition: null }));
    }
  };

  const makeAIMove = async () => {
    // gameEngineから直接現在の状態を取得
    const currentTurn = gameEngine.getTurn();
    const currentGameOver = gameEngine.isGameOver();
    
    console.log(`makeAIMove 開始: engineTurn=${currentTurn}, gameOver=${currentGameOver}, isThinking=${isThinking}`);
    
    if (currentTurn !== 'ai' || currentGameOver || isThinking) {
      console.log('AIの手番ではないため終了');
      return;
    }
    
    console.log('AIが手を考えています...');
    const aiMove = await getAIMove();
    console.log('AI選択手:', aiMove);
    
    if (aiMove) {
      const success = gameEngine.makeMoveFromMove(aiMove);
      console.log('AI手の実行結果:', success);
      if (success) {
        updateGameState();
      }
    }
  };

  const startNewGame = () => {
    gameEngine.reset();
    setSelectedHandPiece(null);
    updateGameState();
  };

  return { 
    gameState, 
    handleSquareClick, 
    startNewGame,
    isThinking,
    aiLevel,
    setAILevel,
    humanHandPieces,
    aiHandPieces,
    selectedHandPiece,
    handleHandPieceClick
  };
};
