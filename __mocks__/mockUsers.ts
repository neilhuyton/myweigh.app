import bcrypt from "bcryptjs";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  verificationToken: string | null;
  isEmailVerified: boolean;
  resetPasswordToken: string | null;
  resetPasswordTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  refreshToken: string | null; // Add refreshToken property
}

export const mockUsers: MockUser[] = [
  {
    id: "test-user-1", // Changed from 'test-user-id' to match test expectation
    email: "testuser@example.com",
    password: bcrypt.hashSync("password123", 10),
    verificationToken: null,
    isEmailVerified: true,
    resetPasswordToken: null,
    resetPasswordTokenExpiresAt: null,
    createdAt: "2025-08-16T10:40:39.214Z",
    updatedAt: "2025-08-16T10:40:39.214Z",
    refreshToken: "mock-refresh-token", // Add refreshToken
  },
  {
    id: "verified-user-id",
    email: "verifieduser@example.com",
    password: bcrypt.hashSync("password123", 10),
    isEmailVerified: true,
    verificationToken: "987fcdeb-12d3-4e5a-9876-426614174000",
    resetPasswordToken: null,
    resetPasswordTokenExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    refreshToken: "mock-refresh-token-verified", // Add refreshToken
  },
  {
    id: "27e72eb9-a0ad-4714-bd7a-c148ac1b903e",
    email: "neil.huyton@gmail.com",
    password: "$2b$10$jEeurRBvzMKgzXNYqihFiedyVyMCJDlC293i/MYoY9IPVrWeZOhX",
    verificationToken: "42c6b154-c097-4a71-9b34-5b28669ea467",
    isEmailVerified: false,
    resetPasswordToken: "123e4567-e89b-12d3-a456-426614174000",
    resetPasswordTokenExpiresAt: new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString(),
    createdAt: "2025-08-16T10:40:39.214Z",
    updatedAt: "2025-08-16T11:10:39.214Z",
    refreshToken: null, // No refreshToken for unverified user
  },
  {
    id: "fb208768-1bf8-4f8d-bcad-1f94c882ed93",
    email: "hi@neilhuyton.com",
    password: "$2b$10$RBmt.5/HTA/qk5Y47NYgvuZ5TA0AurgAUy0vDeytiUKsvZUeR.lrG",
    verificationToken: null,
    isEmailVerified: true,
    resetPasswordToken: null,
    resetPasswordTokenExpiresAt: null,
    createdAt: "2025-08-16T19:57:56.561Z",
    updatedAt: "2025-08-16T19:58:22.721Z",
    refreshToken: "mock-refresh-token-hi", // Add refreshToken
  },
];
