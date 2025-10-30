const API_URL = 'http://localhost:3000/api';

/**
 * Fetch current admin user's permissions from backend
 */
export const fetchAdminPermissions = async (): Promise<Record<string, boolean>> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return {};
        }

        const response = await fetch(`${API_URL}/admin/permissions/my-permissions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch permissions:', response.status);
            return {};
        }

        const data = await response.json();
        return data.permissions || {};
    } catch (error) {
        console.error('Failed to fetch admin permissions:', error);
        return {};
    }
};
