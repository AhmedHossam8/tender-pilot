import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/services.service";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Button,
    Badge,
    SkeletonCard,
    SkeletonText,
} from "@/components/ui";

const ServiceDetailPage = () => {
    const { id } = useParams();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["service", id],
        queryFn: () => serviceService.getById(id),
    });

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <SkeletonText lines={2} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) return <p>Error: {error.message}</p>;

    const service = data?.data;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground">{service.description}</p>

            <div>
                <h2 className="text-2xl font-semibold mb-2">Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.packages?.map((pkg) => (
                        <Card key={pkg.id}>
                            <CardHeader>
                                <CardTitle>{pkg.name}</CardTitle>
                                <CardDescription>{pkg.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>
                                    <strong>Price:</strong> ${pkg.price}
                                </p>
                                {pkg.duration && (
                                    <p>
                                        <strong>Duration:</strong> {pkg.duration} days
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button>Book Now</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailPage;
