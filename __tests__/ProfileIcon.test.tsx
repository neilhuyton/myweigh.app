import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileIcon from "../src/components/ProfileIcon";
import "@testing-library/jest-dom";

vi.mock("lucide-react", () => ({
  UserIcon: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className} />
  ),
}));

interface MockLinkProps {
  to: string;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  children?: React.ReactNode;
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, ...props }: MockLinkProps) => <a href={to} {...props} />,
}));

describe("ProfileIcon Component", () => {
  it("renders with correct link, icon, and accessibility attributes", () => {
    render(<ProfileIcon />);

    const link = screen.getByTestId("profile-icon");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/profile");
    expect(link).toHaveAttribute("aria-label", "User Profile");

    const userIcon = screen.getByTestId("user-icon");
    expect(userIcon).toBeInTheDocument();
  });
});
