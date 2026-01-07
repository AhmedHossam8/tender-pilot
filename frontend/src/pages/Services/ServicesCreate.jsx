import React from "react";
import { useServices } from "../../hooks/useServices";

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
    } = useServices();

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

                <h2 className="text-xl font-bold mb-4">Create New Service</h2>

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
                        <label className="block font-semibold">Description</label>
                        <textarea
                            value={serviceData.description}
                            onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
                            className="border p-2 rounded w-full"
                        />
                    </div>

                    <div>
                        <h3 className="font-bold mb-2">Packages</h3>
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
                        {createServiceMutation.isLoading ? "Creating..." : "Create Service"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServicesCreate;
