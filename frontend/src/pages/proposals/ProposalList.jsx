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
import { useProposals } from "../../hooks/useProposals";

const ProposalList = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const { data: proposals = [], isLoading, isError, error } = useProposals();

  // Local state for deletion
  const [proposalList, setProposalList] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Initialize local state once after proposals load
  useEffect(() => {
    if (!isLoading && !isError && proposalList.length === 0) {
      setProposalList(proposals);
    }
  }, [proposals, isLoading, isError]);

  const handleDelete = (proposal) => {
    setProposalList((prev) => prev.filter((p) => p.id !== proposal.id));
    toast.success(t("Proposal deleted successfully!"));
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );

  if (isError || error)
    return <EmptyState title={t("proposal.loadError", "Failed to load proposals")} />;

  if (!proposalList || proposalList.length === 0)
    return <EmptyState title={t("proposal.noProposals", "No proposals found")} />;

  return (
    <div
      className={`p-8 min-h-screen bg-background ${i18n.language === "ar" ? "rtl" : "ltr"
        }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("Proposals")}</h1>
        {user?.role === "writer" && (
          <Link to="/proposals/create">
            <Button>
              <Plus className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
              {t("Create Proposal")}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("All Proposals")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Title")}</TableHead>
                <TableHead>{t("Tender")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposalList.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell>{proposal.tender_title || proposal.tender}</TableCell>
                  <TableCell>
                    <StatusBadge status={proposal.status || "draft"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={
                          role === "reviewer"
                            ? `/proposals/${proposal.id}/review`
                            : role === "proposal_manager"
                              ? `/proposals/${proposal.id}/preview`
                              : `/proposals/${proposal.id}/`
                        }
                      >
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      {user?.role === "writer" && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => {
                            setSelectedProposal(proposal);
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
        title={t("Delete Proposal?")}
        description={t(
          "This action cannot be undone. Are you sure you want to delete this proposal?"
        )}
        confirmLabel={t("Delete")}
        variant="destructive"
        onConfirm={() => {
          if (selectedProposal) handleDelete(selectedProposal);
          setConfirmDialogOpen(false);
        }}
      />
    </div>
  );
};

export default ProposalList;
