import { Customer } from '../Customers';
import { User } from '../Users';
import { ServiceOrderItem } from '../ServiceOrderItems';

export interface ServiceOrder {
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
    other_prague_type: string;
    other_treatment_type: string;
    build_description: string;
    animals: boolean;
    old_people: boolean;
    allergic_people: boolean;
    value: number;
    payment: string;
    warranty: string;
    notes: string;
    created_at: Date;
    created_by: string;
    start_at: Date;
    finish_at: Date;
    updated_by: string;
    updated_at: Date;
    user: User;
    items: ServiceOrderItem[];
}