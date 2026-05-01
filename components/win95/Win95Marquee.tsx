"use client";

import React from "react";

interface Win95MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  bgColor?: string;
}

export default function Win95Marquee({
  children,
  speed = 20,
  className = "",
  bgColor = "bg-win95-bg",
}: Win95MarqueeProps) {
  return (
    <div className={`win95-inset overflow-hidden ${bgColor} ${className}`}>
      <div
        className="animate-marquee inline-block"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}
