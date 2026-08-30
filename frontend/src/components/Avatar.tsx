type Size = "sm" | "md" | "lg";

const dimensions: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-[76px] w-[76px]",
};

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string;
  size?: Size;
}) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#b7d3c2] to-[#6ea988] ${dimensions[size]}`}
      aria-hidden={!name}
    >
      {src ? <img src={src} alt={name ?? ""} className="h-full w-full object-cover" /> : null}
    </span>
  );
}
