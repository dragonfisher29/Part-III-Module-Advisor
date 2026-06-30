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

describe("catalog workload parsing", () => {
  it("classifies representative modules into different workload bands", () => {
    const catalog = getModuleCatalog();
    const naturalLanguageProcessing = catalog.find((item) => item.code === "COMP3225");
    const advancedDatabases = catalog.find((item) => item.code === "COMP3211");
    const cloudApplicationDevelopment = catalog.find((item) => item.code === "COMP3207");

    expect(naturalLanguageProcessing?.workloadProfile).toBe("light");
    expect(advancedDatabases?.workloadProfile).toBe("balanced");
    expect(cloudApplicationDevelopment?.workloadProfile).toBe("intensive");
  });

  it("produces more than one workload category across the real catalog", () => {
    const profiles = new Set(getModuleCatalog().map((item) => item.workloadProfile));

    expect(profiles.size).toBeGreaterThan(1);
    expect([...profiles]).toEqual(expect.arrayContaining(["light", "balanced", "intensive"]));
  });
});
