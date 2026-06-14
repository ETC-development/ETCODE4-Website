export function Placeholder({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="font-display text-4xl uppercase">{title}</h1>
      <p className="mt-2 text-sm text-bone/50">Lands in {phase}.</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
