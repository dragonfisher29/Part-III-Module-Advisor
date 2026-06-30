# Part III Module Advisor

A Next.js web tool that helps students choose Semester 1 and Semester 2 Part III modules.

## What It Does

- collects user preference data through a guided questionnaire
- ranks modules for Semester 1 and Semester 2
- checks known prerequisite constraints
- builds a balanced 5-module plan with 3 options in Semester 1 and 2 in Semester 2
- stores submissions in Supabase when environment variables are present
- deploys cleanly to Vercel

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Supabase
- Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
copy .env.example .env.local
```

3. Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Run the app:

```bash
npm run dev
```

5. Run tests:

```bash
npm test
```

## Supabase Setup

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

The app writes submissions to `module_advice_requests` using a server-side Supabase client. If the Supabase variables are missing, the app still returns recommendations but skips persistence.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Set the root directory to this project.
4. Add environment variables from `.env.example`.
5. Deploy.

Vercel will build the Next.js app and keep the markdown module source files available in the deployment bundle.

## Data Source

The recommendation catalog is generated from the markdown files already present in this workspace, including:
- `Semester I.md`
- `Semester II.md`
- per-module markdown files such as `Computer Vision.md` and `Natural Language Processing.md`

## Advisor Logic

The advisor combines questionnaire answers with metadata parsed from the module markdown files. Each module carries tags such as `ai-ml`, `data`, `web-cloud`, `practical`, and `theory`, plus assessment and prerequisite data extracted from the source content.

### Inputs Used By The Advisor

- interests: boosts modules whose tags match the selected subject areas
- career goal: adds extra weight for tags aligned with software engineering, AI/data, research, cybersecurity, product/UX, or an undecided path
- assessment preference: supports `Coursework`, `Exam`, `Continuous Assessment`, and `Final Assessment`
- workload preference: boosts modules whose workload profile matches `light`, `balanced`, or `intensive`
- theory vs practical balance: boosts modules tagged as `theory` or `practical`
- broadening interest: boosts the maths broadening modules when explicitly requested
- AI/ML preference: gives additional weight to modules tagged `ai-ml`
- prior modules: treats selected `COMP1xxx` and `COMP2xxx` modules as already satisfying known prerequisites

### Scoring Model

For each module, the advisor builds a score from several signals:

- interest match: each matching boosted interest tag adds `+3`
- career alignment: each matching career tag adds `+2`
- workload match: exact workload match adds `+2`
- theory/practical match: matching the preferred study style adds `+2`
- broadening boost: selecting broadening interest adds `+4` to supported maths modules
- broadening penalty: not selecting broadening interest subtracts `1` from those maths modules
- AI/ML boost: selecting the AI/ML preference adds `+3` to modules tagged `ai-ml`
- special-case boost: `COMP3222` gets an additional `+2` when AI/ML preference is enabled

Assessment preference is handled separately so the advisor can use both coarse categories and detailed parsed assessment data:

- `Coursework`: strongest match for pure coursework modules, then for coarse coursework modules, then for modules whose tags mention coursework or continuous assessment
- `Exam`: strongest match for pure exam modules, then for coarse exam modules, then for modules whose tags mention exam, examination, or final assessment
- `Continuous Assessment`: strongest match for continuous-assessment-heavy modules, then keyword matching against parsed assessment tags
- `Final Assessment`: strongest match for final-assessment-heavy modules, then keyword matching against parsed assessment tags

The advisor also generates short explanation strings for the UI, such as why a module matched the user's interests, workload, or assessment preference.

### Ranking And Plan Construction

The engine ranks Semester 1 and Semester 2 modules separately, then returns:

- top Semester 1 recommendations
- top Semester 2 recommendations
- a balanced five-module plan containing `3` Semester 1 modules and `2` Semester 2 modules

The balanced plan is built in order:

1. choose the highest-ranked Semester 1 modules until three are selected
2. avoid selecting `COMP3223` if `COMP3222` has already been chosen in the Semester 1 plan
3. evaluate Semester 2 modules against prerequisite blockers before adding them
4. keep the first two Semester 2 modules that are not blocked

### Prerequisite Handling

The advisor checks each module's prerequisite list against:

- modules already selected earlier in the balanced plan
- modules the user marked as already taken in previous years

If a prerequisite is missing, the advisor records a warning and skips that blocked Semester 2 candidate in the balanced plan. It also includes a couple of explicit domain rules:

- `COMP3225` requires a prior machine learning module such as `COMP3222` or `COMP3223`
- `COMP3224` depends on `COMP3223`, which may be unavailable in the current source list

This means the returned plan aims to be practical rather than purely score-maximizing: a highly ranked module can still be excluded if the prerequisite chain is not satisfied.

## Notes

- recommendations are advisory rather than official enrolment decisions
- the app surfaces prerequisite warnings where source data is incomplete or unavailable
