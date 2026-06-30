import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { formatGranularAssessmentStyle } from "@/lib/assessment";
import { getModuleBySlug, getModuleCatalog } from "@/lib/catalog";
import { getModuleSlug } from "@/lib/module-links";

type SectionBlock =
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "rule" };

type ModulePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function renderInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(cells: string[]) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function expandBulletLine(line: string) {
  return line
    .slice(2)
    .trim()
    .split(/\s-\s(?=[A-Z0-9(])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSectionContent(content: string): SectionBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: SectionBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{3,4})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 3 | 4,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (/^-{3,}$/.test(trimmedLine)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("|")) {
      const tableLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }

      const rows = tableLines.map(splitTableRow);

      if (rows.length >= 2) {
        const headers = rows[0];
        const bodyRows = isDividerRow(rows[1]) ? rows.slice(2) : rows.slice(1);
        blocks.push({
          type: "table",
          headers,
          rows: bodyRows,
        });
      }

      continue;
    }

    if (trimmedLine.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(...expandBulletLine(lines[index].trim()));
        index += 1;
      }

      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const candidate = lines[index].trim();

      if (
        !candidate ||
        /^(#{3,4})\s+/.test(candidate) ||
        /^-{3,}$/.test(candidate) ||
        candidate.startsWith("|") ||
        candidate.startsWith("- ")
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join(" "),
      });
      continue;
    }

    index += 1;
  }

  return blocks;
}

function FormattedSection({
  content,
  emptyMessage,
}: {
  content: string;
  emptyMessage: string;
}) {
  const blocks = parseSectionContent(content);

  if (blocks.length === 0) {
    return <p className="mt-4 text-sm leading-7 text-slate-100/75">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 space-y-5">
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          return block.level === 3 ? (
            <h3 key={blockIndex} className="text-lg font-semibold text-white">
              {block.text}
            </h3>
          ) : (
            <h4 key={blockIndex} className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-100/80">
              {block.text}
            </h4>
          );
        }

        if (block.type === "rule") {
          return <div key={blockIndex} className="border-t border-white/10" />;
        }

        if (block.type === "paragraph") {
          return (
            <p key={blockIndex} className="text-sm leading-7 text-slate-100/85">
              {renderInlineText(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={blockIndex} className="space-y-3">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="flex gap-3 text-sm leading-7 text-slate-100/85">
                  <span className="mt-2 h-2 w-2 rounded-full bg-orange-400" />
                  <span>{renderInlineText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={blockIndex} className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm text-slate-100/85">
                <thead className="bg-white/6 text-slate-200">
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={`${header}-${headerIndex}`} className="px-4 py-3 font-semibold">
                        {renderInlineText(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-white/8">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top">
                          {renderInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function generateStaticParams() {
  return getModuleCatalog().map((module) => ({
    slug: getModuleSlug(module),
  }));
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);

  if (!module) {
    notFound();
  }

  const assessmentTags = [
    formatGranularAssessmentStyle(module.granularAssessment),
    ...module.assessmentTags,
  ];

  return (
    <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <section className="glass-strong mx-auto max-w-[1100px] overflow-hidden rounded-[36px] border border-white/10 px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-orange-100/85">{module.code}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{module.title}</h1>
          </div>
          <Link
            className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-100 transition hover:border-orange-400/35 hover:bg-white/10 focus-visible:border-orange-400/45 focus-visible:bg-white/10 focus-visible:outline-none"
            href="/"
          >
            Back to advisor
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-100/85">
          <span className="rounded-full bg-orange-500/12 px-4 py-2">{module.semester === "semester1" ? "Semester 1" : "Semester 2"}</span>
          {assessmentTags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/7 px-4 py-2">
              {tag}
            </span>
          ))}
          <span className="rounded-full bg-white/7 px-4 py-2">{module.workloadProfile}</span>
          <span className="rounded-full bg-white/7 px-4 py-2">{module.credits} credits</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="glass rounded-[30px] p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Overview</p>
            <p className="mt-4 text-base leading-8 text-slate-100/85">{module.overview || "No overview was parsed from the source markdown."}</p>
          </article>

          <aside className="space-y-6">
            <section className="glass rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Prerequisites</p>
              {module.prerequisites.length > 0 ? (
                <div className="mt-4 space-y-3 text-sm text-slate-100/85">
                  {module.prerequisites.map((code) => (
                    <div key={code} className="rounded-2xl bg-black/20 px-4 py-3">
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-100/75">No prerequisite module codes were parsed for this module.</p>
              )}
              {module.prerequisiteNote ? (
                <p className="mt-4 text-sm leading-7 text-orange-100/75">{module.prerequisiteNote}</p>
              ) : null}
            </section>

            <section className="glass rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Source</p>
              <div className="mt-4 space-y-3 text-sm text-slate-100/85">
                <p>Markdown file: {module.sourceFile}</p>
                <p>Tags: {module.tags.length > 0 ? module.tags.join(", ") : "No tags inferred"}</p>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="glass rounded-[30px] p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Syllabus Summary</p>
            <FormattedSection
              content={module.syllabusSummary}
              emptyMessage="No syllabus summary was parsed from the source markdown."
            />
          </section>

          <div className="space-y-6">
            <section className="glass rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Study Time</p>
              <FormattedSection
                content={module.studyTime}
                emptyMessage="No study time section was parsed from the source markdown."
              />
            </section>

            <section className="glass rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Assessment and Feedback Summary</p>
              <FormattedSection
                content={module.assessmentFeedbackSummary}
                emptyMessage="No assessment and feedback summary was parsed from the source markdown."
              />
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
