import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-6',
    xl: 'size-8',
  }
  
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Spinner }
export type { SpinnerProps }
