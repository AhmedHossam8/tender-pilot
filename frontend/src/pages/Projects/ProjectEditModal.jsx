import { useState, useEffect } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useCategories, useSkills } from "@/hooks/useCore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Button,
    Input,
    Textarea,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui";

export default function ProjectEditModal({ open, onOpenChange, project, onSuccess }) {
    const { t } = useTranslation();
    const { updateProject } = useProjects();
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: skills } = useSkills();

    const [form, setForm] = useState({
        title: "",
        description: "",
        budget: "",
        attachment: null,
        categoryId: "",
        skillIds: [],
    });

    /** Prefill form when project changes */
    useEffect(() => {
        if (!project) return;

        setForm({
            title: project.title ?? "",
            description: project.description ?? "",
            budget: project.budget?.toString() ?? "",
            attachment: null,
            categoryId: project.category?.id?.toString() ?? "",
            skillIds: project.skills?.map((s) => s.id.toString()) ?? [],
        });
    }, [project?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let payload;
            let headers = {};

            if (form.attachment) {
                payload = new FormData();
                payload.append("title", form.title);
                payload.append("description", form.description);
                payload.append("budget", form.budget);
                payload.append("category_id", form.categoryId);
                payload.append(
                    "skill_ids",
                    JSON.stringify(form.skillIds.map((id) => parseInt(id)))
                );
                payload.append("attachments", form.attachment);
                headers["Content-Type"] = "multipart/form-data";
            } else {
                payload = {
                    title: form.title,
                    description: form.description,
                    budget: form.budget,
                    category_id: parseInt(form.categoryId),
                    skill_ids: form.skillIds.map((id) => parseInt(id)),
                };
            }

            const updated = await updateProject.mutateAsync({
                id: project.id,
                data: payload,
                headers,
            });

            toast.success(t("project.updateSuccess"));
            onOpenChange(false);
            onSuccess?.(updated);
        } catch (err) {
            console.log(err.response?.data);
            toast.error(t("project.updateError"));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#101825] text-white">
                <DialogHeader>
                    <DialogTitle>{t("project.edit")}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {t("project.editDescription")}
                    </DialogDescription>
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
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={6}
                        className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400 focus:ring-purple-500"
                    />

                    <Input
                        type="number"
                        placeholder={t("project.budget")}
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        required
                        className="bg-[#1c1f2a] text-white border-gray-700 placeholder-gray-400 focus:ring-purple-500"
                    />

                    <Input
                        type="file"
                        onChange={(e) =>
                            setForm({ ...form, attachment: e.target.files?.[0] || null })
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
                                <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t("filters.skills")}</label>
                        {skills?.map((skill) => (
                            <label key={skill.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.skillIds.includes(skill.id.toString())}
                                    onChange={(e) => {
                                        const updated = e.target.checked
                                            ? [...form.skillIds, skill.id.toString()]
                                            : form.skillIds.filter((id) => id !== skill.id.toString());
                                        setForm({ ...form, skillIds: updated });
                                    }}
                                    className="accent-purple-500"
                                />
                                <span>{skill.name}</span>
                            </label>
                        ))}
                    </div>

                    <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 border-0"
                        disabled={updateProject.isPending}
                    >
                        {updateProject.isPending && <span className="loader mr-2"></span>}
                        {t("project.update")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
