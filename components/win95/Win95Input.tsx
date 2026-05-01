"use client";

import React from "react";

interface Win95InputProps {
  type?: "text" | "password" | "email" | "number" | "url" | "date";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function Win95Input({
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  required = false,
}: Win95InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`win95-inset bg-white px-2 py-1 text-sm font-sans text-win95-text placeholder:text-win95-gray w-full focus:outline-none focus-visible:outline-dotted focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2 ${className}`}
    />
  );
}
