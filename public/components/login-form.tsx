import { GalleryVerticalEnd } from "lucide-react"
import { useForm, useStore } from "@tanstack/react-form"
import { AnimatePresence, motion } from "framer-motion"
import { isValidPhoneNumber, parsePhoneNumberWithError } from "libphonenumber-js"
import { memo, useCallback, useState, useEffect } from "react"
import { toast } from "sonner"

import { cn } from "@public/lib/utils"
import { Button } from "@public/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@public/components/ui/field"
import { Input } from "@public/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@public/components/ui/input-otp"
import pkg from "@package"
import { authClient } from "@public/lib/auth-client"
import { z } from "zod"

type AuthMethod = "email" | "phone"
type Step = "login" | "verify"

const formSchema = z
  .object({
    identifier: z
      .string()
      .min(1, "Identifier must be at least 1 character.")
      .max(255, "Identifier must be at most 255 characters."),
    otp: z.string(),
    step: z.enum(["login", "verify"]),
    method: z.enum(["email", "phone"]),
  })
  .superRefine((data, ctx) => {
    // Only validate OTP when on the verify step
    if (data.step === "verify") {
      if (data.otp.length !== 6) {
        ctx.addIssue({
          code: "custom",
          message: "OTP must be 6 characters.",
          path: ["otp"],
        })
      }
    }
  })

const FormHeader = memo(
  function FormHeader({ step, identifier }: { step: Step; identifier: string }) {

    const title =
      step === "login"
        ? `Welcome to ${pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)}`
        : "Enter verification code"

    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <a
          href="#"
          className="flex flex-col items-center gap-2 font-medium"
        >
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <span className="sr-only">
            {pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1)}
          </span>
        </a>
        <h1 className="text-xl font-bold">{title}</h1>
        {step === "verify" && (
          <FieldDescription>
            We sent a 6-digit code to {identifier}
          </FieldDescription>
        )}
      </div>
    )
  }
)

// Memoized social buttons - static, no need to re-render
const SocialButtons = memo(function SocialButtons() {
  const handleGoogleSignIn = useCallback(() => {
    authClient.signIn.social({ provider: "google" })
  }, [])

  const handleAppleSignIn = useCallback(() => {
    authClient.signIn.social({ provider: "apple" })
  }, [])

  return (
    <Field className="grid gap-4 sm:grid-cols-2">
      <Button
        onClick={handleAppleSignIn}
        variant="outline"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
            fill="currentColor"
          />
        </svg>
        Continue with Apple
      </Button>
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Continue with Google
      </Button>
    </Field>
  )
})

SocialButtons.displayName = "SocialButtons"

function ResendButton({ onResend }: { onResend: () => Promise<void> }) {
  const [cooldown, setCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
    try {
      await onResend()
      setCooldown(30)
    } finally {
      setIsResending(false)
    }
  }

  const isDisabled = cooldown > 0 || isResending

  return (
    <button
      type="button"
      onClick={handleResendClick}
      disabled={isDisabled}
      className="underline disabled:cursor-not-allowed disabled:text-muted-foreground"
    >
      {isResending
        ? "Resending..."
        : cooldown > 0
        ? `Resend in ${cooldown}s`
        : "Resend"}
    </button>
  )
}

// Login step component - only re-renders when form state changes
function LoginStep({
  field,
  isSubmitting
}: {
  field: any
  isSubmitting: boolean
}) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="identifier">
          Phone or email
        </FieldLabel>
        <Input
          id="identifier"
          type="text"
          placeholder="example@domain.com"
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          required
        />
      </Field>
      <Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending code..." : "Continue"}
        </Button>
      </Field>
      <FieldSeparator>Or</FieldSeparator>
      <SocialButtons />
    </>
  )
}

