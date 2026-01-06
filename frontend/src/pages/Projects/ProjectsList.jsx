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
  const { user } = useAuthStore((state) => state.user);

  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const { projects = [], isLoading, isError } = useProjects();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: skills, isLoading: skillsLoading } = useSkills();

  // Initialize local project list
  useEffect(() => {
    if (!isLoading && !isError && projectList.length === 0) {
      setProjectList(projects);
    }
  }, [projects, isLoading, isError]);

  const handleDelete = (project) => {
    setProjectList((prev) => prev.filter((p) => p.id !== project.id));
    toast.success(t("Project deleted successfully!"));
  };

  const filters = [
    {
      key: "category",
      label: t("Category"),
      type: "select",
      options: categories?.map((c) => ({ value: c.id, label: c.name })) || [],
      loading: categoriesLoading,
    },
    { key: "budget_min", label: t("Min Budget"), type: "number" },
    { key: "budget_max", label: t("Max Budget"), type: "number" },
    {
      key: "skills",
      label: t("Skills"),
      type: "select-multiple",
      options: skills?.map((s) => ({ value: s.id, label: s.name })) || [],
      loading: skillsLoading,
    },
  ];

  const filteredProjects = useMemo(() => {
    let data = projectList || [];

    if (searchValue) {
      const lower = searchValue.toLowerCase();
      data = data.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }

    if (activeFilters.category) {
      data = data.filter((p) => p.category?.id === activeFilters.category);
    }

    if (activeFilters.skills?.length) {
      data = data.filter((p) =>
        activeFilters.skills.every((f) => p.skills.some((s) => s.id === f))
      );
    }

    if (activeFilters.budget_min) {
      data = data.filter((p) => p.budget >= activeFilters.budget_min);
    }
    if (activeFilters.budget_max) {
      data = data.filter((p) => p.budget <= activeFilters.budget_max);
    }

    return data;
  }, [projectList, searchValue, activeFilters]);

  // Loading state
  if (isLoading || categoriesLoading || skillsLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  // Error state
  if (isError)
    return (
      <EmptyState title={t("project.loadError", "Failed to load projects")} />
    );

  // Empty state
  if (!filteredProjects || filteredProjects.length === 0)
    return (
      <EmptyState
        title={t("project.noProjects", "No projects found")}
        description={t("Get started by creating your first project.")}
        actionLabel={t("Create Project")}
        action={() => toast.info(t("Redirect to create project"))}
      />
    );

  return (
    <div>
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
      <Card>
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
                      {user?.role === "writer" && project.is_owner && (
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
        onConfirm={() => {
          if (selectedProject) handleDelete(selectedProject);
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
}

export default ProjectsList;
