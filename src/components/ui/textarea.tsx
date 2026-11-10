import { cn } from "cn";
import type * as React from "react";
import { fieldClass } from "./input";

// shadcn's Textarea is a plain <textarea> (Base UI has no primitive); this one
// shares the site's Input styles (`fieldClass`) so the two can't drift.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClass, "min-h-32 px-3.5 py-3 text-base", className)}
      {...props}
    />
  );
}

export { Textarea };
