import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-css-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
