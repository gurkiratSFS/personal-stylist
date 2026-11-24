import {
  MAX_PHOTO_BYTES,
  photoRegisterSchema,
} from "@/lib/photos/schemas";

describe("photoRegisterSchema", () => {
  it("requires storage consent to be true", () => {
    expect(
      photoRegisterSchema.safeParse({
        photo_type: "face",
        storage_path: "u1/p1/face.jpg",
        consent_storage: false,
      }).success,
    ).toBe(false);
  });

  it("accepts a valid face photo registration", () => {
    const parsed = photoRegisterSchema.parse({
      photo_type: "face",
      storage_path: "u1/p1/face.jpg",
      consent_storage: true,
      mime_type: "image/jpeg",
      bytes: 1024,
    });
    expect(parsed.photo_type).toBe("face");
  });

  it("rejects oversized byte counts", () => {
    expect(
      photoRegisterSchema.safeParse({
        photo_type: "full_body",
        storage_path: "u1/p1/body.jpg",
        consent_storage: true,
        bytes: MAX_PHOTO_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});
