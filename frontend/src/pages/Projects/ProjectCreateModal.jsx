import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useCategories, useSkills } from "@/hooks/useCore";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

function ProjectCreateModal({ trigger, onSuccess }) {
  const { t, i18n } = useTranslation();
  const { createProject } = useProjects();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: skills, isLoading: skillsLoading } = useSkills();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    attachment: null,
    budget: "",
    categoryId: "",
    skillId: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("budget", form.budget);
      formData.append("category_id", form.categoryId);

      // optional skills
      if (form.skillId) {
        formData.append("skill_ids", form.skillId);
      }

      if (form.attachment) {
        formData.append("attachments", form.attachment);
      }

      await createProject.mutateAsync(formData);

      toast.success(t("project.createSuccess"));
      setOpen(false);
      setForm({
        title: "",
        description: "",
        attachment: null,
        budget: "",
        categoryId: "",
        skillId: "",
      });
      onSuccess?.();
    } catch (error) {
      toast.error(t("project.createError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("project.create")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            required
          />

          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={6}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Budget"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            required
          />

          {/* Optional attachment */}
          <Input
            type="file"
            aria-label={t("project.attachment")}
            onChange={(e) =>
              setForm({
                ...form,
                attachment: e.target.files?.[0] || null,
              })
            }
          />

          <Select
            value={form.categoryId}
            onValueChange={(value) => setForm({ ...form, categoryId: value })}
            disabled={categoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={form.skillId}
            onValueChange={(value) => setForm({ ...form, skillId: value })}
            disabled={skillsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select skills" />
            </SelectTrigger>
            <SelectContent>
              {skills?.map((skill) => (
                <SelectItem key={skill.id} value={String(skill.id)}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectCreateModal;