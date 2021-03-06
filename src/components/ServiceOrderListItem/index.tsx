import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { format } from 'date-fns';

import { ServiceOrder } from '../ServiceOrders';

import styles from './styles.module.css';

interface ServiceOrderItemProps {
    serviceOrder: ServiceOrder;
}

const ServiceOrderItem: React.FC<ServiceOrderItemProps> = ({ serviceOrder }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/services/orders/edit/${serviceOrder.id}`);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col sm={10}>
                        <Link href={`/services/orders/details/${serviceOrder.id}`}>
                            <a>
                                <h5 className={styles.itemText}>{serviceOrder.customer.name}</h5>
                            </a>
                        </Link>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {serviceOrder.same_address ? `${serviceOrder.customer.city} - ${serviceOrder.customer.state}` :
                                `${serviceOrder.city} - ${serviceOrder.state}`}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {`Atualizado em: ${format(new Date(serviceOrder.updated_at), 'dd/MM/yyyy')}`}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <ButtonGroup size="sm" className="col-12">
                        <Button
                            variant="success"
                            title="Editar ordem de servi??o."
                            onClick={goToEdit}
                        >
                            <FaPencilAlt />
                        </Button>
                    </ButtonGroup>
                </Row>
            </div>
        </Col >
    )
}

export default ServiceOrderItem;