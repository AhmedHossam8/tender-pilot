import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import bidService from '@/services/bid.service';
import { projectService } from "@/services/project.services";
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
import { Brain, TrendingUp, Check, X, ArrowLeftCircle } from 'lucide-react';

export default function BidDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuthStore();
    const { t } = useTranslation();

    const changeBidStatus = useChangeBidStatus();
    const analyzeBid = useAnalyzeBidStrength(id);
    const predictSuccess = usePredictBidSuccess(id);

    // Fetch Bid
    const { data: bid, isLoading, isError, error } = useQuery({
        queryKey: ["bid", id],
        queryFn: async () => {
            const response = await bidService.getBid(id);
            return response.data;
        },
    });

    // Loading state
    if (isLoading) {
        return (
            <div className="p-8">
                <Skeleton className="h-8 w-1/3 mb-6" />
                <Skeleton className="h-80 w-full max-w-3xl mx-auto rounded-lg" />
            </div>
        );
    }

    // Error state
    if (isError || !bid) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-2">{t('bids.failedLoad', 'Failed to load bid')}</p>
                {error && <p className="text-sm text-gray-400">{error?.message || 'Unknown error'}</p>}
                <Button variant="outline" onClick={() => navigate("/app/bids")} className="mt-4">
                    {t("common.goBack", "Go Back")}
                </Button>
            </div>
        );
    }

    const isClient = auth.isClient();
    const isProvider = auth.isProvider();
    const isOwnerClient = bid.project?.is_owner;
    const isBidOwner = bid.is_owner;
    const isPending = bid.status === "pending";

    const handleDecision = async (status) => {
        try {
            await changeBidStatus.mutateAsync({ id: bid.id, status });
            if (status === "accepted") {
                await projectService.updateProjectStatus(bid.project.id, "in_progress");
            }
            toast.success(`Bid ${status}`);
        } catch {
            toast.error(t('bids.bidError', 'Failed to update bid'));
        }
    };

    const handleWithdraw = async () => {
        try {
            await bidService.withdrawBid(bid.id);
            toast.success(t('bids.bidWithdrawn', 'Bid withdrawn'));
            navigate(`/projects/${bid.project.id}`);
        } catch {
            toast.error(t('bids.bidWithdrawError', 'Failed to withdraw bid'));
        }
    };

    return (
        <div className="p-8 min-h-screen bg-[#101825] text-white">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t("bid.details", "Bid Details")}</h1>
                    <Button variant="outline" onClick={() => navigate("/app/bids")}>
                        {t("common.goBack", "Go Back")}
                    </Button>
                </div>

                <Card>
                    <CardHeader className="flex justify-between items-start">
                        <div>
                            <CardTitle>{bid.project_title}</CardTitle>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('bids.submittedBy', 'Submitted by')}: {bid.service_provider?.first_name} {bid.service_provider?.last_name}
                            </p>
                        </div>
                        <Badge className="capitalize">{bid.status}</Badge>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Amount & Timeline */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm text-gray-400 font-semibold">{t('bids.amount')}</h3>
                                <p className="text-2xl font-bold">${bid.proposed_amount}</p>
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-400 font-semibold">{t('bids.deliveryTime')}</h3>
                                <p className="text-2xl font-bold">{bid.proposed_timeline} {t('bids.days')}</p>
                            </div>
                        </div>

                        {/* AI Score */}
                        {bid.ai_score && (
                            <div>
                                <h3 className="text-sm text-gray-400 font-semibold mb-2">{t('bids.aiScore', 'AI Match Score')}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600" style={{ width: `${bid.ai_score}%` }} />
                                    </div>
                                    <span className="font-semibold">{bid.ai_score}/100</span>
                                </div>
                            </div>
                        )}

                        {/* Cover Letter */}
                        <div>
                            <h3 className="font-semibold mb-2">{t('bids.coverLetter', 'Cover Letter')}</h3>
                            <div className="bg-gray-900 p-4 rounded-md border whitespace-pre-wrap">
                                {bid.cover_letter}
                            </div>
                        </div>

                        {/* AI Analysis */}
                        {isBidOwner && (
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="font-semibold">{t('bids.aiAnalysis', 'AI Bid Analysis')}</h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => analyzeBid.mutate()}
                                        disabled={analyzeBid.isPending}
                                        variant="outline" size="sm"
                                    >
                                        <Brain className="h-4 w-4 mr-2" />
                                        {analyzeBid.isPending ? t('bids.analyzing') : t('bids.analyzeBid')}
                                    </Button>
                                    <Button
                                        onClick={() => predictSuccess.mutate()}
                                        disabled={predictSuccess.isPending}
                                        variant="outline" size="sm"
                                    >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        {predictSuccess.isPending ? t('bids.predicting') : t('bids.predictSuccess')}
                                    </Button>
                                </div>

                                {analyzeBid.data && (
                                    <Card className="bg-gray-900 border-gray-700">
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>{t('bids.overallScore')}</span>
                                                <span className="font-bold">{analyzeBid.data.overall_score}/10</span>
                                            </div>
                                            {analyzeBid.data.analysis?.content_quality && (
                                                <div className="flex justify-between">
                                                    <span>{t('bids.contentQuality')}</span>
                                                    <span className="font-semibold">{analyzeBid.data.analysis.content_quality.score}/10</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {predictSuccess.data && (
                                    <Card className="bg-gray-900 border-gray-700">
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <span>{t('bids.winProbability')}</span>
                                                <span className="text-xl font-bold">{(predictSuccess.data.win_probability * 100).toFixed(1)}%</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* CLIENT ACTIONS */}
                {isClient && isOwnerClient && isPending && (
                    <div className="flex gap-3">
                        <Button onClick={() => handleDecision("accepted")} variant="success">
                            <Check className="h-4 w-4 mr-2" />
                            {t('bids.accept')}
                        </Button>
                        <Button onClick={() => handleDecision("rejected")} variant="destructive">
                            <X className="h-4 w-4 mr-2" />
                            {t('bids.reject')}
                        </Button>
                    </div>
                )}

                {/* PROVIDER ACTIONS */}
                {isProvider && isBidOwner && isPending && (
                    <Button onClick={handleWithdraw} variant="destructive">
                        <ArrowLeftCircle className="h-4 w-4 mr-2" />
                        {t('bids.withdraw')}
                    </Button>
                )}

                {/* LOCKED STATE */}
                {!isPending && (
                    <p className="text-sm text-gray-400">{t('bids.locked', 'This bid is locked and can no longer be modified.')}</p>
                )}

            </div>
        </div>
    );
}
