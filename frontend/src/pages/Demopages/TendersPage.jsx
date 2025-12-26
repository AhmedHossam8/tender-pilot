import * as React from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  StatusBadge,
  DataTable,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui"
import { SearchBar, FilterPanel, EmptyState } from "@/components/common"
import { Plus, Eye, Edit, Trash2, Download, Filter } from "lucide-react"
import { toast } from "sonner"

// Sample data
const sampleTenders = [
  { id: 1, title: "Website Redesign RFP", organization: "Tech Corp", status: "in-review", deadline: "2024-03-15", budget: "$50,000" },
  { id: 2, title: "Mobile App Development", organization: "StartupXYZ", status: "approved", deadline: "2024-04-01", budget: "$120,000" },
  { id: 3, title: "Cloud Migration Project", organization: "Enterprise Inc", status: "draft", deadline: "2024-03-20", budget: "$75,000" },
  { id: 4, title: "Security Audit Services", organization: "FinanceGroup", status: "submitted", deadline: "2024-02-28", budget: "$25,000" },
  { id: 5, title: "Data Analytics Platform", organization: "DataCo", status: "rejected", deadline: "2024-05-01", budget: "$200,000" },
  { id: 6, title: "ERP System Implementation", organization: "Manufacturing Ltd", status: "draft", deadline: "2024-06-15", budget: "$350,000" },
]

const columns = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue("title")}</p>
        <p className="text-sm text-muted-foreground">{row.original.organization}</p>
      </div>
    ),
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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => toast.info(`Viewing ${row.original.title}`)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => toast.info(`Editing ${row.original.title}`)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.error(`Delete ${row.original.title}?`)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

const filters = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "in-review", label: "In Review" },
      { value: "approved", label: "Approved" },
      { value: "submitted", label: "Submitted" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    key: "organization",
    label: "Organization",
    type: "text",
    placeholder: "Search organization...",
  },
]

function TendersPage() {
  const [searchValue, setSearchValue] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState({})
  const [activeTab, setActiveTab] = React.useState("all")

  const filteredData = sampleTenders.filter((tender) => {
    if (activeTab !== "all" && tender.status !== activeTab) return false
    if (searchValue && !tender.title.toLowerCase().includes(searchValue.toLowerCase())) return false
    if (activeFilters.status && tender.status !== activeFilters.status) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tenders</h1>
          <p className="text-muted-foreground">
            Manage and track all your tender opportunities
          </p>
        </div>
        <Button onClick={() => toast.success("Create tender modal would open")}>
          <Plus className="h-4 w-4 mr-2" />
          New Tender
        </Button>
      </div>

      {/* Tabs for quick filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-2">{sampleTenders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft <Badge variant="secondary" className="ml-2">{sampleTenders.filter(t => t.status === "draft").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-review">
            In Review <Badge variant="secondary" className="ml-2">{sampleTenders.filter(t => t.status === "in-review").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved <Badge variant="secondary" className="ml-2">{sampleTenders.filter(t => t.status === "approved").length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search tenders..."
          className="sm:w-80"
        />
        <FilterPanel
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          onClearFilters={() => setActiveFilters({})}
          className="flex-1"
        />
      </div>

      {/* Data Table */}
      {filteredData.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredData}
          pageSize={5}
        />
      ) : (
        <EmptyState
          title="No tenders found"
          description="Try adjusting your search or filter criteria"
          illustration="no-results"
        />
      )}
    </div>
  )
}

export default TendersPage
