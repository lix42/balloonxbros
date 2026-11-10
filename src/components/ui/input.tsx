import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

// Border, radius, focus ring and type shared by Input and Textarea.
const fieldClass =
  "w-full min-w-0 rounded-lg border-[1.5px] border-input bg-white font-semibold text-ink transition-colors placeholder:text-faint focus:border-ring focus:ring-3 focus:ring-ring/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

// shadcn's Input at the site's sizes: 48px tall (44px for "sm"), 12px radius.
const inputVariants = cva(fieldClass, {
  variants: {
    size: {
      default: "h-12 px-3.5 text-base",
      sm: "h-11 px-3 text-[15px]",
    },
  },
  defaultVariants: { size: "default" },
});

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

export { fieldClass, Input, inputVariants };