// Verify step component - isolated re-renders
function VerifyStep({
  field,
  isSubmitting,
  onBack,
  onResend,
}: {
  field: any
  isSubmitting: boolean
  onBack: () => void
  onResend: () => Promise<void>
}) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="otp" className="sr-only">
          Verification code
        </FieldLabel>
        <InputOTP
          maxLength={6}
          autoFocus
          id="otp"
          value={field.state.value}
          onChange={(value) => field.handleChange(value)}
          containerClassName="gap-4"
        >
          <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl gap-2.5">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl gap-2.5">
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <FieldDescription className="text-center">
          Didn&apos;t receive the code? <ResendButton onResend={onResend} />
        </FieldDescription>
      </Field>
      <Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
      </Field>
      <Field>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
      </Field>
    </>
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const form = useForm({
    defaultValues: {
      identifier: "",
      otp: "",
      step: "login" as Step,
      method: "email",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.step === "login") {
        const input = value.identifier.trim()
        const isPhone = isValidPhoneNumber(input, "US")
        const detectedMethod: AuthMethod = isPhone ? "phone" : "email"
        form.setFieldValue("method", detectedMethod)

        try {
          if (detectedMethod === "phone") {
            const phoneNumber = parsePhoneNumberWithError(input, "US")
            const formattedPhone = phoneNumber.format("E.164")
            await authClient.phoneNumber.sendOtp({
              phoneNumber: formattedPhone,
            })
            form.setFieldValue("identifier", formattedPhone)
            toast.success("Verification code sent to your phone")
          } else {
            await authClient.emailOtp.sendVerificationOtp({
              email: input,
              type: "sign-in",
            })
            form.setFieldValue("identifier", input)
            toast.success("Verification code sent to your email")
          }
          form.setFieldValue("step", "verify")
        } catch (err) {
          console.error("[LoginForm] Error during login step:", err)
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to send verification code",
          )
        }
      } else {
        const currentIdentifier = value.identifier
        if (value.method === "email") {
          try {
            const { error } = await authClient.signIn.emailOtp({
              email: value.identifier,
              otp: value.otp,
            })

            if (error) {
              console.error("[LoginForm] Email OTP error:", error)
              toast.error(error.message || "Invalid verification code")
            } else {
              toast.success("Successfully signed in!")
            }
          } catch (err) {
            console.error("[LoginForm] Email OTP exception:", err)
            toast.error(
              err instanceof Error ? err.message : "Failed to verify code",
            )
          }
        } else {
          try {
            const { error } = await authClient.phoneNumber.verify({
              phoneNumber: value.identifier,
              code: value.otp,
            })

            if (error) {
              console.error("[LoginForm] Phone verify error:", error)
              toast.error(error.message || "Invalid verification code")
            } else {
              toast.success("Successfully signed in!")
            }
          } catch (err) {
            console.error("[LoginForm] Phone verify exception:", err)
            toast.error(
              err instanceof Error ? err.message : "Failed to verify code",
            )
          }
        }
      }
    },
  })

  const handleBack = useCallback(() => {
    form.setFieldValue("step", "login")
    form.setFieldValue("otp", "")
  }, [form])

  const handleResend = useCallback(async () => {
    try {
      const method = form.getFieldValue('method');
      if (method === "email") {
        await authClient.emailOtp.sendVerificationOtp({
          email: form.getFieldValue('identifier'),
          type: "sign-in",
        })
        toast.success("Verification code resent to your email")
      } else {
        await authClient.phoneNumber.sendOtp({
          phoneNumber: form.getFieldValue('identifier'),
        })
        toast.success("Verification code resent to your phone")
      }
    } catch (err) {
      console.error("[LoginForm] Resend error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to resend code")
      throw err
    }
  }, [form])

  const motionVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  }

  const step = useStore(form.store, (state) => state.values.step);
  const identifier = useStore(form.store, (state) => state.values.identifier);

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <FormHeader step={step} identifier={identifier} />
              <AnimatePresence mode="wait">
                {step === "login" ? (
                  <motion.div
                    key="login"
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    <form.Field name="identifier">
                      {(field) => (
                        <LoginStep
                          field={field}
                          isSubmitting={form.state.isSubmitting}
                        />
                      )}
                    </form.Field>
                  </motion.div>
                ) : (
                  <motion.div
                    key="verify"
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-6"
                  >
                    <form.Field name="otp">
                      {(field) => (
                        <VerifyStep
                          field={field}
                          isSubmitting={form.state.isSubmitting}
                          onBack={handleBack}
                          onResend={handleResend}
                        />
                      )}
                    </form.Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </FieldGroup>
          </form>
          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </FieldDescription>
        </div>
      </div>
    </div>
  )
}
