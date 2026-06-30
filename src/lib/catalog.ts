import fs from "node:fs";
import path from "node:path";

import type { AssessmentStyle, ModuleRecord, WorkloadPreference } from "@/lib/types";

const ROOT_DIR = process.cwd();
const CONTENT_DIR_CANDIDATES = [path.join(ROOT_DIR, "source"), ROOT_DIR];

const SEMESTER_FILES = {
  semester1: "Semester I.md",
  semester2: "Semester II.md",
} as const;

const YEAR_SUFFIX_PATTERN = /\s+\d{4}-\d{2}$/;
const MODULE_CODE_PATTERN = /\b[A-Z]{4}\d{4}\b/;

let cachedCatalog: ModuleRecord[] | null = null;

function resolveWorkspacePath(fileName: string) {
  for (const baseDir of CONTENT_DIR_CANDIDATES) {
    const candidatePath = path.join(baseDir, fileName);

    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    `Unable to find source file "${fileName}". Checked: ${CONTENT_DIR_CANDIDATES.join(", ")}`,
  );
}

function readWorkspaceFile(fileName: string) {
  return fs.readFileSync(resolveWorkspacePath(fileName), "utf8");
}

function extractSection(content: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(
    new RegExp(`## ${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i"),
  );

  return match?.[1].trim() ?? "";
}

function parseSemesterList(fileName: string) {
  const content = readWorkspaceFile(fileName);
  return [...content.matchAll(/\[\[(.+?)\]\]/g)].map((match) => match[1].trim());
}

function extractAssessmentStyle(content: string): AssessmentStyle {
  const summative = content.match(/#### Summative([\s\S]*?)(#### Referral|---)/i)?.[1] ?? "";
  const lower = summative.toLowerCase();

  if (lower.includes("examination") && (lower.includes("coursework") || lower.includes("continuous assessment"))) {
    return "mixed";
  }

  if (lower.includes("continuous assessment") || lower.includes("coursework")) {
    return lower.includes("100 %") ? "coursework" : "mixed";
  }

  if (lower.includes("examination")) {
    return "exam";
  }

  return "mixed";
}

function extractPrerequisites(content: string, moduleCode: string) {
  const requisites = extractSection(content, "Requisites");
  const codes = [...new Set([...requisites.matchAll(/\b[A-Z]{4}\d{4}\b/g)].map((match) => match[0]))].filter(
    (code) => code !== moduleCode,
  );
  const note = requisites.replace(/\s+/g, " ").trim();

  return {
    prerequisites: codes,
    prerequisiteNote: note || null,
  };
}

function inferTags(title: string, overview: string, syllabus: string, assessment: AssessmentStyle) {
  const text = `${title} ${overview} ${syllabus}`.toLowerCase();
  const tags = new Set<string>();

  if (/(machine learning|neural|nlp|language model|classification|regression|clustering|embeddings|data)/.test(text)) {
    tags.add("ai-ml");
    tags.add("data");
  }

  if (/(vision|image|graphics|visual)/.test(text)) {
    tags.add("creative-visual");
    tags.add("ai-ml");
  }

  if (/(cloud|web|javascript|node|python|app|software|database)/.test(text)) {
    tags.add("web-cloud");
    tags.add("practical");
  }

  if (/(security|network|embedded|real-time|cyber)/.test(text)) {
    tags.add("systems-security");
  }

  if (/(history|social|human|society|interaction|ethics)/.test(text)) {
    tags.add("human-centred");
  }

  if (/(optimisation|optimization|operational research|math|mathematical|causal)/.test(text)) {
    tags.add("maths-optimisation");
    tags.add("theory");
  }

  if (/(lab|implement|practical|design and implement|application)/.test(text)) {
    tags.add("practical");
  }

  if (/(theory|algorithmic|analysis|modelling|proof|understanding)/.test(text)) {
    tags.add("theory");
  }

  if (assessment === "coursework") {
    tags.add("practical");
  }

  if (assessment === "exam") {
    tags.add("theory");
  }

  return [...tags];
}

function inferWorkloadProfile(content: string, assessment: AssessmentStyle): WorkloadPreference {
  const lower = content.toLowerCase();

  if (assessment === "coursework" || /project|laboratory|lab|specialist laboratory/.test(lower)) {
    return "intensive";
  }

  if (assessment === "exam") {
    return "light";
  }

  return "balanced";
}

function extractModuleCode(content: string, titleFromSemester: string) {
  const headingMatch = content.match(/# \*\*([A-Z]{4}\d{4}) - (.+?)\*\*/);

  if (headingMatch?.[1]) {
    return headingMatch[1];
  }

  const firstMatch = content.match(MODULE_CODE_PATTERN)?.[0];

  if (firstMatch) {
    return firstMatch;
  }

  return titleFromSemester.slice(0, 8);
}

function extractModuleTitle(content: string, fallbackTitle: string) {
  const headingMatch = content.match(/# \*\*[A-Z]{4}\d{4} - (.+?)\*\*/);

  if (headingMatch?.[1]) {
    return headingMatch[1].replace(YEAR_SUFFIX_PATTERN, "").trim();
  }

  return fallbackTitle.replace(YEAR_SUFFIX_PATTERN, "").trim();
}

function parseModule(titleFromSemester: string, semester: ModuleRecord["semester"]): ModuleRecord {
  const fileName = `${titleFromSemester}.md`;
  const content = readWorkspaceFile(fileName);
  const code = extractModuleCode(content, titleFromSemester);
  const headingTitle = extractModuleTitle(content, titleFromSemester);
  const overview = extractSection(content, "Module overview").replace(/\s+/g, " ").trim();
  const syllabus = extractSection(content, "Syllabus summary").replace(/\s+/g, " ").trim();
  const creditsMatch = content.match(/\|School\|Module Code\|Credit Points\|Level\|[\s\S]*?\|.*?\|.*?\|(\d+)\|/);
  const credits = Number(creditsMatch?.[1] ?? 15);
  const assessment = extractAssessmentStyle(content);
  const { prerequisites, prerequisiteNote } = extractPrerequisites(content, code);
  const tags = inferTags(headingTitle, overview, syllabus, assessment);

  return {
    code,
    title: headingTitle,
    semester,
    credits,
    overview,
    assessment,
    prerequisites,
    prerequisiteNote,
    tags,
    workloadProfile: inferWorkloadProfile(`${overview} ${syllabus} ${content}`, assessment),
    sourceFile: fileName,
  };
}

export function getModuleCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  cachedCatalog = [
    ...parseSemesterList(SEMESTER_FILES.semester1).map((title) => parseModule(title, "semester1")),
    ...parseSemesterList(SEMESTER_FILES.semester2).map((title) => parseModule(title, "semester2")),
  ];

  return cachedCatalog;
}
