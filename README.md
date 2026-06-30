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

## Notes

- recommendations are advisory rather than official enrolment decisions
- the app surfaces prerequisite warnings where source data is incomplete or unavailable
