import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useProposal } from "../../hooks/useProposals";
import { useTranslation } from "react-i18next";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    Button,
    Textarea,
    StatusBadge,
} from "@/components/ui";
import { LoadingSpinner, EmptyState, ConfirmDialog } from "@/components/common";
import { proposalService } from "../../services/proposal.service";

const ProposalReview = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: proposal, isLoading, error } = useProposal(id);
    const queryClient = useQueryClient();

    const [feedback, setFeedback] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState("");

    // Fetch all AI feedback for sections
    const sectionFeedbackQueries = useQueries({
        queries:
            proposal?.sections?.map((section) => ({
                queryKey: ["section-feedback", section.id],
                queryFn: async () => {
                    const res = await proposalService.getSectionFeedback(section.id);
                    return res.data;
                },
                enabled: !!proposal,
            })) || [],
    });

    const handleAction = (type) => {
        if (!feedback && type === "reject") {
            toast.error(t("proposal.feedbackRequired", "Please provide feedback"));
            return;
        }
        setActionType(type);
        setConfirmDialogOpen(true);
    };

    const confirmAction = async () => {
        try {
            if (actionType === "approve") {
                await proposalService.approveProposal(id);
            } else if (actionType === "reject") {
                await proposalService.rejectProposal(id);
            }

            await queryClient.invalidateQueries(["proposal", id]);
            await queryClient.invalidateQueries(["proposals"]);

            toast.success(
                t("proposal.actionSuccess", `Proposal ${actionType}ed successfully!`)
            );
            setConfirmDialogOpen(false);
            navigate("/proposals");
        } catch (error) {
            console.error("Proposal update failed:", error.response?.data || error);
            toast.error(
                t("proposal.actionError", "Failed to update proposal status")
            );
            setConfirmDialogOpen(false);
        }
    };

    if (isLoading) return <LoadingSpinner text={t("common.loading")} />;
    if (error || !proposal)
        return <EmptyState title={t("proposal.loadError")} />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <h1 className="text-2xl font-bold">{proposal.title}</h1>
            <StatusBadge status={proposal.status} />

            {proposal.sections?.map((section, idx) => {
                const feedbackQuery = sectionFeedbackQueries[idx];
                const aiFeedback = feedbackQuery?.data?.ai_feedback;

                return (
                    <Card key={section.id}>
                        <CardHeader>
                            <CardTitle>{section.name || section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{section.content}</p>

                            {feedbackQuery?.isLoading ? (
                                <LoadingSpinner size="sm" />
                            ) : aiFeedback ? (
                                <p className="mt-2 text-gray-600">
                                    <strong>AI Feedback:</strong> {aiFeedback}
                                </p>
                            ) : (
                                <p className="mt-2 text-gray-400">No AI feedback available</p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            <Card>
                <CardHeader>
                    <CardTitle>{t("proposal.feedback", "Leave Feedback")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder={t(
                            "proposal.feedbackPlaceholder",
                            "Write your feedback here..."
                        )}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button onClick={() => handleAction("approve")}>
                        {t("proposal.approve")}
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction("reject")}>
                        {t("proposal.reject")}
                    </Button>
                </CardFooter>
            </Card>

            <ConfirmDialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
                title={t("proposal.confirmAction", `Confirm ${actionType}?`)}
                description={t(
                    "proposal.confirmDescription",
                    "Are you sure you want to proceed with this action?"
                )}
                confirmLabel={t("common.confirm", "Confirm")}
                variant={actionType === "reject" ? "destructive" : "default"}
                onConfirm={confirmAction}
            />
        </div>
    );
};

export default ProposalReview;
