import { getModuleCatalog } from "@/lib/catalog";
import { ModuleAdvisor } from "@/components/module-advisor";

export default function HomePage() {
  const modules = getModuleCatalog();

  return <ModuleAdvisor modules={modules} />;
}
