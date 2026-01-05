import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { getBidById, changeBidStatus, withdrawBid } from "../../services/bid.service";
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    StatusBadge,
} from "@/components/ui";

const BidDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [bid, setBid] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchBid = async () => {
            try {
                setIsLoading(true);
                const response = await getBidById(id);
                setBid(response.data);
            } catch (err) {
                console.error("Error fetching bid:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBid();
    }, [id]);

    const handleStatusChange = async (newStatus, reason = "") => {
        setIsUpdating(true);
        try {
            const response = await changeBidStatus(id, newStatus, reason);
            setBid(response.data.bid);
            toast.success(t("bid.statusUpdated", "Bid status updated successfully"));
        } catch (err) {
            console.error("Error updating status:", err);
            toast.error(t("bid.statusUpdateError", "Failed to update bid status"));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm(t("bid.confirmWithdraw", "Are you sure you want to withdraw this bid?"))) {
            return;
        }

        setIsUpdating(true);
        try {
            const response = await withdrawBid(id);
            setBid(response.data.bid);
            toast.success(t("bid.withdrawn", "Bid withdrawn successfully"));
        } catch (err) {
            console.error("Error withdrawing bid:", err);
            toast.error(t("bid.withdrawError", "Failed to withdraw bid"));
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <LoadingSpinner text={t("common.loading", "Loading...")} />;
    if (error) return <EmptyState title={t("bid.loadError", "Failed to load bid")} />;
    if (!bid) return <EmptyState title={t("bid.noBid", "Bid not found")} />;

    const isProvider = bid.service_provider?.id === user?.id;
    const isClient = bid.project?.created_by === user?.id;

    return (
        <div className="p-8 min-h-screen bg-background">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t("bid.details", "Bid Details")}</h1>
                    <Button variant="outline" onClick={() => navigate("/bids")}>
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

                        {bid.milestones && bid.milestones.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Milestones</h3>
                                <div className="space-y-2">
                                    {bid.milestones.map((milestone, index) => (
                                        <div key={index} className="border p-3 rounded-md">
                                            <div className="font-medium">{milestone.title}</div>
                                            <div className="text-sm text-muted-foreground">{milestone.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t">
                            {isProvider && bid.status === "pending" && (
                                <Button 
                                    variant="destructive" 
                                    onClick={handleWithdraw}
                                    disabled={isUpdating}
                                >
                                    Withdraw Bid
                                </Button>
                            )}
                            
                            {isClient && bid.status === "pending" && (
                                <>
                                    <Button 
                                        variant="default" 
                                        onClick={() => handleStatusChange("shortlisted")}
                                        disabled={isUpdating}
                                    >
                                        Shortlist
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => handleStatusChange("rejected")}
                                        disabled={isUpdating}
                                    >
                                        Reject
                                    </Button>
                                </>
                            )}
                            
                            {isClient && bid.status === "shortlisted" && (
                                <>
                                    <Button 
                                        variant="success" 
                                        onClick={() => handleStatusChange("accepted")}
                                        disabled={isUpdating}
                                    >
                                        Accept Bid
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => handleStatusChange("rejected")}
                                        disabled={isUpdating}
                                    >
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BidDetail;
