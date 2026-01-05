import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTenders } from "../../hooks/useTenders";
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
    Textarea,
} from "@/components/ui";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { useTranslation } from "react-i18next";
import { createBid } from "../../services/bid.service";

const BidCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenders, isLoading, isError, error } = useTenders();

    const [selectedProject, setSelectedProject] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [proposedAmount, setProposedAmount] = useState("");
    const [proposedTimeline, setProposedTimeline] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedProject) {
            toast.error(t("bid.pleaseSelectProject", "Please select a project"));
            return;
        }
        if (!coverLetter.trim()) {
            toast.error(t("bid.coverLetterRequired", "Cover letter is required"));
            return;
        }
        if (!proposedAmount || proposedAmount <= 0) {
            toast.error(t("bid.validAmountRequired", "Please enter a valid amount"));
            return;
        }
        if (!proposedTimeline || proposedTimeline <= 0) {
            toast.error(t("bid.validTimelineRequired", "Please enter a valid timeline"));
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await createBid({
                project: selectedProject,
                cover_letter: coverLetter,
                proposed_amount: proposedAmount,
                proposed_timeline: proposedTimeline,
            });
            toast.success(t("bid.submittedSuccess", "Bid submitted successfully!"));
            navigate(`/bids/${response.data.id}`);
        } catch (err) {
            console.error("Error creating bid:", err);
            toast.error(t("bid.submittedError", "Failed to submit bid"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSpinner text={t("bid.loadingProjects", "Loading projects...")} />;
    if (error) return <EmptyState title={t("bid.loadError", "Failed to load projects")} />;

    if (!tenders?.length)
        return (
            <EmptyState
                title={t("bid.noProjects", "No projects available")}
                description={t("bid.noProjectsDescription", "There are no open projects to bid on at the moment.")}
            />
        );

    return (
        <>
            <Card className="max-w-2xl mx-auto space-y-4 p-6">
                <CardHeader>
                    <CardTitle>{t("bid.create", "Submit a Bid")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("bid.selectProject", "Select Project")}
                        </label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("bid.selectProjectPlaceholder", "Choose a project...")} />
                            </SelectTrigger>
                            <SelectContent>
                                {tenders.map((tender) => (
                                    <SelectItem key={tender.id} value={tender.id.toString()}>
                                        {tender.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("bid.coverLetter", "Cover Letter")}
                        </label>
                        <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder={t("bid.coverLetterPlaceholder", "Explain why you're the best fit for this project...")}
                            rows={6}
                        />
                    </div>

                    <InputWithLabel
                        label={t("bid.proposedAmount", "Proposed Amount ($)")}
                        type="number"
                        value={proposedAmount}
                        onChange={(e) => setProposedAmount(e.target.value)}
                        placeholder="5000"
                        min="0"
                        step="0.01"
                    />

                    <InputWithLabel
                        label={t("bid.proposedTimeline", "Proposed Timeline (Days)")}
                        type="number"
                        value={proposedTimeline}
                        onChange={(e) => setProposedTimeline(e.target.value)}
                        placeholder="30"
                        min="1"
                    />
                </CardContent>
                <CardFooter className="block">
                    <Button 
                        onClick={handleSubmit} 
                        className="w-full" 
                        variant="success" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            t("bid.submitBid", "Submit Bid")
                        )}
                    </Button>
                    <Button 
                        onClick={() => navigate("/bids")} 
                        className="w-full mt-2"
                        variant="outline"
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
};

export default BidCreate;
