export function SectionHeading({
  title,
  subtitle,
  light = false,
  id,
}: {
  title: string;
  subtitle?: string;
  light?: boolean;
  id?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <h2
        id={id}
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-4 text-lg leading-relaxed ${
            light ? "text-white/70" : "text-muted"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
