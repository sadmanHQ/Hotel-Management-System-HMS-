import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hotel, Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
              <Hotel className="h-8 w-8" />
              <span>HotelMS</span>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600">Account Created Successfully!</CardTitle>
              <CardDescription>Please check your email to verify your account</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span className="text-sm">Verification email sent</span>
              </div>

              <p className="text-sm text-muted-foreground">
                We've sent a verification link to your email address. Please click the link to activate your account and
                access the hotel management system.
              </p>

              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Return to Sign In</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or contact your system administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
