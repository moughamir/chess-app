import { describe, it, expect, mock, afterEach } from 'bun:test';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
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

  it('should render 64 squares', () => {
    render(<Board {...defaultProps} />);
    
    const squares = screen.getAllByRole('button');
    expect(squares).toHaveLength(64);
  });

  it('should render pieces from FEN', () => {
    render(<Board {...defaultProps} />);
    
    // Black king should be on e8
    const e8 = screen.getByTestId('square-e8');
    expect(e8.textContent).toContain('♚');
    
    // White pawn on e4
    const e4 = screen.getByTestId('square-e4');
    expect(e4.textContent).toContain('♙');
  });

  it('should call onSquareClick when square is clicked', () => {
    render(<Board {...defaultProps} />);
    
    const e2 = screen.getByTestId('square-e2');
    fireEvent.click(e2);
    
    expect(defaultProps.onSquareClick).toHaveBeenCalledWith('e2');
  });

  it('should highlight selected square', () => {
    render(<Board {...defaultProps} selectedSquare="e2" />);
    
    const e2 = screen.getByTestId('square-e2');
    expect(e2.className).toContain('selected');
  });

  it('should highlight legal moves', () => {
    render(<Board {...defaultProps} legalMoves={['e3', 'e4']} />);
    
    const e3 = screen.getByTestId('square-e3');
    const e4 = screen.getByTestId('square-e4');
    expect(e3.className).toContain('legal-move');
    expect(e4.className).toContain('legal-move');
  });

  it('should highlight last move', () => {
    render(<Board {...defaultProps} lastMove={{ from: 'e2', to: 'e4' }} />);
    
    const e2 = screen.getByTestId('square-e2');
    const e4 = screen.getByTestId('square-e4');
    expect(e2.className).toContain('last-move');
    expect(e4.className).toContain('last-move');
  });

  it('should flip board for black orientation', () => {
    render(<Board {...defaultProps} orientation="black" />);
    
    // a1 should be top-left for black orientation
    const a1 = screen.getByTestId('square-a1');
    expect(a1.style.gridRow).toBe('1');
    expect(a1.style.gridColumn).toBe('8');
  });
});
