import { Toaster } from '@public/components/ui/sonner'
import type { ComponentType, PropsWithChildren } from 'react'
import { QueryProvider } from './query-provider'

/**
 * Type-safe utility to compose multiple React providers
 * Each provider must accept children and can have additional props
 */
type Provider<TProps = Record<string, unknown>> = [
  ComponentType<PropsWithChildren<TProps>>,
  TProps?,
]

/**
 * Composes multiple providers into a single component tree
 * Providers are nested in the order they appear in the array (first = outermost)
 *
 * @example
 * const providers: Provider[] = [
 *   [ThemeProvider, { theme: 'dark' }],
 *   [QueryProvider],
 *   [AuthProvider, { apiUrl: '/api' }]
 * ]
 */
function composeProviders(providers: Provider[]) {
  return ({ children }: PropsWithChildren) => {
    return providers.reduceRight(
      (acc, [Provider, props = {}]) => {
        return (
          <Provider key={Provider.displayName} {...props}>
            {acc}
          </Provider>
        )
      },
      <>
        {children}
        <Toaster />
      </>
    )
  }
}

/**
 * Main layout composition
 * Add new providers to this array to include them in the layout
 */
const providers: Provider[] = [
  [QueryProvider],
  // Add more providers here:
  // [ThemeProvider, { theme: 'dark' }],
  // [AuthProvider],
]

export const Providers = composeProviders(providers)
