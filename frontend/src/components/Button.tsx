import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'cursor-pointer inline-flex items-center justify-center h-[45px] px-6 rounded-[4px] text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EB0029] disabled:pointer-events-none disabled:bg-[#CFD2D3] disabled:text-[#A2A9AD]',
          variant === 'primary' && 'bg-[#EB0029] text-white hover:bg-[#DB0026]',
          variant === 'secondary' &&
            'bg-white text-[#323E48] border border-[#323E48] hover:text-[#DB0026] hover:border-[#DB0026]',
          variant === 'tertiary' &&
            'bg-transparent text-[#323E48] hover:text-[#DB0026] underline',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
