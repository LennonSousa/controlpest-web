import { CustomerType } from '../CustomerTypes';

export interface Customer {
    id: string;
    name: string;
    document: string;
    phone: string;
    cellphone: string;
    contacts: string;
    email: string;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    city: string;
    state: string;
    owner: string;
    notes: string;
    birth: Date;
    created_by: string;
    created_at: Date;
    type: CustomerType;
}