import { render, screen } from '@testing-library/react';
import App from '../src/popup/App';

test('renders header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Web Content Scraper/i);
  expect(headerElement).toBeInTheDocument();
});
