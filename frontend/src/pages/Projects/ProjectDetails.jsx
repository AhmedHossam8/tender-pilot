import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { projectService } from "../../services/project.services";
import { useProjects } from "../../hooks/useProjects";
import { useProjectMatches } from "../../hooks/useProjectMatches";
import { useBids, useChangeBidStatus } from "../../hooks/useBids";
import { useAuthStore } from "@/contexts/authStore";
import { messagingService } from "@/services/messaging.service";
import { createBid } from "../../services/bid.service";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  SkeletonList,
  Badge,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/common";
import { StatusBadge } from "@/components/ui";

import ProjectEditModal from "./ProjectEditModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const auth = useAuthStore();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  /* =======================
     Fetch Project
  ======================= */
  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await projectService.getProject(id)).data,
  });

  /* =======================
     Derived Flags
  ======================= */
  const flags = useMemo(() => {
    if (!project) return {};
    return {
      isOwner: project.is_owner,
      isOpen: project.status === "open",
      isInProgress: project.status === "in_progress",
      isCompleted: project.status === "completed",
      isClient: auth.isClient(),
      isProvider: auth.isProvider(),
    };
  }, [project, auth]);

  /* =======================
   Bids
  ======================= */
  const { data: bidsData, isLoading: bidsLoading, refetch: refetchBids } = useBids({ project: id });
  const changeBidStatus = useChangeBidStatus();

  const bids = Array.isArray(bidsData) ? bidsData : (bidsData?.results ?? []);

  const hasApplied = bids.some(
    bid => bid.service_provider === auth.user?.id || bid.service_provider_id === auth.user?.id
  );

  const acceptedBid = bids.find(bid => bid.status === "accepted");
  const assignedProviderId = acceptedBid?.service_provider;

  /* =======================
   Create Bid
  ======================= */
  const { mutateAsync: createBidMutation, isLoading: creatingBid } = useMutation({
    mutationFn: (bidData) => createBid(bidData),
    onSuccess: () => {
      toast.success(t("Bid submitted successfully"));
      refetchBids();
      refetch();
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.message ||
        t("Failed to submit bid");
      toast.error(errorMessage);
    },
  });

  const handleSubmitBid = async () => {
    if (!auth.user) return toast.error(t("You must be logged in"));
    await createBidMutation({
      project: id,
      cover_letter: "Hello, I would like to work on this project.",
      proposed_amount: 1000,
      proposed_timeline: 7,
    });
  };

  /* =======================
     AI Matches
  ======================= */
  const { data: matchesData, refetch: refetchMatches, isLoading: matchesLoading } = useProjectMatches(id);
  const matches = matchesData?.matches ?? [];

  /* =======================
     Messaging - Project Conversation
  ======================= */
  const { data: projectConversation } = useQuery({
    queryKey: ["project-conversation", id],
    queryFn: async () => {
      const conversations = await messagingService.getConversations().then(res => res.data.results);
      return conversations.find(conv => conv.project?.id?.toString() === id.toString());
    },
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count", projectConversation?.id],
    queryFn: async () => {
      if (!projectConversation?.id) return 0;
      try {
        const data = await messagingService.getUnreadCount().then(res => res.data);
        const convUnread = data?.conversations?.find(c => c.id === projectConversation.id);
        return convUnread?.unread_count ?? 0;
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        return 0;
      }
    },
    enabled: !!projectConversation?.id,
    retry: 1,
  });

  const startConversationMutation = useMutation({
    mutationFn: async (providerId) => projectService.startConversation(id, providerId),
    onSuccess: (data) => {
      toast.success(t("Conversation started"));
      queryClient.setQueryData(["project-conversation", id], data);
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['unread-count']);

      // Navigate to the chat after starting conversation
      const conversationId = data?.id || data?.data?.id;
      if (conversationId) {
        navigate(`/app/messages/${conversationId}`);
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.error || t("Failed to start conversation");
      toast.error(msg);
    },
  });

  /* =======================
     Actions
  ======================= */
  const { deleteProject } = useProjects();

  const updateProjectStatus = async (newStatus) => {
    try {
      setStatusLoading(true);
      await projectService.updateProjectStatus(id, newStatus);
      toast.success(t("Project status updated"));
      refetch();
    } catch {
      toast.error(t("Failed to update project status"));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteProject.mutateAsync(id);
      toast.success(t("project.deleteSuccess"));
      navigate("/app/projects");
    } catch {
      toast.error(t("Failed to delete project"));
    } finally {
      setDeleting(false);
    }
  };

  const handleBidDecision = async (bidId, status, providerId) => {
    try {
      await changeBidStatus.mutateAsync({ id: bidId, status });
      if (status === "accepted") {
        await updateProjectStatus("in_progress");
        // Automatically start conversation with accepted provider
        if (providerId) {
          await startConversationMutation.mutateAsync(providerId);
        }
      }
      toast.success(`${t("Bid")} ${status}`);
    } catch (error) {
      console.error("Bid update error:", error.response?.data || error);
      toast.error(t("Failed to update bid"));
    }
  };

  const handleAIAnalysis = async () => {
    try {
      setAiLoading(true);
      await projectService.aiAnalysis(id);
      toast.success(t("AI analysis completed"));
    } catch {
      toast.error(t("AI analysis failed"));
    } finally {
      setAiLoading(false);
    }
  };

  /* =======================
     Loading / Error
  ======================= */
  if (isLoading || !project) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <SkeletonList items={4} />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500">{t("Failed to load project")}</p>;
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">{project.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>{t("Budget")}:</strong> ${project.budget ?? "-"}</div>
            <div><strong>{t("Status")}:</strong> {project.status}</div>
            <div><strong>{t("Category")}:</strong> {project.category_name ?? "-"}</div>
            <div><strong>{t("Created")}:</strong> {new Date(project.created_at).toLocaleDateString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Actions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {flags.isProvider && flags.isOpen && !hasApplied && (
            <Button onClick={handleSubmitBid} disabled={creatingBid}>
              {creatingBid ? t("Submitting...") : t("Submit Bid")}
            </Button>
          )}

          {flags.isOwner && flags.isOpen && (
            <Button onClick={() => setEditOpen(true)}>
              {t("Edit")}
            </Button>
          )}

          {flags.isOwner && (flags.isOpen || flags.isCompleted) && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("Delete")}
            </Button>
          )}

          {flags.isOwner && flags.isInProgress && (
            <Button
              disabled={statusLoading}
              onClick={() => updateProjectStatus("completed")}
            >
              {t("Mark as Completed")}
            </Button>
          )}

          {/* Chat Button - for both Client and Accepted Provider */}
          {((flags.isOwner && flags.isInProgress) ||
            (flags.isProvider && flags.isInProgress && auth.user?.id === assignedProviderId)) && (
              <Button
                onClick={() => {
                  if (projectConversation?.id) {
                    navigate(`/app/messages/${projectConversation.id}`);
                  } else {
                    // Determine who to start conversation with
                    const otherPartyId = flags.isOwner
                      ? assignedProviderId
                      : project.created_by; // Use created_by for the client ID

                    if (otherPartyId) {
                      startConversationMutation.mutate(otherPartyId);
                    } else {
                      toast.error(t("Unable to start conversation"));
                    }
                  }
                }}
                disabled={startConversationMutation.isLoading}
              >
                {startConversationMutation.isLoading
                  ? t("Starting Chat...")
                  : projectConversation?.id
                    ? flags.isOwner ? t("Chat with Provider") : t("Chat with Client")
                    : t("Start Chat")}
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
        </CardContent>
      </Card>

      {/* AI Assistance */}
      {flags.isOwner && flags.isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{t("AI Assistance")}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button disabled={aiLoading} onClick={handleAIAnalysis}>
              {t("Analyze Project")}
            </Button>
            <Button disabled={matchesLoading} onClick={refetchMatches}>
              {t("Match Providers")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bids */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Bids")}</CardTitle>
        </CardHeader>
        <CardContent>
          {bidsLoading ? (
            <SkeletonList items={3} />
          ) : bids.length === 0 ? (
            <p className="text-muted-foreground">{t("No bids yet.")}</p>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{bid.service_provider_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${bid.proposed_amount} • {bid.proposed_timeline} days
                      </p>
                    </div>
                    <StatusBadge status={bid.status} />
                  </div>

                  <p className="text-sm">{bid.cover_letter}</p>

                  {bid.ai_score && (
                    <p className="text-xs text-muted-foreground">
                      AI Score: {bid.ai_score}%
                    </p>
                  )}

                  {flags.isOwner && flags.isOpen && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleBidDecision(bid.id, "accepted", bid.service_provider)
                        }
                      >
                        {t("Accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleBidDecision(bid.id, "shortlisted", bid.service_provider)
                        }
                      >
                        {t("Shortlist")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleBidDecision(bid.id, "rejected", bid.service_provider)
                        }
                      >
                        {t("Reject")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ProjectEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSuccess={() => {
          setEditOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("Delete Project")}
        description={t("Are you sure you want to delete this project?")}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
