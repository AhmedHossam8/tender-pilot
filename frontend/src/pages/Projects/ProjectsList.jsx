import * as React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// UI Components
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
  EmptyState,
  LoadingSpinner,
  ConfirmDialog,
} from "@/components/common";

import { Eye, Edit, Trash2, Plus } from "lucide-react";

function ProjectsListPage() {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);

  // Simulate fetching data
  React.useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500); // simulate delay
  }, []);

  const handleDelete = (project) => {
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    toast.success(t("Project deleted successfully!"));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Projects")}</h1>
        <Link to="/projects/create">
          <Button>
            <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
            {t("Create Project")}
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
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
                {projects.map((project) => (
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
        onConfirm={() => {
          if (selectedProject) handleDelete(selectedProject);
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
}

export default ProjectsListPage;
