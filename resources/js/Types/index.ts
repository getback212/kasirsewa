export type RoleName = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE';

export interface User {
    id: number;
    company_id: number;
    outlet_id: number;
    name: string;
    email: string;
    role: RoleName;
    is_active: boolean;
}

export interface Company {
    id: number;
    name: string;
    registration_number?: string;
    is_active: boolean;
}

export interface Outlet {
    id: number;
    company_id: number;
    code: string;
    display_pair_token?: string;
    name: string;
    phone?: string;
    address?: string;
    is_active: boolean;
}

export interface PageProps {
    auth: {
        user: User;
        roles: RoleName[];
        permissions: string[];
    };
    currentOutlet?: Outlet;
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}
