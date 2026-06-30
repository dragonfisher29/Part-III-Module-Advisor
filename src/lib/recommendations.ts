import { formatAssessmentPreference, getAssessmentPreferenceMatchScore } from "./assessment";
import type {
  ModuleRecord,
  RankedModule,
  RecommendationResult,
} from "./types";
import type { AdvisorFormData } from "./validation";

type InterestTag = AdvisorFormData["interests"][number];

const PLAN_COUNTS = {
  semester1: 3,
  semester2: 2,
} as const;

const INTEREST_WEIGHTS: Record<InterestTag, string[]> = {
  "ai-ml": ["ai-ml", "data"],
  data: ["data", "maths-optimisation"],
  "web-cloud": ["web-cloud", "practical"],
  "systems-security": ["systems-security"],
  "human-centred": ["human-centred"],
  "creative-visual": ["creative-visual", "practical"],
  "maths-optimisation": ["maths-optimisation", "theory"],
};

const CAREER_WEIGHTS: Record<AdvisorFormData["careerGoal"], string[]> = {
  "software-engineering": ["web-cloud", "practical", "data"],
  "ai-data": ["ai-ml", "data", "maths-optimisation"],
  "research-academia": ["theory", "maths-optimisation", "ai-ml"],
  cybersecurity: ["systems-security", "theory"],
  "product-ux": ["human-centred", "creative-visual", "web-cloud"],
  undecided: ["practical", "human-centred", "data"],
};

function getPreviouslyTakenCodes(answers: AdvisorFormData) {
  return new Set(answers.priorModules);
}

function buildReasons(module: ModuleRecord, answers: AdvisorFormData) {
  const reasons: string[] = [];

  if (answers.interests.some((interest) => INTEREST_WEIGHTS[interest].some((tag) => module.tags.includes(tag)))) {
    reasons.push("Matches your stated subject interests.");
  }

  if (CAREER_WEIGHTS[answers.careerGoal].some((tag) => module.tags.includes(tag))) {
    reasons.push("Supports your current career direction.");
  }

  const assessmentMatchScore = getAssessmentPreferenceMatchScore(module, answers.assessmentPreference);

  if (assessmentMatchScore >= 4) {
    reasons.push(`Exactly matches your ${formatAssessmentPreference(answers.assessmentPreference).toLowerCase()} assessment preference.`);
  } else if (assessmentMatchScore >= 2) {
    reasons.push(`Fits your ${formatAssessmentPreference(answers.assessmentPreference).toLowerCase()} assessment preference.`);
  }

  if (module.workloadProfile === answers.workloadPreference) {
    reasons.push(`Aligns with your preferred ${answers.workloadPreference} workload.`);
  }

  if (answers.theoryPracticeBalance === "practical" && module.tags.includes("practical")) {
    reasons.push("Leans toward applied and hands-on work.");
  }

  if (answers.theoryPracticeBalance === "theory" && module.tags.includes("theory")) {
    reasons.push("Leans toward analytical and theory-heavy study.");
  }

  if (answers.broadeningInterest && ["MATH3081", "MATH3082"].includes(module.code)) {
    reasons.push("Adds a broadening option outside the main CS track.");
  }

  if (answers.aiMlInterest && module.tags.includes("ai-ml")) {
    reasons.push("Supports your preference for AI/ML-heavy content.");
  }

  return reasons.slice(0, 3);
}

function scoreModule(module: ModuleRecord, answers: AdvisorFormData) {
  let score = 0;

  for (const interest of answers.interests) {
    for (const boostedTag of INTEREST_WEIGHTS[interest]) {
      if (module.tags.includes(boostedTag)) {
        score += 3;
      }
    }
  }

  for (const boostedTag of CAREER_WEIGHTS[answers.careerGoal]) {
    if (module.tags.includes(boostedTag)) {
      score += 2;
    }
  }

  score += getAssessmentPreferenceMatchScore(module, answers.assessmentPreference);

  if (module.workloadProfile === answers.workloadPreference) {
    score += 2;
  }

  if (answers.theoryPracticeBalance === "practical" && module.tags.includes("practical")) {
    score += 2;
  }

  if (answers.theoryPracticeBalance === "theory" && module.tags.includes("theory")) {
    score += 2;
  }

  if (answers.broadeningInterest && ["MATH3081", "MATH3082"].includes(module.code)) {
    score += 4;
  }

  if (!answers.broadeningInterest && ["MATH3081", "MATH3082"].includes(module.code)) {
    score -= 1;
  }

  if (answers.aiMlInterest && module.tags.includes("ai-ml")) {
    score += 3;
  }

  if (module.code === "COMP3222" && answers.aiMlInterest) {
    score += 2;
  }

  return score;
}

