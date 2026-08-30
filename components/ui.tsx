'use client';

import React, { forwardRef } from 'react';
import type { ReactNode, ForwardedRef } from 'react';
import { cn, formatResponseText } from '@/lib/utils';
import { AlertCircle, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';

export function PageHeader({ 
  title,
  description,
  action,
  className 
}: { 
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 lg:mb-8', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-heading sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-text-muted sm:text-base leading-6 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: { 
  icon?: any;
  title: string; 
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <h3 className="text-sm font-medium text-text-heading mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-text-muted max-w-sm leading-5">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Card({ 
  children, 
  className,
  hover = false,
  elevated = false
}: { 
  children: ReactNode; 
  className?: string;
  hover?: boolean;
  elevated?: boolean;
}) {
  return (
    <div className={cn(
      'bg-surface/70 backdrop:blur-xl border border-border/30 rounded-2xl',
      elevated ? 'shadow-[0_4px_20px_rgba(0,0,0,0.15)]' : 'shadow-sm',
      hover && 'transition-all duration-300 hover:bg-surface/90 hover:border-border/50 hover:shadow-lg',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4 border-b border-border/40', className)}>
      {children}
    </div>
  );
}

export function CardContent({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <h2 className={cn('text-xs font-semibold uppercase tracking-wider text-primary', className)}>
      {children}
    </h2>
  );
}

export function StatCard({ 
  icon: Icon, 
  value, 
  label,
  trend,
  trendUp = true,
  className 
}: { 
  icon?: any; 
  value: string | number; 
  label: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}) {
  return (
    <Card elevated className={cn('p-5 transition-all duration-300 hover:-translate-y-0.5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-semibold text-text-heading mb-1 tracking-tight">{value}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-muted">{label}</p>
            {trend && (
              <span className={cn('text-xs font-medium', trendUp ? 'text-success' : 'text-danger')}>
                {trend}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Badge({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: ReactNode; 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}) {
  const variants = {
    default: 'bg-background-secondary/60 text-text-body/70',
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
    outline: 'border border-border/50 bg-transparent text-text-muted',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function Section({ 
  title, 
  children,
  action,
  className 
}: { 
  title: string; 
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      <div className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
          {title}
        </span>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

export function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className 
}: { 
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary/40',
    secondary: 'bg-background-secondary/80 text-text-heading hover:bg-surface border border-border/40',
    ghost: 'bg-transparent text-text-muted hover:bg-surface/60',
    danger: 'bg-danger/15 text-danger hover:bg-danger/25',
    outline: 'border border-border/50 bg-transparent text-text-heading hover:bg-surface/60',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
      {children}
    </button>
  );
}

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  [key: string]: any;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { value, onChange, placeholder, type = 'text', className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  );
});

interface TextAreaProps {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  readOnly?: boolean;
  [key: string]: any;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { value, onChange, placeholder, rows = 4, className, readOnly = false, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      className={cn(
        'w-full resize-none rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        className
      )}
      {...props}
    />
  );
});

export function Select({ 
  value, 
  onChange, 
  options,
  placeholder,
  className,
  ...props 
}: { 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'w-full rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-2.5 text-sm text-text-heading outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20 appearance-none',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function Alert({ 
  variant = 'info', 
  title,
  description,
  className 
}: { 
  variant?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  className?: string;
}) {
  const variants = {
    info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-200', iconColor: 'text-blue-300' },
    success: { icon: CheckCircle2, bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', iconColor: 'text-success' },
    warning: { icon: AlertCircle, bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', iconColor: 'text-warning' },
    error: { icon: XCircle, bg: 'bg-danger/10', border: 'border-danger/30', text: 'text-danger', iconColor: 'text-danger' },
  };

  const Icon = variants[variant].icon;

  return (
    <div className={cn(
      'rounded-xl border p-4',
      variants[variant].bg,
      variants[variant].border,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-4 w-4 mt-0.5', variants[variant].iconColor)} />
        <div>
          <p className={cn('text-sm font-medium', variants[variant].text)}>{title}</p>
          {description && (
            <p className="mt-1 text-xs text-text-muted">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResponseDisplay({ 
  content, 
  placeholder = "AI response will appear...",
  className,
  compact = false
}: { 
  content: string; 
  placeholder?: string;
  className?: string;
  compact?: boolean;
}) {
  if (!content) {
    return (
      <div className={cn(
        'text-sm text-text-muted italic',
        compact ? 'min-h-0' : 'min-h-[200px]',
        className
      )}>
        {placeholder}
      </div>
    );
  }

  const formattedHtml = formatResponseText(content);

  return (
    <div
      className={cn(
        'text-sm text-text-heading',
        className
      )}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
