import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../Art.js";

describe("Art Model", () => {
  beforeEach(async () => {
    // Clear the Art collection before each test
    await Art.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should create art with required fields", async () => {
      // Arrange
      const artData = {
        artikul: "TEST001",
        zone: "A1",
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.artikul).toBe("TEST001");
      expect(savedArt.zone).toBe("A1");
      expect(savedArt._id).toBeDefined();
      expect(savedArt.createdAt).toBeDefined();
      expect(savedArt.updatedAt).toBeDefined();
    });

    it("should create art with all fields", async () => {
      // Arrange
      const artData = {
        artikul: "TEST002",
        nameukr: "Test Art Ukrainian",
        namerus: "Тест Арт Русский",
        zone: "A2",
        limit: 100,
        marker: "IMPORTANT",
        btradeStock: {
          value: 50,
          date: new Date("2024-01-01"),
        },
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.artikul).toBe("TEST002");
      expect(savedArt.nameukr).toBe("Test Art Ukrainian");
      expect(savedArt.namerus).toBe("Тест Арт Русский");
      expect(savedArt.zone).toBe("A2");
      expect(savedArt.limit).toBe(100);
      expect(savedArt.marker).toBe("IMPORTANT");
      expect(savedArt.btradeStock?.value).toBe(50);
      expect(savedArt.btradeStock?.date).toBeInstanceOf(Date);
    });

    it("should fail without required artikul field", async () => {
      // Arrange
      const artData = {
        zone: "A1",
      };

      // Act & Assert
      const art = new Art(artData);
      await expect(art.save()).rejects.toThrow();
    });

    it("should fail without required zone field", async () => {
      // Arrange
      const artData = {
        artikul: "TEST003",
      };

      // Act & Assert
      const art = new Art(artData);
      await expect(art.save()).rejects.toThrow();
    });

    it("should enforce unique artikul constraint", async () => {
      // Arrange
      const artData = {
        artikul: "DUPLICATE",
        zone: "A1",
      };

      // Act
      await new Art(artData).save();

      // Assert
      await expect(new Art(artData).save()).rejects.toThrow();
    });

    it("should handle special characters in artikul", async () => {
      // Arrange
      const artData = {
        artikul: "SPECIAL-123_ABC",
        zone: "A1",
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.artikul).toBe("SPECIAL-123_ABC");
    });

    it("should handle unicode characters in names", async () => {
      // Arrange
      const artData = {
        artikul: "UNICODE001",
        nameukr: "Українська назва з їїї",
        namerus: "Русское название с ёёё",
        zone: "A1",
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.nameukr).toBe("Українська назва з їїї");
      expect(savedArt.namerus).toBe("Русское название с ёёё");
    });

    it("should handle numeric limit", async () => {
      // Arrange
      const artData = {
        artikul: "LIMIT001",
        zone: "A1",
        limit: 0,
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.limit).toBe(0);
    });

    it("should handle negative limit", async () => {
      // Arrange
      const artData = {
        artikul: "NEGATIVE001",
        zone: "A1",
        limit: -10,
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.limit).toBe(-10);
    });

    it("should handle decimal limit", async () => {
      // Arrange
      const artData = {
        artikul: "DECIMAL001",
        zone: "A1",
        limit: 10.5,
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.limit).toBe(10.5);
    });
  });

  describe("btradeStock Subdocument", () => {
    it("should save btradeStock with valid data", async () => {
      // Arrange
      const artData = {
        artikul: "BTrade001",
        zone: "A1",
        btradeStock: {
          value: 75,
          date: new Date("2024-01-15"),
        },
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.btradeStock).toBeDefined();
      expect(savedArt.btradeStock?.value).toBe(75);
      expect(savedArt.btradeStock?.date).toBeInstanceOf(Date);
      expect(savedArt.btradeStock?.date.toISOString()).toBe(
        "2024-01-15T00:00:00.000Z"
      );
    });

    it("should use current date when btradeStock date is not provided", async () => {
      // Arrange
      const artData = {
        artikul: "BTrade002",
        zone: "A1",
        btradeStock: {
          value: 100,
        },
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.btradeStock?.date).toBeInstanceOf(Date);
      expect(savedArt.btradeStock?.date.getTime()).toBeGreaterThan(
        Date.now() - 1000
      ); // Within 1 second
    });

    it("should fail btradeStock without required value", async () => {
      // Arrange
      const artData = {
        artikul: "BTrade003",
        zone: "A1",
        btradeStock: {
          date: new Date(),
        },
      };

      // Act & Assert
      const art = new Art(artData);
      await expect(art.save()).rejects.toThrow();
    });

    it("should handle zero btradeStock value", async () => {
      // Arrange
      const artData = {
        artikul: "BTrade004",
        zone: "A1",
        btradeStock: {
          value: 0,
        },
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.btradeStock?.value).toBe(0);
    });

    it("should handle negative btradeStock value", async () => {
      // Arrange
      const artData = {
        artikul: "BTrade005",
        zone: "A1",
        btradeStock: {
          value: -5,
        },
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.btradeStock?.value).toBe(-5);
    });
  });

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      // Arrange
      const artData = {
        artikul: "TIMESTAMP001",
        zone: "A1",
      };

      // Act
      const art = new Art(artData);
      const savedArt = await art.save();

      // Assert
      expect(savedArt.createdAt).toBeInstanceOf(Date);
      expect(savedArt.updatedAt).toBeInstanceOf(Date);
      expect(savedArt.createdAt.getTime()).toBeGreaterThan(Date.now() - 1000);
      expect(savedArt.updatedAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it("should update updatedAt when document is modified", async () => {
      // Arrange
      const art = await new Art({
        artikul: "UPDATE001",
        zone: "A1",
      }).save();

      const originalUpdatedAt = art.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      art.nameukr = "Updated Name";
      const updatedArt = await art.save();

      // Assert
      expect(updatedArt.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
      expect(updatedArt.createdAt.getTime()).toBe(originalUpdatedAt.getTime());
    });
  });

  describe("Query Methods", () => {
    beforeEach(async () => {
      // Create test data
      await Art.create([
        { artikul: "ART001", nameukr: "Test Art 1", zone: "A1", limit: 100 },
        { artikul: "ART002", nameukr: "Test Art 2", zone: "A2", limit: 200 },
        { artikul: "ART003", nameukr: "Another Art", zone: "A1", limit: 150 },
        { artikul: "XYZ123", nameukr: "XYZ Product", zone: "B1", limit: 300 },
      ]);
    });

    it("should find art by artikul", async () => {
      // Act
      const art = await Art.findOne({ artikul: "ART001" });

      // Assert
      expect(art).toBeDefined();
      expect(art?.nameukr).toBe("Test Art 1");
      expect(art?.zone).toBe("A1");
    });

    it("should find arts by zone", async () => {
      // Act
      const arts = await Art.find({ zone: "A1" }).sort({ artikul: 1 });

      // Assert
      expect(arts).toHaveLength(2);
      expect(arts[0].artikul).toBe("ART001");
      expect(arts[1].artikul).toBe("ART003");
    });

    it("should find arts with limit greater than value", async () => {
      // Act
      const arts = await Art.find({ limit: { $gt: 150 } }).sort({ artikul: 1 });

      // Assert
      expect(arts).toHaveLength(2);
      expect(arts[0].artikul).toBe("ART002");
      expect(arts[1].artikul).toBe("XYZ123");
    });

    it("should find arts by nameukr using regex", async () => {
      // Act
      const arts = await Art.find({
        nameukr: { $regex: "Test", $options: "i" },
      }).sort({ artikul: 1 });

      // Assert
      expect(arts).toHaveLength(2);
      expect(arts[0].artikul).toBe("ART001");
      expect(arts[1].artikul).toBe("ART002");
    });

    it("should sort arts by artikul", async () => {
      // Act
      const arts = await Art.find().sort({ artikul: 1 });

      // Assert
      expect(arts).toHaveLength(4);
      expect(arts[0].artikul).toBe("ART001");
      expect(arts[1].artikul).toBe("ART002");
      expect(arts[2].artikul).toBe("ART003");
      expect(arts[3].artikul).toBe("XYZ123");
    });

    it("should count documents", async () => {
      // Act
      const count = await Art.countDocuments();

      // Assert
      expect(count).toBe(4);
    });

    it("should count documents with filter", async () => {
      // Act
      const count = await Art.countDocuments({ zone: "A1" });

      // Assert
      expect(count).toBe(2);
    });
  });

  describe("Update Operations", () => {
    it("should update art by artikul", async () => {
      // Arrange
      await Art.create({
        artikul: "UPDATE001",
        nameukr: "Original Name",
        zone: "A1",
      });

      // Act
      const result = await Art.updateOne(
        { artikul: "UPDATE001" },
        { $set: { nameukr: "Updated Name", limit: 500 } }
      );

      // Assert
      expect(result.modifiedCount).toBe(1);

      const updatedArt = await Art.findOne({ artikul: "UPDATE001" });
      expect(updatedArt?.nameukr).toBe("Updated Name");
      expect(updatedArt?.limit).toBe(500);
    });

    it("should update btradeStock", async () => {
      // Arrange
      await Art.create({
        artikul: "BTradeUpdate001",
        zone: "A1",
        btradeStock: { value: 100 },
      });

      // Act
      const result = await Art.updateOne(
        { artikul: "BTradeUpdate001" },
        { $set: { "btradeStock.value": 200 } }
      );

      // Assert
      expect(result.modifiedCount).toBe(1);

      const updatedArt = await Art.findOne({ artikul: "BTradeUpdate001" });
      expect(updatedArt?.btradeStock?.value).toBe(200);
    });
  });

  describe("Delete Operations", () => {
    it("should delete art by artikul", async () => {
      // Arrange
      await Art.create({
        artikul: "DELETE001",
        zone: "A1",
      });

      // Act
      const result = await Art.deleteOne({ artikul: "DELETE001" });

      // Assert
      expect(result.deletedCount).toBe(1);

      const deletedArt = await Art.findOne({ artikul: "DELETE001" });
      expect(deletedArt).toBeNull();
    });

    it("should delete multiple arts by zone", async () => {
      // Arrange
      await Art.create([
        { artikul: "DELETE001", zone: "A1" },
        { artikul: "DELETE002", zone: "A1" },
        { artikul: "DELETE003", zone: "A2" },
      ]);

      // Act
      const result = await Art.deleteMany({ zone: "A1" });

      // Assert
      expect(result.deletedCount).toBe(2);

      const remainingArts = await Art.find({ zone: "A1" });
      expect(remainingArts).toHaveLength(0);

      const otherZoneArts = await Art.find({ zone: "A2" });
      expect(otherZoneArts).toHaveLength(1);
    });
  });
});
