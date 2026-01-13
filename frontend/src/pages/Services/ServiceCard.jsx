import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/contexts/authStore";

const ServiceCard = ({ service }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const handleClick = () => {
        if (!user) return;

        // Provider → Service details
        if (user.user_type === "provider") {
            navigate(`/app/services/${service.id}`);
            return;
        }

        // Client or Both → Booking page
        if (user.user_type === "client" || user.user_type === "both") {
            navigate(`/app/services/${service.id}/book`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className="cursor-pointer p-4 rounded-xl bg-[#101825] border border-gray-700 shadow-sm hover:shadow-md transition-colors"
        >
            <h2 className="text-xl font-semibold text-white">{service.name}</h2>
            <p className="text-slate-400">{service.description}</p>

            <div className="mt-2 flex gap-2 flex-wrap">
                {service.skills?.map((skill) => (
                    <span
                        key={skill.id}
                        className="px-2 py-1 text-sm bg-blue-600/20 text-blue-400 rounded"
                    >
                        {skill.name}
                    </span>
                ))}
            </div>

            {service.packages?.[0]?.price && (
                <p className="mt-2 font-bold text-white">
                    ${service.packages[0].price}
                </p>
            )}
        </div>
    );
};

export default ServiceCard;
