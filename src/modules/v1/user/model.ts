import { t } from 'elysia'

/**
 * User module models (DTOs)
 * Types match Better Auth's actual return types
 */
export namespace UserModel {
  export const user = t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String({ format: 'email' }),
    phoneNumber: t.Optional(t.Union([t.String(), t.Null()])),
    emailVerified: t.Boolean(),
    phoneNumberVerified: t.Optional(t.Union([t.Boolean(), t.Null()])),
    image: t.Optional(t.Union([t.String(), t.Null()])),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  })
  export type User = typeof user.static

  export const PublicUser = t.Object({
    id: t.String(),
    name: t.String(),
    image: t.Optional(t.Union([t.String(), t.Null()])),
  })
  export type PublicUser = typeof PublicUser.static

  export const updateProfile = t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    image: t.Optional(t.Union([t.String({ format: 'uri' }), t.Null()])),
  })
  export type UpdateProfile = typeof updateProfile.static
}
