import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  /** Accessible label and fallback text. */
  label: string;
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  align = "left",
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const selected = options.find((option) => option.value === value);

  const focusOption = (direction: 1 | -1) => {
    const optionButtons = Array.from(
      containerRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="option"]',
      ) ?? [],
    );
    if (optionButtons.length === 0) return;

    const currentIndex = optionButtons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex = direction === 1
      ? (currentIndex + 1) % optionButtons.length
      : (currentIndex - 1 + optionButtons.length) % optionButtons.length;

    optionButtons[nextIndex]?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full lg:w-auto ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            window.requestAnimationFrame(() => focusOption(1));
          }
        }}
        className="flex h-10 w-full items-center gap-2 border border-stone-200 bg-white px-3 text-left text-[9px] font-bold uppercase tracking-widest text-stone-600 transition-colors hover:border-stone-400 focus-visible:border-stone-900 focus-visible:outline-none lg:w-auto"
      >
        {Icon && (
          <Icon
            size={13}
            className="shrink-0 text-stone-400"
            aria-hidden="true"
          />
        )}
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? label}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id={menuId}
        role="listbox"
        aria-label={label}
        aria-hidden={!isOpen}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            focusOption(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            focusOption(-1);
          }
        }}
        className={`absolute z-40 mt-2 min-w-full max-w-[calc(100vw-2rem)] overflow-hidden border border-stone-100 bg-white py-1 shadow-xl transition-all duration-200 sm:max-w-[280px] ${
          align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
        } ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[9px] uppercase tracking-widest transition-colors ${
                isSelected
                  ? "bg-stone-50 text-stone-900"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {isSelected && (
                <Check size={12} className="shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
