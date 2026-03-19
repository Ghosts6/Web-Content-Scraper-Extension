import { render, screen, act } from '@testing-library/react';
import { SplashScreen } from '../src/popup/components/SplashScreen';

// Stub sessionStorage
beforeEach(() => {
  sessionStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SplashScreen', () => {
  test('renders the extension name', () => {
    render(<SplashScreen onComplete={() => {}} />);
    // Each character is a separate span — check by text content across the DOM
    expect(screen.getByAltText('Web Content Scraper logo')).toBeInTheDocument();
  });

  test('renders the tagline', () => {
    render(<SplashScreen onComplete={() => {}} />);
    expect(screen.getByText(/Extract/i)).toBeInTheDocument();
  });

  test('calls onComplete after ~3 seconds', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('does not call onComplete before exit timer fires', () => {
    const onComplete = jest.fn();
    render(<SplashScreen onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  test('cleans up timers on unmount', () => {
    const onComplete = jest.fn();
    const { unmount } = render(<SplashScreen onComplete={onComplete} />);
    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // onComplete should not fire after unmount
    expect(onComplete).not.toHaveBeenCalled();
  });
});