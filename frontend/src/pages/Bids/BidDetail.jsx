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
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Bid Details</CardTitle>

                    {isAccepted && (
                        <Badge variant="success">🏆 Winning Bid</Badge>
                    )}
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <strong>Project:</strong>{" "}
                        <span
                            className="underline cursor-pointer"
                            onClick={() => navigate(`/projects/${bid.project.id}`)}
                        >
                            {bid.project.title}
                        </span>
                    </div>

                    <div>
                        <strong>Provider:</strong> {bid.service_provider_name}
                    </div>

                    <div>
                        <strong>Amount:</strong> ${bid.proposed_amount}
                    </div>

                    <div>
                        <strong>Timeline:</strong> {bid.proposed_timeline} days
                    </div>

                    <div>
                        <strong>Status:</strong>{" "}
                        <Badge>{bid.status}</Badge>
                    </div>

                    {bid.ai_score && (
                        <div className="text-sm text-muted-foreground">
                            AI Score: {bid.ai_score}%
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
