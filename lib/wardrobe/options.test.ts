import {
  slotForCategory,
  slotsConflict,
} from "@/lib/wardrobe/options";

describe("wardrobe combination slots", () => {
  it("maps jeans and trousers to the same lower slot", () => {
    expect(slotForCategory("jeans")).toBe("lower");
    expect(slotForCategory("trousers")).toBe("lower");
    expect(slotsConflict("lower", "lower")).toBe(true);
  });

  it("blocks two footwear pieces", () => {
    expect(slotsConflict(slotForCategory("shoes"), slotForCategory("shoes"))).toBe(
      true,
    );
  });

  it("allows accessories together", () => {
    expect(
      slotsConflict(
        slotForCategory("accessories"),
        slotForCategory("accessories"),
      ),
    ).toBe(false);
  });

  it("blocks dress with tops or jeans", () => {
    expect(slotsConflict("dress", "upper")).toBe(true);
    expect(slotsConflict("dress", "lower")).toBe(true);
    expect(slotsConflict("dress", "footwear")).toBe(false);
  });
});
