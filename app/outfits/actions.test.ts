/**
 * @jest-environment node
 */

jest.mock("../../lib/auth/session", () => ({
  requireUser: jest.fn(async () => ({ id: "user-1", email: "a@b.com" })),
}));

jest.mock("../../lib/ai/vision/factory", () => ({
  isVisionConfigured: jest.fn(),
}));

jest.mock("../../lib/outfits/service", () => ({
  enqueueOutfitAnalysis: jest.fn(),
  registerOutfit: jest.fn(),
  createOutfitUploadTarget: jest.fn(),
  askFollowUp: jest.fn(),
  enqueueCompare: jest.fn(),
  getOutfitJobStatus: jest.fn(),
  getCompareResult: jest.fn(),
  saveLook: jest.fn(),
  unsaveLook: jest.fn(),
  deleteOutfit: jest.fn(),
}));

jest.mock("../../lib/outfits/runner", () => ({
  triggerOutfitJob: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/server", () => ({
  after: (fn: () => void) => fn(),
}));

import { isVisionConfigured } from "@/lib/ai/vision/factory";
import { enqueueOutfitAnalysis } from "@/lib/outfits/service";
import { startOutfitAnalysis } from "@/app/outfits/actions";

const visionConfigured = isVisionConfigured as jest.MockedFunction<
  typeof isVisionConfigured
>;
const enqueue = enqueueOutfitAnalysis as jest.MockedFunction<
  typeof enqueueOutfitAnalysis
>;

describe("startOutfitAnalysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a setup-required error when the vision key is missing", async () => {
    visionConfigured.mockReturnValue(false);
    const formData = new FormData();
    formData.set("outfit_id", "11111111-1111-4111-8111-111111111111");
    formData.set("feedback_depth", "detailed");

    const result = await startOutfitAnalysis(
      { error: null, message: null },
      formData,
    );

    expect(result.error).toMatch(/isn’t available right now/i);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("surfaces consent denial from the service layer", async () => {
    visionConfigured.mockReturnValue(true);
    enqueue.mockRejectedValue(
      new Error("AI processing consent is required before analysis."),
    );

    const formData = new FormData();
    formData.set("outfit_id", "11111111-1111-4111-8111-111111111111");
    formData.set("feedback_depth", "detailed");

    const result = await startOutfitAnalysis(
      { error: null, message: null },
      formData,
    );

    expect(result.error).toMatch(/consent/i);
  });
});
