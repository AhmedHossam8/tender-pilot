import React, { useState } from "react";
import { useServices } from "../../hooks/useServices";
import ServiceCard from "./ServiceCard";
import ServicesCreate from "./ServicesCreate";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui";
import { EmptyState } from "@/components/common";
import { useAuthStore } from "@/contexts/authStore";

const ServicesList = () => {
    const [showModal, setShowModal] = useState(false);

    const {
        servicesData,
        isServicesLoading,
        isServicesError,
        servicesError,
    } = useServices();

    const { t } = useTranslation();
    const { user } = useAuthStore();

    const canCreateService =
        user?.user_type === "provider" || user?.user_type === "both";

    if (isServicesError) {
        return (
            <p className="text-red-500 text-center mt-10">
                {servicesError?.message || "Something went wrong"}
            </p>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t("services.title")}</h1>

                {canCreateService && (
                    <Button
                        onClick={() => setShowModal(true)}
                        disabled={isServicesLoading}
                    >
                        + {t("services.create")}
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isServicesLoading &&
                    Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}

                {!isServicesLoading && servicesData?.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            title={t("services.emptyTitle")}
                            {...(canCreateService
                                ? {
                                    description: t("services.emptyDescription"),
                                    actionLabel: t("services.create"),
                                    action: () => setShowModal(true),
                                }
                                : {})}
                        />
                    </div>
                )}

                {!isServicesLoading &&
                    servicesData?.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
            </div>

            {/* Create Modal */}
            {canCreateService && (
                <ServicesCreate
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ServicesList;
