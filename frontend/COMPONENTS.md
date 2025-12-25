# TenderPilot Frontend Component Library

A comprehensive React component library built with shadcn/ui patterns, Radix UI primitives, and Tailwind CSS.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Library Reference](#library-reference)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Common Components](#common-components)
- [Usage Examples](#usage-examples)

---

## Quick Start

### Prerequisites

- Node.js >= 18.x (we recommend v20 LTS)
- npm >= 9.x

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Path Aliases

The project uses `@/` as an alias to `src/`. This is configured in:
- `vite.config.js` - For Vite bundler
- `jsconfig.json` - For VS Code IntelliSense

```javascript
// Instead of:
import { Button } from "../../../components/ui/Button"

// Use:
import { Button } from "@/components/ui/Button"
```

### Importing Components

```javascript
// Import individual components
import { Button, Input, Badge } from "@/components/ui"
import { LoadingSpinner, EmptyState } from "@/components/common"
import { Sidebar, Header } from "@/components/layout"

// Import layouts
import { AppLayout, AuthLayout } from "@/layouts"
```

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── index.js           # Barrel export
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── Dialog.jsx
│   │   ├── Tabs.jsx
│   │   ├── Select.jsx
│   │   ├── Toast.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Table.jsx
│   │   └── DataTable.jsx
│   ├── layout/                # Layout components
│   │   ├── index.js
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── MobileNav.jsx
│   │   └── Footer.jsx
│   └── common/                # Reusable common components
│       ├── index.js
│       ├── LoadingSpinner.jsx
│       ├── ErrorBoundary.jsx
│       ├── EmptyState.jsx
│       ├── ConfirmDialog.jsx
│       ├── SearchBar.jsx
│       └── FilterPanel.jsx
├── layouts/                   # Page layout wrappers
│   ├── index.js
│   ├── AppLayout.jsx
│   ├── AuthLayout.jsx
│   └── EmptyLayout.jsx
├── lib/
│   └── utils.js               # Utility functions
└── pages/
    └── ComponentShowcase.jsx  # Component demo page
```

---

## Library Reference

### Core Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react** | ^19.0.0 | UI library | Core framework for building components |
| **react-dom** | ^19.0.0 | React DOM renderer | Required for React web apps |
| **react-router-dom** | ^7.1.1 | Client-side routing | Navigation between pages, protected routes |

### State Management

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tanstack/react-query** | ^5.62.8 | Server state management | API calls, caching, background refetching |
| **zustand** | ^5.0.2 | Client state management | Global UI state, user preferences, auth state |

### Form Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **react-hook-form** | ^7.54.2 | Form state management | Complex forms, validation, performance |
| **zod** | ^3.24.1 | Schema validation | Form validation, API response validation |
| **@hookform/resolvers** | ^3.9.1 | Form validation integration | Connecting Zod schemas to react-hook-form |

### UI Primitives (Radix UI)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| **@radix-ui/react-dialog** | Modal dialogs | Confirmations, forms in modals, alerts |
| **@radix-ui/react-dropdown-menu** | Dropdown menus | Action menus, context menus |
| **@radix-ui/react-tabs** | Tab interfaces | Tabbed content, settings panels |
| **@radix-ui/react-select** | Select dropdowns | Form selects, filters |
| **@radix-ui/react-checkbox** | Checkboxes | Form checkboxes, multi-select |
| **@radix-ui/react-radio-group** | Radio buttons | Single-select options |
| **@radix-ui/react-switch** | Toggle switches | Boolean settings, feature toggles |
| **@radix-ui/react-tooltip** | Tooltips | Helper text, abbreviation explanations |
| **@radix-ui/react-popover** | Popovers | Rich tooltips, mini forms |
| **@radix-ui/react-accordion** | Accordions | FAQ sections, collapsible content |
| **@radix-ui/react-avatar** | User avatars | Profile pictures, user indicators |
| **@radix-ui/react-progress** | Progress bars | Upload progress, loading states |
| **@radix-ui/react-slider** | Range sliders | Numeric input ranges, filters |
| **@radix-ui/react-toast** | Toast notifications | (Base primitive, we use Sonner instead) |
| **@radix-ui/react-label** | Form labels | Accessible form labels |
| **@radix-ui/react-slot** | Component composition | Polymorphic components (asChild pattern) |

### Styling & Animation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **tailwindcss** | ^3.4.17 | Utility-first CSS | All styling needs |
| **class-variance-authority** | ^0.7.1 | Component variants | Creating variant props (size, color, etc.) |
| **clsx** | ^2.1.1 | Class concatenation | Conditional class names |
| **tailwind-merge** | ^2.6.0 | Tailwind class merging | Prevent class conflicts when combining |
| **tailwindcss-animate** | ^1.0.7 | CSS animations | Entry/exit animations, transitions |

### Data Display

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tanstack/react-table** | ^8.20.6 | Headless table logic | Complex tables with sorting, filtering, pagination |
| **recharts** | ^2.15.0 | Charts & graphs | Dashboards, analytics, data visualization |
| **date-fns** | ^4.1.0 | Date utilities | Date formatting, manipulation, comparisons |

### Notifications & Feedback

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **sonner** | ^1.7.1 | Toast notifications | Success/error messages, action confirmations |

### Icons

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **lucide-react** | ^0.468.0 | Icon library | All icons throughout the app |

### HTTP & API

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **axios** | ^1.7.9 | HTTP client | API requests (alternative to fetch) |

---

## UI Components

### Button

**File:** `src/components/ui/Button.jsx`

**Dependencies:** 
- `@radix-ui/react-slot` - For polymorphic rendering
- `class-variance-authority` - For variant management

**Exports:** `Button`, `buttonVariants`

**Variants:**
- `default` - Primary blue button
- `secondary` - Navy/dark button
- `destructive` - Red/danger button
- `outline` - Bordered button
- `ghost` - Transparent button
- `link` - Text link style
- `success` - Green/success button

**Sizes:** `sm`, `default`, `lg`, `xl`, `icon`

```jsx
import { Button } from "@/components/ui"

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive" size="lg">Delete</Button>

// With icon
<Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>

// As a link (polymorphic)
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

---

### Input

**File:** `src/components/ui/Input.jsx`

**Dependencies:** None (pure React)

**Exports:** `Input`, `InputWithLabel`, `Textarea`

```jsx
import { Input, InputWithLabel, Textarea } from "@/components/ui"

// Basic input
<Input placeholder="Enter text..." />

// Input with label and error
<InputWithLabel
  label="Email"
  type="email"
  placeholder="you@example.com"
  error="Invalid email address"
/>

// Textarea
<Textarea placeholder="Enter description..." rows={4} />
```

---

### Badge

**File:** `src/components/ui/Badge.jsx`

**Dependencies:**
- `class-variance-authority` - For variant management

**Exports:** `Badge`, `StatusBadge`, `badgeVariants`

**Variants:** `default`, `secondary`, `destructive`, `outline`, `success`, `warning`

**Status Variants (StatusBadge):** `draft`, `in-review`, `approved`, `rejected`, `submitted`

```jsx
import { Badge, StatusBadge } from "@/components/ui"

// Basic badge
<Badge>New</Badge>
<Badge variant="success">Active</Badge>

// Status badge (auto-formatted label)
<StatusBadge status="in-review" />  // Displays "In Review"
<StatusBadge status="approved" />   // Displays "Approved"
```

---

### Card

**File:** `src/components/ui/Card.jsx`

**Dependencies:** None (pure React)

**Exports:** `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`, `StatCard`

```jsx
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui"

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
</Card>

// Stat card (for dashboards)
<StatCard
  title="Total Tenders"
  value="156"
  change={12.5}
  changeType="increase"
  icon={FileText}
/>
```

---

### Dialog

**File:** `src/components/ui/Dialog.jsx`

**Dependencies:**
- `@radix-ui/react-dialog` - Dialog primitive

**Exports:** `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogTrigger`, `DialogClose`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

```jsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Form content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Tabs

**File:** `src/components/ui/Tabs.jsx`

**Dependencies:**
- `@radix-ui/react-tabs` - Tabs primitive

**Exports:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content here
  </TabsContent>
  <TabsContent value="details">
    Details content here
  </TabsContent>
  <TabsContent value="settings">
    Settings content here
  </TabsContent>
</Tabs>
```

---

### Select

**File:** `src/components/ui/Select.jsx`

**Dependencies:**
- `@radix-ui/react-select` - Select primitive
- `lucide-react` - Icons

**Exports:** `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`, `SelectWithLabel`

```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"

// Basic select
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// With label
import { SelectWithLabel } from "@/components/ui"

<SelectWithLabel
  label="Category"
  value={category}
  onValueChange={setCategory}
  placeholder="Select category"
  options={[
    { value: "tech", label: "Technology" },
    { value: "health", label: "Healthcare" },
  ]}
/>
```

---

### Toast (Sonner)

**File:** `src/components/ui/Toast.jsx` (Radix primitive, but we use Sonner)

**Dependencies:**
- `sonner` - Toast library (preferred)
- `@radix-ui/react-toast` - Base primitive (optional)

**Usage:** Import `toast` directly from Sonner

```jsx
import { toast } from "sonner"

// In your component
<Button onClick={() => toast.success("Saved successfully!")}>
  Save
</Button>

// Different toast types
toast("Default message")
toast.success("Success message")
toast.error("Error message")
toast.warning("Warning message")
toast.info("Info message")

// With options
toast.success("Created!", {
  description: "Your tender has been created.",
  duration: 5000,
})
```

**Note:** Make sure `<Toaster />` from Sonner is included in your app root (already in App.jsx).

---

### Skeleton

**File:** `src/components/ui/Skeleton.jsx`

**Dependencies:** None (pure React)

**Exports:** `Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonList`, `SkeletonText`

```jsx
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from "@/components/ui"

// Basic skeleton
<Skeleton className="h-4 w-[200px]" />

// Predefined patterns
<SkeletonCard />                    // Card placeholder
<SkeletonTable rows={5} columns={4} />  // Table placeholder
<SkeletonText lines={3} />          // Text paragraph placeholder
<SkeletonList items={5} />          // List placeholder
```

---

### Table

**File:** `src/components/ui/Table.jsx`

**Dependencies:** None (pure React)

**Exports:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`

```jsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.status}</TableCell>
        <TableCell>{row.date}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### DataTable

**File:** `src/components/ui/DataTable.jsx`

**Dependencies:**
- `@tanstack/react-table` - Headless table logic
- `lucide-react` - Sort icons

**Exports:** `DataTable`

**Features:** Sorting, filtering, pagination, search

```jsx
import { DataTable } from "@/components/ui"

// Define columns
const columns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "date",
    header: "Date",
  },
]

// Use DataTable
<DataTable
  columns={columns}
  data={tenders}
  searchKey="name"
  searchPlaceholder="Search tenders..."
  pageSize={10}
  pagination={true}
  sorting={true}
/>
```

---

## Layout Components

### Sidebar

**File:** `src/components/layout/Sidebar.jsx`

**Dependencies:**
- `react-router-dom` - NavLink
- `lucide-react` - Icons

**Exports:** `Sidebar`, `navigation`, `bottomNavigation`

```jsx
import { Sidebar } from "@/components/layout"

<Sidebar
  collapsed={isCollapsed}
  onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
/>
```

---

### Header

**File:** `src/components/layout/Header.jsx`

**Dependencies:**
- `react-router-dom` - Link
- `lucide-react` - Icons

**Exports:** `Header`

```jsx
import { Header } from "@/components/layout"

<Header
  onMenuClick={() => setMobileNavOpen(true)}
  user={{ name: "John Doe", email: "john@example.com" }}
/>
```

---

### MobileNav

**File:** `src/components/layout/MobileNav.jsx`

**Dependencies:**
- `react-router-dom` - NavLink
- `lucide-react` - Icons

**Exports:** `MobileNav`

```jsx
import { MobileNav } from "@/components/layout"

<MobileNav
  isOpen={mobileNavOpen}
  onClose={() => setMobileNavOpen(false)}
/>
```

---

### Footer

**File:** `src/components/layout/Footer.jsx`

**Dependencies:**
- `react-router-dom` - Link

**Exports:** `Footer`

```jsx
import { Footer } from "@/components/layout"

<Footer />
```

---

## Common Components

### LoadingSpinner

**File:** `src/components/common/LoadingSpinner.jsx`

**Dependencies:**
- `lucide-react` - Loader icon

**Exports:** `LoadingSpinner`, `PageLoader`, `FullPageLoader`

```jsx
import { LoadingSpinner, PageLoader, FullPageLoader } from "@/components/common"

// Inline spinner
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" text="Loading..." />

// Page-level loader
<PageLoader text="Loading tenders..." />

// Full-screen overlay loader
<FullPageLoader text="Saving changes..." />
```

---

### ErrorBoundary

**File:** `src/components/common/ErrorBoundary.jsx`

**Dependencies:**
- `lucide-react` - Icons

**Exports:** `ErrorBoundary`, `ErrorFallback`

```jsx
import { ErrorBoundary } from "@/components/common"

// Wrap components that might throw
<ErrorBoundary>
  <ProblematicComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <ProblematicComponent />
</ErrorBoundary>
```

---

### EmptyState

**File:** `src/components/common/EmptyState.jsx`

**Dependencies:**
- `lucide-react` - Icons

**Exports:** `EmptyState`

**Illustrations:** `default`, `no-results`, `no-documents`, `error`

```jsx
import { EmptyState } from "@/components/common"

<EmptyState
  title="No tenders found"
  description="Get started by creating your first tender."
  actionLabel="Create Tender"
  action={() => navigate("/tenders/new")}
/>

// With custom icon
<EmptyState
  icon={SearchIcon}
  illustration="no-results"
  title="No results"
  description="Try adjusting your search criteria."
/>
```

---

### ConfirmDialog

**File:** `src/components/common/ConfirmDialog.jsx`

**Dependencies:**
- `@radix-ui/react-dialog` - Via Dialog component
- `lucide-react` - Icons

**Exports:** `ConfirmDialog`

```jsx
import { ConfirmDialog } from "@/components/common"

const [showDelete, setShowDelete] = useState(false)

<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete Tender?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={async () => {
    await deleteTender(id)
    toast.success("Tender deleted")
  }}
/>
```

---

### SearchBar

**File:** `src/components/common/SearchBar.jsx`

**Dependencies:**
- `lucide-react` - Icons
- Uses `debounce` from `@/lib/utils`

**Exports:** `SearchBar`

```jsx
import { SearchBar } from "@/components/common"

<SearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={(term) => fetchResults(term)}
  placeholder="Search tenders..."
  debounceMs={300}
/>
```

---

### FilterPanel

**File:** `src/components/common/FilterPanel.jsx`

**Dependencies:**
- `lucide-react` - Icons

**Exports:** `FilterPanel`

```jsx
import { FilterPanel } from "@/components/common"

const filters = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "active", label: "Active" },
    ],
  },
  {
    key: "deadline",
    label: "Deadline",
    type: "date",
  },
  {
    key: "search",
    label: "Keyword",
    type: "text",
    placeholder: "Search...",
  },
]

<FilterPanel
  filters={filters}
  activeFilters={activeFilters}
  onFilterChange={setActiveFilters}
  onClearFilters={() => setActiveFilters({})}
  collapsible={true}
/>
```

---

## Usage Examples

### Complete Page Example

```jsx
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button, DataTable, StatusBadge } from "@/components/ui"
import { SearchBar, FilterPanel, EmptyState, PageLoader } from "@/components/common"
import { fetchTenders } from "@/api/tenders"

export default function TendersPage() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({})

  const { data: tenders, isLoading, error } = useQuery({
    queryKey: ["tenders", search, filters],
    queryFn: () => fetchTenders({ search, ...filters }),
  })

  const columns = [
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    { accessorKey: "deadline", header: "Deadline" },
    { accessorKey: "budget", header: "Budget" },
  ]

  if (isLoading) return <PageLoader />
  if (error) return <EmptyState illustration="error" title="Failed to load" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenders</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Tender
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tenders..."
        />
        <FilterPanel
          filters={filterConfig}
          activeFilters={filters}
          onFilterChange={setFilters}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {/* Data Table */}
      {tenders?.length > 0 ? (
        <DataTable columns={columns} data={tenders} pageSize={10} />
      ) : (
        <EmptyState
          title="No tenders yet"
          description="Create your first tender to get started."
          actionLabel="Create Tender"
          action={() => navigate("/tenders/new")}
        />
      )}
    </div>
  )
}
```

---

## Design Tokens

The design system is configured in `tailwind.config.js`:

### Colors

| Token | HSL Value | Usage |
|-------|-----------|-------|
| `primary` | 220 90% 56% | Primary actions, links |
| `secondary` | 220 20% 20% | Secondary backgrounds |
| `accent` | 142 76% 36% | Success states |
| `destructive` | 0 84% 60% | Errors, delete actions |
| `warning` | 38 92% 50% | Warnings |
| `success` | 142 76% 36% | Success messages |

### Status Colors

| Status | Color |
|--------|-------|
| `draft` | Muted gray |
| `in-review` | Blue |
| `approved` | Green |
| `rejected` | Red |
| `submitted` | Purple |

### Typography

- **Font Family:** Inter (with system fallbacks)
- **Font Sizes:** Following Tailwind defaults (sm, base, lg, xl, 2xl, etc.)

---

## Best Practices

1. **Always use the `cn()` utility** for combining class names:
   ```jsx
   import { cn } from "@/lib/utils"
   
   <div className={cn("base-class", isActive && "active-class", className)} />
   ```

2. **Use barrel exports** for cleaner imports:
   ```jsx
   // Good
   import { Button, Input, Badge } from "@/components/ui"
   
   // Avoid
   import { Button } from "@/components/ui/Button"
   import { Input } from "@/components/ui/Input"
   ```

3. **Prefer Sonner for toasts** over Radix Toast:
   ```jsx
   import { toast } from "sonner"
   toast.success("Done!")
   ```

4. **Use StatusBadge for tender/proposal statuses** for consistent styling.

5. **Wrap routes with ErrorBoundary** to catch rendering errors gracefully.

---

## Component Showcase

Visit `/components` in development to see all components in action:

```bash
npm run dev
# Open http://localhost:5173/components
```
