// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTestAsk,
  createTestPos,
  createTestUser,
} from "../../../../test/setup.js";
import { Ask } from "../../../asks/models/Ask.js";
import { Pos } from "../../../poses/models/Pos.js";
import { calculatePullByPalletId, calculatePulls } from "../calculatePulls.js";

// Mock the database models
vi.mock("../../../asks/models/Ask.js");
vi.mock("../../../poses/models/Pos.js");

describe("calculatePulls", () => {
  let testUser: any;
  let testAsks: any[];
  let testPositions: any[];

  beforeEach(async () => {
    // Create test user
    testUser = await createTestUser({
      username: "testuser",
      fullname: "Test User",
      telegram: "@testuser",
      photo: "test-photo.jpg",
    });

    // Create test asks
    testAsks = [
      await createTestAsk({
        artikul: "ART001",
        nameukr: "Test Product 1",
        quant: 10,
        asker: testUser._id,
        askerData: {
          _id: testUser._id,
          fullname: testUser.fullname,
          telegram: testUser.telegram,
          photo: testUser.photo,
        },
        status: "new",
      }),
      await createTestAsk({
        artikul: "ART002",
        nameukr: "Test Product 2",
        quant: 5,
        asker: testUser._id,
        askerData: {
          _id: testUser._id,
          fullname: testUser.fullname,
          telegram: testUser.telegram,
          photo: testUser.photo,
        },
        status: "new",
      }),
    ];

    // Create test positions
    testPositions = [
      await createTestPos({
        artikul: "ART001",
        nameukr: "Test Product 1",
        quant: 15,
        palletTitle: "Pallet A",
        rowTitle: "Row 1",
        palletData: {
          _id: "pallet1" as any,
          title: "Pallet A",
          sector: "1",
          isDef: false,
        },
        rowData: {
          _id: "row1" as any,
          title: "Row 1",
        },
        pallet: "pallet1" as any,
        row: "row1" as any,
      }),
      await createTestPos({
        artikul: "ART002",
        nameukr: "Test Product 2",
        quant: 8,
        palletTitle: "Pallet B",
        rowTitle: "Row 2",
        palletData: {
          _id: "pallet2" as any,
          title: "Pallet B",
          sector: "2",
          isDef: false,
        },
        rowData: {
          _id: "row2" as any,
          title: "Row 2",
        },
        pallet: "pallet2" as any,
        row: "row2" as any,
      }),
    ];

    // Mock the database calls
    vi.mocked(Ask.find).mockResolvedValue(testAsks as any);
    vi.mocked(Pos.find).mockImplementation((query: any) => {
      if (query.artikul === "ART001") {
        return Promise.resolve([testPositions[0]] as any);
      } else if (query.artikul === "ART002") {
        return Promise.resolve([testPositions[1]] as any);
      }
      return Promise.resolve([] as any);
    });
    vi.mocked(Pos.findById).mockImplementation((id: any) => {
      const pos = testPositions.find((p) => p._id.toString() === id.toString());
      return Promise.resolve(pos as any);
    });
  });

  it("should calculate pulls correctly for new asks", async () => {
    const result = await calculatePulls();

    // calculatePulls returns IPullsResponse directly
    expect(result.pulls).toHaveLength(2);
    expect(result.totalPulls).toBe(2);
    expect(result.totalAsks).toBe(2);

    // Check first pull (ART001)
    const pull1 = result.pulls.find((p) => p.positions[0].artikul === "ART001");
    expect(pull1).toBeDefined();
    expect(pull1!.palletTitle).toBe("Pallet A");
    expect(pull1!.sector).toBe(1);
    expect(pull1!.positions).toHaveLength(1);
    expect(pull1!.positions[0].requestedQuant).toBe(10);

    // Check second pull (ART002)
    const pull2 = result.pulls.find((p) => p.positions[0].artikul === "ART002");
    expect(pull2).toBeDefined();
    expect(pull2!.palletTitle).toBe("Pallet B");
    expect(pull2!.sector).toBe(2);
    expect(pull2!.positions).toHaveLength(1);
    expect(pull2!.positions[0].requestedQuant).toBe(5);
  });

  it("should return empty result when no new asks exist", async () => {
    vi.mocked(Ask.find).mockResolvedValue([] as any);

    const result = await calculatePulls();

    expect(result.pulls).toHaveLength(0);
    expect(result.totalPulls).toBe(0);
    expect(result.totalAsks).toBe(0);
  });

  it("should sort pulls by sector in ascending order", async () => {
    // Add a third position with sector 0 (should come first)
    const thirdPosition = await createTestPos({
      artikul: "ART003",
      nameukr: "Test Product 3",
      quant: 3,
      palletTitle: "Pallet C",
      rowTitle: "Row 3",
      palletData: {
        _id: "pallet3" as any,
        title: "Pallet C",
        sector: "0",
        isDef: false,
      },
      rowData: {
        _id: "row3" as any,
        title: "Row 3",
      },
      pallet: "pallet3" as any,
      row: "row3" as any,
    });

    const thirdAsk = await createTestAsk({
      artikul: "ART003",
      nameukr: "Test Product 3",
      quant: 3,
      asker: testUser._id,
      askerData: {
        _id: testUser._id,
        fullname: testUser.fullname,
        telegram: testUser.telegram,
        photo: testUser.photo,
      },
      status: "new",
    });

    vi.mocked(Ask.find).mockResolvedValue([...testAsks, thirdAsk] as any);
    vi.mocked(Pos.find).mockImplementation((query: any) => {
      if (query.artikul === "ART001") {
        return Promise.resolve([testPositions[0]] as any);
      } else if (query.artikul === "ART002") {
        return Promise.resolve([testPositions[1]] as any);
      } else if (query.artikul === "ART003") {
        return Promise.resolve([thirdPosition] as any);
      }
      return Promise.resolve([] as any);
    });

    const result = await calculatePulls();

    expect(result.pulls).toHaveLength(3);
    expect(result.pulls[0].sector).toBe(0); // ART003
    expect(result.pulls[1].sector).toBe(1); // ART001
    expect(result.pulls[2].sector).toBe(2); // ART002
  });

  it("should handle positions with null/undefined sectors", async () => {
    const positionWithNullSector = await createTestPos({
      artikul: "ART003",
      nameukr: "Test Product 3",
      quant: 3,
      palletTitle: "Pallet C",
      rowTitle: "Row 3",
      palletData: {
        _id: "pallet3" as any,
        title: "Pallet C",
        sector: null,
        isDef: false,
      },
      rowData: {
        _id: "row3" as any,
        title: "Row 3",
      },
      pallet: "pallet3" as any,
      row: "row3" as any,
    });

    const askWithNullSector = await createTestAsk({
      artikul: "ART003",
      nameukr: "Test Product 3",
      quant: 3,
      asker: testUser._id,
      askerData: {
        _id: testUser._id,
        fullname: testUser.fullname,
        telegram: testUser.telegram,
        photo: testUser.photo,
      },
      status: "new",
    });

    vi.mocked(Ask.find).mockResolvedValue([
      ...testAsks,
      askWithNullSector,
    ] as any);
    vi.mocked(Pos.find).mockImplementation((query: any) => {
      if (query.artikul === "ART001") {
        return Promise.resolve([testPositions[0]] as any);
      } else if (query.artikul === "ART002") {
        return Promise.resolve([testPositions[1]] as any);
      } else if (query.artikul === "ART003") {
        return Promise.resolve([positionWithNullSector] as any);
      }
      return Promise.resolve([] as any);
    });

    const result = await calculatePulls();

    expect(result.pulls).toHaveLength(3);
    // Position with null sector should be treated as sector 0
    const nullSectorPull = result.pulls.find((p) => p.sector === 0);
    expect(nullSectorPull).toBeDefined();
    expect(nullSectorPull!.palletTitle).toBe("Pallet C");
  });

  it("should handle asks with no matching positions", async () => {
    const askWithoutPositions = await createTestAsk({
      artikul: "ART999",
      nameukr: "Non-existent Product",
      quant: 5,
      asker: testUser._id,
      askerData: {
        _id: testUser._id,
        fullname: testUser.fullname,
        telegram: testUser.telegram,
        photo: testUser.photo,
      },
      status: "new",
    });

    vi.mocked(Ask.find).mockResolvedValue([
      ...testAsks,
      askWithoutPositions,
    ] as any);
    vi.mocked(Pos.find).mockImplementation((query: any) => {
      if (query.artikul === "ART001") {
        return Promise.resolve([testPositions[0]] as any);
      } else if (query.artikul === "ART002") {
        return Promise.resolve([testPositions[1]] as any);
      }
      // ART999 has no positions
      return Promise.resolve([] as any);
    });

    const result = await calculatePulls();

    // Should only return pulls for asks that have positions
    expect(result.pulls).toHaveLength(2);
    expect(result.totalAsks).toBe(3); // Total asks including the one without positions
  });
});

