import { profileUpdateSchema } from "@/lib/profile/schemas";

describe("profileUpdateSchema", () => {
  it("accepts a complete preference set", () => {
    expect(
      profileUpdateSchema.parse({
        display_name: "Alex",
        country: "IN",
        language: "en",
        currency: "INR",
        timezone: "Asia/Kolkata",
      }),
    ).toEqual({
      display_name: "Alex",
      country: "IN",
      language: "en",
      currency: "INR",
      timezone: "Asia/Kolkata",
    });
  });

  it("rejects an empty display name", () => {
    expect(() =>
      profileUpdateSchema.parse({
        display_name: "   ",
        country: "IN",
        language: "en",
        currency: "INR",
        timezone: "Asia/Kolkata",
      }),
    ).toThrow();
  });
});
