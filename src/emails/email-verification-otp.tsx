import { Body, Container, Head, Heading, Html, Section, Text } from '@react-email/components'

interface EmailVerificationOTPProps {
  otp: string
}

export default function EmailVerificationOTPEmail({ otp }: EmailVerificationOTPProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Verify Your Email</Heading>
            <Text style={text}>
              Thank you for signing up! Please verify your email address by entering the code below:
            </Text>
            <Section style={otpBox}>
              <Text style={otpCode}>{otp}</Text>
            </Section>
            <Text style={text}>This code will expire in 5 minutes.</Text>
            <Text style={footerText}>
              If you didn't request this code, please ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const section = {
  padding: '24px',
  border: 'solid 1px #dedede',
  borderRadius: '5px',
  textAlign: 'center' as const,
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  color: '#333',
}

const text = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '24px',
  margin: '16px 0',
}

const otpBox = {
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const otpCode = {
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  color: '#333',
  margin: '0',
}

const footerText = {
  fontSize: '14px',
  color: '#666',
  lineHeight: '24px',
  margin: '16px 0 0',
}
