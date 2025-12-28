import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useProposal } from "../../hooks/useProposals";
import { proposalService } from "../../services/proposal.service";
import { useAuthStore } from "@/contexts/authStore";
import { LoadingSpinner, EmptyState } from "@/components/common";
import ProposalCard from "@/components/proposals/ProposalCard";
import SectionEditor from "@/components/proposals/SectionEditor";
import CompliancePanel from "@/components/proposals/CompliancePanel";
import WorkflowStepper from "@/components/proposals/WorkflowStepper";
import StatusActions from "@/components/proposals/StatusActions";
import ChecklistPanel from "@/components/proposals/ChecklistPanel";


const ProposalDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const { data: proposal, isLoading, error } = useProposal(id);
    const [checklist, setChecklist] = useState(null);

    const actionMutation = useMutation({
        mutationFn: async ({ action, sectionId }) => {
            switch (action) {
                case "submit_for_review": return proposalService.submitForReview(id);
                case "approve": return proposalService.approveProposal(id);
                case "reject": return proposalService.rejectProposal(id);
                case "submit": return proposalService.submitProposal(id);
                case "generate_document": return proposalService.generateDocument(id);
                case "generate_feedback": return proposalService.generateFeedback(id);
                case "generate_checklist": return proposalService.generateChecklist(id);
                case "regenerate_section": return proposalService.regenerateSection(id, sectionId);
                default: throw new Error("Unknown action");
            }
        },
        onSuccess: (res, variables) => {
            if (variables.action === "generate_checklist") setChecklist(res.data);
            queryClient.invalidateQueries(["proposal", id]);
            queryClient.invalidateQueries(["proposals"]);
        },
    });

    if (isLoading) return <LoadingSpinner text={t("common.loading")} />;
    if (error) return <EmptyState title={t("proposal.loadError")} />;
    if (!proposal) return <EmptyState title={t("proposal.noProposals")} />;

    return (
        <div className="space-y-6">
            <ProposalCard proposal={proposal}>
                <WorkflowStepper status={proposal.status} />
            </ProposalCard>

            <div className="space-y-4">
                {(proposal.sections || []).map(section => (
                    <SectionEditor
                        key={section.id}
                        section={section}
                        onRegenerate={() =>
                            actionMutation.mutate({ action: "regenerate_section", sectionId: section.id })
                        }
                    />
                ))}
            </div>

            {checklist && <ChecklistPanel checklist={checklist} />}
            <CompliancePanel proposal={proposal} />

            <StatusActions
                userRole={user?.role}
                proposal={proposal}
                onAction={(action) => actionMutation.mutate({ action })}
                onPreview={() => {
                    proposalService.previewProposal(id).then(res => {
                        const blob = new Blob([res.data], { type: "application/pdf" });
                        window.open(URL.createObjectURL(blob), "_blank");
                    });
                }}
            />
        </div>
    );
};

export default ProposalDetail;
