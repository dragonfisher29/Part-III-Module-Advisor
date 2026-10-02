import { NextResponse } from "next/server";

import { getModuleCatalog } from "@/lib/catalog";
import { generateRecommendations } from "@/lib/recommendations";
import { advisorFormSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submission = advisorFormSchema.parse(body);
    const modules = getModuleCatalog();
    const recommendations = generateRecommendations(modules, submission);

    return NextResponse.json({ recommendations });
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
