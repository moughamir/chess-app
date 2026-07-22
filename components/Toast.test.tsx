import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('should display message', () => {
    render(<Toast message="Test message" type="" />);
    
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should apply warning class', () => {
    const { container } = render(<Toast message="Warning" type="warning" />);
    
    expect(container.querySelector('.warning')).toBeTruthy();
  });

  it('should apply error class', () => {
    const { container } = render(<Toast message="Error" type="error" />);
    
    expect(container.querySelector('.error')).toBeTruthy();
  });
});
