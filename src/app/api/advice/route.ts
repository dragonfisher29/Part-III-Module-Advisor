import path from "node:path";

import { NextResponse } from "next/server";

import { getModuleCatalog } from "@/lib/catalog";
import { generateRecommendations } from "@/lib/recommendations";
import { appendRunToCsv } from "@/lib/run-log";
import { advisorFormSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submission = advisorFormSchema.parse(body);
    const modules = getModuleCatalog();
    const recommendations = generateRecommendations(modules, submission);
    let savedTo: string | null = null;
    let saveError: string | null = null;

    try {
      const filePath = await appendRunToCsv(submission, recommendations);
      savedTo = path.relative(process.cwd(), filePath);
    } catch (error) {
      saveError = error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json({ recommendations, savedTo, saveError });
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
