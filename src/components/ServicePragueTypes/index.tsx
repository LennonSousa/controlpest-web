import { Badge, CloseButton } from 'react-bootstrap';

import { ServiceOrder } from '../ServiceOrders';
import { PragueType } from '../PragueTypes';

export interface ServicePragueType {
    id: string;
    service?: ServiceOrder;
    prague: PragueType;
}

interface ServicePragueTypesProps {
    servicePragueType: ServicePragueType;
    handleServicePragueTypesList(servicePragueType: ServicePragueType): void;
}

export function addServicePrague(pragueType: PragueType, index: number, servicePragueTypesList: ServicePragueType[]) {
    const newItem: ServicePragueType = {
        id: `@${index}`,
        prague: pragueType,
    }

    console.log('New item: ', newItem);

    const updatedListItems = [...servicePragueTypesList, newItem];

    return updatedListItems;
}

const ServicePragueTypes: React.FC<ServicePragueTypesProps> = ({ servicePragueType, handleServicePragueTypesList }) => {
    async function deleteItem() {
        handleServicePragueTypesList(servicePragueType);
    }

    return (
        <Badge className="me-2" bg="success">
            {servicePragueType.prague.name} <CloseButton onClick={deleteItem} />
        </Badge>
    )
}

export default ServicePragueTypes;