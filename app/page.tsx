'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { useChessGame } from '@/hooks/useChessGame';
import { useEngine } from '@/hooks/useEngine';
import { useBoardInteraction } from '@/hooks/useBoardInteraction';
import { Board } from '@/components/Board';
import { GamePanel } from '@/components/GamePanel';
import { SetupModal } from '@/components/SetupModal';
import { Toast } from '@/components/Toast';
import { generateExplanation } from '@/lib/explanations';
import { parsePGN, ParsedGame } from '@/lib/pgn-parser';
import { ChessComGame } from '@/lib/chesscom-api';
import type { Opening } from '@/lib/types';

export default function Home() {
  const game = useChessGame();
  const engine = useEngine();
  const board = useBoardInteraction();

  const [modalOpen, setModalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'load' | 'openings'>('new');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'warning' | 'error' | ''>('');
  const [statusText, setStatusText] = useState('Preparing the board...');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [actionButtonText, setActionButtonText] = useState<string | null>(null);

  const expectingEngineResult = useRef(false);
  const gameStartedRef = useRef(false);

  const showToast = useCallback((message: string, type: 'warning' | 'error' | '' = '') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage('');
    setToastType('');
  }, []);

  const updateStatusUI = useCallback((systemMove: any = null, serverExplanation?: string) => {
    const chess = game.chess;
    if (!chess) return;

    if (chess.turn() === game.oppColor) {
      if (systemMove) {
        setStatusText(`🔥 System Played: ${systemMove.san} — CLICK opponent's piece to match move.`);
        setExplanation(serverExplanation || generateExplanation(systemMove));
        setActionButtonText("🔄 Undo System Move & Play Manually");
      } else {
        setStatusText("👉 Waiting for opponent's move...");
        setExplanation(null);
        setActionButtonText(null);
      }
    } else {
      setStatusText("⏳ Thinking...");
      setExplanation(null);
      setActionButtonText(null);
    }
  }, [game.chess, game.oppColor]);

  const handleGameOver = useCallback(() => {
    board.clearSelection();
    const chess = game.chess;
    if (!chess) return;

    if (chess.isCheckmate()) {
      setStatusText(chess.turn() === game.myColor ? "💀 CHECKMATE. You lost." : "🏆 BOOOM! CHECKMATE! You won!");
    } else {
      setStatusText("🤝 Game Over - Draw!");
    }
  }, [game.chess, game.myColor, board]);

  const startEngineCalculation = useCallback(async () => {
    const chess = game.chess;
    if (!chess) return;

    setStatusText('🧠 Calculating lethal move...');
    setExplanation(null);
    setActionButtonText(null);
    expectingEngineResult.current = true;

    await engine.calculateBestMove(chess.fen(), 3);
  }, [game.chess, engine.calculateBestMove]);

  const handleSquareClick = useCallback((square: string) => {
    const chess = game.chess;
    if (!chess || chess.isGameOver()) return;

    const piece = chess.get(square as Square);

    if (!board.selectedSquare) {
      if (!piece || piece.color !== chess.turn()) return;

      board.selectSquare(square);
      const moves = chess.moves({ square: square as Square, verbose: true });
      board.setLegalMoves(moves.map((m: any) => m.to));
    } else {
      if (square === board.selectedSquare) {
        board.clearSelection();
        return;
      }

      if (piece && piece.color === chess.turn()) {
        board.clearSelection();
        board.selectSquare(square);
        const moves = chess.moves({ square: square as Square, verbose: true });
        board.setLegalMoves(moves.map((m: any) => m.to));
        return;
      }

      if (game.openingMode === 'force' && game.selectedOpening && game.forceMoveIndex < game.selectedOpening.moves.length) {
        const expectedMove = game.selectedOpening.moves[game.forceMoveIndex];
        const move = game.makeMove(board.selectedSquare, square);

        if (move === null) {
          board.clearSelection();
          return;
        }

        if (move.san === expectedMove) {
          board.clearSelection();
          board.setLastMove({ from: move.from, to: move.to });

          const newForceIndex = game.forceMoveIndex + 1;
          game.setOpening({ forceMoveIndex: newForceIndex });

          if (newForceIndex >= game.selectedOpening.moves.length) {
            game.setOpening({ mode: null });
            showToast('Opening completed! Free play now.', 'warning');
          } else if (chess.turn() !== game.myColor) {
            const opponentMoveSAN = game.selectedOpening.moves[newForceIndex];
            const opponentMove = chess.move(opponentMoveSAN);
            if (opponentMove) {
              setTimeout(() => {
                board.setLastMove({ from: opponentMove.from, to: opponentMove.to });
                game.setOpening({ forceMoveIndex: newForceIndex + 1 });
                if (game.selectedOpening && newForceIndex + 1 >= game.selectedOpening.moves.length) {
                  game.setOpening({ mode: null });
                  showToast('Opening completed! Free play now.', 'warning');
                }
              }, 800);
            }
          }

          if (chess.isGameOver()) {
            handleGameOver();
          } else {
            updateStatusUI();
          }
        } else {
          board.clearSelection();
          showToast(`Wrong move! Expected: ${expectedMove}`, 'warning');
        }
        return;
      }

      const move = game.makeMove(board.selectedSquare, square);
      board.clearSelection();

      if (move) {
        board.setLastMove({ from: move.from, to: move.to });

        if (chess.isGameOver()) {
          handleGameOver();
        } else if (chess.turn() === game.myColor) {
          startEngineCalculation();
        } else {
          setStatusText(`👤 You Played: ${move.san} — Waiting for opponent's real move...`);
          setExplanation(generateExplanation(move));
          setActionButtonText(null);
        }
      }
    }
  }, [game, board, handleGameOver, startEngineCalculation, updateStatusUI, showToast]);

  const stepBack = useCallback(() => {
    game.undoMove();
    board.clearSelection();
    board.setLastMove(null);

    const chess = game.chess;
    if (!chess) return;

    if (chess.turn() === game.myColor) {
      setStatusText("⏸️ System Paused. Play manually or let AI decide.");
      setActionButtonText("🧠 Let AI Calculate");
    } else {
      setStatusText("👉 Waiting for opponent's correct move...");
      setActionButtonText(null);
    }
  }, [game, board]);

  const startGame = useCallback(() => {
    game.startGame(game.playerSide);
    setModalOpen(false);
    gameStartedRef.current = true;
  }, [game]);

  const handleLoadPGN = useCallback((parsedGame: ParsedGame) => {
    game.loadFromPGN(parsedGame.moves.join(' '));
    setModalOpen(false);
    gameStartedRef.current = true;
  }, [game]);

  const handleLoadFEN = useCallback((fen: string) => {
    game.loadFromFEN(fen);
    setModalOpen(false);
    gameStartedRef.current = true;
  }, [game]);

  const handleLoadChessCom = useCallback((chessComGame: ChessComGame) => {
    const result = parsePGN(chessComGame.pgn);
    if (result.error || result.games.length === 0) {
      showToast('Could not parse game', 'error');
      return;
    }
    game.loadFromPGN(result.games[0].moves.join(' '));
    setModalOpen(false);
    gameStartedRef.current = true;
  }, [game, showToast]);

  const handleSelectOpening = useCallback((opening: Opening, mode: 'replay' | 'force') => {
    game.startGame(game.playerSide);
    game.setOpening({ mode, opening, forceMoveIndex: mode === 'force' ? 0 : undefined });
    setModalOpen(false);

    if (mode === 'replay') {
      setTimeout(() => {
        let moveIndex = 0;
        const replayNextMove = () => {
          const chess = game.chess;
          if (!chess || moveIndex >= opening.moves.length) {
            game.setOpening({ mode: null });
            updateStatusUI();
            return;
          }
          const move = chess.move(opening.moves[moveIndex]);
          if (move) {
            board.setLastMove({ from: move.from, to: move.to });
            moveIndex++;
            setTimeout(replayNextMove, 800);
          } else {
            showToast(`Invalid move in opening: ${opening.moves[moveIndex]}`, 'error');
            game.setOpening({ mode: null });
          }
        };
        setTimeout(replayNextMove, 500);
      }, 100);
    } else {
      showToast(`Practice mode: Play ${opening.moves[0]}`, 'warning');
    }
  }, [game, board, updateStatusUI, showToast]);

  useEffect(() => {
    if (expectingEngineResult.current && engine.lastResult && !engine.loading) {
      expectingEngineResult.current = false;

      const chess = game.chess;
      if (!chess) return;

      const tempChess = new Chess(chess.fen());
      const moveObj = tempChess.move(engine.lastResult.san);

      if (moveObj) {
        const move = game.makeMove(moveObj.from, moveObj.to);
        if (move) {
          board.setLastMove({ from: move.from, to: move.to });

          if (chess.isGameOver()) {
            handleGameOver();
          } else {
            updateStatusUI(move, engine.lastResult.explanation);
          }
        }
      }
    } else if (engine.error && expectingEngineResult.current) {
      expectingEngineResult.current = false;
      setStatusText('❌ Engine error');
    }
  }, [engine.lastResult, engine.loading, engine.error, game, board, handleGameOver, updateStatusUI]);

  useEffect(() => {
    if (game.gameStarted && game.chess && gameStartedRef.current) {
      gameStartedRef.current = false;
      updateStatusUI();

      if (game.myColor === 'w') {
        startEngineCalculation();
      }
    }
  }, [game.gameStarted, game.chess, game.myColor, updateStatusUI, startEngineCalculation]);

  const gameState = {
    chess: game.chess,
    playerSide: game.playerSide,
    myColor: game.myColor,
    oppColor: game.oppColor,
    gameStarted: game.gameStarted,
    sourceSquare: game.sourceSquare,
    openingMode: game.openingMode,
    selectedOpening: game.selectedOpening,
    forceMoveIndex: game.forceMoveIndex,
  };

  return (
    <div className="main-wrapper">
      <div className="left-panel">
        <h2>♟️ Chess Assistant <span style={{ color: '#e11d48' }}>PRO</span></h2>
        <div id="board-container">
          <Board
            fen={game.chess?.fen() ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
            orientation={game.playerSide}
            selectedSquare={board.selectedSquare}
            legalMoves={board.legalMoves}
            lastMove={board.lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>
      </div>

      <div className="right-panel">
        {!game.gameStarted ? (
          <div id="setup-section">
            <label style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>
              Choose your side:
            </label>
            <select
              value={game.playerSide}
              onChange={(e) => game.startGame(e.target.value as 'white' | 'black')}
            >
              <option value="white">White ♙ (Attack First)</option>
              <option value="black">Black ♟ (Counter Attack)</option>
            </select>
            <button className="btn-primary" onClick={startGame}>Start Battle</button>
          </div>
        ) : (
          <GamePanel
            gameStarted={game.gameStarted}
            gameState={gameState as any}
            engineResult={engine.lastResult}
            isEngineLoading={engine.loading}
            statusText={statusText}
            isThinking={engine.loading}
            explanation={explanation}
            showExplanation={!!explanation}
            actionButtonText={actionButtonText}
            showActionButton={!!actionButtonText}
            onAction={stepBack}
            onNewGame={() => setModalOpen(true)}
          />
        )}
      </div>

      <SetupModal
        isOpen={modalOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setModalOpen(false)}
        onStartGame={startGame}
        playerSide={game.playerSide}
        onPlayerSideChange={(side) => game.startGame(side)}
        onLoadPGN={handleLoadPGN}
        onLoadFEN={handleLoadFEN}
        onLoadChessCom={handleLoadChessCom}
        onSelectOpening={handleSelectOpening}
      />

      <Toast message={toastMessage} type={toastType} onDismiss={dismissToast} />
    </div>
  );
}
