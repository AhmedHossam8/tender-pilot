import * as React from "react"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

function EmptyLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Outlet />
      <Toaster position="top-right" richColors />
    </div>
  )
}

export default EmptyLayout
