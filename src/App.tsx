import { useGame } from './hooks/useGame';
import { ShogiBoard } from './components/ShogiBoard';
import { GameControls } from './components/GameControls';
import { GameInfo } from './components/GameInfo';
import { HandPieces } from './components/HandPieces';
import './App.css';

function App() {
  try {
    const { 
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
    } = useGame();

    return (
      <div className="app">
        <div className="game-area">
          <HandPieces 
            player="ai"
            handPieces={aiHandPieces}
          />
          
          <div className="game-center">
            <GameInfo 
              turn={gameState.turn}
              gameOver={gameState.gameOver}
              winner={gameState.winner}
              isThinking={isThinking}
            />
            <ShogiBoard 
              board={gameState.board}
              onSquareClick={handleSquareClick}
              selectedPosition={gameState.selectedPosition}
            />
          </div>
          
          <HandPieces 
            player="human"
            handPieces={humanHandPieces}
            onPieceClick={handleHandPieceClick}
            selectedPieceKind={selectedHandPiece}
          />
        </div>
        
        <GameControls 
          onNewGame={startNewGame}
          aiLevel={aiLevel}
          onAILevelChange={setAILevel}
        />
      </div>
    );
  } catch (err) {
    return (
      <div className="app">
        <h1>エラーが発生しました</h1>
        <pre>{err instanceof Error ? err.message : String(err)}</pre>
        <p>デバッグ情報: {JSON.stringify(err)}</p>
      </div>
    );
  }
}

export default App;