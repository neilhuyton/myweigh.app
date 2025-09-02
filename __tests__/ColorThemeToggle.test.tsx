import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorThemeToggle } from '../src/components/ColorThemeToggle';
import { ThemeProviderContext } from '../src/contexts/ThemeContext';
import '@testing-library/jest-dom';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Palette: ({ className }: { className?: string }) => (
    <div data-testid="palette-icon" className={className} />
  ),
}));

// Mock the UI components (Button, DropdownMenu, etc.)
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    'data-testid': dataTestId,
    ...props
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
    [key: string]: string | React.ReactNode | undefined;
  }) => (
    <button data-testid={dataTestId} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) =>
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
}));

describe('ColorThemeToggle Component', () => {
  // Mock setColorTheme function
  const mockSetColorTheme = vi.fn();
  const themeContextValue = {
    theme: 'dark' as const,
    setTheme: vi.fn(),
    colorTheme: 'default' as const,
    setColorTheme: mockSetColorTheme,
  };

  // Render with ThemeProviderContext
  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <ThemeProviderContext.Provider value={themeContextValue}>
        {ui}
      </ThemeProviderContext.Provider>
    );
  };

  beforeEach(() => {
    mockSetColorTheme.mockClear();
  });

  it('renders correctly with trigger button and palette icon', () => {
    renderWithContext(<ColorThemeToggle />);

    // Check trigger button
    const triggerButton = screen.getByTestId('color-theme-toggle');
    expect(triggerButton).toBeInTheDocument();

    // Check palette icon
    const paletteIcon = screen.getByTestId('palette-icon');
    expect(paletteIcon).toBeInTheDocument();

    // Check accessibility span
    const srOnlySpan = screen.getByText('Toggle color theme');
    expect(srOnlySpan).toBeInTheDocument();
  });

  it('renders all color theme options in dropdown', () => {
    renderWithContext(<ColorThemeToggle />);

    // Check all dropdown items
    const colorOptions = [
      'Default',
      'Red',
      'Rose',
      'Orange',
      'Green',
      'Blue',
      'Yellow',
      'Violet',
    ];
    const dropdownItems = screen.getAllByTestId('dropdown-item');
    expect(dropdownItems).toHaveLength(8);
    dropdownItems.forEach((item, index) => {
      expect(item).toHaveTextContent(colorOptions[index]);
    });
  });

  it('calls setColorTheme with correct value when clicking each dropdown item', async () => {
    const user = userEvent.setup();
    renderWithContext(<ColorThemeToggle />);

    const dropdownItems = screen.getAllByTestId('dropdown-item');
    const colorOptions = [
      'default',
      'red',
      'rose',
      'orange',
      'green',
      'blue',
      'yellow',
      'violet',
    ];

    for (let i = 0; i < dropdownItems.length; i++) {
      await user.click(dropdownItems[i]);
      expect(mockSetColorTheme).toHaveBeenCalledWith(colorOptions[i]);
      mockSetColorTheme.mockClear(); // Reset mock for next iteration
    }
  });
});