describe("calculatePullByPalletId", () => {
  let testUser: any;
  let testAsks: any[];
  let testPositions: any[];

  beforeEach(async () => {
    testUser = await createTestUser({
      username: "testuser",
      fullname: "Test User",
      telegram: "@testuser",
      photo: "test-photo.jpg",
    });

    testAsks = [
      await createTestAsk({
        artikul: "ART001",
        nameukr: "Test Product 1",
        quant: 10,
        asker: testUser._id,
        askerData: {
          _id: testUser._id,
          fullname: testUser.fullname,
          telegram: testUser.telegram,
          photo: testUser.photo,
        },
        status: "new",
      }),
    ];

    testPositions = [
      await createTestPos({
        artikul: "ART001",
        nameukr: "Test Product 1",
        quant: 15,
        palletTitle: "Pallet A",
        rowTitle: "Row 1",
        palletData: {
          _id: "pallet1" as any,
          title: "Pallet A",
          sector: "1",
          isDef: false,
        },
        rowData: {
          _id: "row1" as any,
          title: "Row 1",
        },
        pallet: "pallet1" as any,
        row: "row1" as any,
      }),
    ];

    vi.mocked(Ask.find).mockResolvedValue(testAsks as any);
    vi.mocked(Pos.find).mockResolvedValue([testPositions[0]] as any);
    vi.mocked(Pos.findById).mockResolvedValue(testPositions[0] as any);
  });

  it("should return pull for specific pallet ID", async () => {
    const palletId = "pallet1";
    const result = await calculatePullByPalletId(palletId as any);

    expect(result).toBeDefined();
    expect(result!.palletId.toString()).toBe(palletId);
    expect(result!.palletTitle).toBe("Pallet A");
    expect(result!.sector).toBe(1);
    expect(result!.positions).toHaveLength(1);
  });

  it("should return null for non-existent pallet ID", async () => {
    const nonExistentPalletId = "nonexistent";
    const result = await calculatePullByPalletId(nonExistentPalletId as any);

    expect(result).toBeNull();
  });
});
