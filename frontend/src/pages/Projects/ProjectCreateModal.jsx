import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useCategories, useSkills } from "@/hooks/useCore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

export default function ProjectCreateModal({ trigger, onSuccess }) {
  const { t } = useTranslation();
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#101825] text-white">
        <DialogHeader>
          <DialogTitle>{t("project.create")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder={t("project.title")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400 focus:ring-purple-500"
          />

          <Textarea
            placeholder={t("project.description")}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={6}
            className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400 focus:ring-purple-500"
          />

          <Input
            type="number"
            step="0.01"
            placeholder={t("project.budget")}
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            required
            className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400 focus:ring-purple-500"
          />

          <Input
            type="file"
            aria-label={t("project.attachment")}
            onChange={(e) =>
              setForm({
                ...form,
                attachment: e.target.files?.[0] || null,
              })
            }
            className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400"
          />

          <Select
            value={form.categoryId}
            onValueChange={(value) => setForm({ ...form, categoryId: value })}
            disabled={categoriesLoading}
          >
            <SelectTrigger className="bg-[#1c1f2a] text-white border-gray-700 focus:ring-purple-500">
              <SelectValue placeholder={t("project.selectCategory")} />
            </SelectTrigger>
            <SelectContent className="bg-[#101825] text-white">
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
            <SelectTrigger className="bg-[#1c1f2a] text-white border-gray-700 focus:ring-purple-500">
              <SelectValue placeholder={t("project.selectSkills")} />
            </SelectTrigger>
            <SelectContent className="bg-[#101825] text-white">
              {skills?.map((skill) => (
                <SelectItem key={skill.id} value={String(skill.id)}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 border-0"
            disabled={createProject.isPending}
          >
            {createProject.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t("project.create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
