// __mocks__/weightsData.ts
export interface Weight {
  id: string;
  userId: string;
  weightKg: number;
  note: string | null;
  createdAt: string;
}

export let weights: Weight[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "test-user-id",
    weightKg: 70.0,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "test-user-id",
    weightKg: 69.9,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const noChangeWeights: Weight[] = [
  {
    id: "3e6b8400-e29b-41d4-a716-446655440000",
    userId: "no-change-user-id",
    weightKg: 70.0,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "4e6b8400-e29b-41d4-a716-446655440000",
    userId: "no-change-user-id",
    weightKg: 70.0,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const gainWeights: Weight[] = [
  {
    id: "5e6b8400-e29b-41d4-a716-446655440000",
    userId: "gain-user-id",
    weightKg: 70.0,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "6e6b8400-e29b-41d4-a716-446655440000",
    userId: "gain-user-id",
    weightKg: 70.5,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const singleWeight: Weight[] = [
  {
    id: "7e6b8400-e29b-41d4-a716-446655440000",
    userId: "single-user-id",
    weightKg: 70.0,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
];

export const resetWeights = () => {
  weights = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "test-user-id",
      weightKg: 70.0,
      createdAt: "2023-10-01T00:00:00Z",
      note: "Morning weigh-in",
    },
    {
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "test-user-id",
      weightKg: 69.9,
      createdAt: "2023-10-02T00:00:00Z",
      note: "Evening weigh-in",
    },
  ];
};