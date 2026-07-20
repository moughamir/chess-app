'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateExplanation } from '@/lib/explanations';
import { parsePGN, getGamePreview, ParsedGame } from '@/lib/pgn-parser';
import { fetchArchives, fetchGames, Archive, ChessComGame } from '@/lib/chesscom-api';
import { searchOpenings, filterByFirstMove, Opening, OPENINGS } from '@/lib/openings';

declare global {
  interface Window {
    Chessboard: any;
    Chess: any;
    jQuery: any;
    $: any;
  }
}

export default function Home() {
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstance = useRef<any>(null);
  const chessRef = useRef<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerSide, setPlayerSide] = useState('white');
  const [statusText, setStatusText] = useState('Preparing the board...');
  const [statusThinking, setStatusThinking] = useState(false);
  const [statusUserTurn, setStatusUserTurn] = useState(false);
  const [explanationHtml, setExplanationHtml] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [historyHtml, setHistoryHtml] = useState('Ready for war...');
  const [showActionBtn, setShowActionBtn] = useState(false);
  const [actionBtnText, setActionBtnText] = useState('');
  const sourceSquareRef = useRef<string | null>(null);
  const myColorRef = useRef('w');
  const oppColorRef = useRef('b');
  const [modalOpen, setModalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'load' | 'openings'>('new');
  const [loadSubTab, setLoadSubTab] = useState<'pgn' | 'fen' | 'chesscom'>('pgn');
  const [pgnInput, setPgnInput] = useState('');
  const [fenInput, setFenInput] = useState('');
  const [pgnError, setPgnError] = useState('');
  const [fenError, setFenError] = useState('');
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [chesscomUsername, setChesscomUsername] = useState('');
  const [chesscomArchives, setChesscomArchives] = useState<Archive[]>([]);
  const [chesscomGames, setChesscomGames] = useState<ChessComGame[]>([]);
  const [chesscomLoading, setChesscomLoading] = useState(false);
  const [chesscomError, setChesscomError] = useState('');
  const [chesscomStep, setChesscomStep] = useState<'username' | 'archives' | 'games'>('username');
  const [openingSearch, setOpeningSearch] = useState('');
  const [openingFilter, setOpeningFilter] = useState('');
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [openingMode, setOpeningMode] = useState<'replay' | 'force' | null>(null);
  const [forceMoveIndex, setForceMoveIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'warning' | 'error' | ''>('');

  const showToast = useCallback((message: string, type: 'warning' | 'error' | '' = '') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  const removeHighlights = useCallback(() => {
    if (!boardRef.current) return;
    const squares = boardRef.current.querySelectorAll('.square-55d63');
    squares.forEach((sq) => {
      sq.classList.remove('highlight-square', 'selected-square');
    });
  }, []);

  const highlightLastMove = useCallback((move: any) => {
    if (!boardRef.current) return;
    const squares = boardRef.current.querySelectorAll('.square-55d63');
    squares.forEach((sq) => sq.classList.remove('last-move-square'));
    if (!move) return;
    const fromSq = boardRef.current.querySelector('.square-' + move.from);
    const toSq = boardRef.current.querySelector('.square-' + move.to);
    if (fromSq) fromSq.classList.add('last-move-square');
    if (toSq) toSq.classList.add('last-move-square');
  }, []);

  const renderHistory = useCallback(() => {
    const chess = chessRef.current;
    if (!chess) return;
    const historyArr = chess.history();
    if (historyArr.length === 0) {
      setHistoryHtml('Ready for war...');
      return;
    }

    let formattedText = '';
    for (let i = 0; i < historyArr.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const wStr = `<span style="color:#f4f4f5">${historyArr[i]}</span>`;
      const bStr = historyArr[i + 1] ? `<span style="color:#a1a1aa">${historyArr[i + 1]}</span>` : '';
      formattedText += `<div style="margin-bottom: 8px; border-bottom: 1px solid #27272a; padding-bottom: 4px;"><b>${moveNumber}.</b> &nbsp; ${wStr} &nbsp;&nbsp;&nbsp; ${bStr}</div>`;
    }
    setHistoryHtml(formattedText);
  }, []);

  const analyzeUserMove = useCallback((move: any): string => {
    const chess = chessRef.current;
    if (!chess) return '';
    let explanation = generateExplanation(move).replace("<span style='color:#34d399'>💡 الفلسفة من هاد الحركة:</span><br>", "");
    let msg = `<span style="color:#34d399">💡 <b>تحليل الحركة ديالك:</b></span><br>${explanation}`;

    const oppMoves = chess.moves({ verbose: true });
    let allowsMate = false;
    let hangingPiece = false;

    for (const m of oppMoves) {
      chess.move(m.san);
      if (chess.in_checkmate()) {
        allowsMate = true;
      }
      chess.undo();
    }

    const threateningMoves = oppMoves.filter((m: any) => m.to === move.to);
    if (threateningMoves.length > 0) {
      hangingPiece = true;
    }

    if (allowsMate) {
      msg += "<br><br><span style='color:#f43f5e;'><b>❌ خطأ فادح (Blunder):</b> درتي كارثة! هاد الحركة خلات الملك ديالك معرض لـ كش مات فالحركة الجاية.</span>";
    } else if (hangingPiece) {
      msg += "<br><br><span style='color:#f59e0b;'><b>⚠️ رد البال (Warning):</b> القطعة لي حركتي راها مهددة، الخصم يقدر ياكلها فالرد ديالو!</span>";
    } else {
      msg += "<br><br><span style='color:#34d399;'><b>✅ حركة آمنة:</b> مبدئياً الحركة نقية ومافيهاش خطر مباشر.</span>";
    }

    return msg;
  }, []);

  const updateStatusUI = useCallback((systemMove: any = null, serverExplanation?: string) => {
    setStatusThinking(false);
    const chess = chessRef.current;
    if (!chess) return;

    if (chess.turn() === oppColorRef.current) {
      setStatusUserTurn(true);
      if (systemMove) {
        setStatusText(`🔥 System Played: <b style="color:#e11d48">${systemMove.san}</b><br><br>👉 CLICK opponent's piece to match move.`);
        setExplanationHtml(serverExplanation || generateExplanation(systemMove));
        setShowExplanation(true);
        setActionBtnText("🔄 Undo System Move & Play Manually");
        setShowActionBtn(true);
      } else {
        setStatusText("👉 Waiting for opponent's move...");
        setShowExplanation(false);
        setShowActionBtn(false);
      }
    } else {
      setStatusUserTurn(false);
      setStatusText("⏳ Thinking...");
      setShowExplanation(false);
      setShowActionBtn(false);
    }
  }, []);

  const handleGameOver = useCallback(() => {
    setStatusThinking(false);
    setShowExplanation(false);
    setShowActionBtn(false);
    removeHighlights();
    const chess = chessRef.current;
    if (!chess) return;

    if (chess.in_checkmate()) {
      if (chess.turn() === myColorRef.current) {
        setStatusText("💀 CHECKMATE. You lost.");
      } else {
        setStatusText("🏆 BOOOM! CHECKMATE! You won!");
      }
    } else {
      setStatusText("🤝 Game Over - Draw!");
    }
  }, [removeHighlights]);

  const startEngineCalculation = useCallback(async () => {
    setStatusUserTurn(false);
    setStatusText('🧠 Calculating lethal move...');
    setStatusThinking(true);
    setShowExplanation(false);
    setShowActionBtn(false);

    const chess = chessRef.current;
    if (!chess) return;

    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: chess.fen(), depth: 3 }),
      });

      if (!response.ok) {
        setStatusText('❌ Engine error');
        setStatusThinking(false);
        return;
      }

      const data = await response.json();
      const move = chess.move(data.san);

      if (move && boardInstance.current) {
        boardInstance.current.position(chess.fen(), false);
        highlightLastMove(move);
        renderHistory();

        if (chess.game_over()) {
          handleGameOver();
        } else {
          updateStatusUI(move, data.explanation);
        }
      }
    } catch {
      setStatusText('❌ Engine connection failed');
      setStatusThinking(false);
    }
  }, [highlightLastMove, renderHistory, handleGameOver, updateStatusUI]);

  const handleSquareClick = useCallback((square: string) => {
    const chess = chessRef.current;
    if (!chess || chess.game_over()) return;

    const piece = chess.get(square);

    if (sourceSquareRef.current === null) {
      if (!piece) return;
      if (piece.color !== chess.turn()) return;

      sourceSquareRef.current = square;
      if (boardRef.current) {
        const sq = boardRef.current.querySelector('.square-' + square);
        if (sq) sq.classList.add('selected-square');
      }

      const moves = chess.moves({ square, verbose: true });
      for (const m of moves) {
        if (boardRef.current) {
          const sq = boardRef.current.querySelector('.square-' + m.to);
          if (sq) sq.classList.add('highlight-square');
        }
      }
    } else {
      if (square === sourceSquareRef.current) {
        sourceSquareRef.current = null;
        removeHighlights();
        return;
      }

      if (piece && piece.color === chess.turn()) {
        sourceSquareRef.current = null;
        removeHighlights();
        handleSquareClick(square);
        return;
      }

      const move = chess.move({
        from: sourceSquareRef.current,
        to: square,
        promotion: 'q'
      });

      if (move === null) {
        sourceSquareRef.current = null;
        removeHighlights();
        return;
      }

      const isMyManualMove = (move.color === myColorRef.current);

      sourceSquareRef.current = null;
      removeHighlights();
      if (boardInstance.current) {
        boardInstance.current.position(chess.fen(), false);
      }

      highlightLastMove(move);
      renderHistory();

      if (chess.game_over()) {
        handleGameOver();
        return;
      }

      if (chess.turn() === myColorRef.current) {
        startEngineCalculation();
      } else {
        if (isMyManualMove) {
          setStatusUserTurn(true);
          setStatusText(`👤 You Played: <b style="color:#34d399">${move.san}</b><br><br>👉 Waiting for opponent's real move...`);
          setExplanationHtml(analyzeUserMove(move));
          setShowExplanation(true);
          setShowActionBtn(false);
        } else {
          updateStatusUI();
        }
      }
    }
  }, [removeHighlights, highlightLastMove, renderHistory, handleGameOver, startEngineCalculation, analyzeUserMove, updateStatusUI]);

  const stepBack = useCallback(() => {
    const chess = chessRef.current;
    if (!chess || chess.history().length === 0) return;

    chess.undo();
    if (boardInstance.current) {
      boardInstance.current.position(chess.fen(), false);
    }
    sourceSquareRef.current = null;
    removeHighlights();
    highlightLastMove(null);
    renderHistory();

    setStatusThinking(false);
    setShowExplanation(false);

    if (chess.turn() === myColorRef.current) {
      setStatusUserTurn(false);
      setStatusText("⏸️ System Paused. Play manually or let AI decide.");
      setActionBtnText("🧠 Let AI Calculate");
      setShowActionBtn(true);
    } else {
      setStatusUserTurn(true);
      setStatusText("👉 Waiting for opponent's correct move...");
      setShowActionBtn(false);
    }
  }, [removeHighlights, highlightLastMove, renderHistory]);

  const startGame = useCallback(() => {
    const side = playerSide;
    myColorRef.current = side === 'white' ? 'w' : 'b';
    oppColorRef.current = myColorRef.current === 'w' ? 'b' : 'w';

    if (typeof window === 'undefined') return;
    const $ = window.jQuery;
    if (!$ || !window.Chessboard || !window.Chess) return;

    chessRef.current = new window.Chess();
    setGameStarted(true);

    setTimeout(() => {
      if (!boardRef.current) return;

      const config = {
        draggable: false,
        position: 'start',
        orientation: side,
        moveSpeed: 0,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
      };

      boardInstance.current = window.Chessboard(boardRef.current, config);

      $(window).off('resize').on('resize', () => boardInstance.current?.resize());

      $(boardRef.current).off('click touchend', '.square-55d63');
      $(boardRef.current).on('click touchend', '.square-55d63', function(this: HTMLElement, e: any) {
        e.preventDefault();
        const square = $(this).attr('data-square');
        if (square) handleSquareClick(square);
      });

      updateStatusUI();

      if (myColorRef.current === 'w') {
        startEngineCalculation();
      }
    }, 100);
  }, [playerSide, handleSquareClick, updateStatusUI, startEngineCalculation]);

  useEffect(() => {
    renderHistory();
  }, [renderHistory, historyHtml]);

  useEffect(() => {
    const historyWrapper = document.getElementById('history-wrapper');
    if (historyWrapper) {
      historyWrapper.scrollTop = historyWrapper.scrollHeight;
    }
  }, [historyHtml]);

  useEffect(() => {
    return () => {
      const jq = window.jQuery;
      if (jq && boardRef.current) {
        jq(boardRef.current).off('click touchend', '.square-55d63');
      }
      if (jq) jq(window).off('resize');
    };
  }, []);

  return (
    <div className="main-wrapper">
      <div className="left-panel">
        <h2>♟️ Chess Assistant <span style={{ color: '#e11d48' }}>PRO</span></h2>
        <div id="board-container">
          <div id="myBoard" ref={boardRef}></div>
        </div>
      </div>

      <div className="right-panel">
        {!gameStarted ? (
          <div id="setup-section">
            <label style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>
              Choose your side:
            </label>
            <select
              value={playerSide}
              onChange={(e) => setPlayerSide(e.target.value)}
            >
              <option value="white">White ♙ (Attack First)</option>
              <option value="black">Black ♟ (Counter Attack)</option>
            </select>
            <button className="btn-primary" onClick={startGame}>Start Battle</button>
          </div>
        ) : (
          <div id="game-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button className="btn-new-game" onClick={() => setModalOpen(true)}>
                ♟ New Game
              </button>
            </div>
            <div id="status-box" className={statusUserTurn ? 'user-turn' : ''}>
              <div
                id="status-title"
                className={statusThinking ? 'thinking' : ''}
                dangerouslySetInnerHTML={{ __html: statusText }}
              />
              {showExplanation && (
                <div
                  id="move-explanation"
                  dangerouslySetInnerHTML={{ __html: explanationHtml }}
                />
              )}
              {showActionBtn && (
                <button
                  className="btn-secondary"
                  onClick={stepBack}
                  dangerouslySetInnerHTML={{ __html: actionBtnText }}
                />
              )}
            </div>

            <div className="history-header">
              <h4>Move History</h4>
              <button className="btn-small" onClick={stepBack} title="Undo Error">⏪ Step Back</button>
            </div>

            <div id="history-wrapper">
              <div id="history" dangerouslySetInnerHTML={{ __html: historyHtml }} />
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-tabs">
              <button
                className={`modal-tab ${activeTab === 'new' ? 'active' : ''}`}
                onClick={() => setActiveTab('new')}
              >
                ♟ New Game
              </button>
              <button
                className={`modal-tab ${activeTab === 'load' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('load');
                  setChesscomStep('username');
                  setChesscomArchives([]);
                  setChesscomGames([]);
                  setChesscomError('');
                }}
              >
                📂 Load Game
              </button>
              <button
                className={`modal-tab ${activeTab === 'openings' ? 'active' : ''}`}
                onClick={() => setActiveTab('openings')}
              >
                📖 Openings
              </button>
            </div>

            {activeTab === 'new' && (
              <div>
                <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
                  Choose your side:
                </p>
                <div className="side-picker">
                  <div
                    className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
                    onClick={() => setPlayerSide('white')}
                  >
                    <div className="piece">♙</div>
                    <div className="label">White</div>
                    <div className="desc">Attack First</div>
                  </div>
                  <div
                    className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
                    onClick={() => setPlayerSide('black')}
                  >
                    <div className="piece">♟</div>
                    <div className="label">Black</div>
                    <div className="desc">Counter Attack</div>
                  </div>
                </div>
                <button className="btn-modal-primary" onClick={() => {
                  setModalOpen(false);
                  startGame();
                }}>
                  Start Battle
                </button>
              </div>
            )}

            {activeTab === 'load' && (
              <div>
                <div className="sub-tabs">
                  <button
                    className={`sub-tab ${loadSubTab === 'pgn' ? 'active' : ''}`}
                    onClick={() => setLoadSubTab('pgn')}
                  >
                    PGN
                  </button>
                  <button
                    className={`sub-tab ${loadSubTab === 'fen' ? 'active' : ''}`}
                    onClick={() => setLoadSubTab('fen')}
                  >
                    FEN
                  </button>
                  <button
                    className={`sub-tab ${loadSubTab === 'chesscom' ? 'active' : ''}`}
                    onClick={() => setLoadSubTab('chesscom')}
                  >
                    Chess.com
                  </button>
                </div>

                {loadSubTab === 'pgn' && (
                  <div>
                    <textarea
                      className={`modal-textarea ${pgnError ? 'error' : ''}`}
                      placeholder="Paste PGN here..."
                      value={pgnInput}
                      onChange={(e) => {
                        setPgnInput(e.target.value);
                        setPgnError('');
                        setParsedGames([]);
                      }}
                    />
                    {pgnError && (
                      <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                        {pgnError}
                      </p>
                    )}
                    {parsedGames.length > 1 && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                          Multiple games found — select one:
                        </p>
                        {parsedGames.map((game, i) => (
                          <div
                            key={i}
                            className={`opening-item ${selectedGameIndex === i ? 'selected' : ''}`}
                            onClick={() => setSelectedGameIndex(i)}
                          >
                            <div className="name">{getGamePreview(game)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {parsedGames.length === 1 && (
                      <div className="game-preview">
                        <div className="title">{getGamePreview(parsedGames[0])}</div>
                      </div>
                    )}
                    <div className="btn-row">
                      <button className="btn-modal-secondary" onClick={() => {
                        setPgnInput('');
                        setPgnError('');
                        setParsedGames([]);
                      }}>
                        Clear
                      </button>
                      <button
                        className="btn-modal-primary"
                        disabled={!pgnInput.trim()}
                        onClick={() => {
                          const result = parsePGN(pgnInput);
                          if (result.error) {
                            setPgnError(result.error);
                            return;
                          }
                          setParsedGames(result.games);
                          setSelectedGameIndex(0);
                        }}
                      >
                        {parsedGames.length > 1 ? 'Load Selected' : 'Parse PGN'}
                      </button>
                    </div>
                  </div>
                )}

                {loadSubTab === 'fen' && (
                  <div>
                    <input
                      className={`modal-input ${fenError ? 'error' : ''}`}
                      placeholder="Paste FEN string here..."
                      value={fenInput}
                      onChange={(e) => {
                        setFenInput(e.target.value);
                        setFenError('');
                      }}
                    />
                    {fenError && (
                      <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                        {fenError}
                      </p>
                    )}
                    <div className="btn-row">
                      <button className="btn-modal-secondary" onClick={() => {
                        setFenInput('');
                        setFenError('');
                      }}>
                        Clear
                      </button>
                      <button
                        className="btn-modal-primary"
                        disabled={!fenInput.trim()}
                        onClick={() => setFenError('')}
                      >
                        Load Position
                      </button>
                    </div>
                  </div>
                )}

                {loadSubTab === 'chesscom' && (
                  <div>
                    {chesscomStep === 'username' && (
                      <div>
                        <input
                          className="modal-input"
                          placeholder="Chess.com username..."
                          value={chesscomUsername}
                          onChange={(e) => setChesscomUsername(e.target.value)}
                        />
                        {chesscomError && (
                          <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                            {chesscomError}
                          </p>
                        )}
                        <button
                          className="btn-modal-primary"
                          disabled={!chesscomUsername.trim() || chesscomLoading}
                        >
                          {chesscomLoading && <span className="spinner" />}
                          Find Games
                        </button>
                      </div>
                    )}

                    {chesscomStep === 'archives' && (
                      <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                          Select a month:
                        </p>
                        <div className="chesscom-list">
                          {chesscomArchives.map((archive, i) => (
                            <div key={i} className="chesscom-item">
                              <div className="opponent">
                                {archive.year}-{String(archive.month).padStart(2, '0')}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="btn-modal-secondary" onClick={() => {
                          setChesscomStep('username');
                          setChesscomArchives([]);
                        }}>
                          Back
                        </button>
                      </div>
                    )}

                    {chesscomStep === 'games' && (
                      <div>
                        <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                          Select a game:
                        </p>
                        <div className="chesscom-list">
                          {chesscomGames.map((game, i) => (
                            <div key={i} className="chesscom-item">
                              <div className="opponent">vs {game.opponent}</div>
                              <div className="meta">{game.date} — {game.result}</div>
                            </div>
                          ))}
                        </div>
                        {chesscomGames.length === 0 && (
                          <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
                            No games found for this month
                          </p>
                        )}
                        <button className="btn-modal-secondary" onClick={() => {
                          setChesscomStep('archives');
                          setChesscomGames([]);
                        }}>
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'openings' && (
              <div>
                <input
                  className="opening-search"
                  placeholder="Search openings..."
                  value={openingSearch}
                  onChange={(e) => {
                    setOpeningSearch(e.target.value);
                    setOpeningFilter('');
                  }}
                />
                <div className="opening-filters">
                  {['e4', 'd4', 'c4', 'Nf3'].map(move => (
                    <button
                      key={move}
                      className={`opening-filter-btn ${openingFilter === move ? 'active' : ''}`}
                      onClick={() => {
                        setOpeningFilter(openingFilter === move ? '' : move);
                        setOpeningSearch('');
                      }}
                    >
                      1. {move}
                    </button>
                  ))}
                </div>
                <div className="opening-list">
                  {(() => {
                    let openings = OPENINGS;
                    if (openingSearch) openings = searchOpenings(openingSearch);
                    else if (openingFilter) openings = filterByFirstMove(openingFilter);
                    return openings.map((opening, i) => (
                      <div
                        key={i}
                        className={`opening-item ${selectedOpening?.name === opening.name ? 'selected' : ''}`}
                        onClick={() => setSelectedOpening(opening)}
                      >
                        <div className="name">{opening.name}</div>
                        <div className="moves">{opening.moves.join(' ')}</div>
                      </div>
                    ));
                  })()}
                  {(() => {
                    let openings = OPENINGS;
                    if (openingSearch) openings = searchOpenings(openingSearch);
                    else if (openingFilter) openings = filterByFirstMove(openingFilter);
                    return openings.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#71717a' }}>
                        No openings found
                      </div>
                    );
                  })()}
                </div>
                {selectedOpening && (
                  <div className="mode-buttons">
                    <button
                      className="mode-btn replay"
                      onClick={() => {
                        showToast('Replay mode coming soon', 'warning');
                      }}
                    >
                      🔄 Replay (Demo)
                    </button>
                    <button
                      className="mode-btn force"
                      onClick={() => {
                        showToast('Force mode coming soon', 'warning');
                      }}
                    >
                      🔒 Force (Practice)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`toast ${toastType}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
