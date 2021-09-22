import { Customer } from '../Customers';
import { User } from '../Users';
import { EstimateStatus } from '../EstimateStatus';
import { EstimateItem } from '../EstimateItems';

export interface Estimate {
    id: string;
    customer: Customer;
    same_address: boolean;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    city: string;
    state: string;
    discount_percent: boolean;
    discount: number;
    increase_percent: boolean;
    increase: number;
    payment: string;
    created_by: string;
    created_at: Date;
    expire_at: Date;
    finish_at: Date;
    notes: string;
    user: User;
    status: EstimateStatus;
    items: EstimateItem[];
}