import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useProposal } from "../hooks/useProposals";
import { useTranslation } from "react-i18next";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    Button,
    Textarea,
    Badge,
    StatusBadge,
} from "@/components/ui";
import { LoadingSpinner, EmptyState, ConfirmDialog } from "@/components/common";

const ProposalReview = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: proposal, isLoading, error } = useProposal(id);

    const [feedback, setFeedback] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [actionType, setActionType] = useState("");

    const handleAction = (type) => {
        if (!feedback && type === "reject") {
            toast.error(t("proposal.feedbackRequired", "Please provide feedback"));
            return;
        }
        setActionType(type);
        setConfirmDialogOpen(true);
    };

    const confirmAction = () => {
        toast.success(
            t("proposal.actionSuccess", `Proposal ${actionType}ed successfully!`)
        );
        setConfirmDialogOpen(false);
        navigate("/proposals");
    };

    if (isLoading) return <LoadingSpinner text={t("common.loading")} />;
    if (error || !proposal)
        return <EmptyState title={t("proposal.loadError")} />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <h1 className="text-2xl font-bold">{proposal.title}</h1>

            <StatusBadge status={proposal.status} />

            {/* Proposal Sections */}
            {proposal.sections?.map((section, idx) => (
                <Card key={section.id}>
                    <CardHeader>
                        <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{section.content}</p>
                    </CardContent>
                </Card>
            ))}

            {/* Feedback */}
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

            {/* Confirm Dialog */}
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