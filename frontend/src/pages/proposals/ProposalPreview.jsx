import React from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { LoadingSpinner, EmptyState } from "@/components/common";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

import { useProposal, useSubmitProposal, useGenerateDocument } from "../../hooks/useProposals";

const ProposalPreview = () => {
    const { t } = useTranslation();
    const { id } = useParams();

    // Fetch proposal
    const { data: proposal, isLoading, isError } = useProposal(id);

    // Mutations
    const submitProposal = useSubmitProposal();
    const generateDocument = useGenerateDocument(id);

    if (isLoading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="xl" text={t("common.loading")} />
            </div>
        );

    if (isError || !proposal)
        return <EmptyState title={t("proposal.loadError", "Failed to load proposal")} />;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Proposal Header */}
            <Card>
                <CardHeader>
                    <CardTitle>{proposal.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p><strong>{t("Project")}:</strong> {proposal.project_title || proposal.project}</p>
                    <p><strong>{t("Status")}:</strong> {proposal.status}</p>
                </CardContent>
            </Card>

            {/* Proposal Sections */}
            {proposal.sections?.map((section) => (
                <Card key={section.id}>
                    <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{section.content}</p>
                    </CardContent>
                </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                {proposal.status === "approved" && (
                    <Button
                        variant="success"
                        onClick={() =>
                            submitProposal.mutate(proposal.id, {
                                onSuccess: () => toast.success(t("Proposal submitted successfully!")),
                                onError: () => toast.error(t("Failed to submit proposal.")),
                            })
                        }
                        disabled={submitProposal.isLoading}
                    >
                        {submitProposal.isLoading ? t("Submitting...") : t("Submit Proposal")}
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={() =>
                        generateDocument.mutate(undefined, {
                            onSuccess: () => toast.success(t("Document generated successfully!")),
                            onError: () => toast.error(t("Failed to generate document.")),
                        })
                    }
                    disabled={generateDocument.isLoading}
                >
                    {generateDocument.isLoading ? t("Generating...") : t("Generate Document")}
                </Button>
            </div>
        </div>
    );
};

export default ProposalPreview;
