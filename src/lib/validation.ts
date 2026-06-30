import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export const PRIOR_MODULE_CODES = ["COMP1202", "COMP1203", "COMP1206", "COMP2208"] as const;

function sanitizeInlineText(value: string) {
  return value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

function sanitizeNotes(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(CONTROL_CHARS, "").trim();
  return normalized.length === 0 ? "" : normalized;
}

function preprocessInlineText(value: unknown) {
  return typeof value === "string" ? sanitizeInlineText(value) : value;
}

function preprocessEmail(value: unknown) {
  return typeof value === "string" ? sanitizeInlineText(value).toLowerCase() : value;
}

function preprocessNotes(value: unknown) {
  return typeof value === "string" ? sanitizeNotes(value) : value;
}

export const advisorFormSchema = z.object({
  name: z.preprocess(preprocessInlineText, z.string().min(2, "Enter your name.")),
  email: z.preprocess(preprocessEmail, z.email("Enter a valid email address.")),
  degreeRoute: z.preprocess(preprocessInlineText, z.string().min(2, "Enter your degree route.")),
  interests: z.array(
    z.enum([
      "ai-ml",
      "data",
      "web-cloud",
      "systems-security",
      "human-centred",
      "creative-visual",
      "maths-optimisation",
    ]),
  ).min(1, "Choose at least one interest."),
  assessmentPreference: z.enum(["coursework", "exam", "mixed"]),
  workloadPreference: z.enum(["light", "balanced", "intensive"]),
  careerGoal: z.enum([
    "software-engineering",
    "ai-data",
    "research-academia",
    "cybersecurity",
    "product-ux",
    "undecided",
  ]),
  broadeningInterest: z.boolean(),
  aiMlInterest: z.boolean(),
  priorModules: z.array(z.enum(PRIOR_MODULE_CODES)).default([]),
  theoryPracticeBalance: z.enum(["practical", "balanced", "theory"]),
  notes: z.preprocess(preprocessNotes, z.string().max(500, "Keep notes under 500 characters.")),
});

export type AdvisorFormInput = z.input<typeof advisorFormSchema>;
export type AdvisorFormData = z.output<typeof advisorFormSchema>;
