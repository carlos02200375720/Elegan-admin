"use client";

import { useId } from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  title,
  description,
  activeLabel = "Activado",
  inactiveLabel = "Desactivado",
  disabled = false,
  className = "",
}: ToggleSwitchProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className={`toggle-row ${className}`.trim()}>
      <div className="toggle-copy">
        <span id={titleId} className="toggle-title">
          {title}
        </span>
        {description && (
          <span id={descriptionId} className="toggle-desc">
            {description}
          </span>
        )}
      </div>

      <div className="toggle-control">
        <span
          className={`status-text ${checked ? "status-success" : "status-muted"}`}
        >
          {checked ? activeLabel : inactiveLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          disabled={disabled}
          className={`switch ${checked ? "is-checked" : ""}`}
          onClick={() => onChange(!checked)}
        >
          <span className="switch-thumb" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
