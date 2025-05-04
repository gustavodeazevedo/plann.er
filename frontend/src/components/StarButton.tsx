import React, { ReactNode } from "react";
import { StarSvg } from "./StarSvg";
import "../styles/star-button.css";

interface StarButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function StarButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: StarButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`star-button ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
      <div className="star-1">
        <StarSvg />
      </div>
      <div className="star-2">
        <StarSvg />
      </div>
      <div className="star-3">
        <StarSvg />
      </div>
      <div className="star-4">
        <StarSvg />
      </div>
      <div className="star-5">
        <StarSvg />
      </div>
      <div className="star-6">
        <StarSvg />
      </div>
    </button>
  );
}
