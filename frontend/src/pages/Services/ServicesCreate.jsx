import React from "react";
import { useServices } from "../../hooks/useServices";
import { useTranslation } from "react-i18next";

const ServicesCreate = ({ isOpen, onClose }) => {
    const {
        serviceData,
        setServiceData,
        packages,
        addPackage,
        removePackage,
        handlePackageChange,
        handleSubmit,
        createServiceMutation,
        aiSuggestedPackages,
        applyAiSuggestedPackages,
        optimizeServiceMutation,
    } = useServices();

    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50">
            <div className="bg-white rounded p-6 w-full max-w-lg shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-red-600 font-bold text-xl"
                >
                    &times;
                </button>

                <h2 className="text-xl font-bold mb-4">{t("services.create")}</h2>

                <form onSubmit={(e) => handleSubmit(e, onClose)} className="space-y-4">
                    <div>
                        <label className="block font-semibold">Service Name</label>
                        <input
                            type="text"
                            value={serviceData.name}
                            onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
                    </div>

                    <div>
                        <label className="block font-semibold">{t("project.description")}</label>
                        <textarea
                            value={serviceData.description}
                            onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
                        <button
                            type="button"
                            onClick={() => optimizeServiceMutation.mutate()}
                            disabled={
                                optimizeServiceMutation.isLoading ||
                                !serviceData.description.trim()
                            }
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                            {optimizeServiceMutation.isLoading
                                ? t("services.aiImprovingDescription")
                                : t("services.aiImproveDescription")}
                        </button>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">{t("services.packages")}</h3>
                            {aiSuggestedPackages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={applyAiSuggestedPackages}
                                    className="text-xs text-green-600 hover:text-green-800"
                                >
                                    {t("services.applyAiPackages")}
                                </button>
                            )}
                        </div>
                        {aiSuggestedPackages.length > 0 && (
                            <div className="mb-3 rounded border border-dashed border-green-400 bg-green-50 p-2 text-xs text-green-800 space-y-1">
                                <p className="font-semibold">
                                    {t("services.aiSuggestedPackages")}
                                </p>
                                {aiSuggestedPackages.map((pkg, index) => (
                                    <p key={index}>
                                        <span className="font-medium">{pkg.name}</span>
                                        {" — "}${pkg.price} · {pkg.duration_hours}h
                                    </p>
                                ))}
                            </div>
                        )}
                        {packages.map((pkg, i) => (
                            <div key={i} className="border p-2 rounded mb-2 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Package Name"
                                    value={pkg.name}
                                    onChange={(e) => handlePackageChange(i, "name", e.target.value)}
                                    className="border p-1 rounded w-full"
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={pkg.price}
                                    onChange={(e) => handlePackageChange(i, "price", e.target.value)}
                                    className="border p-1 rounded w-full"
                                />
                                <input
                                    type="number"
                                    placeholder="Duration (hours)"
                                    value={pkg.duration_hours}
                                    onChange={(e) => handlePackageChange(i, "duration_hours", e.target.value)}
                                    className="border p-1 rounded w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePackage(i)}
                                    className="text-red-600"
                                >
                                    Remove Package
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addPackage}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Add Package
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded"
                        disabled={createServiceMutation.isLoading}
                    >
                        {createServiceMutation.isLoading
                            ? t("common.loading")
                            : t("services.create")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServicesCreate;
