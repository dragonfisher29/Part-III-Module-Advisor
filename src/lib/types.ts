export type Semester = "semester1" | "semester2";

export type AssessmentStyle = "coursework" | "exam" | "mixed";

export type GranularAssessmentStyle =
  | "pure-coursework"
  | "pure-exam"
  | "coursework-heavy"
  | "exam-heavy"
  | "continuous-assessment-heavy"
  | "final-assessment-heavy"
  | "balanced-mix"
  | "mixed-unknown";

export type WorkloadPreference = "light" | "balanced" | "intensive";

export type AssessmentPreference = "coursework" | "exam" | "continuous-assessment" | "final-assessment";

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
  syllabusSummary: string;
  studyTime: string;
  assessmentFeedbackSummary: string;
  assessment: AssessmentStyle;
  granularAssessment: GranularAssessmentStyle;
  assessmentTags: string[];
  prerequisites: string[];
  prerequisiteNote: string | null;
  tags: string[];
  workloadProfile: WorkloadPreference;
  sourceFile: string;
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
