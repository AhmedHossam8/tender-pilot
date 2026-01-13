import React, { useState, useMemo } from "react";
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
  ConfirmDialog,
} from "@/components/common";

import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";
import { useCategories, useSkills } from "../../hooks/useCore";
import ProjectCreateModal from "./ProjectCreateModal";
import ProjectEditModal from "./ProjectEditModal";

export default function ProjectsList() {
  const { t } = useTranslation();
  const auth = useAuthStore();
  const canCreateProject = auth.isClient();

  const { projects = [], isLoading, isError } = useProjects();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: skills, isLoading: skillsLoading } = useSkills();

  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const isAnyLoading = isLoading || categoriesLoading || skillsLoading;

  // Filters
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

    if (activeFilters.budget_min) data = data.filter((p) => p.budget >= activeFilters.budget_min);
    if (activeFilters.budget_max) data = data.filter((p) => p.budget <= activeFilters.budget_max);

    return data;
  }, [projects, searchValue, activeFilters]);

  const handleDelete = (project) => {
    setDeleting(true);
    toast.success(t("project.deleteSuccess"));
    setDeleting(false);
  };

  if (isAnyLoading) {
    return (
      <div className="space-y-6 p-6">
        <Card className="bg-[#101825] text-white border-gray-700">
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>

        <Card className="bg-[#101825] text-white border-gray-700">
          <CardContent>
            <SkeletonTable rows={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 mt-6">{t("projects.loadError")}</p>
    );
  }

  return (
    <div className="min-h-screen bg-[#101825] text-gray-400 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-300">{t("projects.title")}</h1>
            <p className="text-gray-400 mt-1">{t("projects.subtitle")}</p>
          </div>
          {canCreateProject && (
            <ProjectCreateModal
              trigger={
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-blue-700 border-0 text-gray-400 hover:bg-gray-900/20"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t("projects.create")}
                </Button>
              }
              onSuccess={() => window.location.reload()}
            />
          )}
        </div>

        {/* Search */}
        <Card className="bg-[#101825] border-gray-700">
          <CardContent className="p-6 space-y-4">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("projects.searchPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-[#101825] text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="bg-[#101825] border-gray-700">
          <CardContent className="p-0 overflow-x-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                {searchValue || Object.keys(activeFilters).length > 0
                  ? t("projects.noProjectsFiltered")
                  : t("projects.noProjects")}
              </div>
            ) : (
              <Table className="text-gray-400">
                <TableHeader>
                  <TableRow className="bg-gray-800">
                    <TableHead className="px-6 py-3 text-gray-300">{t("projects.title")}</TableHead>
                    <TableHead className="px-6 py-3 text-gray-300">{t("projects.status")}</TableHead>
                    <TableHead className="px-6 py-3 text-right text-gray-300">{t("projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="hover:bg-gray-700 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <Link
                          to={`/app/projects/${project.id}`}
                          className="font-medium text-gray-400 hover:text-gray-300 hover:underline"
                        >
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusBadge status={project.status || "draft"} />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/app/projects/${project.id}`}>
                            <Button size="sm" variant="outline" className="text-gray-400 border-gray-700 hover:bg-gray-900/20">
                              <Eye className="h-4 w-4 mr-1" />
                              {t("projects.view")}
                            </Button>
                          </Link>

                          {project.is_owner && project.status === "open" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-400 border-gray-700 hover:bg-gray-900/20"
                                onClick={() => {
                                  setEditingProject(project);
                                  setEditModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {t("projects.edit")}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-gray-400 border-gray-700"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t("projects.delete")}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={t("projects.confirmDeleteTitle")}
        description={t("projects.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
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
        onSuccess={() => window.location.reload()}
      />
    </div >
  );
}
