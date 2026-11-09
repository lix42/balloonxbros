import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

// shadcn's Button, with the site's own variants (docs/DESIGN.md): red and ink
// pill buttons 52–56px tall, the outlined "Pre-order" pill, text links,
// 44px icon buttons and admin tabs. Use buttonVariants() to style a Link.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center gap-2 font-extrabold no-underline transition-colors select-none disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        red: "justify-center rounded-full bg-red text-white hover:bg-red-hover hover:text-white",
        ink: "justify-center rounded-full bg-ink text-white hover:bg-ink-hover hover:text-white",
        pill: "min-h-11 justify-center rounded-full border-2 border-ink px-4 text-sm text-ink hover:bg-ground hover:text-ink",
        link: "min-h-11 gap-1.5 bg-transparent p-0 text-sm text-link hover:text-link-hover",
        icon: "size-11 justify-center rounded-lg bg-transparent text-ink hover:text-ink",
        tab: "min-h-11 justify-center rounded-full border-[1.5px] border-line-strong bg-white px-4 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white",
      },
      size: {
        lg: "h-14 px-7 text-[17px]",
        md: "h-13 px-7 text-[17px]",
        none: "",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "red", size: "none", block: false },
  },
);

function Button({
  className,
  variant,
  size,
  block,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
