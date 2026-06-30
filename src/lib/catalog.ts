import fs from "node:fs";
import path from "node:path";

import { getModuleSlug } from "./module-links";
import type { AssessmentStyle, GranularAssessmentStyle, ModuleRecord, WorkloadPreference } from "./types";

const ROOT_DIR = process.cwd();
const CONTENT_DIR_CANDIDATES = [path.join(ROOT_DIR, "source"), ROOT_DIR];

const SEMESTER_FILES = {
  semester1: "Semester I.md",
  semester2: "Semester II.md",
} as const;

const YEAR_SUFFIX_PATTERN = /\s+\d{4}-\d{2}$/;
const MODULE_CODE_PATTERN = /\b[A-Z]{4}\d{4}\b/;

type SummativeAssessmentRow = {
  method: string;
  contribution: string;
  groupWork: string;
};

type StudyTimeRow = {
  type: string;
  hours: number;
};

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

function extractSubsection(content: string, parentHeading: string, subHeading: string) {
  const parentSection = extractSection(content, parentHeading);

  if (!parentSection) {
    return "";
  }

  const escapedSubHeading = subHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = parentSection.match(
    new RegExp(`### ${escapedSubHeading}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`, "i"),
  );

  return match?.[1].trim() ?? "";
}

function parseSemesterList(fileName: string) {
  const content = readWorkspaceFile(fileName);
  return [...content.matchAll(/\[\[(.+?)\]\]/g)].map((match) => match[1].trim());
}

function extractAssessmentSubsection(content: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(
    new RegExp(`(?:^|\\r?\\n)#### ${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n#### |\\r?\\n### |\\r?\\n## |$)`, "i"),
  );

  return match?.[1].trim() ?? "";
}

function extractSummativeAssessmentRows(content: string): SummativeAssessmentRow[] {
  const summative = extractAssessmentSubsection(content, "Summative");
  const lines = summative
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 3) {
    return [];
  }

  const rows = lines
    .slice(2)
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells[0]);

  return rows.map((cells) => ({
    method: cells[0] ?? "",
    contribution: cells[1] ?? "",
    groupWork: cells[3] ?? "",
  }));
}

function extractAssessmentStyle(content: string): AssessmentStyle {
  const granularStyle = extractGranularStyle(content);

  if (granularStyle === "pure-coursework") {
    return "coursework";
  }

  if (granularStyle === "pure-exam") {
    return "exam";
  }

  return "mixed";
}

function extractGranularStyle(content: string): GranularAssessmentStyle {
  const summative = extractAssessmentSubsection(content, "Summative");
  const lower = summative.toLowerCase();

  const hasExam = lower.includes("examination") || lower.includes("exam");
  const hasFinal = lower.includes("final assessment");
  const hasCW = lower.includes("coursework");
  const hasCA = lower.includes("continuous assessment");

  if ((hasCW || hasCA) && !hasExam && !hasFinal) {
    return "pure-coursework";
  }

  if ((hasExam || hasFinal) && !hasCW && !hasCA) {
    return "pure-exam";
  }

  const percentages = lower.match(/\d+/g)?.map(Number) ?? [];

  if (percentages.length >= 2) {
    const [first, second] = percentages;

    if (first === 50 && second === 50) {
      return "balanced-mix";
    }

    const examPos = lower.indexOf("exam");
    const finalPos = lower.indexOf("final assessment");
    const cwPos = lower.indexOf("coursework");
    const caPos = lower.indexOf("continuous assessment");

    const positions = [
      { type: "exam", pos: examPos },
      { type: "final", pos: finalPos },
      { type: "coursework", pos: cwPos },
      { type: "continuous", pos: caPos },
    ]
      .filter((item) => item.pos !== -1)
      .sort((left, right) => left.pos - right.pos);

    if (positions.length >= 2) {
      const dominantType = first > second ? positions[0].type : positions[1].type;

      switch (dominantType) {
        case "exam":
          return "exam-heavy";
        case "final":
          return "final-assessment-heavy";
        case "coursework":
          return "coursework-heavy";
        case "continuous":
          return "continuous-assessment-heavy";
      }
    }
  }

  if (hasCA && !hasCW && (hasExam || hasFinal)) {
    return "continuous-assessment-heavy";
  }

  if (hasFinal && !hasExam && (hasCW || hasCA)) {
    return "final-assessment-heavy";
  }

  return "mixed-unknown";
}

