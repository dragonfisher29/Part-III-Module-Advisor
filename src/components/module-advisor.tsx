"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import type { ModuleRecord, RankedModule, RecommendationResult } from "@/lib/types";
import { advisorFormSchema, PRIOR_MODULE_CODES } from "@/lib/validation";
import type { AdvisorFormData, AdvisorFormInput } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";

const interestOptions = [
  { value: "ai-ml", label: "AI / ML" },
  { value: "data", label: "Data & Analytics" },
  { value: "web-cloud", label: "Web & Cloud" },
  { value: "systems-security", label: "Systems & Security" },
  { value: "human-centred", label: "Human-Centred" },
  { value: "creative-visual", label: "Creative & Visual" },
  { value: "maths-optimisation", label: "Maths & Optimisation" },
] as const;

const priorModuleLabels: Record<(typeof PRIOR_MODULE_CODES)[number], string> = {
  COMP1202: "COMP1202 Programming I",
  COMP1203: "COMP1203 Computer Systems I",
  COMP1206: "COMP1206 Programming II",
  COMP2208: "COMP2208 Intelligent Systems",
};

const semesterLabels = {
  semester1: "Semester 1",
  semester2: "Semester 2",
} as const;

function ModuleCard({ item }: { item: RankedModule }) {
  return (
    <article className="glass rounded-[28px] p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-orange-200/70">{item.module.code}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{item.module.title}</h4>
        </div>
        <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-semibold text-orange-200">
          Score {item.score}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-200/80">{item.module.overview}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200/80">
        <span className="rounded-full bg-white/7 px-3 py-1">{semesterLabels[item.module.semester]}</span>
        <span className="rounded-full bg-white/7 px-3 py-1">{item.module.assessment}</span>
        <span className="rounded-full bg-white/7 px-3 py-1">{item.module.workloadProfile}</span>
      </div>
      {item.reasons.length > 0 ? (
        <div className="mt-4 space-y-2 text-sm text-orange-100/85">
          {item.reasons.map((reason) => (
            <p key={reason}>- {reason}</p>
          ))}
        </div>
      ) : null}
      {item.blockedBy.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">
          {item.blockedBy.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ModuleAdvisor({ modules }: { modules: ModuleRecord[] }) {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const semester1Modules = modules.filter((module) => module.semester === "semester1");
  const semester2Modules = modules.filter((module) => module.semester === "semester2");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdvisorFormInput, unknown, AdvisorFormData>({
    resolver: zodResolver(advisorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      degreeRoute: "Computer Science Part III",
      interests: ["web-cloud"],
      assessmentPreference: "mixed",
      workloadPreference: "balanced",
      careerGoal: "undecided",
      broadeningInterest: false,
      aiMlInterest: false,
      priorModules: [],
      theoryPracticeBalance: "balanced",
      notes: "",
    },
  });

  async function onSubmit(values: AdvisorFormData) {
    setSubmitError(null);
    setStatusNote(null);

    const response = await fetch("/api/advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as {
      error?: string;
      details?: string;
      recommendations?: RecommendationResult;
      persistenceError?: string | null;
    };

    if (!response.ok || !payload.recommendations) {
      setSubmitError(payload.details ?? payload.error ?? "Unable to generate recommendations right now.");
      return;
    }

    setResult(payload.recommendations);
    setStatusNote(
      payload.persistenceError
        ? `Recommendations generated, but the Supabase save failed: ${payload.persistenceError}`
        : payload.recommendations.persisted
          ? "Recommendations generated and saved to Supabase."
          : "Recommendations generated locally. Add Supabase environment variables to store submissions.",
    );
  }

  return (
    <main className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <section className="glass-strong mx-auto grid max-w-[1500px] gap-8 overflow-hidden rounded-[36px] border border-white/10 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-orange-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-orange-100">
            Part III Module Advisor
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Choose a stronger Semester 1 and Semester 2 plan with guided module advice.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-200/78 sm:text-lg">
              Answer a short set of questions about your interests, workload, assessment style, and career goals. The
              tool ranks your modules, checks known constraints, and builds a 5-module option plan with 3 modules in
              Semester 1 and 2 modules in Semester 2. It can also save the submission to Supabase when your deployment
              keys are configured.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-[24px] p-4">
              <p className="text-sm text-slate-300">Optional modules analysed</p>
              <p className="mt-3 text-3xl font-semibold text-white">{modules.length}</p>
            </div>
            <div className="glass rounded-[24px] p-4">
              <p className="text-sm text-slate-300">Semester 1 options</p>
              <p className="mt-3 text-3xl font-semibold text-white">{semester1Modules.length}</p>
            </div>
            <div className="glass rounded-[24px] p-4">
              <p className="text-sm text-slate-300">Semester 2 options</p>
              <p className="mt-3 text-3xl font-semibold text-white">{semester2Modules.length}</p>
            </div>
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,122,24,0.32),_transparent_36%),linear-gradient(160deg,_rgba(255,255,255,0.18),_rgba(255,255,255,0.02))] p-6">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.5))]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-100/90">Recommendation Logic</p>
              <h2 className="mt-3 max-w-sm text-3xl font-semibold text-white">Interest fit, assessment fit, and prerequisite safety.</h2>
            </div>
            <div className="grid gap-3 text-sm text-slate-100/84">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Boosts practical modules for software and cloud-focused students.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Flags blocked combinations like unsupported prerequisite chains.</div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Stores submissions in Supabase for later analysis after deployment to Vercel.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-[1500px] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form className="glass rounded-[32px] p-6 lg:p-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Questionnaire</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Collect user data</h2>
            </div>
            <button
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Generating..." : "Get Recommendations"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Name</span>
              <input className="field" {...register("name")} placeholder="Your name" />
              {errors.name ? <span className="text-sm text-rose-300">{errors.name.message}</span> : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Email</span>
              <input className="field" {...register("email")} placeholder="name@example.com" type="email" />
              {errors.email ? <span className="text-sm text-rose-300">{errors.email.message}</span> : null}
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Degree route</span>
              <input className="field" {...register("degreeRoute")} />
              {errors.degreeRoute ? <span className="text-sm text-rose-300">{errors.degreeRoute.message}</span> : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Career goal</span>
              <select className="field" {...register("careerGoal")}>
                <option value="software-engineering">Software Engineering</option>
                <option value="ai-data">AI / Data</option>
                <option value="research-academia">Research / Academia</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="product-ux">Product / UX</option>
                <option value="undecided">Undecided</option>
              </select>
            </label>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm text-slate-200">Interests</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {interestOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
                >
                  <input type="checkbox" value={option.value} {...register("interests")} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.interests ? <span className="mt-2 block text-sm text-rose-300">{errors.interests.message}</span> : null}
          </div>

          <div className="mt-6">
            <div className="mb-3">
              <p className="text-sm text-slate-200">Modules already taken in previous years</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">
                Tick any common `COMP1xxx` or `COMP2xxx` prerequisites you have already completed so the advisor can
                treat them as satisfied.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIOR_MODULE_CODES.map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
                >
                  <input type="checkbox" value={code} {...register("priorModules")} />
                  <span>{priorModuleLabels[code]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Assessment</span>
              <select className="field" {...register("assessmentPreference")}>
                <option value="coursework">Coursework</option>
                <option value="exam">Exam</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Workload</span>
              <select className="field" {...register("workloadPreference")}>
                <option value="light">Light</option>
                <option value="balanced">Balanced</option>
                <option value="intensive">Intensive</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-200">Theory vs practical</span>
              <select className="field" {...register("theoryPracticeBalance")}>
                <option value="practical">Practical</option>
                <option value="balanced">Balanced</option>
                <option value="theory">Theory</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
              <input type="checkbox" {...register("broadeningInterest")} />
              <span>Boost broadening modules</span>
            </label>
            <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
              <input type="checkbox" {...register("aiMlInterest")} />
              <span>Prefer AI / ML-heavy options</span>
            </label>
          </div>

          <label className="mt-6 block space-y-2">
            <span className="text-sm text-slate-200">Notes</span>
            <textarea className="field min-h-32" {...register("notes")} placeholder="Optional preferences, constraints, or modules you already like." />
            {errors.notes ? <span className="text-sm text-rose-300">{errors.notes.message}</span> : null}
          </label>

          {submitError ? (
            <div className="mt-6 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">{submitError}</div>
          ) : null}
          {statusNote ? (
            <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">{statusNote}</div>
          ) : null}
        </form>

        <div className="space-y-6">
          <section className="glass rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Available Modules</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Semester options</h2>
              </div>
              <div className="rounded-full bg-orange-500/12 px-4 py-2 text-sm text-orange-100">Source: local module markdown</div>
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {[semester1Modules, semester2Modules].map((group, index) => (
                <div key={semesterLabels[index === 0 ? "semester1" : "semester2"]} className="rounded-[24px] border border-white/10 bg-white/4 p-4">
                  <h3 className="text-lg font-semibold text-white">{semesterLabels[index === 0 ? "semester1" : "semester2"]}</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-200/82">
                    {group.map((module) => (
                      <div key={module.code} className="rounded-2xl bg-black/18 px-4 py-3">
                        <p className="font-medium text-white">{module.code} · {module.title}</p>
                        <p className="mt-1 line-clamp-3">{module.overview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Results</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recommended path</h2>
              </div>
              <div className="text-sm text-slate-300">{result?.persisted ? "Saved to Supabase" : "Local result preview"}</div>
            </div>

            {!result ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/12 bg-white/4 p-6 text-sm leading-7 text-slate-300">
                Submit the questionnaire to rank Semester 1 and Semester 2 modules, see warnings, and get a balanced
                5-module plan with 3 options in Semester 1 and 2 in Semester 2.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Top Semester 1</h3>
                    {result.semester1.map((item) => (
                      <ModuleCard key={item.module.code} item={item} />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Top Semester 2</h3>
                    {result.semester2.map((item) => (
                      <ModuleCard key={item.module.code} item={item} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-orange-400/18 bg-orange-500/8 p-5">
                  <h3 className="text-lg font-semibold text-white">Balanced plan</h3>
                  <p className="mt-2 text-sm text-orange-100/80">Course structure: 3 optional modules in Semester 1 and 2 optional modules in Semester 2.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-orange-100/85">Semester 1</p>
                      <div className="mt-3 space-y-3">
                        {result.balancedPlan.semester1.map((item) => (
                          <div key={item.module.code} className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-slate-100">
                            {item.module.code} · {item.module.title}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-orange-100/85">Semester 2</p>
                      <div className="mt-3 space-y-3">
                        {result.balancedPlan.semester2.map((item) => (
                          <div key={item.module.code} className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-slate-100">
                            {item.module.code} · {item.module.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {result.warnings.length > 0 ? (
                  <div className="rounded-[28px] border border-amber-400/25 bg-amber-500/10 p-5">
                    <h3 className="text-lg font-semibold text-white">Warnings</h3>
                    <div className="mt-3 space-y-2 text-sm text-amber-100">
                      {result.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
