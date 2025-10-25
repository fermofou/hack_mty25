export function BanorteLogo() {
  return (
    <div className='flex items-center'>
      <img
        src='/images/logo.png'
        alt='Banorte'
        className='h-8 w-auto'
        onError={(e) => {
          // Fallback if image doesn't exist
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML =
              '<span class="text-[#EB0029] font-bold text-xl">BANORTE</span>';
          }
        }}
      />
    </div>
  );
}
