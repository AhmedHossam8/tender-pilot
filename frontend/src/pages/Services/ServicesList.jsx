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

    const { servicesData, isServicesLoading, isServicesError, servicesError } =
        useServices();
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const canCreateService = user?.user_type === "provider" || user?.user_type === "both";

    if (isServicesError) {
        return (
            <div className="p-6 bg-[#101825] min-h-[60vh] flex items-center justify-center">
                <p className="text-red-500 text-center">
                    {servicesError?.message || "Something went wrong"}
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#101825] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-white">{t("services.title")}</h1>

                {canCreateService && (
                    <Button onClick={() => setShowModal(true)} disabled={isServicesLoading}>
                        + {t("services.create")}
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-gray-800">
                {isServicesLoading &&
                    Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonCard key={index} className="bg-white/5 border-white/10" />
                    ))}

                {!isServicesLoading && servicesData?.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            title={t("services.emptyTitle")}
                            titleClassName="text-white"
                            descriptionClassName="text-slate-400"
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
                        <ServiceCard key={service.id} service={service} darkTheme />
                    ))}
            </div>

            {/* Create Modal */}
            {canCreateService && <ServicesCreate isOpen={showModal} setOpen={setShowModal} />}
        </div>
    );
};

export default ServicesList;
