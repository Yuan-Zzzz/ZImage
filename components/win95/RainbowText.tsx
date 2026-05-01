"use client";

import React from "react";

interface RainbowTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "div" | "p";
}

export default function RainbowText({
  children,
  className = "",
  as: Tag = "span",
}: RainbowTextProps) {
  return (
    <Tag className={`text-rainbow font-display font-black ${className}`}>
      {children}
    </Tag>
  );
}
