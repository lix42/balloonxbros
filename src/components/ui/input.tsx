import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

// shadcn's Input at the site's sizes: 48px tall (44px for "sm"), 12px radius.
const inputVariants = cva(
  "w-full min-w-0 rounded-lg border-[1.5px] border-input bg-white font-semibold text-ink transition-colors placeholder:text-[#757575] focus:border-blue focus:shadow-[0_0_0_3px_rgba(46,107,230,0.2)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      size: {
        default: "h-12 px-3.5 text-base",
        sm: "h-11 px-3 text-[15px]",
      },
    },
    defaultVariants: { size: "default" },
  },
);

function Input({
  className,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
