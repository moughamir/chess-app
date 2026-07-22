'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { parsePGN, getGamePreview, ParsedGame } from '@/lib/pgn-parser';
import { fetchArchives, fetchGames, Archive, ChessComGame } from '@/lib/chesscom-api';
import { getSavedGames, deleteGame } from '@/lib/storage';
import type { SavedGame } from '@/lib/types';

interface LoadGameTabProps {
  onLoadPGN?: (game: ParsedGame) => void;
  onLoadFEN?: (fen: string) => void;
  onLoadChessCom?: (game: ChessComGame) => void;
}

export function LoadGameTab({ onLoadPGN, onLoadFEN, onLoadChessCom }: LoadGameTabProps) {
  const [loadSubTab, setLoadSubTab] = useState<'pgn' | 'fen' | 'chesscom' | 'saved'>('pgn');

  // PGN state
  const [pgnInput, setPgnInput] = useState('');
  const [pgnError, setPgnError] = useState('');
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);

  // FEN state
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState('');

  // Chess.com state
  const [chesscomUsername, setChesscomUsername] = useState('');
  const [chesscomArchives, setChesscomArchives] = useState<Archive[]>([]);
  const [chesscomGames, setChesscomGames] = useState<ChessComGame[]>([]);
  const [chesscomLoading, setChesscomLoading] = useState(false);
  const [chesscomError, setChesscomError] = useState('');
  const [chesscomStep, setChesscomStep] = useState<'username' | 'archives' | 'games'>('username');

  // Saved games state
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

  const loadSavedGames = useCallback(() => {
    setSavedGames(getSavedGames());
  }, []);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  const handleLoadSaved = useCallback((game: SavedGame) => {
    if (onLoadFEN) {
      onLoadFEN(game.fen);
    }
  }, [onLoadFEN]);

  const handleDeleteSaved = useCallback((timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGame(timestamp);
    loadSavedGames();
  }, [loadSavedGames]);

  const handleParsePGN = useCallback(() => {
    if (parsedGames.length > 0 && onLoadPGN) {
      onLoadPGN(parsedGames[selectedGameIndex]);
      return;
    }

    const result = parsePGN(pgnInput);
    if (result.error) {
      setPgnError(result.error);
      return;
    }

    setParsedGames(result.games);
    setSelectedGameIndex(0);
    if (result.games.length === 1 && onLoadPGN) {
      onLoadPGN(result.games[0]);
    }
  }, [pgnInput, parsedGames, selectedGameIndex, onLoadPGN]);

  const handleLoadFEN = useCallback(() => {
    if (fenInput.trim() && onLoadFEN) {
      onLoadFEN(fenInput.trim());
    }
  }, [fenInput, onLoadFEN]);

  const handleLoadChessComArchives = useCallback(async () => {
    setChesscomLoading(true);
    setChesscomError('');
    const result = await fetchArchives(chesscomUsername);
    setChesscomLoading(false);
    if (result.error) {
      setChesscomError(result.error);
      return;
    }
    setChesscomArchives(result.archives);
    setChesscomStep('archives');
  }, [chesscomUsername]);

  const handleLoadChessComGames = useCallback(async (archive: Archive) => {
    setChesscomLoading(true);
    setChesscomError('');
    const result = await fetchGames(archive.url);
    setChesscomLoading(false);
    if (result.error) {
      setChesscomError(result.error);
      return;
    }
    setChesscomGames(result.games);
    setChesscomStep('games');
  }, []);

  const handleLoadChessComGame = useCallback((game: ChessComGame) => {
    if (onLoadChessCom) {
      onLoadChessCom(game);
    }
  }, [onLoadChessCom]);

  return (
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
        <button
          className={`sub-tab ${loadSubTab === 'saved' ? 'active' : ''}`}
          onClick={() => {
            setLoadSubTab('saved');
            loadSavedGames();
          }}
        >
          Saved
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
              onClick={handleParsePGN}
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
              onClick={handleLoadFEN}
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
                onClick={handleLoadChessComArchives}
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
                  <div key={i} className="chesscom-item" onClick={() => handleLoadChessComGames(archive)}>
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
                  <div key={i} className="chesscom-item" onClick={() => handleLoadChessComGame(game)}>
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

      {loadSubTab === 'saved' && (
        <div>
          {savedGames.length === 0 ? (
            <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
              No saved games yet
            </p>
          ) : (
            <div className="chesscom-list">
              {savedGames.map((game) => (
                <div
                  key={game.timestamp}
                  className="chesscom-item"
                  onClick={() => handleLoadSaved(game)}
                >
                  <div className="opponent">{game.name}</div>
                  <div className="meta">{new Date(game.timestamp).toLocaleDateString()}</div>
                  <button
                    className="btn-delete"
                    onClick={(e) => handleDeleteSaved(game.timestamp, e)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="btn-modal-secondary" onClick={loadSavedGames}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
