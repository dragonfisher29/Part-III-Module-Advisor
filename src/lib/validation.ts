import { z } from "zod";

export const advisorFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address."),
  degreeRoute: z.string().trim().min(2, "Enter your degree route."),
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
  theoryPracticeBalance: z.enum(["practical", "balanced", "theory"]),
  notes: z.string().trim().max(500, "Keep notes under 500 characters.").default(""),
});

export type AdvisorFormInput = z.infer<typeof advisorFormSchema>;
