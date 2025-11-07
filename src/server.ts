import { serverTiming } from '@elysiajs/server-timing'
import pkg from '@package'
import { auth } from '@server/lib/auth'
import { v1 } from '@server/modules/v1'
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import { composePlugins } from './lib/plugins'
import { cors } from './lib/plugins/cors'
import { openapi } from './lib/plugins/openapi'
import { staticPlugin } from './lib/plugins/static'
import { telemetry } from './lib/plugins/telemetry'

const plugins = [staticPlugin(), telemetry(), openapi(), cors(), rateLimit(), serverTiming(), v1]

export const app = await composePlugins(new Elysia({ name: pkg.name }).mount(auth.handler), plugins)

app.listen(3000, (server) => {
  console.log(
    `🚀 ${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)} is running at http://${server.hostname}:${server.port}`
  )
})
