import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Use Transactional for OTP messages
        },
      },
    })

    await snsClient.send(command)
    console.log(`[SNS] SMS sent to ${phoneNumber}`)
  } catch (error) {
    console.error(`[SNS] Failed to send SMS to ${phoneNumber}:`, error)
    throw error
  }
}
