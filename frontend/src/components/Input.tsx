import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCounter?: boolean;
  alwaysFloatLabel?: boolean;
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
      value,
      alwaysFloatLabel,
      ...props
    },
    ref
  ) => {
    const [hasContent, setHasContent] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const currentLength = value ? String(value).length : 0;
    const showCount = showCounter && maxLength;

    // Check for autofilled content
    React.useEffect(() => {
      const currentInput = inputRef.current;

      const checkAutofill = () => {
        if (currentInput) {
          const hasValue = currentInput.value !== '';
          const isAutofilled =
            currentInput.matches(':-webkit-autofill') ||
            currentInput.matches(':autofill');
          setHasContent(hasValue || isAutofilled);
        }
      };

      // Check immediately
      checkAutofill();

      // Set up observers for autofill detection
      const interval = setInterval(checkAutofill, 100);

      // Also check on animation events (some browsers trigger this on autofill)
      const handleAnimationStart = (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          setHasContent(true);
        }
      };

      if (currentInput) {
        currentInput.addEventListener('animationstart', handleAnimationStart);
      }

      return () => {
        clearInterval(interval);
        if (currentInput) {
          currentInput.removeEventListener(
            'animationstart',
            handleAnimationStart
          );
        }
      };
    }, []);

    // Update hasContent when value changes
    React.useEffect(() => {
      const hasValue = value !== '' && value !== undefined && value !== null;
      setHasContent(hasValue);
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const shouldFloatLabel = hasContent || isFocused || alwaysFloatLabel;

    return (
      <div className='w-full relative group'>
        <style>{`
          /* CSS for autofill detection */
          @keyframes onAutoFillStart {
            from { }
            to { }
          }
          
          input:-webkit-autofill {
            animation-name: onAutoFillStart;
            animation-duration: 0.001s;
          }
        `}</style>

        {label && (
          <label
            className={cn(
              'text-[#5B6670] absolute z-10 ml-[20px] pb-1 h-full flex items-center pointer-events-none transition-all font-medium group-focus-within:font-normal group-focus-within:text-[12px] group-focus-within:translate-y-[-12px]',
              {
                'font-normal text-[12px] translate-y-[-12px]': shouldFloatLabel,
              }
            )}
          >
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type={type}
          maxLength={maxLength}
          className={cn(
            'flex h-[50px] w-full bg-[#F6F6F6] pl-[20px] pr-[30px] pt-[20px] text-[15px] text-[#323E48] placeholder:text-transparent',
            'border-0 border-b-2 border-[#323E48] rounded-none',
            'focus-visible:outline-none focus-visible:border-[#EB0029]',
            'disabled:cursor-not-allowed disabled:text-[#C1C5C8]',
            'transition-colors',
            error && 'border-[#EB0029]',
            className
          )}
          style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 500 }}
          value={value}
          placeholder=' '
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
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
