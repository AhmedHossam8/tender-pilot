import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import bidService from '@/services/bid.service';
import { projectService } from "../../services/project.services";
import { useChangeBidStatus } from "@/hooks/useBids";
import { useAuthStore } from "@/contexts/authStore";
import { useAnalyzeBidStrength, usePredictBidSuccess } from '@/hooks/useBidOptimization';

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge,
    Skeleton,
} from "@/components/ui";
import { StatusBadge } from "@/components/ui/Badge";
import { Brain, TrendingUp } from 'lucide-react';

export default function BidDetail() {
    const { id } = useParams(); // bid id
    const navigate = useNavigate();
    const auth = useAuthStore();
    const { t } = useTranslation();

    const changeBidStatus = useChangeBidStatus();
    const analyzeBid = useAnalyzeBidStrength(id);
    const predictSuccess = usePredictBidSuccess(id);

    /* =======================
       Fetch Bid
    ======================= */
    const {
        data: bid,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["bid", id],
        queryFn: async () => {
            try {
                const response = await bidService.getBid(id);
                console.log("Bid response:", response);
                return response.data;
            } catch (err) {
                console.error("Failed to fetch bid:", err);
                throw err;
            }
        },
    });

    if (isLoading) {
        return <Skeleton className="h-40 w-full max-w-3xl mx-auto" />;
    }

    if (isError || !bid) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500 text-lg mb-2">
                    Failed to load bid
                </p>
                {error && (
                    <p className="text-sm text-muted-foreground">
                        {error?.response?.data?.detail || error?.message || "Unknown error"}
                    </p>
                )}
                <Button 
                    variant="outline" 
                    onClick={() => navigate("/app/bids")}
                    className="mt-4"
                >
                    Back to Bids
                </Button>
            </div>
        );
    }

    /* =======================
       Flags
    ======================= */
    const isClient = auth.isClient();
    const isProvider = auth.isProvider();

    const isOwnerClient = bid.project?.is_owner;
    const isBidOwner = bid.is_owner;

    const isPending = bid.status === "pending";
    const isAccepted = bid.status === "accepted";
    const isRejected = bid.status === "rejected";

    /* =======================
       Actions
    ======================= */
    const handleDecision = async (status) => {
        try {
            await changeBidStatus.mutateAsync({ id: bid.id, status });

            if (status === "accepted") {
                await projectService.updateProjectStatus(
                    bid.project.id,
                    "in_progress"
                );
            }

            // Query invalidation is handled by the mutation hook
            // Show toast after all async operations complete
            setTimeout(() => {
                toast.success(`Bid ${status}`);
            }, 0);
        } catch (error) {
            setTimeout(() => {
                toast.error(t('bids.bidError'));
            }, 0);
        }
    };

    const handleWithdraw = async () => {
        try {
            await bidService.withdrawBid(bid.id);
            setTimeout(() => {
                toast.success(t('bids.bidWithdrawn'));
                navigate(`/projects/${bid.project.id}`);
            }, 0);
        } catch (error) {
            setTimeout(() => {
                toast.error(t('bids.bidWithdrawError'));
            }, 0);
        }
    };

    /* =======================
       UI
    ======================= */
    return (
        <div className="p-8 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t("bid.details", "Bid Details")}</h1>
                    <Button variant="outline" onClick={() => navigate("/app/bids")}>
                        {t("common.goBack", "Go Back")}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{bid.project_title || "Project"}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Submitted by: {bid.service_provider?.first_name} {bid.service_provider?.last_name}
                                </p>
                            </div>
                            <StatusBadge status={bid.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Proposed Amount</h3>
                                <p className="text-2xl font-bold">${bid.proposed_amount}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Timeline</h3>
                                <p className="text-2xl font-bold">{bid.proposed_timeline} days</p>
                            </div>
                        </div>

                        {bid.ai_score && (
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">AI Match Score</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${bid.ai_score}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-semibold">{bid.ai_score}/100</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="font-semibold mb-2">Cover Letter</h3>
                            <div className="bg-muted/50 text-foreground p-4 rounded-md whitespace-pre-wrap border">
                                {bid.cover_letter}
                            </div>
                        </div>

                        {/* AI Analysis Section */}
                        {isBidOwner && (
                            <div className="border-t pt-6">
                                <h3 className="font-semibold mb-3">AI Bid Analysis</h3>
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        onClick={() => analyzeBid.mutate()}
                                        disabled={analyzeBid.isPending}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Brain className="mr-2 h-4 w-4" />
                                        {analyzeBid.isPending ? 'Analyzing...' : 'Analyze Bid Strength'}
                                    </Button>
                                    
                                    <Button 
                                        onClick={() => predictSuccess.mutate()}
                                        disabled={predictSuccess.isPending}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        {predictSuccess.isPending ? 'Predicting...' : 'Predict Success'}
                                    </Button>
                                </div>
                                
                                {/* Bid Analysis Results */}
                                {analyzeBid.data && (
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">Bid Strength Analysis</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Overall Score:</span>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {analyzeBid.data.overall_score}/10
                                                </span>
                                            </div>
                                            {analyzeBid.data.analysis?.content_quality && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Content Quality:</span>
                                                    <span className="font-semibold">
                                                        {analyzeBid.data.analysis.content_quality.score}/10
                                                    </span>
                                                </div>
                                            )}
                                            {analyzeBid.data.analysis?.pricing && (
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">Pricing Competitiveness:</span>
                                                        <span className="font-semibold">
                                                            {analyzeBid.data.analysis.pricing.competitive_score}/10
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {analyzeBid.data.analysis.pricing.reasoning}
                                                    </p>
                                                </div>
                                            )}
                                            {analyzeBid.data.suggestions?.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm font-medium mb-2">Suggestions:</p>
                                                    <ul className="text-sm space-y-1">
                                                        {analyzeBid.data.suggestions.map((suggestion, idx) => (
                                                            <li key={idx} className="flex items-start">
                                                                <span className="mr-2">•</span>
                                                                <span>{suggestion}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Success Prediction Results */}
                                {predictSuccess.data && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                        <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">Success Prediction</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Win Probability:</span>
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {(predictSuccess.data.win_probability * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            {predictSuccess.data.reasoning && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {predictSuccess.data.reasoning}
                                                </p>
                                            )}
                                            {predictSuccess.data.factors && (
                                                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                                    <p className="text-sm font-medium mb-2">Key Factors:</p>
                                                    <ul className="text-sm space-y-1">
                                                        {Object.entries(predictSuccess.data.factors).map(([key, value]) => (
                                                            <li key={key} className="flex items-center justify-between">
                                                                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                                                <span className="font-semibold">{value}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* =======================
                    CLIENT ACTIONS
                ======================= */}
                {isClient && isOwnerClient && isPending && (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => handleDecision("accepted")}
                            variant="success"
                        >
                            Accept Bid
                        </Button>

                        <Button
                            onClick={() => handleDecision("rejected")}
                            variant="destructive"
                        >
                            Reject Bid
                        </Button>
                    </div>
                )}

                {/* =======================
                    PROVIDER ACTIONS
                ======================= */}
                {isProvider && isBidOwner && isPending && (
                    <Button
                        variant="destructive"
                        onClick={handleWithdraw}
                    >
                        Withdraw Bid
                    </Button>
                )}

                {/* =======================
                    LOCKED STATE
                ======================= */}
                {!isPending && (
                    <p className="text-sm text-muted-foreground">
                        This bid is locked and can no longer be modified.
                    </p>
                )}
            </div>
        </div>
    );
}
