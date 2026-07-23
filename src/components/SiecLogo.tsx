/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface SiecLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light-blue";
  align?: "left" | "center";
}

export default function SiecLogo({ className = "", size = "md", variant = "light-blue", align = "left" }: SiecLogoProps) {
  // Map sizes to Tailwind font sizes and spacing
  const sizeClasses = {
    sm: {
      container: "gap-0.5",
      title: "text-2xl font-black tracking-tighter",
      trademark: "text-[8px] -top-1.5 ml-0.5",
      subtitle: "text-[8px] sm:text-[9px] leading-tight font-bold mt-0.5 max-w-[200px]"
    },
    md: {
      container: "gap-1",
      title: "text-4xl sm:text-5xl font-black tracking-tighter",
      trademark: "text-[12px] -top-3 ml-0.5",
      subtitle: "text-[11px] sm:text-[12px] leading-snug font-extrabold mt-1 max-w-[280px]"
    },
    lg: {
      container: "gap-1.5",
      title: "text-5xl sm:text-6xl font-black tracking-tighter",
      trademark: "text-[15px] -top-4 ml-1",
      subtitle: "text-[12px] sm:text-[14px] leading-snug font-extrabold mt-1.5 max-w-[340px]"
    },
    xl: {
      container: "gap-2",
      title: "text-6xl sm:text-7xl font-black tracking-tighter",
      trademark: "text-[18px] -top-5 ml-1",
      subtitle: "text-[14px] sm:text-[16px] leading-snug font-black mt-2 max-w-[400px]"
    }
  }[size];

  const colorHex = variant === "light-blue" ? "#38bdf8" : "#001F54";
  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex ${align === "center" ? "justify-center" : "justify-start"} ${className}`} id="siec-logo-root">
      {/* Container aligned as requested */}
      <div className={`flex flex-col ${alignClass} ${sizeClasses.container}`} id="siec-logo-inner-wrapper">
        {/* Main "SIEC®" Heading */}
        <h2 
          className={`${sizeClasses.title} font-sans font-black uppercase leading-none select-none relative flex items-start`}
          style={{ color: colorHex }}
        >
          SIEC
          <span className={`${sizeClasses.trademark} font-bold relative font-sans`}>®</span>
        </h2>
        
        {/* Precise Subtitle Layout replicating the attached logo image */}
        <div 
          className={`${sizeClasses.subtitle} font-sans font-medium select-none tracking-tight`}
          style={{ color: colorHex }}
        >
          <span className="block leading-tight">Sistema Integral de Evaluación</span>
          <span className="block leading-tight mt-0.5">de Competencias para la Conducción</span>
        </div>
      </div>
    </div>
  );
}
