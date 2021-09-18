import { Category } from '../Categories';

export interface Product {
    id: string;
    title: string;
    description: string;
    code: string;
    price: number;
    discount: boolean;
    discount_price: number;
    inventory_amount: number;
    inventory_min: number;
    paused: boolean;
    order: number;
    category: Category;
}