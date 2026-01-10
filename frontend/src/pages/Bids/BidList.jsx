import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  StatusBadge,
} from "@/components/ui";

import { LoadingSpinner, EmptyState, ConfirmDialog } from "@/components/common";
import { Edit, Trash2, Plus, Check, X, Star } from "lucide-react";
import { useBids, useChangeBidStatus } from "../../hooks/useBids";
import bidService from "../../services/bid.service";

const BidList = () => {
  const { t, i18n } = useTranslation();
  const auth = useAuthStore();
  const user = auth.user;
  const role = auth.role;
  const navigate = useNavigate();
  
  // Determine filter based on user type
  const bidFilter = auth.isProvider() ? { type: 'sent' } : auth.isClient() ? { type: 'received' } : {};
  const { data: bids, isLoading, isError, error, refetch } = useBids(bidFilter);
  const changeBidStatus = useChangeBidStatus();

  // Local state
  const [bidList, setBidList] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'withdraw', 'accept', 'reject', 'shortlist'
  const [loading, setLoading] = useState(false); // Loading state for actions

  // Initialize local state once after bids load
  useEffect(() => {
    if (!isLoading && !isError && bids) {
      // Ensure bids is always an array
      const bidsArray = Array.isArray(bids) ? bids : [];
      setBidList(bidsArray);
    }
  }, [bids, isLoading, isError]);

  // Helper function to check if a project has an accepted bid
  const hasAcceptedBid = (projectId) => {
    return bidList.some(b => b.project === projectId && b.status === 'accepted');
  };

  // Helper function to check if this specific bid is the accepted one
  const isAcceptedBid = (bid) => {
    return bid.status === 'accepted';
  };

  const handleWithdraw = async (bid) => {
    setLoading(true);
    try {
      await bidService.withdrawBid(bid.id);
      toast.success(t("Bid withdrawn successfully!"));
      refetch();
    } catch (error) {
      toast.error(t("Failed to withdraw bid"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bid, status) => {
    setLoading(true);
    try {
      await changeBidStatus.mutateAsync({ id: bid.id, status });
      
      // Show success message based on action
      const messages = {
        'accepted': t('Bid accepted successfully!'),
        'rejected': t('Bid rejected successfully!'),
        'shortlisted': t('Bid shortlisted successfully!')
      };
      toast.success(messages[status] || t('Bid status updated!'));
      
      refetch();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.status?.[0] || 
                          t("Failed to update bid status");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (bid, action) => {
    setSelectedBid(bid);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedBid || !confirmAction) return;

    switch (confirmAction) {
      case 'withdraw':
        handleWithdraw(selectedBid);
        break;
      case 'accept':
      case 'reject':
      case 'shortlisted':
        handleStatusChange(selectedBid, confirmAction);
        break;
    }

    setConfirmDialogOpen(false);
    setSelectedBid(null);
    setConfirmAction(null);
  };

  const getConfirmDialogProps = () => {
    switch (confirmAction) {
      case 'withdraw':
        return {
          title: t("Withdraw Bid?"),
          description: t("This action cannot be undone. Are you sure you want to withdraw this bid?"),
          confirmLabel: t("Withdraw"),
          variant: "destructive"
        };
      case 'accept':
        return {
          title: t("Accept Bid?"),
          description: t("Accepting this bid will automatically reject all other bids for this project and move the project to 'In Progress'. Are you sure?"),
          confirmLabel: t("Accept"),
          variant: "default"
        };
      case 'reject':
        return {
          title: t("Reject Bid?"),
          description: selectedBid?.status === 'accepted' 
            ? t("Rejecting this accepted bid will allow you to accept other bids for this project. Are you sure?")
            : t("Are you sure you want to reject this bid? This action cannot be undone."),
          confirmLabel: t("Reject"),
          variant: "destructive"
        };
      case 'shortlisted':
        return {
          title: t("Shortlist Bid?"),
          description: t("Are you sure you want to shortlist this bid?"),
          confirmLabel: t("Shortlist"),
          variant: "default"
        };
      default:
        return {
          title: t("Confirm Action"),
          description: t("Are you sure?"),
          confirmLabel: t("Confirm"),
          variant: "default"
        };
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  if (isError || error)
    return <EmptyState title={t("bid.loadError", "Failed to load bids")} />;

  if (!Array.isArray(bidList) || bidList.length === 0)
    return <EmptyState title={t("bid.noBids", "No bids found")} />;

  const dialogProps = getConfirmDialogProps();

  // Render for PROVIDER
  if (auth.isProvider()) {
    return (
      <div
        className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("My Bids")}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("Submitted Bids")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Project")}</TableHead>
                  <TableHead>{t("Proposed Amount")}</TableHead>
                  <TableHead>{t("Timeline (Days)")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bidList.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">{bid.project_title || bid.project}</TableCell>
                    <TableCell>${bid.proposed_amount}</TableCell>
                    <TableCell>{bid.proposed_timeline} days</TableCell>
                    <TableCell>
                      <StatusBadge status={bid.status || "pending"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/app/bids/${bid.id}`}>
                          <Button size="sm" variant="ghost" disabled={loading}>
                            <Edit className="h-4 w-4 mr-1" />
                            {t("View")}
                          </Button>
                        </Link>

                        {bid.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={loading}
                            onClick={() => openConfirmDialog(bid, 'withdraw')}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {t("Withdraw")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title={dialogProps.title}
          description={dialogProps.description}
          confirmLabel={dialogProps.confirmLabel}
          variant={dialogProps.variant}
          loading={loading}
          onConfirm={handleConfirm}
        />
      </div>
    );
  }

  // Render for CLIENT
  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Bids")}</h1>
        {user?.role === "provider" && (
          <Link to="/app/bids/create">
            <Button>
              <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
              {t("Submit Bid")}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Received Bids")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Project")}</TableHead>
                <TableHead>{t("Provider")}</TableHead>
                <TableHead>{t("Amount")}</TableHead>
                <TableHead>{t("Timeline")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bidList.map((bid) => {
                const projectHasAcceptedBid = hasAcceptedBid(bid.project);
                const thisIsAcceptedBid = isAcceptedBid(bid);
                const canModify = !projectHasAcceptedBid || thisIsAcceptedBid;
                
                return (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">{bid.project_title || bid.project}</TableCell>
                  <TableCell>{bid.service_provider_name || "Unknown"}</TableCell>
                  <TableCell>${bid.proposed_amount}</TableCell>
                  <TableCell>{bid.proposed_timeline} days</TableCell>
                  <TableCell>
                    <StatusBadge status={bid.status || "pending"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/app/bids/${bid.id}`}>
                        <Button size="sm" variant="ghost" disabled={loading}>
                          {t("View Details")}
                        </Button>
                      </Link>

                      {/* Show reject button for accepted bids */}
                      {thisIsAcceptedBid && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loading}
                          onClick={() => openConfirmDialog(bid, 'reject')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t("Reject")}
                        </Button>
                      )}

                      {/* Show action buttons for pending/shortlisted bids if no other bid is accepted */}
                      {(bid.status === "pending" || bid.status === "shortlisted") && canModify && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={loading}
                            onClick={() => openConfirmDialog(bid, 'accept')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t("Accept")}
                          </Button>

                          {bid.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => openConfirmDialog(bid, 'shortlisted')}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              {t("Shortlist")}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={loading}
                            onClick={() => openConfirmDialog(bid, 'reject')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t("Reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        variant={dialogProps.variant}
        loading={loading}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default BidList;
