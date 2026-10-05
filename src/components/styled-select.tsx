"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type StyledSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
};

export default function StyledSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openAt(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && activeIndex >= 0) {
        selectOption(activeIndex);
      } else {
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className={`styled-select${open ? " styled-select-open" : ""}`} ref={rootRef}>
      <button
        aria-label={ariaLabel}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="styled-select-trigger"
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openAt(selectedIndex >= 0 ? selectedIndex : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className={selectedOption ? "" : "styled-select-placeholder"}>
          {selectedOption?.label ?? placeholder ?? "Selecteer een optie"}
        </span>
        <svg aria-hidden="true" className="styled-select-chevron" viewBox="0 0 20 20" fill="none">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div className="styled-select-menu" id={`${id}-listbox`} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <div
              aria-selected={index === selectedIndex}
              className={`styled-select-option${index === activeIndex ? " styled-select-option-active" : ""}`}
              id={`${id}-option-${index}`}
              key={option.value}
              onClick={() => selectOption(index)}
              onMouseDown={(event) => event.preventDefault()}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="option"
            >
              <span className="styled-select-option-copy">
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </span>
              {index === selectedIndex ? (
                <svg aria-hidden="true" className="styled-select-check" viewBox="0 0 20 20" fill="none">
                  <path d="m4 10 4 4 8-8" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
