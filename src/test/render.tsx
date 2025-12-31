/**
 * Custom Render Utilities
 *
 * Usage:
 *   import { renderWithProviders, screen, userEvent } from '@/test/render'
 *   const { user } = renderWithProviders(<MyComponent />)
 *   await user.click(screen.getByRole('button'))
 */

import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent }

interface WrapperProps {
  children: ReactNode
}

/**
 * Default wrapper for all tests
 * Add providers here (Router, Theme, State, etc.) as the app grows
 */
function AllProviders({ children }: WrapperProps) {
  return <>{children}</>
}

interface CustomRenderResult extends ReturnType<typeof render> {
  user: ReturnType<typeof userEvent.setup>
}

/**
 * Custom render that includes:
 * - All app providers
 * - User event setup for interactions
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult {
  const user = userEvent.setup()

  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...options })
  }
}

/**
 * Wait for async operations to complete
 */
export async function waitForLoadingToFinish(): Promise<void> {
  // Wait for any pending promises
  await new Promise(resolve => setTimeout(resolve, 0))
}
