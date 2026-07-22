import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, cleanup } from '@testing-library/react';
import { Board } from './Board';

describe('Board', () => {
  afterEach(() => cleanup());
  
  const defaultProps = {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    orientation: 'white' as const,
    selectedSquare: null,
    legalMoves: [],
    lastMove: null,
    onSquareClick: mock(() => {}),
  };

  it('should render without errors', () => {
    // Mock window objects
    (window as any).Chessboard = mock(() => ({}));
    (window as any).jQuery = mock(() => ({
      find: mock(() => ({
        addClass: mock(() => {}),
        removeClass: mock(() => {}),
        attr: mock(() => ''),
      })),
      off: mock(() => {}),
      on: mock(() => {}),
    }));
    (window as any).$ = (window as any).jQuery;
    
    const { container } = render(<Board {...defaultProps} />);
    
    // Board should render a div with id="myBoard"
    const board = container.querySelector('#myBoard');
    expect(board).toBeTruthy();
  });

  it('should accept different orientations', () => {
    (window as any).Chessboard = mock(() => ({}));
    (window as any).jQuery = mock(() => ({
      find: mock(() => ({
        addClass: mock(() => {}),
        removeClass: mock(() => {}),
        attr: mock(() => ''),
      })),
      off: mock(() => {}),
      on: mock(() => {}),
    }));
    (window as any).$ = (window as any).jQuery;
    
    const { container } = render(<Board {...defaultProps} orientation="black" />);
    
    const board = container.querySelector('#myBoard');
    expect(board).toBeTruthy();
  });

  it('should accept different FEN positions', () => {
    (window as any).Chessboard = mock(() => ({}));
    (window as any).jQuery = mock(() => ({
      find: mock(() => ({
        addClass: mock(() => {}),
        removeClass: mock(() => {}),
        attr: mock(() => ''),
      })),
      off: mock(() => {}),
      on: mock(() => {}),
    }));
    (window as any).$ = (window as any).jQuery;
    
    const { container } = render(<Board {...defaultProps} fen="8/8/8/4k3/8/8/8/4K3 w - - 0 1" />);
    
    const board = container.querySelector('#myBoard');
    expect(board).toBeTruthy();
  });
});
