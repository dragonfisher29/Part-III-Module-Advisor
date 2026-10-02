import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { appendRunToCsv, buildRunRow, escapeCsvField } from "./run-log";
import type { RecommendationResult } from "./types";
import type { AdvisorFormData } from "./validation";

const submission: AdvisorFormData = {
  name: "Test User",
  email: "test@example.com",
  degreeRoute: "Computer Science Part III",
  interests: ["ai-ml", "data"],
  assessmentPreference: "coursework",
  workloadPreference: "balanced",
  careerGoal: "ai-data",
  broadeningInterest: false,
  aiMlInterest: true,
  priorModules: ["COMP2208"],
  theoryPracticeBalance: "balanced",
  notes: 'Likes "hands-on" work,\nnot exams',
};

const recommendations: RecommendationResult = {
  semester1: [],
  semester2: [],
  balancedPlan: { semester1: [], semester2: [] },
  warnings: ["Example warning"],
};

describe("escapeCsvField", () => {
  it("quotes fields containing commas, quotes, or newlines", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(escapeCsvField("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvField("@cmd")).toBe("'@cmd");
  });
});

describe("appendRunToCsv", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "run-log-"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("writes the header once and appends a row per run", async () => {
    const filePath = path.join(dir, "nested", "runs.csv");

    await appendRunToCsv(submission, recommendations, filePath);
    await appendRunToCsv(submission, recommendations, filePath);

    const contents = await fs.readFile(filePath, "utf8");
    const headerCount = contents.split("\n").filter((line) => line.startsWith("saved_at,")).length;

    expect(headerCount).toBe(1);
    expect(contents.match(/Test User/g)).toHaveLength(2);
    expect(contents).toContain('"Likes ""hands-on"" work,\nnot exams"');
  });

  it("serialises list fields with semicolons", () => {
    const row = buildRunRow(submission, recommendations, new Date("2026-01-01T00:00:00Z"));

    expect(row.startsWith("2026-01-01T00:00:00.000Z,Test User,test@example.com,")).toBe(true);
    expect(row).toContain(",ai-ml; data,");
    expect(row).toContain(",COMP2208,");
    expect(row.endsWith(",Example warning")).toBe(true);
  });
});
