import React from "react";

const ServiceCard = ({ service }) => {
    return (
        <div className="p-4 border rounded shadow">
            <h3 className="font-bold">{service.name}</h3>
            <p>{service.description}</p>
            {service.packages?.map((pkg) => (
                <div key={pkg.id} className="mt-2 p-2 border rounded bg-gray-50">
                    <p>{pkg.name}</p>
                    <p>Price: ${pkg.price}</p>
                    <p>Duration: {pkg.duration_hours} hours</p>
                </div>
            ))}
        </div>
    );
};

export default ServiceCard;
