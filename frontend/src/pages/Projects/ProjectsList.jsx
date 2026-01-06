import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  StatusBadge,
} from "@/components/ui";

import {
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
  SearchBar,
  FilterPanel,
} from "@/components/common";

import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";
import { useCategories, useSkills } from "../../hooks/useCore";

function ProjectsList() {
  const { t, i18n } = useTranslation();

  // State
  const [searchValue, setSearchValue] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);

  // Fetch data
  const { projects, isLoading, isError, deleteProject } = useProjects();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: skills, isLoading: skillsLoading } = useSkills();

  // Delete handler
  const handleDelete = () => {
    if (!selectedProject) return;

    deleteProject.mutate(selectedProject.id, {
      onSuccess: () => toast.success(t("Project deleted successfully!")),
      onError: () => toast.error(t("Failed to delete project")),
    });

    setConfirmDialogOpen(false);
  };

  // Configure filters dynamically
  const filters = [
    {
      key: "category",
      label: t("Category"),
      type: "select",
      options:
        categories?.map((c) => ({ value: c.id, label: c.name })) || [],
      loading: categoriesLoading,
    },
    {
      key: "budget_min",
      label: t("Min Budget"),
      type: "number",
    },
    {
      key: "budget_max",
      label: t("Max Budget"),
      type: "number",
    },
    {
      key: "skills",
      label: t("Skills"),
      type: "select-multiple",
      options: skills?.map((s) => ({ value: s.id, label: s.name })) || [],
      loading: skillsLoading,
    },
  ];

  // Apply search & filters
  const filteredProjects = React.useMemo(() => {
    let data = projects || [];

    // Search
    if (searchValue) {
      const lower = searchValue.toLowerCase();
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }

    // Category filter
    if (activeFilters.category) {
      data = data.filter((p) => p.category?.id === activeFilters.category);
    }

    // Skills filter
    if (activeFilters.skills?.length) {
      data = data.filter((p) =>
        activeFilters.skills.every((f) => p.skills.some((s) => s.id === f))
      );
    }

    // Budget filters
    if (activeFilters.budget_min) {
      data = data.filter((p) => p.budget >= activeFilters.budget_min);
    }
    if (activeFilters.budget_max) {
      data = data.filter((p) => p.budget <= activeFilters.budget_max);
    }

    return data;
  }, [projects, searchValue, activeFilters]);

  if (isLoading || categoriesLoading || skillsLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  if (isError)
    return (
      <div className="text-center text-red-500 py-20">
        {t("Failed to load projects.")}
      </div>
    );

  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Projects")}</h1>
        <Link to="/projects/create">
          <Button>
            <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
            {t("Create Project")}
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSearch={() => { }}
          placeholder={t("Search projects...")}
          className="flex-1"
        />
        <FilterPanel
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          onClearFilters={() => setActiveFilters({})}
        />
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title={t("No projects found")}
          description={t("Get started by creating your first project.")}
          actionLabel={t("Create Project")}
          action={() => toast.info(t("Redirect to create project"))}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("All Projects")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Title")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status || "draft"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/projects/${project.id}`}>
                          <Button size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {project.is_owner && (
                          <>
                            <Link to={`/projects/${project.id}/edit`}>
                              <Button size="icon" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                setSelectedProject(project);
                                setConfirmDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={t("Delete Project?")}
        description={t(
          "This action cannot be undone. Are you sure you want to delete this project?"
        )}
        confirmLabel={t("Delete")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default ProjectsList;
