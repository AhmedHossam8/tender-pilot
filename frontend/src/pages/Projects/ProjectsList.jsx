import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";

import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  StatusBadge,
  Button,
  Skeleton,
  SkeletonTable,
} from "@/components/ui";

import {
  LoadingSpinner,
  SearchBar,
  FilterPanel,
  ConfirmDialog,
} from "@/components/common";

import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";
import { useCategories, useSkills } from "../../hooks/useCore";
import ProjectCreateModal from "./ProjectCreateModal";
import ProjectEditModal from "./ProjectEditModal";

function ProjectsList() {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const { projects = [], isLoading, isError } = useProjects();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: skills, isLoading: skillsLoading } = useSkills();

  const auth = useAuthStore();
  const canCreateProject = auth.isClient();

  const isAnyLoading = isLoading || categoriesLoading || skillsLoading;

  // Filters definition
  const filters = [
    {
      key: "category",
      label: t("filters.category"),
      type: "select-multiple",
      options: categories?.map((c) => ({ value: c.id, label: c.name })) || [],
      loading: categoriesLoading,
    },
    {
      key: "budget_min",
      label: t("filters.minBudget"),
      type: "number",
    },
    {
      key: "budget_max",
      label: t("filters.maxBudget"),
      type: "number",
    },
    {
      key: "skills",
      label: t("filters.skills"),
      type: "select-multiple",
      options: skills?.map((s) => ({ value: s.id, label: s.name })) || [],
      loading: skillsLoading,
    },
  ];

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let data = [...projects];

    if (searchValue) {
      const lower = searchValue.toLowerCase();
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }

    if (activeFilters.category?.length) {
      data = data.filter((p) =>
        activeFilters.category.includes(p.category?.id)
      );
    }

    if (activeFilters.skills?.length) {
      data = data.filter((p) =>
        activeFilters.skills.every((id) =>
          p.skills?.some((s) => s.id === id)
        )
      );
    }

    if (activeFilters.budget_min) {
      data = data.filter((p) => p.budget >= activeFilters.budget_min);
    }

    if (activeFilters.budget_max) {
      data = data.filter((p) => p.budget <= activeFilters.budget_max);
    }

    return data;
  }, [projects, searchValue, activeFilters]);

  const handleDelete = (project) => {
    setDeleting(true);
    toast.success(t("project.deleteSuccess"));
    setDeleting(false);
  };

  // Loading state
  if (isAnyLoading) {
    return (
      <div className="space-y-6">
        {/* Search & Filters Skeleton */}
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>

        {/* Projects Table Skeleton */}
        <Card>
          <CardContent>
            <SkeletonTable rows={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return <p className="text-center text-red-500">{t("project.loadError")}</p>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("project.title") || "Projects"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your projects
            </p>
          </div>
          {canCreateProject && (
            <ProjectCreateModal
              trigger={
                <Button size="lg" disabled={isAnyLoading}>
                  <Plus className="h-5 w-5 mr-2" />
                  {t("project.create")}
                </Button>
              }
              onSuccess={() => queryClient.invalidateQueries(["projects"])}
            />
          )}
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              placeholder={t("project.searchPlaceholder") || "Search projects..."}
            />
            <FilterPanel
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onClearFilters={() => setActiveFilters({})}
            />
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-0">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">
                  {searchValue || Object.keys(activeFilters).length > 0
                    ? "No projects match your search"
                    : "No projects yet"}
                </p>
                {!searchValue && Object.keys(activeFilters).length === 0 && (
                  <ProjectCreateModal
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first project
                      </Button>
                    }
                    onSuccess={() => window.location.reload()}
                  />
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold px-6">{t("project.title") || "Title"}</TableHead>
                      <TableHead className="font-semibold px-6">{t("project.status") || "Status"}</TableHead>
                      <TableHead className="font-semibold px-6 text-right">{t("project.actions") || "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="space-y-1">
                            <Link
                              to={`/app/projects/${project.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                            >
                              {project.title}
                            </Link>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={project.status || "draft"} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link to={`/app/projects/${project.id}`}>
                              <Button size="sm" variant="ghost" disabled={isAnyLoading}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>

                            {project.is_owner && project.status === "open" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isAnyLoading}
                                  onClick={() => {
                                    setEditingProject(project);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={isAnyLoading || deleting}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setConfirmDialogOpen(true);
                                  }}
                                >
                                  {deleting ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={t("project.confirmDeleteTitle")}
        description={t("project.confirmDeleteDescription")}
        confirmLabel={t("confirm.delete")}
        variant="destructive"
        onConfirm={() => {
          if (selectedProject) handleDelete(selectedProject);
          setConfirmDialogOpen(false);
        }}
      />

      {/* Edit Modal */}
      <ProjectEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={editingProject}
        onSuccess={() => {
          setEditModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

export default ProjectsList;
