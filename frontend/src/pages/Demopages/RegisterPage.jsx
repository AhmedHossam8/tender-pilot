import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button, InputWithLabel, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
import { toast } from "sonner"

function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate registration
    setTimeout(() => {
      setLoading(false)
      toast.success("Account created successfully!")
      navigate("/login")
    }, 1500)
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputWithLabel
              label="First name"
              placeholder="John"
              required
            />
            <InputWithLabel
              label="Last name"
              placeholder="Doe"
              required
            />
          </div>
          <InputWithLabel
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <InputWithLabel
            label="Company"
            placeholder="Your company name"
          />
          <InputWithLabel
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <InputWithLabel
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="rounded border-input mt-0.5" required />
            <span className="text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </span>
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default RegisterPage
