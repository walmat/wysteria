import { authService } from '@server/auth-service'
import { Elysia, status, t } from 'elysia'
import { UserModel } from './model'
import { User } from './service'

export const userController = new Elysia({ prefix: '/user' })
  .use(authService)
  .get('/me', ({ user }) => user, {
    auth: true,
    detail: {
      summary: 'Get current user profile',
      tags: ['User'],
    },
    response: {
      200: UserModel.user,
    },
  })

  .patch(
    '/me',
    ({ user, body }) => {
      // TODO: Implement profile update logic with database
      return {
        ...user,
        ...body,
        updatedAt: new Date(),
      }
    },
    {
      auth: true,
      body: UserModel.updateProfile,
      detail: {
        summary: 'Update current user profile',
        tags: ['User'],
      },
      response: {
        200: UserModel.user,
      },
    }
  )

  .get(
    '/:id',
    async ({ params: { id } }) => {
      const user = await User.getUserById(id)
      if (!user) {
        throw status(404, 'User not found')
      }
      return user
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: 'Get user by ID',
        tags: ['User'],
      },
      response: {
        200: UserModel.PublicUser,
      },
    }
  )
