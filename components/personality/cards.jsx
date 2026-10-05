/* Hallmark · genre: playful-editorial · personality tests share the home page exception (design.md)
 * Cards used by the test list, the test page and the shared result page.
 */
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { canOptimizeImage } from "@/lib/images";

export const MARKS = ["bg-mark-blue", "bg-mark-red", "bg-mark-yellow", "bg-mark-green"];

/**
 * A test in a grid: cover, title, two lines of description, question count. On phones it is a
 * compact row (picture left, no description) so thirty-odd tests stay a short scroll.
 */
export function TestCard({ test, title, description, questionsLabel, startLabel, index = 0, priority = false }) {
  return (
    <Link
      href={`/personality-test/${test.slug}`}
      className="group flex h-full overflow-hidden rounded-lg bg-paper-2 transition-colors duration-micro ease-out hover:bg-paper-3 sm:flex-col"
    >
      <span className={`block w-1.5 shrink-0 sm:h-1.5 sm:w-auto ${MARKS[index % 4]}`} aria-hidden="true" />
      <span className="relative block min-h-[7rem] w-28 shrink-0 overflow-hidden bg-paper-3 sm:aspect-[16/10] sm:min-h-0 sm:w-auto">
        {test.imageUrl ? (
          <Image
            src={test.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px"
            priority={priority}
            unoptimized={!canOptimizeImage(test.imageUrl)}
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-5xl font-extrabold text-muted-foreground sm:text-8xl" aria-hidden="true">
            ?
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <span className="font-display text-lg font-extrabold leading-tight group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-xl">
          {title}
        </span>
        {/* line-clamp sets its own display, so the phone-only hiding sits on a wrapper */}
        {description && (
          <span className="mt-2 hidden sm:block">
            <span className="line-clamp-2 text-sm text-ink-2">{description}</span>
          </span>
        )}
        <span className="mt-auto flex items-center justify-between gap-4 pt-3 sm:pt-4">
          <span className="font-outlier text-sm tabular-nums text-muted-foreground">{questionsLabel}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            {startLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * A result: its picture, name, description and traits, with the result's own colour as the top
 * band (an admin-chosen colour, like the raffle colours). `children` is for the actions under it.
 */
export function ResultCard({ result, label, headingLevel = "h2", headingRef, priority = false, children }) {
  const Heading = headingLevel;
  return (
    <article
      className={`grid overflow-hidden rounded-lg border-t-8 bg-paper-2 ${result.imageUrl ? "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""} ${result.color ? "" : "border-brand"}`}
      style={result.color ? { borderTopColor: result.color } : undefined}
    >
      {result.imageUrl && (
        <div className="relative aspect-square bg-paper-3 md:aspect-auto md:min-h-[28rem]">
          <Image
            src={result.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            priority={priority}
            unoptimized={!canOptimizeImage(result.imageUrl)}
            className="object-cover object-top"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-col p-6 md:p-10">
        {label && <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-2">{label}</p>}
        <Heading
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight outline-none [overflow-wrap:anywhere]"
        >
          {result.title}
        </Heading>
        {result.description && <p className="mt-5 max-w-measure text-lg text-ink-2">{result.description}</p>}
        {result.traits?.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {result.traits.map((trait) => (
              <li key={trait} className="rounded-full border border-rule bg-paper px-3 py-1 text-sm font-semibold">
                {trait}
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </article>
  );
}
