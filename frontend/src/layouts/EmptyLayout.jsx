import * as React from "react"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

function EmptyLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster position="top-right" richColors />
    </div>
  )
}

export default EmptyLayout
