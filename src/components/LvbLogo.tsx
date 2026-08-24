import { forwardRef } from "react";
import lvbMonograma from "@/assets/lvb-monograma.png";
import lvbMonogramaLight from "@/assets/lvb-monograma-light.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** "dark" = monograma vinho p/ fundos claros · "light" = creme p/ fundos escuros */
  variant?: "dark" | "light";
  /** mostra "Larissa Brandão" ao lado do monograma */
  withName?: boolean;
}

const sizes = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
};

export const LvbLogo = forwardRef<HTMLSpanElement, LogoProps>(
  ({ className = "", size = "md", variant = "dark", withName = false }, ref) => (
    <span ref={ref} className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={variant === "light" ? lvbMonogramaLight : lvbMonograma}
        alt="LVB — Larissa Brandão"
        className={`${sizes[size]} w-auto`}
        draggable={false}
      />
      {withName && (
        <span
          className={`font-serif-lvb font-bold leading-none tracking-tight ${
            size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"
          } ${variant === "light" ? "text-ink-foreground" : "text-foreground"}`}
        >
          Larissa Brandão
        </span>
      )}
    </span>
  )
);

LvbLogo.displayName = "LvbLogo";
