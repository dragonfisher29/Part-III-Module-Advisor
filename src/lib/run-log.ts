import fs from "node:fs/promises";
import path from "node:path";

import type { RankedModule, RecommendationResult } from "./types";
import type { AdvisorFormData } from "./validation";

export const RUN_LOG_PATH = path.join(process.cwd(), "data", "runs.csv");

const COLUMNS = [
  "saved_at",
  "name",
  "email",
  "degree_route",
  "interests",
  "assessment_preference",
  "workload_preference",
  "career_goal",
  "broadening_interest",
  "ai_ml_interest",
  "prior_modules",
  "theory_practice_balance",
  "notes",
  "plan_semester_1",
  "plan_semester_2",
  "top_semester_1",
  "top_semester_2",
  "warnings",
] as const;

// Spreadsheet apps evaluate cells starting with these characters as formulas.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvField(value: string) {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;

  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function formatModules(modules: RankedModule[]) {
  return modules.map(({ module }) => `${module.code} ${module.title}`).join("; ");
}

export function buildRunRow(
  submission: AdvisorFormData,
  recommendations: RecommendationResult,
  savedAt: Date = new Date(),
) {
  const values: Record<(typeof COLUMNS)[number], string> = {
    saved_at: savedAt.toISOString(),
    name: submission.name,
    email: submission.email,
    degree_route: submission.degreeRoute,
    interests: submission.interests.join("; "),
    assessment_preference: submission.assessmentPreference,
    workload_preference: submission.workloadPreference,
    career_goal: submission.careerGoal,
    broadening_interest: String(submission.broadeningInterest),
    ai_ml_interest: String(submission.aiMlInterest),
    prior_modules: submission.priorModules.join("; "),
    theory_practice_balance: submission.theoryPracticeBalance,
    notes: submission.notes,
    plan_semester_1: formatModules(recommendations.balancedPlan.semester1),
    plan_semester_2: formatModules(recommendations.balancedPlan.semester2),
    top_semester_1: formatModules(recommendations.semester1),
    top_semester_2: formatModules(recommendations.semester2),
    warnings: recommendations.warnings.join("; "),
  };

  return COLUMNS.map((column) => escapeCsvField(values[column])).join(",");
}

export async function appendRunToCsv(
  submission: AdvisorFormData,
  recommendations: RecommendationResult,
  filePath: string = RUN_LOG_PATH,
) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const existing = await fs.stat(filePath).catch(() => null);
  const header = !existing || existing.size === 0 ? `${COLUMNS.join(",")}\n` : "";

  await fs.appendFile(filePath, `${header}${buildRunRow(submission, recommendations)}\n`, "utf8");

  return filePath;
}
