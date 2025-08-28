import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hotel, AlertCircle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams

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
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {params?.error ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Error: {params.error}</p>
                  {params.error_description && (
                    <p className="text-sm text-muted-foreground">{params.error_description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  An unexpected authentication error occurred. Please try again.
                </p>
              )}

              <div className="pt-4 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Try Again</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/sign-up">Create New Account</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                If the problem persists, please contact your system administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
