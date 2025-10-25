import { fetchApi } from '../api';

export interface Service {
  id: string;
  platformId: string;
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
  features?: string[];
  featuresEn?: string[];
  featuresTr?: string[];
  urlPattern?: string;
  commissionRate: number;
  isActive: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Platform {
  id: string;
  name: string;
  nameEn?: string;
  nameTr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionTr?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
}

export interface PlatformsResponse {
  platforms: Platform[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServicesResponse {
  services: Service[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all platforms
 */
export async function getPlatforms(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  } = {}
): Promise<PlatformsResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const endpoint = `/platforms${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return fetchApi<PlatformsResponse>(endpoint);
}

/**
 * Get platform by ID with services
 */
export async function getPlatformById(platformId: string): Promise<Platform> {
  return fetchApi<Platform>(`/platforms/${platformId}`);
}

/**
 * Get services by platform ID
 */
export async function getServicesByPlatform(platformId: string): Promise<ServicesResponse> {
  return fetchApi<ServicesResponse>(`/platforms/${platformId}/services`);
}

/**
 * Get all services
 */
export async function getServices(
  params: {
    page?: number;
    limit?: number;
    platformId?: string;
    search?: string;
    isActive?: boolean;
  } = {}
): Promise<ServicesResponse> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.platformId) queryParams.append('platformId', params.platformId);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const endpoint = `/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return fetchApi<ServicesResponse>(endpoint);
}

/**
 * Get service by ID
 */
export async function getServiceById(serviceId: string): Promise<Service> {
  return fetchApi<Service>(`/services/${serviceId}`);
}
