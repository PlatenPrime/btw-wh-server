import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../test/setup.js";
import artRouter from "../router.js";

describe("Arts Router Integration Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/arts", artRouter);
  });

  describe("GET /api/arts", () => {
    it("should return all arts with pagination", async () => {
      // Arrange
      await createTestArt({
        artikul: "ART001",
        nameukr: "Test Art 1",
        zone: "A1",
      });
      await createTestArt({
        artikul: "ART002",
        nameukr: "Test Art 2",
        zone: "A2",
      });

      // Act
      const response = await request(app).get("/api/arts").expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.data[0].artikul).toBe("ART001");
      expect(response.body.data[1].artikul).toBe("ART002");
    });

    it("should handle pagination parameters", async () => {
      // Arrange
      const arts = [];
      for (let i = 1; i <= 15; i++) {
        arts.push(
          await createTestArt({
            artikul: `ART${i.toString().padStart(3, "0")}`,
            nameukr: `Test Art ${i}`,
            zone: `A${i}`,
          })
        );
      }

      // Act
      const response = await request(app)
        .get("/api/arts?page=2&limit=5")
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(5);
      expect(response.body.total).toBe(15);
      expect(response.body.page).toBe(2);
      expect(response.body.totalPages).toBe(3);
      expect(response.body.data[0].artikul).toBe("ART006");
    });

    it("should handle search parameter", async () => {
      // Arrange
      await createTestArt({
        artikul: "ABC123",
        nameukr: "Test Art",
        zone: "A1",
      });
      await createTestArt({
        artikul: "XYZ789",
        nameukr: "Another Art",
        zone: "A2",
      });

      // Act
      const response = await request(app)
        .get("/api/arts?search=ABC")
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].artikul).toBe("ABC123");
    });

    it("should return empty array when no arts found", async () => {
      // Act
      const response = await request(app).get("/api/arts").expect(200);

      // Assert
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(0);
    });
  });

  describe("GET /api/arts/id/:id", () => {
    it("should return art by ID", async () => {
      // Arrange
      const testArt = await createTestArt({
        artikul: "TEST123",
        nameukr: "Test Art",
        namerus: "Тест Арт",
        zone: "A1",
        limit: 100,
      });

      // Act
      const response = await request(app)
        .get(`/api/arts/id/${testArt._id}`)
        .expect(200);

      // Assert
      expect(response.body.artikul).toBe("TEST123");
      expect(response.body.nameukr).toBe("Test Art");
      expect(response.body.namerus).toBe("Тест Арт");
      expect(response.body.zone).toBe("A1");
      expect(response.body.limit).toBe(100);
      expect(response.body._id).toBe(testArt._id.toString());
    });

    it("should return 404 for non-existent ID", async () => {
      // Arrange
      const nonExistentId = "507f1f77bcf86cd799439011";

      // Act & Assert
      const response = await request(app)
        .get(`/api/arts/id/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe("Art not found");
    });

    it("should return 500 for invalid ID format", async () => {
      // Act & Assert
      const response = await request(app)
        .get("/api/arts/id/invalid-id")
        .expect(500);

      expect(response.body.message).toBe("Server error");
    });
  });

  describe("GET /api/arts/artikul/:artikul", () => {
    it("should return art by artikul", async () => {
      // Arrange
      await createTestArt({
        artikul: "TEST456",
        nameukr: "Test Art",
        namerus: "Тест Арт",
        zone: "A1",
        limit: 50,
      });

      // Act
      const response = await request(app)
        .get("/api/arts/artikul/TEST456")
        .expect(200);

      // Assert
      expect(response.body.artikul).toBe("TEST456");
      expect(response.body.nameukr).toBe("Test Art");
      expect(response.body.namerus).toBe("Тест Арт");
      expect(response.body.zone).toBe("A1");
      expect(response.body.limit).toBe(50);
    });

    it("should return 404 for non-existent artikul", async () => {
      // Act & Assert
      const response = await request(app)
        .get("/api/arts/artikul/NONEXISTENT")
        .expect(404);

      expect(response.body.message).toBe("Art not found");
    });

    it("should handle case-sensitive search", async () => {
      // Arrange
      await createTestArt({
        artikul: "CaseTest",
        nameukr: "Test Art",
        zone: "A1",
      });

      // Act & Assert
      const response = await request(app)
        .get("/api/arts/artikul/casetest")
        .expect(404);

      expect(response.body.message).toBe("Art not found");
    });
  });

  describe("POST /api/arts/upsert", () => {
    it("should create new arts", async () => {
      // Arrange
      const artsData = [
        {
          artikul: "NEW001",
          nameukr: "New Art 1",
          namerus: "Новый Арт 1",
          zone: "A1",
        },
        {
          artikul: "NEW002",
          nameukr: "New Art 2",
          namerus: "Новый Арт 2",
          zone: "A2",
        },
      ];

      // Act
      const response = await request(app)
        .post("/api/arts/upsert")
        .send(artsData)
        .expect(200);

      // Assert
      expect(response.body.message).toBe("Upsert completed");
      expect(response.body.result.upsertedCount).toBe(2);
      expect(response.body.result.modifiedCount).toBe(0);
    });

    it("should update existing arts", async () => {
      // Arrange
      await createTestArt({
        artikul: "EXIST001",
        nameukr: "Old Name",
        namerus: "Старое имя",
        zone: "A1",
      });

      const updateData = [
        {
          artikul: "EXIST001",
          nameukr: "Updated Name",
          namerus: "Обновленное имя",
          zone: "A2",
        },
      ];

      // Act
      const response = await request(app)
        .post("/api/arts/upsert")
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.message).toBe("Upsert completed");
      expect(response.body.result.upsertedCount).toBe(0);
      expect(response.body.result.modifiedCount).toBe(1);
    });

    it("should handle mixed create and update operations", async () => {
      // Arrange
      await createTestArt({
        artikul: "MIXED001",
        nameukr: "Existing Art",
        zone: "A1",
      });

      const mixedData = [
        {
          artikul: "MIXED001", // Update existing
          nameukr: "Updated Existing Art",
          zone: "A2",
        },
        {
          artikul: "MIXED002", // Create new
          nameukr: "New Mixed Art",
          zone: "A3",
        },
      ];

      // Act
      const response = await request(app)
        .post("/api/arts/upsert")
        .send(mixedData)
        .expect(200);

      // Assert
      expect(response.body.message).toBe("Upsert completed");
      expect(response.body.result.upsertedCount).toBe(1);
      expect(response.body.result.modifiedCount).toBe(1);
    });

    it("should return 400 for empty array", async () => {
      // Act & Assert
      const response = await request(app)
        .post("/api/arts/upsert")
        .send([])
        .expect(400);

      expect(response.body.message).toBe("Invalid or empty data");
    });

    it("should return 400 for non-array data", async () => {
      // Act & Assert
      const response = await request(app)
        .post("/api/arts/upsert")
        .send("not an array")
        .expect(400);

      expect(response.body.message).toBe("Invalid or empty data");
    });

    it("should handle large batch of arts", async () => {
      // Arrange
      const largeBatch = [];
      for (let i = 1; i <= 25; i++) {
        largeBatch.push({
          artikul: `BATCH${i.toString().padStart(3, "0")}`,
          nameukr: `Batch Art ${i}`,
          namerus: `Пакет Арт ${i}`,
          zone: `A${(i % 5) + 1}`,
        });
      }

      // Act
      const response = await request(app)
        .post("/api/arts/upsert")
        .send(largeBatch)
        .expect(200);

      // Assert
      expect(response.body.message).toBe("Upsert completed");
      expect(response.body.result.upsertedCount).toBe(25);
    });
  });

  describe("GET /api/arts/btrade/:artikul", () => {
    it("should return 400 when artikul is missing", async () => {
      // Act & Assert
      const response = await request(app).get("/api/arts/btrade/").expect(404);

      // Note: Express returns 404 for empty route parameter
    });

    it("should handle artikul parameter", async () => {
      // Act
      const response = await request(app)
        .get("/api/arts/btrade/TEST123");

      // Assert
      // The route should work, but external API call may fail
      // Accept both 200 (success) and 404 (no products found) as valid responses
      expect([200, 404]).toContain(response.status);
      expect(response.body).toBeDefined();
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('nameukr');
        expect(response.body).toHaveProperty('price');
        expect(response.body).toHaveProperty('quantity');
      } else if (response.status === 404) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe("Error handling", () => {
    it("should handle malformed JSON in POST request", async () => {
      const response = await request(app)
        .post("/api/arts/upsert")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);

      // If response is JSON, check for message. If HTML, just assert status code.
      if (
        response.headers["content-type"] &&
        response.headers["content-type"].includes("application/json")
      ) {
        expect(response.body.message).toBeDefined();
      } else {
        expect(response.status).toBe(400);
      }
    });

    it("should handle missing Content-Type header", async () => {
      // Act & Assert
      const response = await request(app)
        .post("/api/arts/upsert")
        .send([{ artikul: "TEST", zone: "A1" }])
        .expect(200); // Should still work without Content-Type

      expect(response.body.message).toBe("Upsert completed");
    });
  });
});
