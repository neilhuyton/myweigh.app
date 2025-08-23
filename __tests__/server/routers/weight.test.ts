import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw"; // Keep original import
import { server } from "../../../__mocks__/server";
import { setupMSW } from "../../../__tests__/setupTests";

describe("weight", () => {
  setupMSW();

  describe("weight.create", () => {
    it("should create a weight measurement successfully", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.create",
          async () => {
            return HttpResponse.json([
              {
                id: 0,
                result: { data: { id: 'weight-id-123', weightKg: 70.5, createdAt: '2025-08-23T12:00:00Z' } },
              },
            ]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.create",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([
            { id: 0, json: { weightKg: 70.5, note: "Morning weigh-in" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toEqual({
            id: "weight-id-123",
            weightKg: 70.5,
            createdAt: "2025-08-23T12:00:00Z",
          });
        });
      });
    });

    it("should return 401 if user is not logged in", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.create",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Unauthorized: User must be logged in",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.create",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.create",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([
            { id: 0, json: { weightKg: 70.5, note: "Morning weigh-in" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: User must be logged in"
          );
        });
      });
    });

    it("should return 400 for negative weight", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.create",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Weight must be a positive number",
                    code: -32001,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "weight.create",
                    },
                  },
                },
              ],
              { status: 400 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.create",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([
            { id: 0, json: { weightKg: -70.5, note: "Morning weigh-in" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(400);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Weight must be a positive number"
          );
        });
      });
    });
  });

  describe("weight.getWeights", () => {
    it("should return a list of weight measurements", () => {
      const mockWeights = [
        {
          id: "1",
          weightKg: 70.5,
          note: "Morning weigh-in",
          createdAt: "2025-08-20T10:00:00Z",
        },
        {
          id: "2",
          weightKg: 71.0,
          note: "Evening weigh-in",
          createdAt: "2025-08-19T18:00:00Z",
        },
      ];

      server.use(
        http.get(
          "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
          () => {
            return HttpResponse.json([
              { id: 0, result: { data: mockWeights } },
            ]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toEqual(mockWeights);
        });
      });
    });

    it("should return 401 if user is not logged in", () => {
      server.use(
        http.get(
          "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Unauthorized: User must be logged in",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.getWeights",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.getWeights",
        {
          method: "GET",
          headers: { "content-type": "application/json" },
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: User must be logged in"
          );
        });
      });
    });
  });

  describe("weight.delete", () => {
    it("should delete a weight measurement successfully", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.delete",
          () => {
            return HttpResponse.json([
              { id: 0, result: { data: { id: "weight-id-123" } } },
            ]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.delete",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([
            { id: 0, json: { weightId: "weight-id-123" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toEqual({ id: "weight-id-123" });
        });
      });
    });

    it("should return 404 if weight measurement is not found", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.delete",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Weight measurement not found",
                    code: -32001,
                    data: {
                      code: "NOT_FOUND",
                      httpStatus: 404,
                      path: "weight.delete",
                    },
                  },
                },
              ],
              { status: 404 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.delete",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([
            { id: 0, json: { weightId: "non-existent-id" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(404);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe("Weight measurement not found");
        });
      });
    });

    it("should return 401 if user is not logged in", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.delete",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Unauthorized: User must be logged in",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.delete",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.delete",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([
            { id: 0, json: { weightId: "weight-id-123" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: User must be logged in"
          );
        });
      });
    });

    it("should return 401 for unauthorized deletion", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.delete",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message:
                      "Unauthorized: Cannot delete another user's weight measurement",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.delete",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.delete",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([
            { id: 0, json: { weightId: "other-user-weight-id" } },
          ]),
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: Cannot delete another user's weight measurement"
          );
        });
      });
    });
  });

  describe("weight.setGoal", () => {
    it("should set a goal successfully", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
          () => {
            return HttpResponse.json([
              { id: 0, result: { data: { goalWeightKg: 65.0 } } },
            ]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([{ id: 0, json: { goalWeightKg: 65.0 } }]),
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toEqual({ goalWeightKg: 65.0 });
        });
      });
    });

    it("should return 401 if user is not logged in", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Unauthorized: User must be logged in",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.setGoal",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([{ id: 0, json: { goalWeightKg: 65.0 } }]),
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: User must be logged in"
          );
        });
      });
    });

    it("should return 400 for negative goal weight", () => {
      server.use(
        http.post(
          "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Goal weight must be a positive number",
                    code: -32001,
                    data: {
                      code: "BAD_REQUEST",
                      httpStatus: 400,
                      path: "weight.setGoal",
                    },
                  },
                },
              ],
              { status: 400 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.setGoal",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
          body: JSON.stringify([{ id: 0, json: { goalWeightKg: -65.0 } }]),
        }
      ).then((response) => {
        expect(response.status).toBe(400);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Goal weight must be a positive number"
          );
        });
      });
    });
  });

  describe("weight.getGoal", () => {
    it("should return a goal if it exists", () => {
      server.use(
        http.get(
          "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
          () => {
            return HttpResponse.json([
              { id: 0, result: { data: { goalWeightKg: 65.0 } } },
            ]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toEqual({ goalWeightKg: 65.0 });
        });
      });
    });

    it("should return null if no goal exists", () => {
      server.use(
        http.get(
          "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
          () => {
            return HttpResponse.json([{ id: 0, result: { data: null } }]);
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: "Bearer test-user-id",
          },
        }
      ).then((response) => {
        expect(response.status).toBe(200);
        return response.json().then((body) => {
          expect(body[0].result.data).toBeNull();
        });
      });
    });

    it("should return 401 if user is not logged in", () => {
      server.use(
        http.get(
          "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
          () => {
            return HttpResponse.json(
              [
                {
                  id: 0,
                  error: {
                    message: "Unauthorized: User must be logged in",
                    code: -32001,
                    data: {
                      code: "UNAUTHORIZED",
                      httpStatus: 401,
                      path: "weight.getGoal",
                    },
                  },
                },
              ],
              { status: 401 }
            );
          }
        )
      );

      return fetch(
        "http://localhost:8888/.netlify/functions/trpc/weight.getGoal",
        {
          method: "GET",
          headers: { "content-type": "application/json" },
        }
      ).then((response) => {
        expect(response.status).toBe(401);
        return response.json().then((body) => {
          expect(body[0].error.message).toBe(
            "Unauthorized: User must be logged in"
          );
        });
      });
    });
  });
});
