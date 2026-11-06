export function CelestialBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,#28344955,transparent_55%),radial-gradient(ellipse_at_10%_80%,#3c263433,transparent_55%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(1px_1px_at_18%_21%,#d8b886_60%,transparent_100%),radial-gradient(1px_1px_at_76%_63%,#fff_60%,transparent_100%),radial-gradient(1px_1px_at_43%_81%,#d8b886_60%,transparent_100%)] [background-size:237px_251px,317px_283px,413px_397px]" />
      <div className="absolute -right-[15vw] top-[4vh] size-[85vw] max-h-[1100px] max-w-[1100px] rounded-full border border-gold/[0.035]" />
    </div>
  );
}
