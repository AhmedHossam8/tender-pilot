import * as React from "react"
import { toast } from "sonner"

// UI Components
import {
  Button,
  Input,
  InputWithLabel,
  Textarea,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DataTable,
} from "@/components/ui"

// Common Components
import {
  LoadingSpinner,
  PageLoader,
  EmptyState,
  ConfirmDialog,
  SearchBar,
  FilterPanel,
} from "@/components/common"

// Icons
import {
  FileText,
  FolderOpen,
  Users,
  TrendingUp,
  Bell,
  Settings,
  Trash2,
  Edit,
  Eye,
  Plus,
  Download,
  Share,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react"

function ComponentShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState({})
  const [selectValue, setSelectValue] = React.useState("")

  // Sample data for table
  const sampleData = [
    { id: 1, name: "Website Redesign", status: "in-review", deadline: "2024-03-15", budget: "$50,000" },
    { id: 2, name: "Mobile App Development", status: "approved", deadline: "2024-04-01", budget: "$120,000" },
    { id: 3, name: "Cloud Migration", status: "draft", deadline: "2024-03-20", budget: "$75,000" },
    { id: 4, name: "Security Audit", status: "submitted", deadline: "2024-02-28", budget: "$25,000" },
    { id: 5, name: "Data Analytics Platform", status: "rejected", deadline: "2024-05-01", budget: "$200,000" },
  ]

  // Sample columns for DataTable
  const columns = [
    {
      accessorKey: "name",
      header: "Project Name",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
    },
    {
      accessorKey: "budget",
      header: "Budget",
    },
  ]

  // Sample filters
  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "draft", label: "Draft" },
        { value: "in-review", label: "In Review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    {
      key: "search",
      label: "Search",
      type: "text",
      placeholder: "Search projects...",
    },
    {
      key: "deadline",
      label: "Deadline",
      type: "date",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Component Showcase</h1>
          <p className="text-muted-foreground">
            TenderPilot UI Component Library
          </p>
        </div>

        {/* Colors Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Colors</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary" />
              <p className="text-sm text-center">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-secondary" />
              <p className="text-sm text-center">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent" />
              <p className="text-sm text-center">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-destructive" />
              <p className="text-sm text-center">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning" />
              <p className="text-sm text-center">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success" />
              <p className="text-sm text-center">Success</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Buttons</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">With Icons</h3>
            <div className="flex flex-wrap gap-4">
              <Button><Plus className="h-4 w-4 mr-2" />Create New</Button>
              <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download</Button>
              <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">States</h3>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button className="cursor-wait opacity-75">
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </Button>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input placeholder="Default input" />
              <Input placeholder="Disabled input" disabled />
              <InputWithLabel
                label="Email"
                type="email"
                placeholder="Enter your email"
              />
              <InputWithLabel
                label="With Error"
                placeholder="This field has an error"
                error="This field is required"
              />
            </div>
            <div className="space-y-4">
              <Textarea placeholder="Enter your message..." />
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Badges</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="draft" />
              <StatusBadge status="in-review" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
              <StatusBadge status="submitted" />
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is the card content area where you can add any content.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>

            <StatCard
              title="Total Tenders"
              value="156"
              change={12.5}
              changeType="increase"
              icon={FileText}
            />

            <StatCard
              title="Active Proposals"
              value="24"
              change={-3.2}
              changeType="decrease"
              icon={FolderOpen}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Team Members"
              value="8"
              icon={Users}
            />
            <StatCard
              title="Win Rate"
              value="68%"
              change={5.3}
              changeType="increase"
              icon={TrendingUp}
            />
          </div>
        </section>

        {/* Dialog Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Dialogs</h2>
          <div className="flex flex-wrap gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a dialog description. You can add any content here.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Dialog content goes here.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              onClick={() => setConfirmDialogOpen(true)}
            >
              Open Confirm Dialog
            </Button>
            <ConfirmDialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
              title="Delete Item?"
              description="This action cannot be undone. Are you sure you want to delete this item?"
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={() => toast.success("Item deleted!")}
            />
          </div>
        </section>

        {/* Tabs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Tabs</h2>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Details</TabsTrigger>
              <TabsTrigger value="tab3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">Overview Content</h3>
              <p className="text-muted-foreground mt-2">
                This is the overview tab content.
              </p>
            </TabsContent>
            <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">Details Content</h3>
              <p className="text-muted-foreground mt-2">
                This is the details tab content.
              </p>
            </TabsContent>
            <TabsContent value="tab3" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">Settings Content</h3>
              <p className="text-muted-foreground mt-2">
                This is the settings tab content.
              </p>
            </TabsContent>
          </Tabs>
        </section>

        {/* Toast Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Toasts</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => toast("Default toast message")}>
              Default Toast
            </Button>
            <Button
              variant="success"
              onClick={() => toast.success("Success! Operation completed.")}
            >
              Success Toast
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.error("Error! Something went wrong.")}
            >
              Error Toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("Info: This is informational.")}
            >
              Info Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.warning("Warning! Please be careful.")}
            >
              Warning Toast
            </Button>
          </div>
        </section>

        {/* Table Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Tables</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Table</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.slice(0, 3).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell><StatusBadge status={row.status} /></TableCell>
                      <TableCell>{row.deadline}</TableCell>
                      <TableCell>{row.budget}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Table with Sorting & Pagination</h3>
            <DataTable
              columns={columns}
              data={sampleData}
              searchKey="name"
              searchPlaceholder="Search projects..."
              pageSize={3}
            />
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Search & Filters</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Search Bar</h3>
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSearch={(v) => toast.info(`Searching for: ${v}`)}
              placeholder="Search tenders..."
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Filter Panel</h3>
            <FilterPanel
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onClearFilters={() => setActiveFilters({})}
            />
          </div>
        </section>

        {/* Loading States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Loading States</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Spinners</h3>
              <div className="flex items-center gap-8 p-4 border rounded-lg">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skeleton Text</h3>
              <div className="p-4 border rounded-lg">
                <SkeletonText lines={4} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skeleton Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skeleton Table</h3>
            <SkeletonTable rows={3} columns={4} />
          </div>
        </section>

        {/* Empty States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Empty States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg">
              <EmptyState
                title="No tenders found"
                description="Get started by creating your first tender."
                actionLabel="Create Tender"
                action={() => toast.info("Create tender clicked!")}
              />
            </div>
            <div className="border rounded-lg">
              <EmptyState
                illustration="no-results"
                title="No results"
                description="Try adjusting your search or filter criteria."
              />
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-medium">Heading 4</h4>
            <p className="text-base">
              This is a paragraph with <strong>bold text</strong> and{" "}
              <em>italic text</em>. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit.
            </p>
            <p className="text-sm text-muted-foreground">
              This is small muted text for secondary information.
            </p>
            <p className="text-xs text-muted-foreground">
              Extra small text for labels and captions.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t text-muted-foreground">
          <p>TenderPilot Component Library • Built with shadcn/ui + Tailwind CSS</p>
        </footer>
      </div>
    </div>
  )
}

export default ComponentShowcase
