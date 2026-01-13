import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Lightbulb } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";
import { projectService } from "../../services/project.services";
import { useRealtimeBidSuggestions } from "../../hooks/useBidOptimization";
import { useDebounce } from "../../hooks/useDebounce";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
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
    const [searchParams] = useSearchParams();
    const { projects, isLoading, isError, error } = useProjects();

    const [selectedProject, setSelectedProject] = useState("");
    const [coverLetter, setCoverLetter] = useState("");
    const [proposedAmount, setProposedAmount] = useState("");
    const [proposedTimeline, setProposedTimeline] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatingLetter, setGeneratingLetter] = useState(false);

    // Real-time AI suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const realTimeSuggestions = useRealtimeBidSuggestions();

    // Debounce form data for real-time suggestions
    const debouncedFormData = useDebounce({
        project: selectedProject,
        bid_amount: proposedAmount,
        proposal: coverLetter,
        delivery_time: proposedTimeline,
    }, 1000);

    // Trigger real-time suggestions when form data changes
    useEffect(() => {
        if (
            debouncedFormData.proposal &&
            debouncedFormData.bid_amount &&
            debouncedFormData.project &&
            debouncedFormData.proposal.length > 50
        ) {
            setShowSuggestions(true);
            realTimeSuggestions.mutate(debouncedFormData);
        } else {
            setShowSuggestions(false);
        }
    }, [debouncedFormData]);

    // Get project ID from URL
    const projectId = searchParams.get("project");

    // Normalize projects data - handle both array and { results: [] } structure
    const projectsList = Array.isArray(projects) ? projects : (projects?.results || []);

    const projectFromQuery = projectsList.find(
        (p) => p.id === parseInt(projectId)
    );

    // Filter available projects (open and not owned by current user)
    const availableProjects = projectsList.filter(
        (p) => p.status === "open" && !p.is_owner
    );

    // Determine which projects to show
    // Show the query project ONLY if it meets the criteria (open and not owned)
    const projectsToShow = projectFromQuery &&
        projectFromQuery.status === "open" &&
        !projectFromQuery.is_owner
        ? [projectFromQuery]
        : availableProjects;

    // Pre-select project from URL query parameter
    useEffect(() => {
        if (projectId && projectFromQuery) {
            // Only auto-select if the project meets the criteria
            if (projectFromQuery.status === "open" && !projectFromQuery.is_owner) {
                setSelectedProject(projectId);
            }
        }
    }, [projectId, projectFromQuery]);

    // Get selected project details
    const selectedProjectData = projectsList.find(
        (p) => p.id === parseInt(selectedProject)
    );

    const handleGenerateCoverLetter = async () => {
        if (!selectedProject) {
            toast.error(t("bid.pleaseSelectProject", "Please select a project first"));
            return;
        }
        setGeneratingLetter(true);
        try {
            const response = await projectService.generateCoverLetter(selectedProject);
            setCoverLetter(response.data.cover_letter);
            toast.success(
                t(
                    "bid.coverLetterGenerated",
                    "AI cover letter generated! Feel free to customize it."
                )
            );
        } catch (err) {
            console.error("Error generating cover letter:", err);
            toast.error(t("bid.coverLetterError", "Failed to generate cover letter"));
        } finally {
            setGeneratingLetter(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProject) {
            toast.error(t("bid.pleaseSelectProject", "Please select a project"));
            return;
        }
        if (!coverLetter.trim()) {
            toast.error(t("bid.coverLetterRequired", "Cover letter is required"));
            return;
        }

        const amount = parseFloat(proposedAmount);
        const timeline = parseInt(proposedTimeline);

        if (!proposedAmount || isNaN(amount) || amount <= 0) {
            toast.error(t("bid.validAmountRequired", "Please enter a valid amount"));
            return;
        }
        if (!proposedTimeline || isNaN(timeline) || timeline < 1) {
            toast.error(t("bid.validTimelineRequired", "Please enter a valid timeline (minimum 1 day)"));
            return;
        }

        setIsSubmitting(true);

        // Prepare bid data with proper types
        const bidData = {
            project: parseInt(selectedProject),
            cover_letter: coverLetter,
            proposed_amount: amount,
            proposed_timeline: timeline,
        };

        console.log("Submitting bid with data:", bidData);

        try {
            const response = await createBid(bidData);
            toast.success(t("bid.submittedSuccess", "Bid submitted successfully!"));

            const bidId = response?.data?.id || response?.id;
            if (bidId) navigate(`/app/bids/${bidId}`);
            else navigate("/app/bids");
        } catch (err) {
            console.error("Error creating bid:", err);
            console.error("Error response data:", err.response?.data);
            console.error("Error response status:", err.response?.status);
            console.error("Error response headers:", err.response?.headers);
            console.error("Full error object:", JSON.stringify(err.response, null, 2));

            // Extract detailed error message
            const errorData = err.response?.data;
            let errorMessage = t("bid.submittedError", "Failed to submit bid");

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.non_field_errors) {
                    errorMessage = errorData.non_field_errors[0];
                } else {
                    // Show field-specific errors
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
                        .join(', ');
                    if (fieldErrors) errorMessage = fieldErrors;
                }
            }

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSpinner text={t("bid.loadingProjects", "Loading projects...")} />;
    if (error) return <EmptyState title={t("bid.loadError", "Failed to load projects")} />;

    if (!projectsToShow.length) {
        return (
            <EmptyState
                title="No open projects"
                description="There are no open projects available for bidding."
            />
        );
    }

    return (
        <div className="container mx-auto py-6">
            <Card className="max-w-3xl mx-auto bg-[#101825] border border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-white">
                        {t("bid.create", "Submit a Bid")}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Project Select */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">
                            {t("bid.selectProject", "Select Project")}
                        </label>

                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="bg-transparent border-white/20 text-white">
                                <SelectValue
                                    placeholder={t(
                                        "bid.selectProjectPlaceholder",
                                        "Choose a project..."
                                    )}
                                />
                            </SelectTrigger>

                            <SelectContent className="bg-[#101825] border-white/10 text-white">
                                {projectsToShow.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id.toString()}
                                        className="focus:bg-white/10"
                                    >
                                        {project.title} – ${project.budget}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedProjectData && (
                            <p className="text-xs text-white/60 mt-2">
                                Budget: ${selectedProjectData.budget} · Category:{" "}
                                {selectedProjectData.category_name}
                            </p>
                        )}
                    </div>

                    {/* Amount & Timeline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">
                                {t("bid.proposedAmount", "Proposed Amount ($)")}
                            </label>

                            <input
                                type="number"
                                value={proposedAmount}
                                onChange={(e) => setProposedAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            />

                            {selectedProjectData?.budget && proposedAmount && (
                                <p className="text-xs text-white/60 mt-1">
                                    {(
                                        (proposedAmount / selectedProjectData.budget) *
                                        100
                                    ).toFixed(0)}
                                    % of project budget
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-white">
                                {t("bid.proposedTimeline", "Timeline (days)")}
                            </label>

                            <input
                                type="number"
                                value={proposedTimeline}
                                onChange={(e) => setProposedTimeline(e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 rounded-lg bg-transparent border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    {showSuggestions && realTimeSuggestions.data && (
                        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                            <div className="flex items-start gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold mb-2 text-white">
                                        💡 AI Suggestions
                                    </h4>

                                    {realTimeSuggestions.data.suggestions?.length > 0 ? (
                                        <ul className="text-sm space-y-1 text-white/80">
                                            {realTimeSuggestions.data.suggestions.map((s, idx) => (
                                                <li key={idx}>• {s}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-white/60">
                                            Your bid looks good! Keep writing to get more suggestions.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cover Letter */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-white">
                                {t("bid.coverLetter", "Cover Letter")}
                            </label>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateCoverLetter}
                                disabled={!selectedProject || generatingLetter}
                                className="border-white/20 text-white hover:bg-white/10 gap-2"
                            >
                                <Sparkles className="h-4 w-4" />
                                {generatingLetter
                                    ? t("bid.generating", "Generating...")
                                    : t("bid.generateAI", "Generate with AI")}
                            </Button>
                        </div>

                        <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={8}
                            placeholder={t(
                                "bid.coverLetterPlaceholder",
                                "Explain why you're the best fit for this project..."
                            )}
                            className="bg-transparent border border-white/20 text-white placeholder:text-white/40 font-mono text-sm"
                        />

                        <div className="flex justify-between mt-1">
                            <p className="text-xs text-white/50">
                                {coverLetter.split(" ").length} words
                            </p>
                            {coverLetter && (
                                <p className="text-xs text-white/50">
                                    {t(
                                        "bid.reviewNote",
                                        "Review and personalize before submitting"
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                        className="border-white/20 text-white hover:bg-white/10"
                    >
                        {t("common.cancel", "Cancel")}
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedProject || !coverLetter.trim()}
                        className="bg-white text-black hover:bg-white/90 gap-2"
                    >
                        {isSubmitting ? (
                            <LoadingSpinner className="h-4 w-4" />
                        ) : (
                            t("bid.submit", "Submit Bid")
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default BidCreate;