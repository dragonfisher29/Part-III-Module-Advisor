export type Semester = "semester1" | "semester2";

export type AssessmentStyle = "coursework" | "exam" | "mixed";

export type WorkloadPreference = "light" | "balanced" | "intensive";

export type AssessmentPreference = AssessmentStyle;

export type TheoryPracticeBalance = "practical" | "balanced" | "theory";

export type CareerGoal =
  | "software-engineering"
  | "ai-data"
  | "research-academia"
  | "cybersecurity"
  | "product-ux"
  | "undecided";

export type InterestTag =
  | "ai-ml"
  | "data"
  | "web-cloud"
  | "systems-security"
  | "human-centred"
  | "creative-visual"
  | "maths-optimisation";

export interface ModuleRecord {
  code: string;
  title: string;
  semester: Semester;
  credits: number;
  overview: string;
  assessment: AssessmentStyle;
  prerequisites: string[];
  prerequisiteNote: string | null;
  tags: string[];
  workloadProfile: WorkloadPreference;
  sourceFile: string;
}

export interface AdvisorFormData {
  name: string;
  email: string;
  degreeRoute: string;
  interests: InterestTag[];
  assessmentPreference: AssessmentPreference;
  workloadPreference: WorkloadPreference;
  careerGoal: CareerGoal;
  broadeningInterest: boolean;
  aiMlInterest: boolean;
  theoryPracticeBalance: TheoryPracticeBalance;
  notes: string;
}

export interface RankedModule {
  module: ModuleRecord;
  score: number;
  reasons: string[];
  blockedBy: string[];
}

export interface RecommendationResult {
  semester1: RankedModule[];
  semester2: RankedModule[];
  balancedPlan: {
    semester1: RankedModule[];
    semester2: RankedModule[];
  };
  warnings: string[];
  persisted: boolean;
}
