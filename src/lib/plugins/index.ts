// Use a fully-generic Elysia type to avoid incompatibilities between
// different plugin meta augmentations (e.g. openapi, typebox, etc.)
import type ElysiaBase from 'elysia'

type AnyElysia = ElysiaBase<any, any, any, any, any, any, any>

/**
 * A plugin can be:
 * - An Elysia instance
 * - A Promise that resolves to an Elysia instance
 * - A function that returns an Elysia instance (plugin factory)
 * - A function that returns a Promise of an Elysia instance (async plugin factory)
 */
type ElysiaPlugin =
  | AnyElysia
  | Promise<AnyElysia>
  | ((app: AnyElysia) => AnyElysia | Promise<AnyElysia>)

/**
 * Composes multiple Elysia plugins by applying them in order
 * Plugins are applied in the order they appear in the array (first = applied first)
 * Supports both synchronous and asynchronous plugins
 *
 * @example
 * const app = await composePlugins(new Elysia(), [
 *   cors(),
 *   swagger(),
 *   authService
 * ])
 *
 * @param app - The base Elysia app instance
 * @param plugins - Array of Elysia plugins to compose (can be sync or async)
 * @returns Promise of the app with all plugins applied
 */
export async function composePlugins(
  app: AnyElysia,
  plugins: readonly ElysiaPlugin[]
): Promise<AnyElysia> {
  let result = app
  for (const plugin of plugins) {
    // Handle plugin factories (functions)
    if (typeof plugin === 'function') {
      const pluginResult = plugin(result)
      result = await Promise.resolve(pluginResult)
    } else {
      // Handle direct Elysia instances or Promises
      const resolvedPlugin = await Promise.resolve(plugin)
      result = result.use(resolvedPlugin)
    }
  }
  return result
}
