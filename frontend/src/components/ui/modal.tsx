import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'lg',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure the element is rendered before starting animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Prevent body scroll and compensate for scrollbar width
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Restore normal scrolling
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Ensure styles are reset on cleanup
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-6xl',
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      style={{ margin: 0 }}
    >
      {/* Backdrop with fade animation */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{ margin: 0, padding: 0 }}
      />

      {/* Modal content with scale and fade animation */}
      <div
        className={`
  relative bg-white rounded-3xl shadow-xl mx-4 my-8
  ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden
        transform transition-all duration-300 ease-out
        ${
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }
        ${className}
      `}
      >
        {/* Header */}
        {title && (
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
            <button
              onClick={onClose}
              className='p-1 rounded-full hover:bg-gray-100 transition-colors duration-200'
            >
              <X className='h-5 w-5 text-gray-500' />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all duration-200 hover:scale-105'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        )}

        {/* Content */}
        <div className='overflow-y-auto max-h-[calc(90vh-8rem)]'>
          {children}
        </div>
      </div>
    </div>
  );
};
