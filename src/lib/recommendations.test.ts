import { describe, expect, it } from "vitest";

import { generateRecommendations } from "./recommendations";
import type { ModuleRecord } from "./types";
import type { AdvisorFormData } from "./validation";

const baseAnswers: AdvisorFormData = {
  name: "Test User",
  email: "test@example.com",
  degreeRoute: "Computer Science Part III",
  interests: ["ai-ml"],
  assessmentPreference: "mixed",
  workloadPreference: "balanced",
  careerGoal: "ai-data",
  broadeningInterest: false,
  aiMlInterest: true,
  priorModules: [],
  theoryPracticeBalance: "balanced",
  notes: "",
};

const modules: ModuleRecord[] = [
  {
    code: "COMP3207",
    title: "Cloud Application Development",
    semester: "semester1",
    credits: 15,
    overview: "Cloud applications with Python and JavaScript.",
    assessment: "coursework",
    prerequisites: [],
    prerequisiteNote: null,
    tags: ["web-cloud", "practical"],
    workloadProfile: "intensive",
    sourceFile: "Cloud Application Development.md",
  },
  {
    code: "COMP3204",
    title: "Computer Vision",
    semester: "semester1",
    credits: 15,
    overview: "Visual computing and image understanding.",
    assessment: "mixed",
    prerequisites: [],
    prerequisiteNote: null,
    tags: ["ai-ml", "creative-visual", "practical"],
    workloadProfile: "balanced",
    sourceFile: "Computer Vision.md",
  },
  {
    code: "COMP3222",
    title: "Machine Learning Technologies",
    semester: "semester1",
    credits: 15,
    overview: "Hands-on machine learning and data work.",
    assessment: "mixed",
    prerequisites: [],
    prerequisiteNote: null,
    tags: ["ai-ml", "data", "practical", "theory"],
    workloadProfile: "balanced",
    sourceFile: "Machine Learning Technologies 2026-27.md",
  },
  {
    code: "COMP3225",
    title: "Natural Language Processing",
    semester: "semester2",
    credits: 15,
    overview: "NLP algorithms and applications.",
    assessment: "exam",
    prerequisites: ["COMP3222"],
    prerequisiteNote: "Requires COMP3222 or COMP3223.",
    tags: ["ai-ml", "data", "theory"],
    workloadProfile: "light",
    sourceFile: "Natural Language Processing.md",
  },
  {
    code: "COMP3211",
    title: "Advanced Databases",
    semester: "semester2",
    credits: 15,
    overview: "Database systems and implementation.",
    assessment: "mixed",
    prerequisites: [],
    prerequisiteNote: null,
    tags: ["web-cloud", "data", "practical"],
    workloadProfile: "balanced",
    sourceFile: "Advanced Databases.md",
  },
  {
    code: "COMP3224",
    title: "Causal Reasoning and Machine Learning",
    semester: "semester2",
    credits: 15,
    overview: "Causal reasoning for machine learning.",
    assessment: "mixed",
    prerequisites: ["COMP3223"],
    prerequisiteNote: "Requires COMP3223.",
    tags: ["ai-ml", "maths-optimisation", "theory"],
    workloadProfile: "balanced",
    sourceFile: "Causal Reasoning and Machine Learning.md",
  },
  {
    code: "COMP3212",
    title: "Computational Biology",
    semester: "semester2",
    credits: 15,
    overview: "Computational methods in biology.",
    assessment: "mixed",
    prerequisites: ["COMP2208"],
    prerequisiteNote: "Requires COMP2208.",
    tags: ["data", "theory"],
    workloadProfile: "balanced",
    sourceFile: "Computational Biology.md",
  },
];

describe("generateRecommendations", () => {
  it("boosts COMP3222 for AI/ML-focused users in semester 1", () => {
    const result = generateRecommendations(modules, baseAnswers);

    expect(result.semester1[0]?.module.code).toBe("COMP3222");
  });

  it("keeps NLP in the balanced semester 2 plan when a valid ML prerequisite is chosen first", () => {
    const result = generateRecommendations(modules, baseAnswers);

    expect(result.balancedPlan.semester2.some((item) => item.module.code === "COMP3225")).toBe(true);
  });

  it("builds a 3-module semester 1 plan and a 2-module semester 2 plan", () => {
    const result = generateRecommendations(modules, baseAnswers);

    expect(result.balancedPlan.semester1).toHaveLength(3);
    expect(result.balancedPlan.semester2).toHaveLength(2);
  });

  it("warns when a module depends on unavailable prerequisite data", () => {
    const result = generateRecommendations(modules, baseAnswers);

    expect(result.warnings.some((warning) => warning.includes("COMP3224"))).toBe(true);
  });

  it("treats selected prior-year modules as satisfied prerequisites", () => {
    const result = generateRecommendations(modules, {
      ...baseAnswers,
      priorModules: ["COMP2208"],
    });

    expect(result.warnings.some((warning) => warning.includes("COMP2208"))).toBe(false);
  });
});
