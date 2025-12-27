import React from "react";
import { useParams } from "react-router-dom";
import { useProposal } from "../hooks/useProposals";
import { useTranslation } from "react-i18next";

import { LoadingSpinner, EmptyState } from "@/components/common";
import { Button } from "@/components/ui";

import ProposalCard from "../components/proposals/ProposalCard";
import CompliancePanel from "../components/proposals/CompliancePanel";
import WorkflowStepper from "../components/proposals/WorkflowStepper";
import ChecklistPanel from "../components/proposals/ChecklistPanel";

const ProposalPreview = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const { data: proposal, isLoading, error } = useProposal(id);

    if (isLoading) return <LoadingSpinner text={t("common.loading")} />;
    if (error || !proposal) return <EmptyState title={t("proposal.loadError")} />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            {/* Header and workflow */}
            <ProposalCard proposal={proposal}>
                <WorkflowStepper status={proposal.status} readOnly />
            </ProposalCard>

            {/* Sections */}
            {proposal.sections?.map((section) => (
                <div key={section.id} className="space-y-2">
                    <h3 className="font-semibold">{section.title}</h3>
                    <p>{section.content}</p>
                </div>
            ))}

            {/* Checklist and compliance */}
            <ChecklistPanel checklist={proposal.checklist} readOnly />
            <CompliancePanel proposal={proposal} readOnly />

            {/* Print button */}
            <div className="flex justify-end">
                <Button onClick={() => window.print()}>{t("proposal.print", "Print Proposal")}</Button>
            </div>
        </div>
    );
};

export default ProposalPreview;
