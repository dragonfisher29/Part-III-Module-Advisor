import { describe, expect, it } from "vitest";

import { getModuleCatalog } from "./catalog";

describe("catalog assessment parsing", () => {
  it("parses granular assessment details from the real Computer Vision source file", () => {
    const module = getModuleCatalog().find((item) => item.code === "COMP3204");

    expect(module).toBeDefined();
    expect(module?.granularAssessment).toBe("final-assessment-heavy");
    expect(module?.assessmentTags).toEqual(["Continuous Assessment 40 %", "Final Assessment 60 %"]);
  });
});
