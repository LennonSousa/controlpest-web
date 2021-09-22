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

export function calcSubTotal(listItems: EstimateItem[]) {
    let newSubTotal = 0;

    listItems.forEach(item => {
        const totalItem = Number(item.amount) * Number(item.price);

        newSubTotal = Number(newSubTotal) + Number(totalItem);
    });

    return newSubTotal;
}

export function calcFinalTotal(subTotal: number, isDiscountPercent: boolean, discountValue: number, isIncreasePercent: boolean, increaseValue: number) {
    // Discount and increase.
    let finalPrice = subTotal;

    //console.log('subTotal: ', subTotal, ' discountpercent: ', isDiscountPercent, ' discount: ', discountValue, ' increase percent: ', isIncreasePercent, ' increase: ', increaseValue);

    if (isDiscountPercent) finalPrice = subTotal - (subTotal * discountValue / 100);
    else finalPrice = subTotal - discountValue;

    if (increaseValue > 0) {
        if (isIncreasePercent) finalPrice = finalPrice + (finalPrice * increaseValue / 100);
        else finalPrice = finalPrice + increaseValue;
    }

    //console.log('finalPrice: ', finalPrice);

    return finalPrice;
}