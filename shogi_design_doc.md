# 将棋アプリ シンプル設計書 (Phase1 集中版)

## 🎯 プロジェクト概要

**目的**: AIアシスタントが段階的に開発する高品質将棋アプリ  
**技術スタック**: Vite + React + TypeScript + やねうら王WebAssembly  
**開発環境**: macOS + ターミナル + Node.js 18+  
**開発方針**: 動作確認優先・段階的実装・コード品質重視

## 📁 コンパクトなフォルダ構成

```
shogi-ai-test/
├── src/
│   ├── components/
│   │   ├── ShogiBoard.tsx       # 盤面表示
│   │   ├── Piece.tsx            # 駒コンポーネント
│   │   ├── GameControls.tsx     # ゲーム操作ボタン
│   │   └── GameInfo.tsx         # 手番・持ち駒表示
│   ├── hooks/
│   │   ├── useGame.ts           # ゲーム状態管理
│   │   └── useAI.ts             # AI処理
│   ├── services/
│   │   ├── gameEngine.ts        # shogi.js wrapper
│   │   └── aiEngine.ts          # AI思考エンジン
│   ├── types/
│   │   └── game.ts              # 型定義
│   ├── utils/
│   │   └── constants.ts         # 定数
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── README.md
```

## 🏗️ シンプル設計原則

### 1. 最小限の分割
- ファイル数を必要最小限に抑制
- 各ファイルの責任を明確化
- 過度な抽象化を避ける

### 2. AI開発効率重視
- 1ファイル1機能の単純構造
- 分かりやすい命名
- コメント充実

## 📋 核心実装戦略

### 型定義 (types/game.ts)
```typescript
export type Player = 'human' | 'ai';
export type Position = [number, number]; // [row, col]

export interface GameState {
  board: string[][]; // 9x9 配列
  turn: Player;
  selectedPosition: Position | null;
  gameOver: boolean;
  winner: Player | null;
}

export interface Move {
  from: Position;
  to: Position;
}
```

### ゲームエンジン (services/gameEngine.ts)
```typescript
import { Shogi } from 'shogi.js';

export class GameEngine {
  private shogi: Shogi;

  constructor() {
    this.shogi = new Shogi();
  }

  // 必須メソッドのみ
  getLegalMoves(): string[] { /* shogi.js wrapper */ }
  makeMove(move: string): boolean { /* shogi.js wrapper */ }
  getBoard(): string[][] { /* shogi.js wrapper */ }
  isGameOver(): boolean { /* shogi.js wrapper */ }
  getTurn(): Player { /* shogi.js wrapper */ }
}
```

## 🤖 AI実装戦略 (革命的アプローチ)

### 最新AI技術活用（推奨）

#### **Option 1: 世界最強 やねうら王 WebAssembly版** ⭐⭐⭐⭐⭐
```bash
npm install yaneuraou.wasm
```

```typescript
// services/worldClassAI.ts
import YaneuraOu from 'yaneuraou.wasm';

export class WorldClassAI {
  private engine?: YaneuraOu;

  async initialize() {
    this.engine = await YaneuraOu.create({
      threads: Math.min(navigator.hardwareConcurrency, 4),
      memory: Math.min(navigator.deviceMemory * 256, 512) // MB
    });
  }

  async getBestMove(position: string, difficulty: 'easy' | 'normal' | 'hard'): Promise<string> {
    const searchTime = {
      easy: 100,    // 0.1秒
      normal: 1000, // 1秒  
      hard: 3000    // 3秒
    };

    return await this.engine.search(position, {
      time: searchTime[difficulty]
    });
  }
}
```

#### **Option 2: 軽量 ShogiHome エンジン** ⭐⭐⭐⭐
```bash
npm install @sunfish-shogi/shogi
```

```typescript
// services/lightweightAI.ts
import { Shogi } from '@sunfish-shogi/shogi';

export class LightweightAI {
  private engine: Shogi;

  constructor() {
    this.engine = new Shogi();
  }

  getBestMove(position: string): string {
    // 中級者レベルの思考
    return this.engine.calculateBestMove(position, { depth: 4 });
  }
}
```

