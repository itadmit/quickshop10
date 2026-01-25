import Link from 'next/link';

// ============================================
// Landing Page Button Component
// Server Component - Zero JS
// ============================================

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  href, 
  className = '',
  type = 'button',
}: ButtonProps) {
  // Base styles
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap";
  
  // Variant styles
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100 border-0",
    outline: "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  // Size styles
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-full font-bold",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {children}
    </button>
  );
}






