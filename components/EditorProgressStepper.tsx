import Image from "next/image";

type StepState = "done" | "upcoming";

export type EditorStep = {
  label: string;
  /** Shown when `compact` is true (e.g. mobile editor header) so labels stay readable */
  shortLabel?: string;
  state: StepState;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function connectorBackground(left: EditorStep, right: EditorStep): string {
  if (left.state !== "upcoming" && right.state === "upcoming") {
    return "linear-gradient(90deg, var(--brand-start) 0%, var(--brand-end) 50%, #E5E7EB 50%, #E5E7EB 100%)";
  }
  if (left.state === "upcoming") {
    return "#E5E7EB";
  }
  return "#e85025";
}

export function EditorProgressStepper({
  steps,
  className = "",
  compact = false,
}: {
  steps: EditorStep[];
  className?: string;
  /** Tighter layout for use inside the editor card */
  compact?: boolean;
}) {
  const circleSm = compact
    ? "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
    : "h-6 w-6 xs:h-8 xs:w-8 sm:h-12 sm:w-12 md:h-14 md:h-14 lg:h-16 lg:w-16";
  const circleBorder = compact ? "border-2" : "border-[2px] xs:border-[2.5px] sm:border-[3px] md:border-4";
  const checkSm = compact
    ? "h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]"
    : "h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7";
  const logoSm = compact
    ? "h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]"
    : "h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7";
  const numSm = compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm";

  return (
    <div
      className={`relative mx-auto w-full max-w-full sm:max-w-none ${compact ? "max-w-full px-0 sm:max-w-md sm:px-2" : "px-2 xs:px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32"} ${className}`}
    >
      <div className="relative flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="contents">
            <div
              className={`relative z-20 flex min-w-0 flex-1 flex-col items-center ${compact ? "min-w-0 sm:min-w-[36px]" : "xs:min-w-[32px] sm:min-w-[40px] md:min-w-[60px] lg:min-w-[72px] xl:min-w-[80px]"}`}
            >
              {step.state === "done" ? (
                <div
                  className={`relative z-10 flex items-center justify-center rounded-full border-[var(--brand-end)] shadow-[var(--shadow-brand-glow)] transition-all duration-300 ${circleSm} ${circleBorder}`}
                  style={{
                    background: "#e85025",
                  }}
                >
                  <CheckIcon className={`stroke-[2px] text-white ${checkSm}`} />
                </div>
              ) : i === steps.length - 1 ? (
                <div
                  className={`relative z-10 flex items-center justify-center rounded-full border-gray-300 bg-gray-100 shadow-md transition-all duration-300 ${circleSm} ${circleBorder}`}
                >
                  <Image
                    src="/logo/logo.svg"
                    alt=""
                    width={28}
                    height={28}
                    className={`object-contain opacity-90 ${logoSm}`}
                  />
                </div>
              ) : (
                <div
                  className={`relative z-10 flex items-center justify-center rounded-full border-gray-300 bg-gray-100 font-bold text-gray-500 shadow-md ${circleSm} ${circleBorder} ${numSm}`}
                >
                  {i + 1}
                </div>
              )}
            </div>
            {i < steps.length - 1 ? (
              <div className="progress-steps-connector-container relative flex-1">
                <div
                  className="progress-steps-connector-line absolute top-1/2 z-0 h-0.5 -translate-y-1/2 rounded-full shadow-sm transition-all duration-500 xs:h-1 sm:h-1 md:h-1.5 lg:h-2"
                  style={{ background: connectorBackground(step, steps[i + 1]!) }}
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className={`relative flex items-start ${compact ? "mt-1.5" : "mt-1.5 xs:mt-2 sm:mt-2.5 md:mt-3"}`}>
        {steps.map((step, i) => (
          <div key={`${step.label}-label`} className="contents">
            <div
              className={`flex min-w-0 flex-1 flex-col items-center ${compact ? "min-w-0 px-0.5 sm:min-w-[36px]" : "px-0.5 xs:min-w-[32px] xs:px-1 sm:min-w-[40px] sm:px-1.5 md:min-w-[60px] lg:min-w-[72px] xl:min-w-[80px]"}`}
            >
              <span
                className={`text-center font-semibold transition-colors duration-300 ${compact ? "text-pretty text-[11px] leading-snug xs:text-xs sm:text-xs sm:leading-tight" : "text-[10px] leading-tight xs:text-xs sm:text-sm md:text-base lg:text-base"} ${
                  step.state === "done" ? "font-semibold text-[var(--foreground)]" : "text-gray-400"
                }`}
              >
                {compact && step.shortLabel ? (
                  <>
                    <span aria-hidden>{step.shortLabel}</span>
                    <span className="sr-only">{step.label}</span>
                  </>
                ) : (
                  step.label
                )}
              </span>
            </div>
            {i < steps.length - 1 ? <div className="flex-1" aria-hidden /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
