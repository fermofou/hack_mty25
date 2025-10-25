"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface BanorteInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCounter?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

const BanorteInput = React.forwardRef<HTMLInputElement, BanorteInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      maxLength,
      showCounter,
      showClearButton,
      onClear,
      value,
      ...props
    },
    ref
  ) => {
    const currentLength = value ? String(value).length : 0;
    const showCount = showCounter && maxLength;

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-xs text-[#5B6670] mb-1.5"
            style={{ fontFamily: "Gotham, sans-serif", fontWeight: 400 }}
          >
            {label}
            {props.required && <span className="text-[#EB0029] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            maxLength={maxLength}
            className={cn(
              "flex h-[50px] w-full bg-[#F6F6F6] px-3 py-2 text-[15px] text-[#323E48] placeholder:text-[#C1C5C8]",
              "border-0 border-b-2 border-[#323E48] rounded-none",
              "focus-visible:outline-none focus-visible:border-[#EB0029]",
              "disabled:cursor-not-allowed disabled:text-[#C1C5C8]",
              "transition-colors",
              error && "border-[#EB0029]",
              className
            )}
            style={{ fontFamily: "Gotham, sans-serif", fontWeight: 500 }}
            ref={ref}
            value={value}
            {...props}
          />
          {showClearButton && value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#323E48] hover:text-[#EB0029] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex-1">
            {helperText && !error && (
              <p
                className="text-xs text-[#5B6670]"
                style={{ fontFamily: "Gotham, sans-serif", fontWeight: 400 }}
              >
                {helperText}
              </p>
            )}
            {error && (
              <p
                className="text-xs text-[#EB0029]"
                style={{ fontFamily: "Gotham, sans-serif", fontWeight: 400 }}
              >
                {error}
              </p>
            )}
          </div>
          {showCount && (
            <span
              className="text-xs text-[#5B6670] ml-2"
              style={{ fontFamily: "Gotham, sans-serif", fontWeight: 400 }}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
BanorteInput.displayName = "BanorteInput";

export { BanorteInput };
