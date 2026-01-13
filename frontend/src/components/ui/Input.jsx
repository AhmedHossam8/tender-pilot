import * as React from "react";
import { cn } from "@/lib/utils";

// Single Input
const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Input with Label + Error + HelpText
const InputWithLabel = React.forwardRef(
  ({ className, label, error, helpText, required, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium text-white">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <Input ref={ref} error={error} {...props} />
        {helpText && !error && (
          <p className="text-xs text-slate-300">{helpText}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
InputWithLabel.displayName = "InputWithLabel";

// Textarea
const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Input, InputWithLabel, Textarea };
