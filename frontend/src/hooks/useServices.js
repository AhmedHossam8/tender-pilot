import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../services/services.service";

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

    const createServiceMutation = useMutation({
        mutationFn: serviceService.create,
        onSuccess: async (res) => {
            const serviceId = res.data.id;

            for (const pkg of packages) {
                await serviceService.createPackage({
                    ...pkg,
                    service: serviceId,
                });
            }

            queryClient.invalidateQueries({ queryKey: ["services"] });
            setServiceData({ name: "", description: "" });
            setPackages([]);
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
        if (!serviceData.name) return alert("Service name is required");

        createServiceMutation.mutate(serviceData, {
            onSuccess: () => onSuccessClose?.(),
        });
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
    };
};
