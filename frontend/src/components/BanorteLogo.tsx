interface BanorteLogoProps {
  variant?: 'white' | 'red';
  className?: string;
}

export default function BanorteLogo({
  variant = 'red',
  className = '',
}: BanorteLogoProps) {
  const logoSrc =
    variant === 'white' ? '/images/logo_white.png' : '/images/logo.png';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt='Banorte'
        className='h-8 w-auto'
        onError={(e) => {
          // Fallback if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const textColor =
              variant === 'white' ? 'text-white' : 'text-[#EB0029]';
            parent.innerHTML = `<span class="${textColor} font-bold text-xl">BANORTE</span>`;
          }
        }}
      />
    </div>
  );
}
