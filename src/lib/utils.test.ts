import { cn } from "./utils";

describe("cn", () => {
  it("joins class names and ignores falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("lets the last conflicting Tailwind utility win", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });
});
