import { Elysia } from 'elysia'
import { auth } from './lib/auth'

export const authService = new Elysia({ name: 'Auth.Service' }).macro({
  auth: {
    async resolve({ request, status }) {
      const session = await auth.api.getSession({
        headers: request.headers,
      })

      if (!session) {
        throw status(401, { error: 'Unauthorized' })
      }

      return {
        user: session.user,
        session: session.session,
      }
    },
  },
})