#### **Option 3: ハイブリッド実装** (最推奨) ⭐⭐⭐⭐⭐
```typescript
// services/hybridAI.ts
export class HybridAI {
  private worldClass?: WorldClassAI;
  private lightweight: LightweightAI;

  constructor() {
    this.lightweight = new LightweightAI();
  }

  async getBestMove(position: string, difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master'): Promise<string> {
    switch (difficulty) {
      case 'beginner':
        // ランダム + 簡単な評価
        return this.getBeginnerMove(position);
        
      case 'intermediate':
        // 軽量エンジン
        return this.lightweight.getBestMove(position);
        
      case 'advanced':
      case 'master':
        // 世界最強エンジン
        if (!this.worldClass) {
          this.worldClass = new WorldClassAI();
          await this.worldClass.initialize();
        }
        return this.worldClass.getBestMove(position, difficulty === 'master' ? 'hard' : 'normal');
    }
  }

  private getBeginnerMove(position: string): string {
    const moves = this.getLegalMoves(position);
    // 70%は良い手、30%はランダム（人間らしさ）
    return Math.random() < 0.7 
      ? this.lightweight.getBestMove(position)
      : moves[Math.floor(Math.random() * moves.length)];
  }
}
```

### AI実装の新優先順位

1. **まず軽量AI**: 動作確認・初心者レベル
2. **やねうら王WASM**: 中級者以上レベル  
3. **ハイブリッド**: 全レベル対応

### メモリ・パフォーマンス最適化
```typescript
// utils/aiOptimizer.ts
export class AIOptimizer {
  static shouldUseWorldClassAI(): boolean {
    // デバイス性能チェック
    return navigator.deviceMemory >= 4 && // 4GB以上
           navigator.hardwareConcurrency >= 4; // 4コア以上
  }

  static getOptimalSettings() {
    return {
      memory: Math.min(navigator.deviceMemory * 128, 512),
      threads: Math.min(navigator.hardwareConcurrency, 4),
      useWorldClass: this.shouldUseWorldClassAI()
    };
  }
}
```

## 🎮 メインゲームループ (hooks/useGame.ts)

```typescript
export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const { getAIMove } = useAI();

  const makeMove = async (move: Move) => {
    // 1. 人間の手を実行
    const newState = engine.makeMove(move);
    setGameState(newState);

    // 2. ゲーム終了チェック
    if (newState.gameOver) return;

    // 3. AIの手を計算・実行
    const aiMove = await getAIMove(newState);
    const finalState = engine.makeMove(aiMove);
    setGameState(finalState);
  };

  return { gameState, makeMove };
};
```

## 🎨 最小限UI設計

### App.tsx (メイン構成)
```typescript
export default function App() {
  const { gameState, makeMove } = useGame();

  return (
    <div className="app">
      <GameInfo turn={gameState.turn} />
      <ShogiBoard 
        board={gameState.board}
        onMove={makeMove}
        selectedPosition={gameState.selectedPosition}
      />
      <GameControls onNewGame={startNewGame} />
    </div>
  );
}
```

## 📦 開発ステップ

### Step 1: 基盤構築 (1日目)
```bash
# セットアップ
npm create vite@latest shogi-ai-test -- --template react-ts
npm install shogi.js

# 実装順序
1. types/game.ts          # 型定義
2. services/gameEngine.ts # shogi.js wrapper
3. hooks/useGame.ts       # 基本ゲームループ
```

### Step 2: UI構築 (2日目)
```typescript
1. components/ShogiBoard.tsx    # 盤面表示
2. components/Piece.tsx         # 駒表示
3. components/GameControls.tsx  # 操作ボタン
4. App.tsx                      # 統合
```

### Step 3: AI実装 (3日目)
```typescript
1. services/aiEngine.ts         # ランダムAI
2. hooks/useAI.ts              # AI統合
3. AI強化 (評価関数)           # 時間があれば
```

## ⚠️ AI開発者向け重要注意事項

### 実装順序（厳守）
```bash
# 必須: この順序で実装（依存関係あり）
1. types/game.ts          # 他ファイルで型を参照するため最初
2. utils/constants.ts     # 定数定義
3. services/gameEngine.ts # ビジネスロジック
4. hooks/useGame.ts       # 状態管理
5. components/*           # UI層（最後）
6. App.tsx               # 統合（最終）

# 確認方法: 各ファイル作成後に必ず実行
npm run dev  # エラーなく起動すること
```

### よくある失敗パターンと対策

