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
import { Edit, Trash2, Plus } from "lucide-react";
import { useBids } from "../../hooks/useBids";

const BidList = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const { data: bids = [], isLoading, isError, error } = useBids();

  // Local state for deletion
  const [bidList, setBidList] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);

  // Initialize local state once after bids load
  useEffect(() => {
    if (!isLoading && !isError && bidList.length === 0) {
      setBidList(bids);
    }
  }, [bids, isLoading, isError]);

  const handleDelete = (bid) => {
    setBidList((prev) => prev.filter((b) => b.id !== bid.id));
    toast.success(t("Bid withdrawn successfully!"));
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  if (isError || error)
    return <EmptyState title={t("bid.loadError", "Failed to load bids")} />;

  if (!bidList || bidList.length === 0)
    return <EmptyState title={t("bid.noBids", "No bids found")} />;

  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Bids")}</h1>
        {user?.role === "provider" && (
          <Link to="/bids/create">
            <Button>
              <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
              {t("Submit Bid")}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("All Bids")}</CardTitle>
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
                      <Link to={`/bids/${bid.id}`}>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {user?.role === "provider" && bid.status === "pending" && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setSelectedBid(bid);
                            setConfirmDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
        title={t("Withdraw Bid?")}
        description={t(
          "This action cannot be undone. Are you sure you want to withdraw this bid?"
        )}
        confirmLabel={t("Withdraw")}
        variant="destructive"
        onConfirm={() => {
          if (selectedBid) handleDelete(selectedBid);
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
};

export default BidList;
