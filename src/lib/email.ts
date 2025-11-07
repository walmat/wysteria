import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import SignInOTPEmail from '@server/emails/sign-in-otp'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import pkg from '@package'

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

/**
 * Send an email with OTP code
 *
 * You can use AWS SES, SendGrid, Resend, or any other email service
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
): Promise<void> {
  console.log(`[Email] Sending OTP to ${email}: ${otp}`)

  const html = renderToStaticMarkup(React.createElement(SignInOTPEmail, { otp }))


  const command = new SendEmailCommand({
    Source: 'noreply@wysteria.io',
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: `Your ${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)} Sign In Code` },
      Body: {
        Html: { Data: html },
      },
    },
  })
  await sesClient.send(command)
}
