import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGenerateProposal, useProposals } from "../../hooks/useProposals";
import { useProjects } from "../../hooks/useProjects";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    InputWithLabel,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Button,
} from "@/components/ui";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { useTranslation } from "react-i18next";

const ProposalCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projects, isLoading, isError, error } = useProjects();
    const generateProposalMutation = useGenerateProposal();

    const [selectedProject, setSelectedProject] = useState("");
    const [instructions, setInstructions] = useState("");

    const handleGenerate = async () => {
        if (!selectedProject) {
            toast.error(t("proposal.pleaseSelectProject"));
            return;
        }

        try {
            const res = await generateProposalMutation.mutateAsync({
                projectId: selectedProject,
                payload: { instructions },
            });
            toast.success(t("proposal.generatedSuccess"));
            navigate(`/proposals/${res.data.id}`);
        } catch (err) {
            toast.error(t("proposal.generatedError"));
        }
    };

    if (isLoading) return <LoadingSpinner text={t("proposal.loadingProjects")} />;
    if (error) return <EmptyState title={t("proposal.generatedError")} />;

    if (!projects?.length)
        return (
            <EmptyState
                title={t("proposal.noProjects")}
                description={t("proposal.noProjectsDescription")}
            />
        );

    return (
        <>
            <Card className="max-w-2xl mx-auto space-y-4 p-6">
                <CardHeader>
                    <CardTitle>{t("proposal.create")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("proposal.selectProject")} />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <InputWithLabel
                        label={t("proposal.instructions")}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder={t("proposal.provideInstructions")}
                    />
                </CardContent>
                <CardFooter className="block">
                    <Button onClick={handleGenerate} className="w-full" variant="success" disabled={generateProposalMutation.isLoading}>
                        {generateProposalMutation.isLoading ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            t("proposal.create")
                        )}
                    </Button>
                    <Button onClick={() => navigate("/proposals")} className="w-full mt-2"
                        variant="destructive">
                        {t("common.goBack")}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
};

export default ProposalCreate;
