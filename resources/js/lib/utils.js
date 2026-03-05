import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Helper function for reactive state updating in TanStack Table
 * @param {Function|any} updaterOrValue - Updater function or direct value
 * @param {import('vue').Ref} ref - Vue ref to update
 */
export function valueUpdater(updaterOrValue, ref) {
  if (typeof updaterOrValue === 'function') {
    ref.value = updaterOrValue(ref.value)
  } else {
    ref.value = updaterOrValue
  }
}
