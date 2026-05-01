"use client";

import React from "react";

interface Win95ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "primary" | "danger" | "success";
  disabled?: boolean;
  className?: string;
}

export default function Win95Button({
  children,
  onClick,
  type = "button",
  variant = "default",
  disabled = false,
  className = "",
}: Win95ButtonProps) {
  const variantStyles = {
    default: "bg-win95-bg text-win95-text",
    primary: "bg-win95-blue text-white",
    danger: "bg-win95-red text-white",
    success: "bg-win95-darkgreen text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`win95-btn ${variantStyles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
