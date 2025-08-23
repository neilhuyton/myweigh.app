// __mocks__/mockUsers.ts
export const mockUsers = [
  {
    id: "27e72eb9-a0ad-4714-bd7a-c148ac1b903e",
    email: "neil.huyton@gmail.com",
    password: "$2b$10$3T7JTgXV0uQsQD4jIwE9H.4A8S7L5/sPEbU/x/IaI21ey9rintyZO",
    verificationToken: "42c6b154-c097-4a71-9b34-5b28669ea467",
    isEmailVerified: false,
    resetPasswordToken: "123e4567-e89b-12d3-a456-426614174000",
    resetPasswordTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    createdAt: "2025-08-16T10:40:39.214Z",
    updatedAt: "2025-08-16T10:40:39.214Z",
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
  },
];