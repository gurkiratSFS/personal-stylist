/**
 * @jest-environment node
 */

jest.mock("../../../../../lib/outfits/runner", () => ({
  authorizeRunnerToken: jest.fn(),
}));

jest.mock("../../../../../lib/outfits/service", () => ({
  processOutfitAnalysisJob: jest.fn(),
}));

import { POST } from "./route";
import { authorizeRunnerToken } from "@/lib/outfits/runner";
import { processOutfitAnalysisJob } from "@/lib/outfits/service";

const authorize = authorizeRunnerToken as jest.MockedFunction<
  typeof authorizeRunnerToken
>;
const processJob = processOutfitAnalysisJob as jest.MockedFunction<
  typeof processOutfitAnalysisJob
>;

describe("POST /api/ai/outfit/run", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the bearer token is invalid", async () => {
    authorize.mockReturnValue(false);
    const response = await POST(
      new Request(
        "http://localhost/api/ai/outfit/run?job=11111111-1111-4111-8111-111111111111",
        {
          method: "POST",
          headers: { Authorization: "Bearer bad" },
        },
      ),
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the job is missing", async () => {
    authorize.mockReturnValue(true);
    processJob.mockRejectedValue(new Error("Job not found"));
    const response = await POST(
      new Request(
        "http://localhost/api/ai/outfit/run?job=11111111-1111-4111-8111-111111111111",
        {
          method: "POST",
          headers: { Authorization: "Bearer good" },
        },
      ),
    );
    expect(response.status).toBe(404);
  });

  it("returns 200 on a successful job", async () => {
    authorize.mockReturnValue(true);
    processJob.mockResolvedValue({ ok: true, analysisId: "analysis-1" });
    const response = await POST(
      new Request(
        "http://localhost/api/ai/outfit/run?job=11111111-1111-4111-8111-111111111111",
        {
          method: "POST",
          headers: { Authorization: "Bearer good" },
        },
      ),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      analysisId: "analysis-1",
    });
  });
});
