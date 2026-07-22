import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { MoveHistory } from './MoveHistory';

describe('MoveHistory', () => {
  it('should display ready message when no moves', () => {
    const { unmount } = render(<MoveHistory moves={[]} />);
    
    expect(screen.getByText('Ready for war...')).toBeTruthy();
    unmount();
  });

  it('should display moves', () => {
    const { unmount } = render(<MoveHistory moves={['e4', 'e5', 'Nf3', 'Nc6']} />);
    
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('e4')).toBeTruthy();
    expect(screen.getByText('e5')).toBeTruthy();
    unmount();
  });

  it('should group moves by pairs', () => {
    const { unmount } = render(<MoveHistory moves={['e4', 'e5', 'Nf3']} />);
    
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
    unmount();
  });
});
