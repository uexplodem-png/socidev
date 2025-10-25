import React, { useState, useEffect } from 'react';
import { PlatformConfig, ServiceConfig } from '../types';
import { realApiService } from '../services/realApi';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, AlertCircle, Loader, X } from 'lucide-react';

interface ExpandedPlatforms {
    [key: string]: boolean;
}

interface FormData {
    name: string;
    nameEn?: string;
    nameTr?: string;
    description?: string;
    descriptionEn?: string;
    descriptionTr?: string;
    icon?: string;
    isActive?: boolean;
}

interface ServiceFormData {
    name: string;
    nameEn?: string;
    nameTr?: string;
    description?: string;
    descriptionEn?: string;
    descriptionTr?: string;
    pricePerUnit: number;
    minOrder: number;
    maxOrder: number;
    inputFieldName: string;
    sampleUrl?: string;
    urlPattern?: string;
    urlLabel?: string;
    features: string[];
    featuresEn?: string[];
    featuresTr?: string[];
    commissionRate?: number;
    isActive?: boolean;
}

const PlatformsServices: React.FC = () => {
    const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
    const [services, setServices] = useState<ServiceConfig[]>([]);
    const [expandedPlatforms, setExpandedPlatforms] = useState<ExpandedPlatforms>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [serviceError, setServiceError] = useState<string | null>(null);
    const [activeServiceTab, setActiveServiceTab] = useState<string>('basic');
    const [draggedPlatformId, setDraggedPlatformId] = useState<string | null>(null);
    const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);

    // Modal states
    const [showPlatformModal, setShowPlatformModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<PlatformConfig | null>(null);
    const [editingService, setEditingService] = useState<ServiceConfig | null>(null);
    const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

    // Form states
    const [platformForm, setPlatformForm] = useState<FormData>({
        name: '',
        nameEn: '',
        nameTr: '',
        description: '',
        descriptionEn: '',
        descriptionTr: '',
        icon: '',
        isActive: true,
    });

    const [serviceForm, setServiceForm] = useState<ServiceFormData>({
        name: '',
        nameEn: '',
        nameTr: '',
        description: '',
        descriptionEn: '',
        descriptionTr: '',
        pricePerUnit: 0,
        minOrder: 1,
        maxOrder: 1000,
        inputFieldName: '',
        sampleUrl: '',
        urlPattern: '',
        urlLabel: '',
        features: [],
        featuresEn: [],
        featuresTr: [],
        commissionRate: 10,
        isActive: true,
    });

    const [newFeatureEn, setNewFeatureEn] = useState('');
    const [newFeatureTr, setNewFeatureTr] = useState('');

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const platformsResponse = await realApiService.getPlatforms({ limit: 100 });
            const servicesResponse = await realApiService.getServices({ limit: 100 });

            const sortedPlatforms = (platformsResponse.data || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            const sortedServices = (servicesResponse.data || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            setPlatforms(sortedPlatforms);
            setServices(sortedServices);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('Error fetching platforms and services:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePlatform = (platformId: string) => {
        setExpandedPlatforms((prev) => ({
            ...prev,
            [platformId]: !prev[platformId],
        }));
    };

    // Drag and drop handlers for platforms
    const handlePlatformDragStart = (e: React.DragEvent, platformId: string) => {
        setDraggedPlatformId(platformId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handlePlatformDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handlePlatformDrop = async (e: React.DragEvent, targetPlatformId: string) => {
        e.preventDefault();
        if (!draggedPlatformId || draggedPlatformId === targetPlatformId) {
            setDraggedPlatformId(null);
            return;
        }

        try {
            const draggedPlatform = platforms.find(p => p.id === draggedPlatformId);
            const targetPlatform = platforms.find(p => p.id === targetPlatformId);

            if (!draggedPlatform || !targetPlatform) return;

            // Swap displayOrder
            const draggedIndex = platforms.findIndex(p => p.id === draggedPlatformId);
            const targetIndex = platforms.findIndex(p => p.id === targetPlatformId);

            const newPlatforms = [...platforms];
            [newPlatforms[draggedIndex].displayOrder, newPlatforms[targetIndex].displayOrder] =
                [newPlatforms[targetIndex].displayOrder, newPlatforms[draggedIndex].displayOrder];

            // Reorder array
            if (draggedIndex < targetIndex) {
                newPlatforms.splice(draggedIndex, 1);
                newPlatforms.splice(targetIndex - 1, 0, draggedPlatform);
            } else {
                newPlatforms.splice(draggedIndex, 1);
                newPlatforms.splice(targetIndex, 0, draggedPlatform);
            }

            setPlatforms(newPlatforms);

            // Update display order on server
            await Promise.all(
                newPlatforms.map((p, idx) =>
                    realApiService.updatePlatform(p.id, { ...p, displayOrder: idx })
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reorder platforms');
        } finally {
            setDraggedPlatformId(null);
        }
    };

    // Drag and drop handlers for services
    const handleServiceDragStart = (e: React.DragEvent, serviceId: string) => {
        setDraggedServiceId(serviceId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleServiceDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleServiceDrop = async (e: React.DragEvent, targetServiceId: string) => {
        e.preventDefault();
        if (!draggedServiceId || draggedServiceId === targetServiceId) {
            setDraggedServiceId(null);
            return;
        }

        try {
            const draggedService = services.find(s => s.id === draggedServiceId);
            const targetService = services.find(s => s.id === targetServiceId);

            if (!draggedService || !targetService) return;

            // Only allow reordering within same platform
            if (draggedService.platformId !== targetService.platformId) {
                setDraggedServiceId(null);
                return;
            }

            const draggedIndex = services.findIndex(s => s.id === draggedServiceId);
            const targetIndex = services.findIndex(s => s.id === targetServiceId);

            const newServices = [...services];
            [newServices[draggedIndex].displayOrder, newServices[targetIndex].displayOrder] =
                [newServices[targetIndex].displayOrder, newServices[draggedIndex].displayOrder];

            // Reorder array
            if (draggedIndex < targetIndex) {
                newServices.splice(draggedIndex, 1);
                newServices.splice(targetIndex - 1, 0, draggedService);
            } else {
                newServices.splice(draggedIndex, 1);
                newServices.splice(targetIndex, 0, draggedService);
            }

            setServices(newServices);

            // Update display order on server
            await Promise.all(
                newServices
                    .filter(s => s.platformId === draggedService.platformId)
                    .map((s, idx) =>
                        realApiService.updateService(s.id, { ...s, displayOrder: idx })
                    )
            );
        } catch (err) {
            setServiceError(err instanceof Error ? err.message : 'Failed to reorder services');
        } finally {
            setDraggedServiceId(null);
        }
    };

    // Platform handlers
    const handleAddPlatform = () => {
        setEditingPlatform(null);
        setPlatformForm({
            name: '',
            nameEn: '',
            nameTr: '',
            description: '',
            descriptionEn: '',
            descriptionTr: '',
            icon: '',
            isActive: true,
        });
        setShowPlatformModal(true);
    };

    const handleEditPlatform = (platform: PlatformConfig) => {
        setEditingPlatform(platform);
        setPlatformForm({
            name: platform.name,
            nameEn: platform.nameEn || '',
            nameTr: platform.nameTr || '',
            description: platform.description || '',
            descriptionEn: platform.descriptionEn || '',
            descriptionTr: platform.descriptionTr || '',
            icon: platform.icon || '',
            isActive: platform.isActive ?? true,
        });
        setShowPlatformModal(true);
    };

    const handleSavePlatform = async () => {
        try {
            setError(null);

            if (!platformForm.name.trim()) {
                setError('Platform name is required');
                return;
            }

            if (editingPlatform) {
                await realApiService.updatePlatform(editingPlatform.id, platformForm);
            } else {
                await realApiService.createPlatform(platformForm);
            }

            await fetchData();
            setShowPlatformModal(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save platform';
            setError(message);
            console.error('Error saving platform:', err);
        }
    };

    const handleDeletePlatform = async (platformId: string) => {
        if (!window.confirm('Are you sure you want to delete this platform? All associated services will be deleted.')) {
            return;
        }

        try {
            setError(null);
            await realApiService.deletePlatform(platformId);
            await fetchData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete platform';
            setError(message);
            console.error('Error deleting platform:', err);
        }
    };

    // Service handlers
    const handleAddService = (platformId: string) => {
        setSelectedPlatformId(platformId);
        setEditingService(null);
        setServiceForm({
            name: '',
            nameEn: '',
            nameTr: '',
            description: '',
            descriptionEn: '',
            descriptionTr: '',
            pricePerUnit: 0,
            minOrder: 1,
            maxOrder: 1000,
            inputFieldName: '',
            sampleUrl: '',
            urlPattern: '',
            urlLabel: '',
            features: [],
            featuresEn: [],
            featuresTr: [],
            commissionRate: 10,
            isActive: true,
        });
        setNewFeatureEn('');
        setNewFeatureTr('');
        setShowServiceModal(true);
    };

    const handleEditService = (service: ServiceConfig) => {
        setSelectedPlatformId(service.platformId);
        setEditingService(service);
        setServiceForm({
            name: service.name,
            nameEn: service.nameEn || '',
            nameTr: service.nameTr || '',
            description: service.description || '',
            descriptionEn: service.descriptionEn || '',
            descriptionTr: service.descriptionTr || '',
            pricePerUnit: service.pricePerUnit,
            minOrder: service.minOrder,
            maxOrder: service.maxOrder,
            inputFieldName: service.inputFieldName,
            sampleUrl: service.sampleUrl || '',
            urlPattern: service.urlPattern || '',
            urlLabel: service.urlLabel || '',
            features: service.features || [],
            featuresEn: service.featuresEn || [],
            featuresTr: service.featuresTr || [],
            commissionRate: service.commissionRate || 10,
            isActive: service.isActive ?? true,
        });
        setNewFeatureEn('');
        setNewFeatureTr('');
        setShowServiceModal(true);
    };

    const handleAddFeature = () => {
        if (newFeatureEn.trim() || newFeatureTr.trim()) {
            setServiceForm((prev) => ({
                ...prev,
                featuresEn: [...(prev.featuresEn || []), newFeatureEn || newFeatureTr],
                featuresTr: [...(prev.featuresTr || []), newFeatureTr || newFeatureEn],
            }));
            setNewFeatureEn('');
            setNewFeatureTr('');
        }
    };

    const handleRemoveFeature = (index: number) => {
        setServiceForm((prev) => ({
            ...prev,
            featuresEn: (prev.featuresEn || []).filter((_, i) => i !== index),
            featuresTr: (prev.featuresTr || []).filter((_, i) => i !== index),
        }));
    };

    const handleSaveService = async () => {
        try {
            setServiceError(null);

            if (!serviceForm.name.trim()) {
                setServiceError('Service name is required');
                return;
            }

            if (serviceForm.minOrder > serviceForm.maxOrder) {
                setServiceError('Min order cannot be greater than max order');
                return;
            }

            if (!selectedPlatformId) {
                setServiceError('Platform selection is required');
                return;
            }

            const payload = {
                ...serviceForm,
                features: serviceForm.featuresEn || [],
                platformId: selectedPlatformId,
            };

            if (editingService) {
                await realApiService.updateService(editingService.id, payload);
            } else {
                await realApiService.createService(payload);
            }

            await fetchData();
            setShowServiceModal(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save service';
            setServiceError(message);
            console.error('Error saving service:', err);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!window.confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            setServiceError(null);
            await realApiService.deleteService(serviceId);
            await fetchData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete service';
            setServiceError(message);
            console.error('Error deleting service:', err);
        }
    };

    const getPlatformServices = (platformId: string) => {
        return services.filter((service) => service.platformId === platformId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">Loading platforms and services...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Platforms & Services
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage social media platforms and their associated services
                        </p>
                    </div>
                    <Button
                        onClick={handleAddPlatform}
                        variant="primary"
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Platform
                    </Button>
                </div>

                {/* Error messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-300">Platform Error</h3>
                            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {serviceError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-300">Service Error</h3>
                            <p className="text-red-700 dark:text-red-400 text-sm">{serviceError}</p>
                        </div>
                    </div>
                )}

                {/* Platforms list */}
                <div className="space-y-4">
                    {platforms.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                            <p className="text-gray-500 dark:text-gray-400">No platforms found. Create one to get started.</p>
                        </div>
                    ) : (
                        platforms.map((platform) => (
                            <div
                                key={platform.id}
                                draggable
                                onDragStart={(e) => handlePlatformDragStart(e, platform.id)}
                                onDragOver={handlePlatformDragOver}
                                onDrop={(e) => handlePlatformDrop(e, platform.id)}
                                className={`bg-white dark:bg-slate-800 rounded-lg border-2 overflow-hidden transition-all ${draggedPlatformId === platform.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 opacity-50'
                                    : 'border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                {/* Platform header */}
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                                    onClick={() => togglePlatform(platform.id)}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-grab active:cursor-grabbing">
                                            {expandedPlatforms[platform.id] ? (
                                                <ChevronDown className="w-5 h-5" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5" />
                                            )}
                                        </button>
                                        {platform.icon && (
                                            <span className="text-2xl">{platform.icon}</span>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {platform.name}
                                            </h3>
                                            {platform.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {platform.description}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${platform.isActive
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                            }`}>
                                            {platform.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditPlatform(platform);
                                            }}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePlatform(platform.id);
                                            }}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Services list */}
                                {expandedPlatforms[platform.id] && (
                                    <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                                        <div className="p-4 space-y-3">
                                            {getPlatformServices(platform.id).length === 0 ? (
                                                <div className="text-center py-6">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                        No services for this platform
                                                    </p>
                                                    <Button
                                                        onClick={() => handleAddService(platform.id)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-2"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Service
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        {getPlatformServices(platform.id).map((service) => (
                                                            <div
                                                                key={service.id}
                                                                draggable
                                                                onDragStart={(e) => handleServiceDragStart(e, service.id)}
                                                                onDragOver={handleServiceDragOver}
                                                                onDrop={(e) => handleServiceDrop(e, service.id)}
                                                                className={`flex items-center justify-between p-3 rounded border-2 transition-all ${draggedServiceId === service.id
                                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 opacity-50'
                                                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                                                    }`}
                                                            >
                                                                <div className="flex-1 cursor-grab active:cursor-grabbing">
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {service.name}
                                                                    </p>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 grid grid-cols-2 gap-2 w-fit">
                                                                        <span>Price: ${service.pricePerUnit.toFixed(2)}</span>
                                                                        <span>Min: {service.minOrder}</span>
                                                                        <span>Max: {service.maxOrder}</span>
                                                                        <span>Commission: {service.commissionRate || 10}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${service.isActive
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                                        }`}>
                                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleEditService(service)}
                                                                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteService(service.id)}
                                                                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        onClick={() => handleAddService(platform.id)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="w-full gap-2"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Service
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Platform Modal */}
            <Modal
                isOpen={showPlatformModal}
                onClose={() => setShowPlatformModal(false)}
                title={editingPlatform ? 'Edit Platform' : 'Add New Platform'}
            >
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Platform Name (Default) *
                            </label>
                            <input
                                type="text"
                                value={platformForm.name}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="e.g., Instagram"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                English Name
                            </label>
                            <input
                                type="text"
                                value={platformForm.nameEn || ''}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, nameEn: e.target.value }))
                                }
                                placeholder="English name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Turkish Name (Türkçe)
                            </label>
                            <input
                                type="text"
                                value={platformForm.nameTr || ''}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, nameTr: e.target.value }))
                                }
                                placeholder="Turkish name"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description (Default)
                            </label>
                            <textarea
                                value={platformForm.description}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Describe this platform..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                English Description
                            </label>
                            <textarea
                                value={platformForm.descriptionEn || ''}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, descriptionEn: e.target.value }))
                                }
                                placeholder="English description..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Turkish Description
                            </label>
                            <textarea
                                value={platformForm.descriptionTr || ''}
                                onChange={(e) =>
                                    setPlatformForm((prev) => ({ ...prev, descriptionTr: e.target.value }))
                                }
                                placeholder="Turkish description..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Icon (Emoji)
                        </label>
                        <input
                            type="text"
                            value={platformForm.icon}
                            onChange={(e) =>
                                setPlatformForm((prev) => ({ ...prev, icon: e.target.value }))
                            }
                            placeholder="e.g., 📱"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={platformForm.isActive ?? true}
                            onChange={(e) =>
                                setPlatformForm((prev) => ({ ...prev, isActive: e.target.checked }))
                            }
                            className="rounded border-gray-300 dark:border-slate-600"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSavePlatform}
                            variant="primary"
                            className="flex-1"
                        >
                            {editingPlatform ? 'Update' : 'Create'} Platform
                        </Button>
                        <Button
                            onClick={() => setShowPlatformModal(false)}
                            variant="secondary"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Service Modal */}
            <Modal
                isOpen={showServiceModal}
                onClose={() => {
                    setShowServiceModal(false);
                    setActiveServiceTab('basic');
                }}
                title={editingService ? 'Edit Service' : 'Add New Service'}
                size="lg"
            >
                <div className="h-full flex flex-col">
                    {/* Tabs Section - Scrollable */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <Tabs
                            tabs={[
                                { id: 'basic', label: 'Basic Info' },
                                { id: 'pricing', label: 'Pricing & Rules' },
                                { id: 'content', label: 'Multilingual' },
                                { id: 'features', label: 'Features' },
                            ]}
                            activeTab={activeServiceTab}
                            onTabChange={setActiveServiceTab}
                        >
                            {/* Basic Info Tab */}
                            {activeServiceTab === 'basic' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Service Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.name}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, name: e.target.value }))
                                                }
                                                placeholder="e.g., Instagram Followers"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Input Field Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.inputFieldName}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, inputFieldName: e.target.value }))
                                                }
                                                placeholder="e.g., Instagram Username"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description (Default)
                                        </label>
                                        <textarea
                                            value={serviceForm.description || ''}
                                            onChange={(e) =>
                                                setServiceForm((prev) => ({ ...prev, description: e.target.value }))
                                            }
                                            placeholder="Describe this service..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sample URL
                                            </label>
                                            <input
                                                type="url"
                                                value={serviceForm.sampleUrl}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, sampleUrl: e.target.value }))
                                                }
                                                placeholder="e.g., https://instagram.com/example"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Target URL Pattern
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.urlPattern}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, urlPattern: e.target.value }))
                                                }
                                                placeholder="e.g., https://instagram.com/p"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Target URL Label
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.urlLabel}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, urlLabel: e.target.value }))
                                                }
                                                placeholder="e.g., Instagram Profile URL"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="serviceActive"
                                            checked={serviceForm.isActive ?? true}
                                            onChange={(e) =>
                                                setServiceForm((prev) => ({ ...prev, isActive: e.target.checked }))
                                            }
                                            className="rounded border-gray-300 dark:border-slate-600"
                                        />
                                        <label htmlFor="serviceActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Active
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Pricing & Rules Tab */}
                            {activeServiceTab === 'pricing' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Price Per Unit *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={serviceForm.pricePerUnit}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({
                                                        ...prev,
                                                        pricePerUnit: parseFloat(e.target.value) || 0,
                                                    }))
                                                }
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Commission Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={serviceForm.commissionRate}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({
                                                        ...prev,
                                                        commissionRate: parseFloat(e.target.value) || 0,
                                                    }))
                                                }
                                                placeholder="10"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Min Order *
                                            </label>
                                            <input
                                                type="number"
                                                value={serviceForm.minOrder}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({
                                                        ...prev,
                                                        minOrder: parseInt(e.target.value) || 1,
                                                    }))
                                                }
                                                placeholder="1"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Max Order *
                                            </label>
                                            <input
                                                type="number"
                                                value={serviceForm.maxOrder}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({
                                                        ...prev,
                                                        maxOrder: parseInt(e.target.value) || 1000,
                                                    }))
                                                }
                                                placeholder="1000"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Multilingual Tab */}
                            {activeServiceTab === 'content' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                English Name
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.nameEn || ''}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, nameEn: e.target.value }))
                                                }
                                                placeholder="English name"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Turkish Name
                                            </label>
                                            <input
                                                type="text"
                                                value={serviceForm.nameTr || ''}
                                                onChange={(e) =>
                                                    setServiceForm((prev) => ({ ...prev, nameTr: e.target.value }))
                                                }
                                                placeholder="Turkish name"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            English Description
                                        </label>
                                        <textarea
                                            value={serviceForm.descriptionEn || ''}
                                            onChange={(e) =>
                                                setServiceForm((prev) => ({ ...prev, descriptionEn: e.target.value }))
                                            }
                                            placeholder="English description..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Turkish Description
                                        </label>
                                        <textarea
                                            value={serviceForm.descriptionTr || ''}
                                            onChange={(e) =>
                                                setServiceForm((prev) => ({ ...prev, descriptionTr: e.target.value }))
                                            }
                                            placeholder="Turkish description..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Features Tab */}
                            {activeServiceTab === 'features' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={newFeatureEn}
                                            onChange={(e) => setNewFeatureEn(e.target.value)}
                                            placeholder="Feature in English"
                                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            value={newFeatureTr}
                                            onChange={(e) => setNewFeatureTr(e.target.value)}
                                            placeholder="Feature in Turkish"
                                            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddFeature}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Feature
                                    </Button>

                                    {(serviceForm.featuresEn || []).length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Added Features:</h4>
                                            {(serviceForm.featuresEn || []).map((featureEn, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                                    <div className="flex-1 text-sm">
                                                        <p className="font-medium text-gray-700 dark:text-gray-300">{featureEn}</p>
                                                        {serviceForm.featuresTr?.[idx] && (
                                                            <p className="text-gray-600 dark:text-gray-400 text-xs">{serviceForm.featuresTr[idx]}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveFeature(idx)}
                                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Tabs>
                    </div>

                    {/* Action Buttons - Fixed at bottom, not scrollable */}
                    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pt-4 mt-4">
                        <div className="flex gap-3">
                            <Button
                                onClick={handleSaveService}
                                variant="primary"
                                className="flex-1"
                            >
                                {editingService ? 'Update' : 'Create'} Service
                            </Button>
                            <Button
                                onClick={() => setShowServiceModal(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PlatformsServices;
