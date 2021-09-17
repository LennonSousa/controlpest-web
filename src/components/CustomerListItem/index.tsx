import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaFileAlt, FaMapSigns, FaPencilAlt, FaFileContract, FaExclamationCircle } from 'react-icons/fa'

import { Customer } from '../Customers';

import styles from './styles.module.css';

interface CustomerItemProps {
    customer: Customer;
}

const CustomerItem: React.FC<CustomerItemProps> = ({ customer }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/customers/edit/${customer.id}`);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col sm={10}>
                        <Link href={`/customers/details/${customer.id}`}>
                            <a>
                                <h5 className={styles.itemText}>{customer.name}</h5>
                            </a>
                        </Link>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {!!customer.document ? customer.document : <br />}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {!!customer.address ? customer.address : <br />}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <ButtonGroup size="sm" className="col-12">
                        <Button
                            variant="success"
                            title="Lista todos os orçamentos desse cliente."
                            onClick={() => handleRoute(`/projects?customer=${customer.id}`)}
                        >
                            <FaFileAlt />
                        </Button>
                        <Button
                            variant="success"
                            title="Lista todos as ordens de serviço desse cliente."
                            onClick={() => handleRoute(`/properties?customer=${customer.id}`)}
                        >
                            <FaMapSigns />
                        </Button>
                        <Button
                            variant="success"
                            title="Editar cliente."
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

export default CustomerItem;