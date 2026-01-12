import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { projectService } from "../../services/project.services";
import { aiService } from "../../services/ai.service";
import { useProjects } from "../../hooks/useProjects";
import { useProjectMatches } from "../../hooks/useProjectMatches";
import { useBids, useChangeBidStatus } from "../../hooks/useBids";
import { useAuthStore } from "@/contexts/authStore";
import { messagingService } from "@/services/messaging.service";
import { createBid } from "../../services/bid.service";
import { useProjectOptimization } from "../../hooks/useRecommendations";

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
import { AISummaryCard, AIMatchScore, AIComplexityBadge } from "@/components/ai/AIComponents";
import { Lightbulb, User } from 'lucide-react';

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
  const [bidDecisionLoading, setBidDecisionLoading] = useState(false);

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

  const handleSubmitBid = () => {
    if (!auth.user) {
      toast.error(t("You must be logged in"));
      return;
    }
    // Navigate to the bid creation page with project pre-selected
    navigate(`/app/bids/create/?project=${id}`);
  };

  /* =======================
     AI Matches
  ======================= */
  const [matchesOffset, setMatchesOffset] = useState(0);
  const [allMatches, setAllMatches] = useState([]);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const { data: matchesData, refetch: refetchMatches, isLoading: matchesLoading } = useProjectMatches(id);
  const matches = useMemo(() => {
    if (aiUnavailable) return [];
    return matchesData?.matches || [];
  }, [matchesData, aiUnavailable]);

  /* =======================
   AI Project Optimization (for owners only) - Manual trigger
  ======================= */
  const [optimizationData, setOptimizationData] = useState(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);

  const handleMatchProviders = async () => {
    try {
      console.log('Matching providers for project:', id);
      toast.info(t('projects.findingMatches'));
      setMatchesOffset(0);
      setAllMatches([]);
      setAiUnavailable(false);

      const result = await refetchMatches();
      console.log('Match providers result:', result);
      console.log('Matches data structure:', result.data?.matches);

      // Check if AI is unavailable
      if (result.data?.error === 'AI_UNAVAILABLE') {
        setAiUnavailable(true);
        toast.error(t('ai.unavailable'));
        return;
      }

      const matchCount = result.data?.matches?.length || 0;
      setHasMoreMatches(result.data?.has_more || false);

      if (matchCount > 0) {
        toast.success(t('projects.findingMatches'));
      } else {
        toast.info(t('projects.noOptimization'));
      }
    } catch (error) {
      console.error('Match providers error:', error);
      if (error?.response?.status === 503) {
        setAiUnavailable(true);
        toast.error(t('ai.unavailable'));
      } else {
        toast.error(t('projects.bidError'));
      }
    }
  };

  const handleOptimizationSuggestions = async () => {
    try {
      setOptimizationLoading(true);
      const response = await aiService.getProjectOptimization(id);
      setOptimizationData(response.data);
      toast.success(t('projects.optimizationSuggestions'));
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error(error?.response?.data?.error || "Failed to get optimization suggestions");
    } finally {
      setOptimizationLoading(false);
    }
  };

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
    mutationFn: async ({ providerId, existingConversation }) => {
      // If conversation already exists, just return it
      if (existingConversation) {
        return existingConversation;
      }
      // Otherwise create a new conversation
      return projectService.startConversation(id, providerId);
    },
    onSuccess: (data) => {
      const conversationId = data?.id || data?.data?.id;

      // Only show success toast and update cache if it's a new conversation
      if (!projectConversation) {
        toast.success(t("Conversation started"));
        queryClient.setQueryData(["project-conversation", id], data);
        queryClient.invalidateQueries(['conversations']);
        queryClient.invalidateQueries(['unread-count']);
      }

      // Navigate to the chat
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
      setBidDecisionLoading(true);
      await changeBidStatus.mutateAsync({ id: bidId, status });
      if (status === "accepted") {
        await updateProjectStatus("in_progress");
        // Automatically start conversation with accepted provider (or use existing one)
        if (providerId) {
          if (projectConversation?.id) {
            // Conversation already exists, just navigate
            navigate(`/app/messages/${projectConversation.id}`);
          } else {
            // Create new conversation
            await startConversationMutation.mutateAsync({
              providerId,
              existingConversation: null
            });
          }
        }
      }
      toast.success(`${t("Bid")} ${status}`);
    } catch (error) {
      console.error("Bid update error:", error.response?.data || error);
      toast.error(t("Failed to update bid"));
    } finally {
      setBidDecisionLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    try {
      setAiLoading(true);
      await projectService.triggerAIAnalysis(id);
      toast.success(t("AI analysis completed"));
      // Refetch project data to get updated AI fields
      refetch();
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error(error?.response?.data?.error || t("AI analysis failed"));
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
      {/* AI Summary */}
      {(project.ai_summary || project.ai_complexity) && (
        <AISummaryCard
          summary={project.ai_summary}
          complexity={project.ai_complexity}
        />
      )}

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{project.title}</CardTitle>
            {project.ai_complexity && <AIComplexityBadge complexity={project.ai_complexity} />}
          </div>
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
                    // Conversation exists, just navigate to it
                    navigate(`/app/messages/${projectConversation.id}`);
                  } else {
                    // No conversation exists, create one
                    const otherPartyId = flags.isOwner
                      ? assignedProviderId
                      : project.created_by;

                    if (otherPartyId) {
                      startConversationMutation.mutate({
                        providerId: otherPartyId,
                        existingConversation: null
                      });
                    } else {
                      toast.error(t("Unable to start conversation"));
                    }
                  }
                }}
                disabled={startConversationMutation.isPending}
              >
                {startConversationMutation.isPending
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
              {aiLoading ? 'Analyzing...' : t("Analyze Project")}
            </Button>
            <Button disabled={matchesLoading} onClick={handleMatchProviders}>
              {matchesLoading ? 'Loading...' : t("Match Providers")}
            </Button>
            <Button disabled={optimizationLoading} onClick={handleOptimizationSuggestions}>
              {optimizationLoading ? 'Loading...' : 'Get AI Suggestions'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Matched Providers */}
      {flags.isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Providers {matches.length > 0 && `(${matches.length})`}</CardTitle>
          </CardHeader>
          <CardContent>
            {aiUnavailable ? (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-3v3m0 5.12V21m0-9.12V3" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900">{t('ai.fallbackTitle')}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {t('ai.fallbackMessage')}
                    <br />
                    {t('ai.tryAgain')}
                  </p>
                </div>
              </div>
            ) : matches.length > 0 ? (
              <>
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.provider_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {match.provider_name?.split(' ').map(name => name[0]).join('').substring(0, 2) || 'P'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{match.provider_name}</h4>
                          <p className="text-sm text-gray-600">{match.provider_email || 'Email not available'}</p>
                          {Array.isArray(match.matching_skills) && match.matching_skills.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {match.matching_skills.slice(0, 3).map((skill, index) => (
                                <span key={`${match.provider_id}-skill-${index}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                              {match.matching_skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{match.matching_skills.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(match.match_score || 0)}% Match
                        </div>
                        <a
                          href={`/app/profiles/${match.provider_id}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`/app/profiles/${match.provider_id}`, '_blank');
                          }}
                        >
                          <User className="w-3 h-3" />
                          View Profile
                        </a>
                        {match.reasoning && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {match.reasoning}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreMatches && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast.info('Load more functionality coming soon');
                      }}
                      className="w-full sm:w-auto"
                    >
                      Show 5 More Providers
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No matching providers found for this project.</p>
                <p className="text-sm text-gray-400 mt-1">Try clicking "Match Providers" to find suitable candidates.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Optimization Suggestions */}
      {flags.isOwner && optimizationData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold mb-4 flex items-center text-blue-900 dark:text-blue-100">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            AI Optimization Suggestions
          </h3>

          <div className="space-y-4">
            {optimizationData.suggestions?.missing_details?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">Missing Details</h4>
                <ul className="text-sm space-y-1">
                  {optimizationData.suggestions.missing_details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {optimizationData.suggestions?.improvements?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-400">Improvements</h4>
                <ul className="text-sm space-y-1">
                  {optimizationData.suggestions.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {optimizationData.suggestions?.engagement_tips?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">Engagement Tips</h4>
                <ul className="text-sm space-y-1">
                  {optimizationData.suggestions.engagement_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {optimizationData.suggestions?.optimization_score && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-400">Optimization Score</h4>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{optimizationData.suggestions.optimization_score}/100</div>
                  <div className="text-sm text-gray-600">Project completeness</div>
                </div>
              </div>
            )}
          </div>
        </div>
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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{bid.service_provider_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${bid.proposed_amount} • {bid.proposed_timeline} days
                      </p>
                    </div>
                    <StatusBadge status={bid.status} />
                  </div>

                  {/* AI Match Score with detailed feedback */}
                  {bid.ai_score && (
                    <div className="my-3">
                      <AIMatchScore
                        score={bid.ai_score}
                        recommendation={bid.ai_feedback?.recommendation}
                        showDetails={true}
                        feedback={bid.ai_feedback}
                        size="small"
                      />
                    </div>
                  )}

                  <p className="text-sm">{bid.cover_letter}</p>

                  {flags.isOwner && flags.isOpen && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleBidDecision(bid.id, "accepted", bid.service_provider)
                        }
                        disabled={bidDecisionLoading}
                      >
                        {t("Accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleBidDecision(bid.id, "shortlisted", bid.service_provider)
                        }
                        disabled={bidDecisionLoading}
                      >
                        {t("Shortlist")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleBidDecision(bid.id, "rejected", bid.service_provider)
                        }
                        disabled={bidDecisionLoading}
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