import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCounter?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
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

    props.placeholder = ' ';

    return (
      <div className='w-full relative group'>
        {label && (
          <label
            className={cn(
              'text-[#5B6670] absolute z-10 ml-[20px] pb-1 h-full flex items-center pointer-events-none transition-all font-medium group-focus-within:font-normal group-focus-within:text-[12px] group-focus-within:translate-y-[-12px]',
              {
                'font-normal text-[12px] translate-y-[-12px]': value !== '',
              }
            )}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          maxLength={maxLength}
          className={cn(
            'flex h-[50px] w-full bg-[#F6F6F6] pl-[20px] pr-[30px] pt-[20px] text-[15px] text-[#323E48] placeholder:text-[#C1C5C8]',
            'border-0 border-b-2 border-[#323E48] rounded-none',
            'focus-visible:outline-none focus-visible:border-[#EB0029]',
            'disabled:cursor-not-allowed disabled:text-[#C1C5C8]',
            'transition-colors',
            error && 'border-[#EB0029]',
            className
          )}
          style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 500 }}
          ref={ref}
          value={value}
          {...props}
        />
        {showClearButton && value && (
          <button
            type='button'
            onClick={onClear}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-[#323E48] hover:text-[#EB0029] transition-colors cursor-pointer'
          >
            &times;
          </button>
        )}
        <div className='flex items-center justify-between mt-1.5'>
          <div className='flex-1'>
            {helperText && !error && (
              <p
                className='text-xs text-[#5B6670]'
                style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 400 }}
              >
                {helperText}
              </p>
            )}
            {error && (
              <p
                className='text-xs text-[#EB0029]'
                style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 400 }}
              >
                {error}
              </p>
            )}
          </div>
          {showCount && (
            <span
              className='text-xs text-[#5B6670] ml-2'
              style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 400 }}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
