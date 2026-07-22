import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { StatusBox } from './StatusBox';

describe('StatusBox', () => {
  it('should display status text', () => {
    render(
      <StatusBox
        statusText="Thinking..."
        isThinking={false}
        isUserTurn={false}
        explanation={null}
        showExplanation={false}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(screen.getByText('Thinking...')).toBeTruthy();
  });

  it('should show thinking indicator', () => {
    const { container } = render(
      <StatusBox
        statusText="Thinking..."
        isThinking={true}
        isUserTurn={false}
        explanation={null}
        showExplanation={false}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(container.querySelector('.thinking')).toBeTruthy();
  });

  it('should show explanation when enabled', () => {
    render(
      <StatusBox
        statusText="Move played"
        isThinking={false}
        isUserTurn={false}
        explanation="This is a good move"
        showExplanation={true}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(screen.getByText('This is a good move')).toBeTruthy();
  });

  it('should show action button when enabled', () => {
    const onAction = mock(() => {});
    render(
      <StatusBox
        statusText="Your turn"
        isThinking={false}
        isUserTurn={true}
        explanation={null}
        showExplanation={false}
        actionButtonText="Step Back"
        showActionButton={true}
        onAction={onAction}
      />
    );
    
    const button = screen.getByText('Step Back');
    expect(button).toBeTruthy();
  });
});
