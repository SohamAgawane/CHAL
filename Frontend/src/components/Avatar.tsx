import { cn, initials } from "@/lib/utils";

const sizes = {
  xs: "size-6 text-[10px] rounded-md",
  sm: "size-8 text-xs rounded-lg",
  md: "size-10 text-sm rounded-xl",
  lg: "size-14 text-lg rounded-2xl",
  xl: "size-28 text-4xl rounded-3xl",
};

interface Props {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: Props) {
  if (src) {
    return <img src={src} alt={name} className={cn("shrink-0 object-cover", sizes[size], className)} />;
  }
  return (
    <span
      aria-label={name}
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br from-brand-600 to-leaf-500 font-display font-bold text-white",
        sizes[size],
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
