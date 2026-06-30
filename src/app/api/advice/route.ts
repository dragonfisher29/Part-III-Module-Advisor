import { NextResponse } from "next/server";

import { getModuleCatalog } from "@/lib/catalog";
import { generateRecommendations } from "@/lib/recommendations";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { advisorFormSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submission = advisorFormSchema.parse(body);
    const modules = getModuleCatalog();
    const recommendations = generateRecommendations(modules, submission);
    const supabase = getSupabaseAdminClient();
    let persisted = false;
    let persistenceError: string | null = null;

    if (supabase) {
      const { error } = await supabase.from("module_advice_requests").insert({
        name: submission.name,
        email: submission.email,
        degree_route: submission.degreeRoute,
        interests: submission.interests,
        assessment_preference: submission.assessmentPreference,
        workload_preference: submission.workloadPreference,
        career_goal: submission.careerGoal,
        broadening_interest: submission.broadeningInterest,
        ai_ml_interest: submission.aiMlInterest,
        theory_practice_balance: submission.theoryPracticeBalance,
        notes: submission.notes,
        recommended_semester_1: recommendations.semester1,
        recommended_semester_2: recommendations.semester2,
        balanced_plan: recommendations.balancedPlan,
      });

      if (error) {
        persistenceError = error.message;
      } else {
        persisted = true;
      }
    }

    return NextResponse.json({
      recommendations: {
        ...recommendations,
        persisted,
      },
      persistenceError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Unable to generate module advice.",
        details: message,
      },
      { status: 400 },
    );
  }
}
