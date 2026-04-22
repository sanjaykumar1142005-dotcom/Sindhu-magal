import React from 'react';

/**
 * A premium reusable button component with glassmorphism and modern aesthetics.
 */
const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    type = 'button',
    ...props
}) => {
    // Map variants to CSS classes
    const variantClasses = {
        primary: 'menu-plus-btn', // Orange gradient
        secondary: 'premium-link-btn--ghost', // Ghost style
        danger: 'menu-minus-btn', // Red gradient
        success: 'menu-print-btn', // Green gradient
        info: 'menu-save-btn', // Blue gradient
        glass: 'glass hover:bg-white/10'
    };

    // Size mappings
    const sizeClasses = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3.5 text-lg'
    };

    const baseClasses = `
        inline-flex items-center justify-center gap-2 
        font-bold rounded-xl transition-all duration-300 
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
        z-10 relative overflow-hidden
    `;

    const combinedClasses = `
        ${baseClasses} 
        ${variantClasses[variant] || variantClasses.primary} 
        ${sizeClasses[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
    `.trim();

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={combinedClasses}
            {...props}
        >
            {/* Shine effect for primary/success/info variants */}
            {(variant === 'primary' || variant === 'success' || variant === 'info') && (
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            )}
            
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                </span>
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="text-xl leading-none">{icon}</span>}
                    {children}
                    {icon && iconPosition === 'right' && <span className="text-xl leading-none">{icon}</span>}
                </>
            )}
        </button>
    );
};

export default Button;
