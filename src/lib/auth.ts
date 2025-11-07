import { db } from '@server/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP, openAPI, phoneNumber } from 'better-auth/plugins'
import { Resource } from 'sst'
import { sendOTPEmail } from './email'
import { sendSMS } from './sns'

export const auth = betterAuth({
  basePath: '/api/auth',

  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // Social OAuth providers
  socialProviders: {
    google: {
      clientId: Resource.GoogleClientId.value,
      clientSecret: Resource.GoogleClientSecret.value,
      accessType: 'offline',
      prompt: 'select_account consent',
    },
    apple: {
      clientId: Resource.AppleClientId.value,
      clientSecret: Resource.AppleClientSecret.value,
      appBundleIdentifier: 'io.wysteria.app',
    },
  },

  // Plugins
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail(email, otp, type)
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
    }),

    phoneNumber({
      async sendOTP(data) {
        const { phoneNumber, code } = data
        await sendSMS(phoneNumber, `Your Wysteria verification code is: ${code}`)
      },
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      signUpOnVerification: {
        getTempEmail: (phoneNumber: string) => `${phoneNumber.replace(/\+/g, '')}@temp.wysteria.io`,
        getTempName: (phoneNumber: string) => `User ${phoneNumber}`,
      },
    }),

    openAPI(),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // ttl = 7 days
    updateAge: 60 * 60 * 24, // update every 24 hours
  },

  trustedOrigins: ['https://wysteria.io', 'https://appleid.apple.com'],
})
