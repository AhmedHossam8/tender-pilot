import React from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/services.service";
import ServiceCard from "./ServiceCard";

const ServicesList = () => {
    const { data, isLoading, isError, error } = useQuery(
        ["services"],
        serviceService.getAll
    );

    if (isLoading) return <p>Loading services...</p>;
    if (isError) return <p>Error: {error.message}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Services</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.data?.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </div>
        </div>
    );
};

export default ServicesList;
