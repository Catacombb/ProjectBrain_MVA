import { render, screen } from '@testing-library/react';

describe('Example test suite', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });

  it('should render a component correctly', () => {
    render(<div data-testid="test-element">Test Content</div>);
    const element = screen.getByTestId('test-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test Content');
  });
}); 