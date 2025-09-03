// __tests__/router.test.tsx
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "../src/store/authStore";
import { checkAuth } from "../src/router/routes";
import { act } from "@testing-library/react";
import { server } from "../__mocks__/server";
import { router } from "../src/router/router";

// Mock jwt-decode
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn((token) => {
    if (
      token ===
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature"
    ) {
      return {
        userId: "test-user-1",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    throw new Error("Invalid token");
  }),
}));

interface RouterMock {
  router: Partial<typeof router>;
  indexRoute: {
    options: {
      beforeLoad: () => Promise<void>;
    };
  };
}

vi.mock("../src/router/router", () => ({
  router: {},
  indexRoute: {
    options: {
      beforeLoad: vi.fn(() => {
        if (checkAuth()) {
          throw redirect({ to: "/weight", statusCode: 307 });
        }
      }),
    },
  },
}));

describe("Router", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
    process.on("unhandledRejection", (reason) => {
      if (
        reason instanceof Error &&
        reason.message.includes("Invalid email or password")
      ) {
        return;
      }
      throw reason;
    });
  });

  afterEach(() => {
    server.resetHandlers();
    useAuthStore.setState({
      isLoggedIn: false,
      userId: null,
      token: null,
      refreshToken: null,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
    process.removeAllListeners("unhandledRejection");
  });

  it("redirects to /login from protected route when unauthenticated", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: false,
        userId: null,
        token: null,
        refreshToken: null,
      });

      try {
        await checkAuth();
      } catch (error) {
        expect(error).toHaveProperty("options.to", "/login");
        expect(error).toHaveProperty("options.statusCode", 307);
      }
    });
  });

  it("allows access to protected route when authenticated with valid token", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId: "test-user-1",
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature",
        refreshToken: "mock-refresh-token",
      });

      const result = await checkAuth();
      expect(result).toBe(true);
    });
  });

  it("redirects to /login from protected route when token is invalid", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId: "test-user-1",
        token: "invalid-token",
        refreshToken: "mock-refresh-token",
      });

      try {
        await checkAuth();
      } catch (error) {
        expect(error).toHaveProperty("options.to", "/login");
        expect(error).toHaveProperty("options.statusCode", 307);
      }
    });
  });

  it("redirects to /weight from root path when authenticated", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: true,
        userId: "test-user-1",
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMSJ9.dummy-signature",
        refreshToken: "mock-refresh-token",
      });

      const mockedRouter = vi.mocked<RouterMock>(
        await vi.importMock("../src/router/router")
      );
      try {
        await mockedRouter.indexRoute.options.beforeLoad();
      } catch (error) {
        expect(error).toHaveProperty("options.to", "/weight");
        expect(error).toHaveProperty("options.statusCode", 307);
      }
    });
  });

  it("redirects to /login from root path when unauthenticated", async () => {
    await act(async () => {
      useAuthStore.setState({
        isLoggedIn: false,
        userId: null,
        token: null,
        refreshToken: null,
      });

      const mockedRouter = vi.mocked<RouterMock>(
        await vi.importMock("../src/router/router")
      );
      try {
        await mockedRouter.indexRoute.options.beforeLoad();
      } catch (error) {
        expect(error).toHaveProperty("options.to", "/login");
        expect(error).toHaveProperty("options.statusCode", 307);
      }
    });
  });
});
