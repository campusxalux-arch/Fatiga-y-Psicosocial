/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import logoAsset from "../assets/images/regenerated_image_1784663101738.jpg";

interface InscolsstLogoProps {
  className?: string;
  variant?: "full" | "icon-only" | "light";
  size?: "sm" | "md" | "lg";
}

export default function InscolsstLogo({ className = "", variant = "full", size = "md" }: InscolsstLogoProps) {
  const heightClass = {
    sm: "h-10 sm:h-12",
    md: "h-12 sm:h-16",
    lg: "h-16 sm:h-20"
  }[size];

  const logoSrc = logoAsset || (variant === "light" ? "/inscolsst-logo-white.svg" : "/inscolsst-logo.svg");

  return (
    <div className={`flex items-center shrink-0 select-none ${className}`}>
      <img 
        src={logoSrc} 
        alt="INSCOLSST - Instituto Colombiano de Seguridad y Salud en el Trabajo" 
        className={`${heightClass} w-auto object-contain block`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