function extractAssessmentTags(content: string) {
  const rows = extractSummativeAssessmentRows(content);
  const tags = rows.map((row) => {
    const contribution = row.contribution ? ` ${row.contribution}` : "";
    return `${row.method}${contribution}`.trim();
  });

  const hasGroupWork = rows.some((row) => row.groupWork.toLowerCase() === "yes");

  if (hasGroupWork) {
    tags.push("Group Work");
  }

  return [...new Set(tags)];
}

function extractStudyTimeRows(studyTime: string): StudyTimeRow[] {
  const lines = studyTime
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 3) {
    return [];
  }

  const rows = lines
    .slice(2)
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells[0] && cells[1]);

  return rows
    .map((cells) => ({
      type: cells[0] ?? "",
      hours: Number.parseFloat((cells[1] ?? "").replace(/[^\d.]/g, "")),
    }))
    .filter((row) => Number.isFinite(row.hours) && !/total study time/i.test(row.type));
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

function inferWorkloadProfile(studyTime: string, assessment: AssessmentStyle): WorkloadPreference {
  const rows = extractStudyTimeRows(studyTime);

  if (rows.length === 0) {
    if (assessment === "coursework") {
      return "intensive";
    }

    if (assessment === "exam") {
      return "light";
    }

    return "balanced";
  }

  const sumHours = (pattern: RegExp) =>
    rows.reduce((total, row) => (pattern.test(row.type.toLowerCase()) ? total + row.hours : total), 0);

  const totalHours = rows.reduce((total, row) => total + row.hours, 0);
  const assessmentTaskHours = sumHours(/assessment task|completion of assessment task|coursework|project/);
  const contactHours = sumHours(/lecture|teaching|tutorial|seminar|laboratory|workshop|studio/);
  const practicalHours = sumHours(/laboratory|workshop|studio/);
  const independentHours = sumHours(/independent study|wider reading|follow-up work|preparation|revision/);

  if (totalHours <= 0) {
    return "balanced";
  }

  const assessmentRatio = assessmentTaskHours / totalHours;
  const contactRatio = contactHours / totalHours;
  const practicalRatio = practicalHours / totalHours;
  const independentRatio = independentHours / totalHours;

  if (
    assessmentRatio >= 0.45 ||
    (assessmentRatio >= 0.35 && (practicalRatio >= 0.12 || contactRatio >= 0.28)) ||
    (assessment === "coursework" && assessmentRatio >= 0.4)
  ) {
    return "intensive";
  }

  if (
    (assessmentRatio <= 0.18 && independentRatio >= 0.6) ||
    (assessment === "exam" && assessmentRatio < 0.1 && independentRatio >= 0.55) ||
    (assessmentRatio <= 0.2 && practicalRatio < 0.1 && independentRatio >= 0.58)
  ) {
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
  const syllabusSummary = extractSection(content, "Syllabus summary").trim();
  const studyTime = extractSubsection(content, "Learning and Teaching Summary", "Study Time");
  const assessmentFeedbackSummary = extractSection(content, "Assessment and Feedback Summary").trim();
  const syllabus = syllabusSummary.replace(/\s+/g, " ").trim();
  const creditsMatch = content.match(/\|School\|Module Code\|Credit Points\|Level\|[\s\S]*?\|.*?\|.*?\|(\d+)\|/);
  const credits = Number(creditsMatch?.[1] ?? 15);
  const assessment = extractAssessmentStyle(content);
  const granularAssessment = extractGranularStyle(content);
  const assessmentTags = extractAssessmentTags(content);
  const { prerequisites, prerequisiteNote } = extractPrerequisites(content, code);
  const tags = inferTags(headingTitle, overview, syllabus, assessment);

  return {
    code,
    title: headingTitle,
    semester,
    credits,
    overview,
    syllabusSummary,
    studyTime,
    assessmentFeedbackSummary,
    assessment,
    granularAssessment,
    assessmentTags,
    prerequisites,
    prerequisiteNote,
    tags,
    workloadProfile: inferWorkloadProfile(studyTime, assessment),
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

export function getModuleBySlug(slug: string) {
  return getModuleCatalog().find((module) => getModuleSlug(module) === slug.toLowerCase()) ?? null;
}
