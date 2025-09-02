// __mocks__/weightsData.ts
export let weights = [
  {
    id: "1",
    weightKg: 70,
    createdAt: "2023-10-01T00:00:00Z",
    note: "Morning weigh-in",
  },
  {
    id: "2",
    weightKg: 69.9,
    createdAt: "2023-10-02T00:00:00Z",
    note: "Evening weigh-in",
  },
];

export const resetWeights = () => {
  weights = [
    {
      id: "1",
      weightKg: 70,
      createdAt: "2023-10-01T00:00:00Z",
      note: "Morning weigh-in",
    },
    {
      id: "2",
      weightKg: 69.9,
      createdAt: "2023-10-02T00:00:00Z",
      note: "Evening weigh-in",
    },
  ];
};