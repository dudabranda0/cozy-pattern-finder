import lvbLogo from "@/assets/lvb-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
};

export const LvbLogo = ({ className = "", size = "md" }: LogoProps) => (
  <img
    src={lvbLogo}
    alt="LVB — Larissa De Vargas Brandão Advogados"
    className={`${sizes[size]} w-auto select-none ${className}`}
    draggable={false}
  />
);
