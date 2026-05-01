"use client";

import React from "react";

interface Win95WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export default function Win95Window({
  title,
  children,
  className = "",
  active = true,
  icon,
}: Win95WindowProps) {
  return (
    <div className={`win95-outset bg-win95-tile ${className}`}>
      {/* Title Bar */}
      <div className={active ? "win95-title-bar" : "win95-title-bar-inactive"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span>{icon}</span>}
            <span>{title}</span>
          </div>
          <div className="flex gap-1">
            <button className="win95-outset bg-win95-bg w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-[#D0D0D0]">
              _
            </button>
            <button className="win95-outset bg-win95-bg w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-[#D0D0D0]">
              □
            </button>
            <button className="win95-outset bg-win95-bg w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-[#D0D0D0]">
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">{children}</div>
    </div>
  );
}
