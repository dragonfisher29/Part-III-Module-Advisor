import type { AssessmentPreference, GranularAssessmentStyle, ModuleRecord } from "./types";

export const ASSESSMENT_PREFERENCE_OPTIONS = [
  "coursework",
  "exam",
  "continuous-assessment",
  "final-assessment",
] as const satisfies readonly AssessmentPreference[];

const ASSESSMENT_PREFERENCE_KEYWORDS: Record<AssessmentPreference, string[]> = {
  coursework: ["coursework", "continuous assessment"],
  exam: ["examination", "exam", "final assessment"],
  "continuous-assessment": ["continuous assessment"],
  "final-assessment": ["final assessment"],
};

export function formatGranularAssessmentStyle(style: GranularAssessmentStyle) {
  switch (style) {
    case "pure-coursework":
      return "Pure Coursework";
    case "pure-exam":
      return "Pure Exam";
    case "coursework-heavy":
      return "Coursework Heavy";
    case "exam-heavy":
      return "Exam Heavy";
    case "continuous-assessment-heavy":
      return "Continuous Assessment Heavy";
    case "final-assessment-heavy":
      return "Final Assessment Heavy";
    case "balanced-mix":
      return "Balanced Mix";
    case "mixed-unknown":
      return "Mixed";
  }
}

export function formatAssessmentPreference(preference: AssessmentPreference) {
  switch (preference) {
    case "coursework":
      return "Coursework";
    case "exam":
      return "Exam";
    case "continuous-assessment":
      return "Continuous Assessment";
    case "final-assessment":
      return "Final Assessment";
  }
}

function normalizeAssessmentText(module: ModuleRecord) {
  return `${module.assessment} ${module.granularAssessment} ${module.assessmentTags.join(" ")}`.toLowerCase();
}

export function getAssessmentPreferenceMatchScore(module: ModuleRecord, preference: AssessmentPreference) {
  const normalized = normalizeAssessmentText(module);

  if (preference === "coursework") {
    if (module.granularAssessment === "pure-coursework") {
      return 4;
    }

    if (module.assessment === "coursework") {
      return 3;
    }
  }

  if (preference === "exam") {
    if (module.granularAssessment === "pure-exam") {
      return 4;
    }

    if (module.assessment === "exam") {
      return 3;
    }
  }

  if (preference === "continuous-assessment") {
    if (module.granularAssessment === "continuous-assessment-heavy") {
      return 4;
    }
  }

  if (preference === "final-assessment") {
    if (module.granularAssessment === "final-assessment-heavy") {
      return 4;
    }
  }

  const keywords = ASSESSMENT_PREFERENCE_KEYWORDS[preference];

  if (keywords.some((keyword) => normalized.includes(keyword))) {
    return 2;
  }

  return 0;
}
