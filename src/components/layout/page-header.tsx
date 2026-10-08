export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-[length:var(--text-title)] text-[var(--text)] md:text-3xl">{title}</h1>
      {lead && <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-muted)] md:text-base">{lead}</p>}
    </div>
  );
}

export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <p className="text-sm text-[var(--text-muted)]">
        {note ?? "Экран в разработке — подключён к API, интерфейс дорабатывается."}
      </p>
    </div>
  );
}