function getBlockedBy(
  module: ModuleRecord,
  selectedEarlierCodes: Set<string>,
  allModules: ModuleRecord[],
  previouslyTakenCodes: Set<string>,
) {
  const blockers: string[] = [];

  for (const prerequisite of module.prerequisites) {
    if (selectedEarlierCodes.has(prerequisite) || previouslyTakenCodes.has(prerequisite)) {
      continue;
    }

    const prereqModule = allModules.find((candidate) => candidate.code === prerequisite);

    if (!prereqModule) {
      blockers.push(`${module.code} expects ${prerequisite}, but you have not marked it as already taken.`);
      continue;
    }

    const detail =
      prereqModule.semester === "semester1"
        ? `${module.code} requires ${prerequisite}, but it is not included in the Semester 1 plan.`
        : `${module.code} requires ${prerequisite}, which is not scheduled earlier in the plan.`;
    blockers.push(detail);
  }

  if (
    module.code === "COMP3225" &&
    !selectedEarlierCodes.has("COMP3222") &&
    !selectedEarlierCodes.has("COMP3223") &&
    !previouslyTakenCodes.has("COMP3222") &&
    !previouslyTakenCodes.has("COMP3223")
  ) {
    blockers.push("COMP3225 needs a machine learning module first.");
  }

  if (module.code === "COMP3224" && !selectedEarlierCodes.has("COMP3223") && !previouslyTakenCodes.has("COMP3223")) {
    blockers.push("COMP3224 requires COMP3223, which is not available in the current semester source list.");
  }

  return blockers;
}

function rankModules(modules: ModuleRecord[], answers: AdvisorFormData): RankedModule[] {
  return modules
    .map((module) => ({
      module,
      score: scoreModule(module, answers),
      reasons: buildReasons(module, answers),
      blockedBy: [],
    }))
    .sort((left, right) => right.score - left.score || left.module.code.localeCompare(right.module.code));
}

function chooseBalancedModules(
  rankedSemester1: RankedModule[],
  rankedSemester2: RankedModule[],
  modules: ModuleRecord[],
  answers: AdvisorFormData,
) {
  const chosenSemester1: RankedModule[] = [];
  const chosenSemester2: RankedModule[] = [];
  const selectedEarlierCodes = new Set<string>();
  const previouslyTakenCodes = getPreviouslyTakenCodes(answers);
  const warnings: string[] = [];

  for (const candidate of rankedSemester1) {
    if (chosenSemester1.length >= PLAN_COUNTS.semester1) {
      break;
    }

    if (candidate.module.code === "COMP3223" && selectedEarlierCodes.has("COMP3222")) {
      continue;
    }

    chosenSemester1.push(candidate);
    selectedEarlierCodes.add(candidate.module.code);
  }

  for (const candidate of rankedSemester2) {
    if (chosenSemester2.length >= PLAN_COUNTS.semester2) {
      break;
    }

    const blockedBy = getBlockedBy(candidate.module, selectedEarlierCodes, modules, previouslyTakenCodes);

    if (blockedBy.length > 0) {
      warnings.push(...blockedBy);
      continue;
    }

    chosenSemester2.push({
      ...candidate,
      blockedBy,
    });
  }

  return {
    semester1: chosenSemester1,
    semester2: chosenSemester2,
    warnings: [...new Set(warnings)],
  };
}

export function generateRecommendations(modules: ModuleRecord[], answers: AdvisorFormData): RecommendationResult {
  const semester1Modules = modules.filter((module) => module.semester === "semester1");
  const semester2Modules = modules.filter((module) => module.semester === "semester2");
  const rankedSemester1 = rankModules(semester1Modules, answers);
  const selectedEarlierCodes = new Set(rankedSemester1.slice(0, 3).map((item) => item.module.code));
  const previouslyTakenCodes = getPreviouslyTakenCodes(answers);
  const rankedSemester2 = rankModules(semester2Modules, answers).map((item) => ({
    ...item,
    blockedBy: getBlockedBy(item.module, selectedEarlierCodes, modules, previouslyTakenCodes),
  }));
  const balancedPlan = chooseBalancedModules(rankedSemester1, rankedSemester2, modules, answers);

  return {
    semester1: rankedSemester1.slice(0, 5),
    semester2: rankedSemester2.slice(0, 5),
    balancedPlan: {
      semester1: balancedPlan.semester1,
      semester2: balancedPlan.semester2,
    },
    warnings: balancedPlan.warnings,
    persisted: false,
  };
}
