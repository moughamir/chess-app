'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

  const generateExplanationLocal = useCallback((move: any): string => {
    const prefix = "<span style='color:#34d399'>💡 الفلسفة من هاد الحركة:</span><br>";
    if (move.san.includes('#')) return prefix + "<b>👑 كش مات:</b> سالا الماتش! هادي هي الضربة القاضية، الملك ديال الخصم ماعندو فين يهرب.";
    if (move.san.includes('+')) return prefix + "<b>⚠️ كش للملك:</b> هاد الحركة كتفرض على الخصم يدافع على الملك ديالو وكتعطيك السيطرة.";
    if (move.flags && move.flags.includes('c')) return prefix + "<b>⚔️ أكل قطعة (Capture):</b> كلينا ليه قطعة باش نقصو من القوة ديالو. ديما تأكد بلي القطعة ديالك محمية.";
    if (move.san === 'O-O' || move.san === 'O-O-O') return prefix + "<b>🏰 التبييت (Castling):</b> خبينا الملك فبلاصة آمنة، وخرجنا القلعة (الرخ) باش تشارك فالهجوم.";
    if (move.piece === 'p' && ['d4', 'e4', 'd5', 'e5'].includes(move.to)) return prefix + "<b>🎯 السيطرة على الوسط:</b> البيدق فوسط الرقعة كيتحكم فمساحة كبيرة، وكيحل الطريق للهجوم.";
    if (move.piece === 'n') return prefix + "<b>🐴 نشر الحصان:</b> الحصان كيتحرك مزيان فاش كيكون قريب للوسط، هادشي كيزيد الضغط على الخصم.";
    if (move.piece === 'b') return prefix + "<b>🎯 نشر الفيل:</b> حطينا الفيل فمربع كيتحكم فـ 'قطر' طويل باش يضغط على معسكر الخصم.";
    if (move.piece === 'r' || move.piece === 'q') return prefix + "<b>🚀 تحريك القطع الثقيلة:</b> كنجيبو القلعة ولا الوزير لبلاصة استراتيجية باش نوجدو للهجوم.";
    return prefix + "<b>🧩 تحسين التموقع:</b> هاد الحركة الهدف ديالها هو نحطو القطعة فمربع أحسن باش تعاون فال الدفاع ولا توجد لهجوم مستقبلي.";
  }, []);

  const analyzeUserMove = useCallback((move: any): string => {
    const chess = chessRef.current;
    if (!chess) return '';
    let explanation = generateExplanationLocal(move).replace("<span style='color:#34d399'>💡 الفلسفة من هاد الحركة:</span><br>", "");
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
  }, [generateExplanationLocal]);

  const updateStatusUI = useCallback((systemMove: any = null) => {
    setStatusThinking(false);
    const chess = chessRef.current;
    if (!chess) return;

    if (chess.turn() === oppColorRef.current) {
      setStatusUserTurn(true);
      if (systemMove) {
        setStatusText(`🔥 System Played: <b style="color:#e11d48">${systemMove.san}</b><br><br>👉 CLICK opponent's piece to match move.`);
        setExplanationHtml(generateExplanationLocal(systemMove));
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
  }, [generateExplanationLocal]);

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
          updateStatusUI(move);
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
    </div>
  );
}
