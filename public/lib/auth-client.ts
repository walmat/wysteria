import { createAuthClient } from 'better-auth/react'

import { phoneNumberClient } from "better-auth/client/plugins"
import { emailOTPClient } from "better-auth/client/plugins"


export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000/api/auth',
  plugins: [
    phoneNumberClient(),
    emailOTPClient(),
  ]
})
