import { Badge, CloseButton } from 'react-bootstrap';

import { ServiceOrder } from '../ServiceOrders';
import { BuildType } from '../BuildTypes';

export interface ServiceBuildType {
    id: string;
    service?: ServiceOrder;
    build: BuildType;
}

interface ServiceBuildTypesProps {
    serviceBuildType: ServiceBuildType;
    handleServiceBuildTypesList(serviceBuildType: ServiceBuildType): void;
}

export function addServiceBuild(buildType: BuildType, index: number, serviceBuildTypesList: ServiceBuildType[]) {
    const newItem: ServiceBuildType = {
        id: `@${index}`,
        build: buildType,
    }

    const updatedListItems = [...serviceBuildTypesList, newItem];

    return updatedListItems;
}

const ServiceBuildTypes: React.FC<ServiceBuildTypesProps> = ({ serviceBuildType, handleServiceBuildTypesList }) => {
    async function deleteItem() {
        handleServiceBuildTypesList(serviceBuildType);
    }

    return (
        <Badge className="me-2" bg="success">
            {serviceBuildType.build.name} <CloseButton onClick={deleteItem} />
        </Badge>
    )
}

export default ServiceBuildTypes;