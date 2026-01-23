import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "full" | "icon" | "text";
}

const sizeMap = {
  sm: { icon: 24, text: "text-base" },
  md: { icon: 32, text: "text-lg" },
  lg: { icon: 48, text: "text-xl" },
  xl: { icon: 64, text: "text-2xl" },
};

/**
 * Logo component based on the app's brand identity
 * Features: Compass rose, airplane, and heart with location pin
 */
export const Logo = ({ 
  className, 
  size = "md", 
  showText = true,
  variant = "full" 
}: LogoProps) => {
  const iconSize = sizeMap[size].icon;
  const textSize = sizeMap[size].text;
  // Generate stable unique ID for SVG filter
  const filterId = useMemo(() => `logo-filter-${Math.random().toString(36).substring(2, 11)}`, []);

  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
        </filter>
      </defs>
    
      {/* Compass Rose - Base concentric circles */}
      <circle cx="50" cy="50" r="35" fill="#38bdf8" opacity="0.2" />
      <circle cx="50" cy="50" r="28" fill="#f97316" opacity="0.25" />
      
      {/* Compass Rose - Cardinal points (sharp triangles) */}
      {/* North - Prominent teal-blue */}
      <path
        d="M 50 12 L 42 32 L 50 28 L 58 32 Z"
        fill="#14b8a6"
        stroke="white"
        strokeWidth="2"
        filter={`url(#${filterId})`}
      />
      
      {/* South - Darker teal */}
      <path
        d="M 50 88 L 42 68 L 50 72 L 58 68 Z"
        fill="#0d9488"
        stroke="white"
        strokeWidth="2"
        filter={`url(#${filterId})`}
      />
      
      {/* East - Orange (smaller) */}
      <path
        d="M 88 50 L 68 42 L 72 50 L 68 58 Z"
        fill="#f97316"
        stroke="white"
        strokeWidth="2"
        filter={`url(#${filterId})`}
      />
      
      {/* West - Light blue (smaller) */}
      <path
        d="M 12 50 L 32 42 L 28 50 L 32 58 Z"
        fill="#38bdf8"
        stroke="white"
        strokeWidth="2"
        filter={`url(#${filterId})`}
      />
      
      {/* Curved teal band wrapping around compass */}
      <path
        d="M 18 22 Q 28 12, 50 18 Q 72 12, 82 22 Q 76 50, 82 78 Q 72 88, 50 82 Q 28 88, 18 78 Q 24 50, 18 22"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.5"
        opacity="0.7"
        strokeLinecap="round"
      />
      
      {/* Airplane - Upper right quadrant, angled upward */}
      <g transform="translate(68, 18) rotate(30)">
        <path
          d="M 0 0 L 10 3 L 14 0 L 10 -3 Z"
          fill="#14b8a6"
          stroke="white"
          strokeWidth="2"
          filter={`url(#${filterId})`}
        />
        {/* Tail fin */}
        <path
          d="M 5 0 L 5 -8"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Body extension */}
        <path
          d="M 5 0 L 5 5"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      
      {/* Heart with location pin - Lower right, overlapping compass */}
      <g transform="translate(72, 72)">
        {/* Heart shape - Green left side, Orange right side */}
        <path
          d="M -8 2 C -8 -1, -12 -3, -15 -3 C -18 -3, -22 -1, -22 2 C -22 6, -15 12, -8 20 C -1 12, 6 6, 6 2 C 6 -1, 2 -3, -1 -3 C -4 -3, -8 -1, -8 2 Z"
          fill="#22c55e"
          stroke="white"
          strokeWidth="2"
          filter={`url(#${filterId})`}
        />
        {/* Right side of heart - Orange */}
        <path
          d="M -8 2 C -8 -1, -4 -3, -1 -3 C 2 -3, 6 -1, 6 2 C 6 6, -1 12, -8 20 Z"
          fill="#f97316"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Location pin inside heart - Teal-blue */}
        <circle cx="-8" cy="6" r="3.5" fill="#14b8a6" stroke="white" strokeWidth="1.5" />
        <path
          d="M -8 9.5 L -8 14"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold", textSize, className)}>
        Family Travel Tracker
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon />
      {showText && (
        <span className={cn("font-bold text-foreground", textSize)}>
          Family Travel Tracker
        </span>
      )}
    </div>
  );
};
