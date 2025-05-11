import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import "../styles/morphing-button.css";

interface MorphingButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function MorphingButton({
  children,
  onClick,
  className = "",
  disabled = false,
}: MorphingButtonProps) {
  const [isMorphing, setIsMorphing] = useState(false);

  useEffect(() => {
    let morphingTimer: NodeJS.Timeout;
    let resetTimer: NodeJS.Timeout;

    if (isMorphing) {
      // Após 0.8 segundos, adicione a classe de animação completa
      morphingTimer = setTimeout(() => {
        const button = document.querySelector(".morphing-button");
        button?.classList.add("morphing-complete");
      }, 800);

      // Após 1.5 segundos, resete o estado do botão
      resetTimer = setTimeout(() => {
        setIsMorphing(false);
      }, 1500);
    }

    return () => {
      clearTimeout(morphingTimer);
      clearTimeout(resetTimer);
    };
  }, [isMorphing]);

  const handleClick = () => {
    if (!isMorphing && !disabled) {
      setIsMorphing(true);

      onClick();
    }
  };

  const buttonClasses = `
    morphing-button
    ${isMorphing ? "morphing" : ""}
    ${className}
  `;

  return (
    <button
      onClick={handleClick}
      className={buttonClasses}
      disabled={disabled || isMorphing}
    >
      <span className="text-content">{children}</span>
      <span className="check-icon">
        <Check size={24} strokeWidth={3} />
      </span>
    </button>
  );
}
