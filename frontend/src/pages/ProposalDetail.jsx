import React from "react";
import { useParams } from "react-router-dom";
import { useProposal } from "../hooks/useProposals";
import { proposalService } from "../services/proposal.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { LoadingSpinner } from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { Card, Button, Badge } from "../components/ui";

const ProposalDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const queryClient = useQueryClient();

    const { data: proposal, isLoading, error } = useProposal(id);

    const [checklist, setChecklist] = React.useState(null);

    const handlePreview = async () => {
        const res = await proposalService.previewProposal(id);
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    const actionMutation = useMutation({
        mutationFn: async ({ action, sectionId }) => {
            switch (action) {
                case "submit_for_review":
                    return proposalService.submitForReview(id);
                case "approve":
                    return proposalService.approveProposal(id);
                case "reject":
                    return proposalService.rejectProposal(id);
                case "submit":
                    return proposalService.submitProposal(id);
                case "generate_document":
                    return proposalService.generateDocument(id);
                case "generate_feedback":
                    return proposalService.generateFeedback(id);
                case "generate_checklist":
                    return proposalService.generateChecklist(id);
                case "regenerate_section":
                    return proposalService.regenerateSection(id, sectionId);
                default:
                    throw new Error("Unknown action");
            }
        },
        onSuccess: (res, variables) => {
            if (variables.action === "generate_checklist") {
                setChecklist(res.data);
            }
            queryClient.invalidateQueries(["proposal", id]);
            queryClient.invalidateQueries(["proposals"]);
        },
    });

    if (isLoading) {
        return <LoadingSpinner text={t("common.loading")} />;
    }

    if (error) {
        return <EmptyState title={t("proposal.loadError", "Failed to load proposal")} />;
    }

    if (!proposal) {
        return <EmptyState title={t("proposal.notFound", "Proposal not found")} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {proposal.title || `${t("proposal.title")} #${proposal.id}`}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            {t("proposal.tender", "Tender")}: {proposal.tender_title}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {t("proposal.createdAt", "Created")}:{" "}
                            {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <Badge>{proposal.status}</Badge>
                </div>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
                {proposal.sections?.map((section) => (
                    <Card key={section.id} className="p-4 space-y-2">
                        <h3 className="font-semibold">{section.name}</h3>
                        <p className="text-sm">{section.content}</p>

                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                                actionMutation.mutate({
                                    action: "regenerate_section",
                                    sectionId: section.id,
                                })
                            }
                        >
                            {t("proposal.regenerateSection")}
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Checklist */}
            {checklist && (
                <Card className="p-4">
                    <h3 className="font-semibold mb-2">
                        {t("proposal.generateChecklist")}
                    </h3>

                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {checklist.items?.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
                <Button onClick={() => actionMutation.mutate({ action: "submit_for_review" })}>
                    {t("proposal.submitForReview")}
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => actionMutation.mutate({ action: "approve" })}
                >
                    {t("proposal.approve")}
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => actionMutation.mutate({ action: "reject" })}
                >
                    {t("proposal.reject")}
                </Button>

                <Button onClick={() => actionMutation.mutate({ action: "submit" })}>
                    {t("proposal.submit")}
                </Button>

                <Button variant="outline" onClick={handlePreview}>
                    {t("proposal.preview")}
                </Button>

                <Button
                    variant="outline"
                    onClick={() => actionMutation.mutate({ action: "generate_document" })}
                >
                    {t("proposal.generateDocument")}
                </Button>

                <Button
                    variant="success"
                    onClick={() => actionMutation.mutate({ action: "generate_feedback" })}
                >
                    {t("proposal.generateFeedback")}
                </Button>
            </div>
        </div>
    );
};

export default ProposalDetail;
