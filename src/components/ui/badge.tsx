import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-[min(var(--radius-sm),8px)] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:shrink-0 transition-[color,box-shadow] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground dark:bg-secondary dark:text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground dark:bg-destructive dark:text-destructive-foreground",
        outline: "text-foreground dark:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
