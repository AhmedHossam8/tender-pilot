import * as React from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
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
      header: t('showcase.projectName'),
    },
    {
      accessorKey: "status",
      header: t('showcase.status'),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "deadline",
      header: t('showcase.deadline'),
    },
    {
      accessorKey: "budget",
      header: t('showcase.budget'),
    },
  ]

  // Sample filters
  const filters = [
    {
      key: "status",
      label: t('showcase.status'),
      type: "select",
      options: [
        { value: "draft", label: t('status.draft') },
        { value: "in-review", label: t('status.inReview') },
        { value: "approved", label: t('status.approved') },
        { value: "rejected", label: t('status.rejected') },
      ],
    },
    {
      key: "search",
      label: t('showcase.search'),
      type: "text",
      placeholder: t('showcase.searchProjects'),
    },
    {
      key: "deadline",
      label: t('showcase.deadline'),
      type: "date",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('showcase.title')}</h1>
          <p className="text-muted-foreground">
            {t('showcase.subtitle')}
          </p>
        </div>

        {/* Colors Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.colors')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary" />
              <p className="text-sm text-center">{t('showcase.primary')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-secondary" />
              <p className="text-sm text-center">{t('showcase.secondary')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent" />
              <p className="text-sm text-center">{t('showcase.accent')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-destructive" />
              <p className="text-sm text-center">{t('showcase.destructive')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning" />
              <p className="text-sm text-center">{t('showcase.warning')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success" />
              <p className="text-sm text-center">{t('showcase.success')}</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.buttons')}</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.variants')}</h3>
            <div className="flex flex-wrap gap-4">
              <Button>{t('showcase.default')}</Button>
              <Button variant="secondary">{t('showcase.secondary')}</Button>
              <Button variant="destructive">{t('showcase.destructive')}</Button>
              <Button variant="outline">{t('showcase.outline')}</Button>
              <Button variant="ghost">{t('showcase.ghost')}</Button>
              <Button variant="link">{t('showcase.link')}</Button>
              <Button variant="success">{t('showcase.success')}</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.sizes')}</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">{t('showcase.small')}</Button>
              <Button>{t('showcase.default')}</Button>
              <Button size="lg">{t('showcase.large')}</Button>
              <Button size="xl">{t('showcase.extraLarge')}</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.withIcons')}</h3>
            <div className="flex flex-wrap gap-4">
              <Button><Plus className="h-4 w-4 mr-2" />{t('showcase.createNew')}</Button>
              <Button variant="outline"><Download className="h-4 w-4 mr-2" />{t('showcase.download')}</Button>
              <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />{t('showcase.delete')}</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.states')}</h3>
            <div className="flex flex-wrap gap-4">
              <Button disabled>{t('showcase.disabled')}</Button>
              <Button className="cursor-wait opacity-75">
                <LoadingSpinner size="sm" className="mr-2" />
                {t('showcase.loading')}
              </Button>
            </div>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.inputs')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input placeholder={t('showcase.defaultInput')} />
              <Input placeholder={t('showcase.disabledInput')} disabled />
              <InputWithLabel
                label={t('auth.email')}
                type="email"
                placeholder={t('auth.enterEmail')}
              />
              <InputWithLabel
                label={t('showcase.withError')}
                placeholder={t('showcase.errorPlaceholder')}
                error={t('showcase.fieldRequired')}
              />
            </div>
            <div className="space-y-4">
              <Textarea placeholder={t('showcase.enterMessage')} />
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder={t('showcase.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">{t('showcase.option')} 1</SelectItem>
                  <SelectItem value="option2">{t('showcase.option')} 2</SelectItem>
                  <SelectItem value="option3">{t('showcase.option')} 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.badges')}</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.variants')}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>{t('showcase.default')}</Badge>
              <Badge variant="secondary">{t('showcase.secondary')}</Badge>
              <Badge variant="destructive">{t('showcase.destructive')}</Badge>
              <Badge variant="outline">{t('showcase.outline')}</Badge>
              <Badge variant="success">{t('showcase.success')}</Badge>
              <Badge variant="warning">{t('showcase.warning')}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.statusBadges')}</h3>
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
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.cards')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('showcase.cardTitle')}</CardTitle>
                <CardDescription>{t('showcase.cardDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('showcase.cardContent')}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">{t('common.cancel')}</Button>
                <Button>{t('common.submit')}</Button>
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
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.dialogs')}</h2>
          <div className="flex flex-wrap gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>{t('showcase.openDialog')}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('showcase.dialogTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('showcase.dialogDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>{t('showcase.dialogContent')}</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>{t('common.confirm')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="destructive"
              onClick={() => setConfirmDialogOpen(true)}
            >
              {t('showcase.openConfirmDialog')}
            </Button>
            <ConfirmDialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
              title={t('showcase.deleteItem')}
              description={t('showcase.deleteConfirmation')}
              confirmLabel={t('showcase.delete')}
              variant="destructive"
              onConfirm={() => toast.success(t('showcase.itemDeleted'))}
            />
          </div>
        </section>

        {/* Tabs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.tabs')}</h2>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">{t('showcase.overview')}</TabsTrigger>
              <TabsTrigger value="tab2">{t('showcase.details')}</TabsTrigger>
              <TabsTrigger value="tab3">{t('showcase.settings')}</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">{t('showcase.overviewContent')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('showcase.overviewText')}
              </p>
            </TabsContent>
            <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">{t('showcase.detailsContent')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('showcase.detailsText')}
              </p>
            </TabsContent>
            <TabsContent value="tab3" className="p-4 border rounded-lg mt-2">
              <h3 className="font-medium">{t('showcase.settingsContent')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('showcase.settingsText')}
              </p>
            </TabsContent>
          </Tabs>
        </section>

        {/* Toast Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.toasts')}</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => toast(t('showcase.defaultToast'))}>
              {t('showcase.defaultToast')}
            </Button>
            <Button
              variant="success"
              onClick={() => toast.success(t('showcase.successToast'))}
            >
              {t('showcase.successToast')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.error(t('showcase.errorToast'))}
            >
              {t('showcase.errorToast')}
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info(t('showcase.infoToast'))}
            >
              {t('showcase.infoToast')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.warning(t('showcase.warningToast'))}
            >
              {t('showcase.warningToast')}
            </Button>
          </div>
        </section>

        {/* Table Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.tables')}</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.basicTable')}</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('showcase.name')}</TableHead>
                    <TableHead>{t('showcase.status')}</TableHead>
                    <TableHead>{t('showcase.deadline')}</TableHead>
                    <TableHead>{t('showcase.budget')}</TableHead>
                    <TableHead className="text-right">{t('showcase.actions')}</TableHead>
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
            <h3 className="text-lg font-medium">{t('showcase.dataTable')}</h3>
            <DataTable
              columns={columns}
              data={sampleData}
              searchKey="name"
              searchPlaceholder={t('showcase.searchProjects')}
              pageSize={3}
            />
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.searchFilters')}</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.searchBar')}</h3>
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSearch={(v) => toast.info(t('showcase.searchingFor', { query: v }))}
              placeholder={t('showcase.searchTenders')}
              className="max-w-md"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.filterPanel')}</h3>
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
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.loadingStates')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('showcase.spinners')}</h3>
              <div className="flex items-center gap-8 p-4 border rounded-lg">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('showcase.skeletonText')}</h3>
              <div className="p-4 border rounded-lg">
                <SkeletonText lines={4} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.skeletonCards')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('showcase.skeletonTable')}</h3>
            <SkeletonTable rows={3} columns={4} />
          </div>
        </section>

        {/* Empty States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.emptyStates')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg">
              <EmptyState
                title={t('showcase.noTendersFound')}
                description={t('showcase.getStartedTender')}
                actionLabel={t('showcase.createTender')}
                action={() => toast.info(t('showcase.createTenderClicked'))}
              />
            </div>
            <div className="border rounded-lg">
              <EmptyState
                illustration="no-results"
                title={t('showcase.noResults')}
                description={t('showcase.adjustFilters')}
              />
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold border-b pb-2">{t('showcase.typography')}</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{t('showcase.heading1')}</h1>
            <h2 className="text-3xl font-semibold">{t('showcase.heading2')}</h2>
            <h3 className="text-2xl font-semibold">{t('showcase.heading3')}</h3>
            <h4 className="text-xl font-medium">{t('showcase.heading4')}</h4>
            <p className="text-base">
              {t('showcase.paragraph')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('showcase.smallText')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('showcase.extraSmallText')}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t text-muted-foreground">
          <p>{t('showcase.footer')}</p>
        </footer>
      </div>
    </div>
  )
}

export default ComponentShowcase
