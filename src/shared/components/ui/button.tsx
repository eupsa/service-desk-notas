import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-input bg-background hover:bg-muted',
        icon: 'min-h-11 min-w-11 bg-transparent p-2 text-foreground hover:text-primary hover:opacity-80 active:opacity-60',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
type Props = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: Props) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, className }))} {...props} />
  );
}