#### 失敗1: import path エラー
```typescript
// ❌ 相対パスの間違い
import { GameState } from '../types/game';  // ディレクトリ構造確認不足

// ✅ 正確な相対パス
import type { GameState } from '../types/game';
import type { GameState } from './types/game';  // 同階層の場合
```

#### 失敗2: 型エラーの放置
```bash
# 各ファイル作成後は必ず型チェック実行
npx tsc --noEmit  # TypeScriptコンパイルエラーチェック

# エラー例と対処
Property 'board' does not exist on type 'GameState'
→ types/game.ts の型定義を確認
→ import文でtype修飾子を使用
```

#### 失敗3: React Hook 使用ミス
```typescript
// ❌ Hook を条件分岐内で使用
if (gameStarted) {
  const [state, setState] = useState(initialState);  // NG
}

// ✅ Hook は常にトップレベルで使用
const [state, setState] = useState(initialState);
if (gameStarted) {
  // 条件処理
}
```

### デバッグ方法
```bash
# 1. 開発サーバーエラー確認
npm run dev
# ターミナルエラーメッセージとブラウザConsoleを両方確認

# 2. TypeScriptエラー確認  
npx tsc --noEmit
# 型エラーを全て解消してから次へ進む

# 3. ブラウザ開発者ツール活用
# F12 → Console → React Developer Tools
```

### パフォーマンス注意事項
```typescript
// ✅ メモリ効率的な実装
const BOARD_SIZE = 9;
const initialBoard = Array(BOARD_SIZE).fill(null).map(() => 
  Array(BOARD_SIZE).fill(null)
);

// ❌ メモリ無駄遣い
const board = new Array(100).fill(new Array(100).fill(null));
```

### WebAssembly AI 使用時の注意
```typescript
// ✅ 適切なメモリ管理
if (navigator.deviceMemory < 4) {
  console.warn('メモリ不足: 軽量AIを使用します');
  useWorldClassAI = false;
}

// ✅ エラーハンドリング必須
try {
  const ai = await YaneuraOu.create();
} catch (error) {
  console.error('WebAssembly AI初期化失敗:', error);
  // フォールバック処理
}
```

## ✅ 完了判定基準

### マイルストーン1完了条件
```bash
# 型定義・基本構造
✓ npm run type-check でエラーゼロ
✓ types/game.ts に全必要型定義済み
✓ utils/constants.ts に定数定義済み
✓ services/gameEngine.ts で基本API作成済み
```

### マイルストーン2完了条件
```bash
# UI基盤
✓ npm run dev でエラーなく起動
✓ ブラウザで9x9将棋盤表示
✓ 駒クリック時のハイライト動作
✓ 基本的なレスポンシブ対応
```

### マイルストーン3完了条件
```bash
# ゲームロジック
✓ 人間同士で将棋対局が可能
✓ 駒移動のルール判定が正確
✓ 勝敗判定が機能
✓ 新ゲーム・リセット機能
```

### マイルストーン4完了条件（最終目標）
```bash
# AI対戦
✓ CPU vs 人間の対戦が可能
✓ 適切な強さのAI応手
✓ AI思考時間の表示
✓ 難易度選択機能
```

## 🚀 デプロイ手順

### 本番環境構築
```bash
# 1. ビルド実行
npm run build

# 2. GitHub Pages デプロイ（推奨）
# package.json に追加
{
  "homepage": "https://[username].github.io/shogi-ai-test",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

npm install --save-dev gh-pages
npm run deploy

# 3. Netlify デプロイ（代替）
# https://app.netlify.com でdistフォルダをドラッグ&ドロップ
```

---

## 🎯 AI開発者最終チェックリスト

開発完了前に以下を確認してください：

### コード品質
- [ ] 全てのTypeScriptエラーが解消済み
- [ ] Console.error が本番で出力されない
- [ ] 未使用import/変数が残っていない
- [ ] ハードコードされた値が定数化済み

### 機能動作
- [ ] 複数ブラウザ（Chrome, Safari, Firefox）で動作確認
- [ ] モバイル表示での操作確認
- [ ] AI対戦で10手以上問題なく進行
- [ ] ページリロード後の状態復帰

### パフォーマンス
- [ ] 初回読み込み5秒以内
- [ ] AI思考時間が適切（1-3秒程度）
- [ ] メモリリークなし（長時間対戦後も軽快）

この設計書に従い、段階的実装を進めてください。各マイルストーン完了時には必ず動作確認を行い、問題があれば次の段階に進まず修正を優先してください。