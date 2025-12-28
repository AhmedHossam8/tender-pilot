import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button, Input, InputWithLabel, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { toast } from "sonner"

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate login
    setTimeout(() => {
      setLoading(false)
      toast.success("Login successful!")
      navigate("/dashboard")
    }, 1500)
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <InputWithLabel
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <InputWithLabel
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-input" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default LoginPage
