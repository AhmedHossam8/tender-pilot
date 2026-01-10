import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import bidService from '@/services/bid.service';
import { projectService } from "../../services/project.services";
import { useChangeBidStatus } from "@/hooks/useBids";
import { useAuthStore } from "@/contexts/authStore";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Badge,
    Skeleton,
} from "@/components/ui";

export default function BidDetail() {
    const { id } = useParams(); // bid id
    const navigate = useNavigate();
    const auth = useAuthStore();

    const changeBidStatus = useChangeBidStatus();

    /* =======================
       Fetch Bid
    ======================= */
    const {
        data: bid,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["bid", id],
        queryFn: async () => (await bidService.getBid(id)).data,
    });

    if (isLoading) {
        return <Skeleton className="h-40 w-full max-w-3xl mx-auto" />;
    }

    if (isError || !bid) {
        return (
            <p className="text-center text-red-500">
                Failed to load bid
            </p>
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

            toast.success(`Bid ${status}`);
            refetch();
        } catch {
            toast.error("Failed to update bid");
        }
    };

    const handleWithdraw = async () => {
        try {
            await bidService.withdrawBid(bid.id);
            toast.success("Bid withdrawn");
            navigate(`/projects/${bid.project.id}`);
        } catch {
            toast.error("Failed to withdraw bid");
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
                            <div className="bg-secondary p-4 rounded-md whitespace-pre-wrap">
                                {bid.cover_letter}
                            </div>
                        </div>
                    )}

                    <div>
                        <strong>Cover Letter:</strong>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {bid.cover_letter}
                        </p>
                    </div>
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
    );
}
