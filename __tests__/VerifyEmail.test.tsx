// __tests__/VerifyEmail.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { server } from "../__mocks__/server";
import "@testing-library/jest-dom";
import { renderWithProviders } from "./utils/setup";
import { verifyEmailHandler } from "../__mocks__/handlers";
import { mockUsers, type MockUser } from "../__mocks__/mockUsers";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import { router } from "../src/router/router";

// Mock useNavigate to track navigation calls
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    createRouter: actual.createRouter,
    RouterProvider: actual.RouterProvider,
  };
});

describe("Email Verification", () => {
  const initialMockUsers: MockUser[] = JSON.parse(JSON.stringify(mockUsers));

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
    server.use(verifyEmailHandler);
  });

  afterEach(() => {
    server.resetHandlers();
    mockUsers.length = 0;
    mockUsers.push(...JSON.parse(JSON.stringify(initialMockUsers)));
    mockNavigate.mockReset();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    server.close();
  });

  const setup = async (initialPath: string, token: string) => {
    const history = createMemoryHistory({
      initialEntries: [`${initialPath}?token=${token}`],
    });
    const testRouter = createRouter({
      ...router.options,
      history,
      routeTree: router.routeTree,
    });

    renderWithProviders(
      <RouterProvider router={testRouter} />,
      { userId: "test-user-id" } // Set userId for auth store, though not strictly needed for verifyEmail
    );

    return { history, testRouter };
  };

  it("successfully verifies email with valid token", async () => {
    const validToken = "42c6b154-c097-4a71-9b34-5b28669ea467";
    await setup("/verify-email", validToken);

    await waitFor(
      () => {
        expect(screen.getByText("Email Verification")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Email verified successfully!"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-green-500"
        );
        expect(screen.getByTestId("go-to-login-button")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("displays error message for invalid or expired verification token", async () => {
    const invalidToken = "00000000-0000-0000-0000-000000000000";
    await setup("/verify-email", invalidToken);

    await waitFor(
      () => {
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Invalid or expired verification token"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-red-500"
        );
      },
      { timeout: 1000 }
    );
  });

  it("displays error message for already verified email", async () => {
    const token = "987fcdeb-12d3-4e5a-9876-426614174000";
    await setup("/verify-email", token);

    await waitFor(
      () => {
        expect(screen.getByTestId("verify-message")).toBeInTheDocument();
        expect(screen.getByTestId("verify-message")).toHaveTextContent(
          "Email already verified"
        );
        expect(screen.getByTestId("verify-message")).toHaveClass(
          "text-red-500"
        );
      },
      { timeout: 1000 }
    );
  });
});
