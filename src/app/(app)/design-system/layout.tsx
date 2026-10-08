import { notFound } from "next/navigation";

/** P4: the design-system reference is developer documentation — it does not exist in production builds. */
export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
