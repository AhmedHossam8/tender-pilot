import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import ComponentShowcase from "./pages/ComponentShowcase"
import "./index.css"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Component Showcase - For Development */}
          <Route path="/components" element={<ComponentShowcase />} />
          
          {/* Default route - redirect to showcase for now */}
          <Route path="/" element={<ComponentShowcase />} />
          
          {/* Add more routes here as you build pages */}
          {/* <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenders" element={<Tenders />} />
            <Route path="/proposals" element={<Proposals />} />
          </Route> */}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}

export default App
