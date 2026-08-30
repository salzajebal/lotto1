import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`bg-[var(--ad-panel)] border border-[var(--ad-border)] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline',
  size?: 'sm' | 'md' | 'lg'
}) {
  const base = "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md";
  
  const variants = {
    primary: "bg-[var(--ad-gold)] text-[#16130D] hover:bg-[var(--ad-gold-hover)]",
    secondary: "bg-[var(--ad-panel-hover)] text-white hover:bg-[#232A3B]",
    danger: "bg-[var(--ad-danger)] text-white hover:opacity-90",
    ghost: "bg-transparent text-[var(--ad-muted)] hover:text-white hover:bg-[var(--ad-panel-hover)]",
    outline: "bg-transparent border border-[var(--ad-border)] text-white hover:border-[var(--ad-gold)] hover:text-[var(--ad-gold)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`w-full px-3 py-2 rounded-md text-sm ${className}`} 
      {...props} 
    />
  );
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select 
      className={`w-full px-3 py-2 rounded-md text-sm appearance-none ${className}`} 
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea 
      className={`w-full px-3 py-2 rounded-md text-sm resize-y min-h-[80px] ${className}`} 
      {...props} 
    />
  );
}

export function Label({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <label className={`block text-xs font-semibold text-[var(--ad-muted)] mb-1.5 uppercase tracking-wider ${className}`}>
      {children}
    </label>
  );
}

export function Modal({ 
  title, isOpen, onClose, children, size = 'md',
}: { 
  title: string; isOpen: boolean; onClose: () => void; children: ReactNode; size?: 'md' | 'xl';
}) {
  if (!isOpen) return null;
  const maxWidth = size === 'xl' ? 'max-w-5xl' : 'max-w-md';
  return (
    <div className="admin-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-[var(--ad-panel)] border border-[var(--ad-border)] rounded-xl w-full ${maxWidth} shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--ad-border)]">
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-[var(--ad-muted)] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto admin-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    default: "bg-[#232A3B] text-[#E2E8F0]",
    success: "bg-[#1A3B26] text-[#3FB950]",
    warning: "bg-[#3B301A] text-[#E8BB51]",
    danger: "bg-[#3B1A1A] text-[#F85149]",
    info: "bg-[#1A2A3B] text-[#58A6FF]"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto admin-scrollbar border border-[var(--ad-border)] rounded-lg bg-[var(--ad-panel)]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 bg-[#0B0E14] text-[var(--ad-muted)] font-semibold text-xs uppercase tracking-wider border-b border-[var(--ad-border)] ${className}`} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 border-b border-[var(--ad-border)] text-[#E2E8F0] ${className}`} {...props}>
      {children}
    </td>
  );
}
