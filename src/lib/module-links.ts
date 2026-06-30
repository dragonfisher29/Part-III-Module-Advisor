import type { ModuleRecord } from "@/lib/types";

export function getModuleSlug(module: Pick<ModuleRecord, "code">) {
  return module.code.toLowerCase();
}

export function getModuleHref(module: Pick<ModuleRecord, "code">) {
  return `/modules/${getModuleSlug(module)}`;
}
