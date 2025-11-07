import { openapi as _openapi, fromTypes } from '@elysiajs/openapi'
import pkg from '@package'
import { auth } from '../auth'

const isProduction = import.meta.env.NODE_ENV === 'production'
let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/auth/api') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const

export const openapi = async () =>
  _openapi({
    documentation: {
      components: await OpenAPI.components,
      paths: await OpenAPI.getPaths(),
      info: {
        title: `${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)} API`,
        version: pkg.version,
        description: `A detailed breakdown of the ${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)} API with Better Auth authentication`,
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints (handled by Better Auth)' },
        { name: 'User', description: 'User management endpoints' },
        { name: 'System', description: 'System endpoints' },
      ],
    },
    references: fromTypes(isProduction ? 'dist/index.d.ts' : 'src/index.ts'),
  })
