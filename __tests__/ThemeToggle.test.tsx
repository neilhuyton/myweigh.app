import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../src/components/ThemeToggle';
import '@testing-library/jest-dom';

// Mock setTheme function
const mockSetTheme = vi.fn();

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sun: ({ className }: { className?: string }) => (
    <div data-testid="sun-icon" className={className} />
  ),
  Moon: ({ className }: { className?: string }) => (
    <div data-testid="moon-icon" className={className} />
  ),
}));

// Mock the UI components (Button, DropdownMenu, etc.)
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    variant,
    size,
    'data-testid': dataTestId,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    size?: string;
    'data-testid'?: string;
    [key: string]: string | React.ReactNode | undefined;
  }) => {
    const className = [
      variant === 'outline' ? 'border p-2' : '',
      size === 'icon' ? 'h-10 w-10' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return <button data-testid={dataTestId} className={className} {...props}>
      {children}
    </button>;
  },
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

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders correctly with trigger button, sun, and moon icons', () => {
    render(<ThemeToggle />);

    // Check trigger button
    const triggerButton = screen.getByTestId('theme-toggle');
    expect(triggerButton).toBeInTheDocument();
    expect(triggerButton).toHaveClass('border p-2 h-10 w-10'); // From variant="outline" size="icon"

    // Check sun icon
    const sunIcon = screen.getByTestId('sun-icon');
    expect(sunIcon).toBeInTheDocument();
    expect(sunIcon).toHaveClass('h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0');

    // Check moon icon
    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
    expect(moonIcon).toHaveClass('absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100');

    // Check accessibility span
    const srOnlySpan = screen.getByText('Toggle theme');
    expect(srOnlySpan).toBeInTheDocument();
    expect(srOnlySpan).toHaveClass('sr-only');
  });

  it('renders all theme options in dropdown', () => {
    render(<ThemeToggle />);

    // Check all dropdown items
    const themeOptions = ['Light', 'Dark', 'System'];
    const dropdownItems = screen.getAllByTestId('dropdown-item');
    expect(dropdownItems).toHaveLength(3);
    dropdownItems.forEach((item, index) => {
      expect(item).toHaveTextContent(themeOptions[index]);
    });
  });

  it('calls setTheme with correct value when clicking each dropdown item', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const dropdownItems = screen.getAllByTestId('dropdown-item');
    const themeOptions = ['light', 'dark', 'system'];

    for (let i = 0; i < dropdownItems.length; i++) {
      await user.click(dropdownItems[i]);
      expect(mockSetTheme).toHaveBeenCalledWith(themeOptions[i]);
      mockSetTheme.mockClear(); // Reset mock for next iteration
    }
  });
});