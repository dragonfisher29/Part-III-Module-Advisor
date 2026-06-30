import { describe, expect, it } from "vitest";

import { generateRecommendations } from "./recommendations";
import type { ModuleRecord } from "./types";
import type { AdvisorFormData } from "./validation";

const baseAnswers: AdvisorFormData = {
  name: "Test User",
  email: "test@example.com",
  degreeRoute: "Computer Science Part III",
  interests: ["ai-ml"],
  assessmentPreference: "coursework",
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
    syllabusSummary: "Cloud platforms, deployment, and application design.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
    assessmentFeedbackSummary: "Continuous Assessment 100%.",
    assessment: "coursework",
    granularAssessment: "pure-coursework",
    assessmentTags: ["Continuous Assessment 100%"],
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
    syllabusSummary: "Image processing, feature extraction, and recognition.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
    assessmentFeedbackSummary: "Mixed assessment.",
    assessment: "mixed",
    granularAssessment: "final-assessment-heavy",
    assessmentTags: ["Continuous Assessment 40 %", "Final Assessment 60 %"],
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
    syllabusSummary: "Supervised learning, labs, and model evaluation.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lab|24 hrs|",
    assessmentFeedbackSummary: "Coursework and final assessment.",
    assessment: "mixed",
    granularAssessment: "balanced-mix",
    assessmentTags: ["Examination 50 %", "Coursework 50 %"],
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
    syllabusSummary: "Language models, parsing, and text classification.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
    assessmentFeedbackSummary: "Final exam.",
    assessment: "exam",
    granularAssessment: "pure-exam",
    assessmentTags: ["Examination 100 %"],
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
    syllabusSummary: "Transactions, storage, and query processing.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|20 hrs|",
    assessmentFeedbackSummary: "Mixed assessment.",
    assessment: "mixed",
    granularAssessment: "final-assessment-heavy",
    assessmentTags: ["Continuous Assessment 25 %", "Final Assessment 75 %"],
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
    syllabusSummary: "Causality, inference, and ML applications.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
    assessmentFeedbackSummary: "Mixed assessment.",
    assessment: "mixed",
    granularAssessment: "pure-coursework",
    assessmentTags: ["Coursework 100%", "Group Work"],
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
    syllabusSummary: "Biological data analysis and algorithms.",
    studyTime: "|Type|Hours|\n|---|---|\n|Lecture|18 hrs|",
    assessmentFeedbackSummary: "Mixed assessment.",
    assessment: "mixed",
    granularAssessment: "pure-coursework",
    assessmentTags: ["Coursework 30 %"],
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

  it("boosts modules whose final assessment style matches the questionnaire preference", () => {
    const result = generateRecommendations(modules, {
      ...baseAnswers,
      interests: ["web-cloud"],
      aiMlInterest: false,
      careerGoal: "software-engineering",
      assessmentPreference: "final-assessment",
    });

    expect(result.semester2[0]?.module.code).toBe("COMP3211");
  });

  it("matches continuous assessment preferences against detailed assessment tags", () => {
    const result = generateRecommendations(modules, {
      ...baseAnswers,
      interests: ["web-cloud"],
      aiMlInterest: false,
      careerGoal: "software-engineering",
      assessmentPreference: "continuous-assessment",
    });

    expect(result.semester1.some((item) => item.module.code === "COMP3204")).toBe(true);
    expect(result.semester2.some((item) => item.module.code === "COMP3211")).toBe(true);
  });

  it("optimizes the full 3+2 plan when a lower-ranked semester 1 module unlocks a stronger semester 2 option", () => {
    const optimizedAnswers: AdvisorFormData = {
      ...baseAnswers,
      interests: ["ai-ml"],
      careerGoal: "ai-data",
      workloadPreference: "balanced",
      assessmentPreference: "coursework",
      aiMlInterest: true,
    };

    const optimizerModules: ModuleRecord[] = [
      {
        code: "COMP3101",
        title: "Applied AI Systems",
        semester: "semester1",
        credits: 15,
        overview: "Applied AI systems work.",
        syllabusSummary: "AI and data systems.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: ["ai-ml", "data"],
        workloadProfile: "balanced",
        sourceFile: "Applied AI Systems.md",
      },
      {
        code: "COMP3102",
        title: "Data Pipelines",
        semester: "semester1",
        credits: 15,
        overview: "Data engineering and pipelines.",
        syllabusSummary: "Data workflows and analytics.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: ["ai-ml", "data"],
        workloadProfile: "balanced",
        sourceFile: "Data Pipelines.md",
      },
      {
        code: "COMP3103",
        title: "AI Theory Seminar",
        semester: "semester1",
        credits: 15,
        overview: "Theory-heavy AI seminar.",
        syllabusSummary: "Research topics in AI.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: ["ai-ml", "data"],
        workloadProfile: "balanced",
        sourceFile: "AI Theory Seminar.md",
      },
      {
        code: "COMP3104",
        title: "Machine Learning Foundations",
        semester: "semester1",
        credits: 15,
        overview: "Foundations for advanced AI modules.",
        syllabusSummary: "ML foundations.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: ["ai-ml"],
        workloadProfile: "balanced",
        sourceFile: "Machine Learning Foundations.md",
      },
      {
        code: "COMP3201",
        title: "Advanced NLP",
        semester: "semester2",
        credits: 15,
        overview: "Advanced NLP module.",
        syllabusSummary: "Applied NLP and models.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: ["COMP3104"],
        prerequisiteNote: "Requires COMP3104.",
        tags: ["ai-ml", "data"],
        workloadProfile: "balanced",
        sourceFile: "Advanced NLP.md",
      },
      {
        code: "COMP3202",
        title: "Systems Topics",
        semester: "semester2",
        credits: 15,
        overview: "Systems topic survey.",
        syllabusSummary: "Systems overview.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: [],
        workloadProfile: "balanced",
        sourceFile: "Systems Topics.md",
      },
      {
        code: "COMP3203",
        title: "General CS Topics",
        semester: "semester2",
        credits: 15,
        overview: "General computing topics.",
        syllabusSummary: "General topics.",
        studyTime: "|Type|Hours|\n|---|---|\n|Lecture|24 hrs|",
        assessmentFeedbackSummary: "Coursework.",
        assessment: "coursework",
        granularAssessment: "pure-coursework",
        assessmentTags: ["Coursework 100%"],
        prerequisites: [],
        prerequisiteNote: null,
        tags: [],
        workloadProfile: "balanced",
        sourceFile: "General CS Topics.md",
      },
    ];

    const result = generateRecommendations(optimizerModules, optimizedAnswers);

    expect(result.semester1.slice(0, 3).map((item) => item.module.code)).toEqual(["COMP3101", "COMP3102", "COMP3103"]);
    expect(result.balancedPlan.semester1.some((item) => item.module.code === "COMP3104")).toBe(true);
    expect(result.balancedPlan.semester1.some((item) => item.module.code === "COMP3103")).toBe(false);
    expect(result.balancedPlan.semester2.some((item) => item.module.code === "COMP3201")).toBe(true);
  });
});
