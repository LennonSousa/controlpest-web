import { Badge, CloseButton } from 'react-bootstrap';

import { ServiceOrder } from '../ServiceOrders';
import { TreatmentType } from '../TreatmentTypes';

export interface ServiceTreatmentType {
    id: string;
    service?: ServiceOrder;
    treatment: TreatmentType;
}

interface ServiceTreatmentTypesProps {
    serviceTreatmentType: ServiceTreatmentType;
    handleServiceTreatmentTypesList(serviceTreatmentType: ServiceTreatmentType): void;
}

export function addServiceTreatment(treatmentType: TreatmentType, index: number, serviceTreatmentTypesList: ServiceTreatmentType[]) {
    const newItem: ServiceTreatmentType = {
        id: `@${index}`,
        treatment: treatmentType,
    }

    const updatedListItems = [...serviceTreatmentTypesList, newItem];

    return updatedListItems;
}

const ServiceTreatmentTypes: React.FC<ServiceTreatmentTypesProps> = ({ serviceTreatmentType, handleServiceTreatmentTypesList }) => {
    async function deleteItem() {
        handleServiceTreatmentTypesList(serviceTreatmentType);
    }

    return (
        <Badge className="me-2" bg="success">
            {serviceTreatmentType.treatment.name} <CloseButton onClick={deleteItem} />
        </Badge>
    )
}

export default ServiceTreatmentTypes;