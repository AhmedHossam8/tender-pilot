import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../services/services.service";
import { aiService } from "../services/ai.service";

export const useServices = () => {
    const queryClient = useQueryClient();

    // --- Fetch all services (NORMALIZED) ---
    const {
        data: servicesData,
        isLoading: isServicesLoading,
        isError: isServicesError,
        error: servicesError,
    } = useQuery({
        queryKey: ["services"],
        queryFn: async () => {
            const res = await serviceService.getAll();
            // ✅ supports paginated & non-paginated responses
            return res.data.results ?? res.data;
        },
    });

    // --- Create service ---
    const [serviceData, setServiceData] = useState({
        name: "",
        description: "",
    });
    const [packages, setPackages] = useState([]);
    const [aiSuggestedPackages, setAiSuggestedPackages] = useState([]);

    const createServiceMutation = useMutation({
        mutationFn: async ({ serviceData, packages }) => {
            //Create service
            const serviceRes = await serviceService.create(serviceData);
            const serviceId = serviceRes.data.id;

            //Create packages using nested routing
            await Promise.all(
                packages.map(pkg =>
                    serviceService.createPackage(serviceId, pkg)
                )
            );

            return serviceRes.data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            setServiceData({ name: "", description: "" });
            setPackages([]);
            setAiSuggestedPackages([]);
        },
    });

    // --- AI optimization ---
    const optimizeServiceMutation = useMutation({
        mutationFn: async () => {
            return aiService.optimizeService({
                name: serviceData.name,
                description: serviceData.description,
                existing_packages: packages.map((pkg) => ({
                    name: pkg.name,
                    description: pkg.description || "",
                    price: Number(pkg.price) || 0,
                    duration_hours: Number(pkg.duration_hours) || 1,
                })),
            });
        },
        onSuccess: (res) => {
            const data = res?.data ?? res;
            if (data?.optimized_description) {
                setServiceData((prev) => ({
                    ...prev,
                    description: data.optimized_description,
                }));
            }
            if (Array.isArray(data?.suggested_packages)) {
                setAiSuggestedPackages(data.suggested_packages);
            }
        },
    });

    // --- Package management ---
    const addPackage = () =>
        setPackages([...packages, { name: "", price: 0, duration_hours: 1 }]);

    const removePackage = (index) =>
        setPackages(packages.filter((_, i) => i !== index));

    const handlePackageChange = (index, field, value) => {
        const newPackages = [...packages];
        newPackages[index][field] = value;
        setPackages(newPackages);
    };

    // --- Submit service + packages ---
    const handleSubmit = (e, onSuccessClose) => {
        e.preventDefault();
        if (!serviceData.name) return;

        createServiceMutation.mutate(
            { serviceData, packages },
            {
                onSuccess: () => {
                    onSuccessClose?.();
                },
            }
        );
    };

    const applyAiSuggestedPackages = () => {
        if (!aiSuggestedPackages.length) return;
        setPackages(
            aiSuggestedPackages.map((pkg) => ({
                name: pkg.name,
                description: pkg.description || "",
                price: pkg.price ?? 0,
                duration_hours: pkg.duration_hours ?? 1,
            }))
        );
        setAiSuggestedPackages([]);
    };

    return {
        // Services fetch
        servicesData,
        isServicesLoading,
        isServicesError,
        servicesError,

        // Service create
        serviceData,
        setServiceData,
        packages,
        addPackage,
        removePackage,
        handlePackageChange,
        handleSubmit,
        createServiceMutation,

        // AI optimization
        aiSuggestedPackages,
        applyAiSuggestedPackages,
        optimizeServiceMutation,
    };
};
