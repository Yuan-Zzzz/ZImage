"use client";

import React from "react";

interface Win95TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
}

export default function Win95Textarea({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
  rows = 6,
}: Win95TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      className={`win95-inset bg-white px-2 py-1 text-sm font-sans text-win95-text placeholder:text-win95-gray w-full resize-none focus:outline-none focus-visible:outline-dotted focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 ${className}`}
    />
  );
}
