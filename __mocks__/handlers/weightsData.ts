// __mocks__/weightsData.ts
export let weights = [
  {
    id: "1",
    userId: "test-user-id",
    weightKg: 70,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "2",
    userId: "test-user-id",
    weightKg: 69.9,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const noChangeWeights = [
  {
    id: "3",
    userId: "no-change-user-id",
    weightKg: 70,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "4",
    userId: "no-change-user-id",
    weightKg: 70,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const gainWeights = [
  {
    id: "5",
    userId: "gain-user-id",
    weightKg: 70,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "6",
    userId: "gain-user-id",
    weightKg: 70.5,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const singleWeight = [
  {
    id: "7",
    userId: "single-user-id",
    weightKg: 70,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
];

export const resetWeights = () => {
  weights = [
    {
      id: "1",
      userId: "test-user-id",
      weightKg: 70,
      createdAt: "2023-10-01T00:00:00Z",
      note: "Morning weigh-in",
    },
    {
      id: "2",
      userId: "test-user-id",
      weightKg: 69.9,
      createdAt: "2023-10-02T00:00:00Z",
      note: "Evening weigh-in",
    },
  ];
};