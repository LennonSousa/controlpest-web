import { useEffect, useState } from 'react';
import { Button, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../api/api';

import { Customer } from '../../Customers';
import { AlertMessage, statusModal } from '../AlertMessage';

interface WaitingModalProps {
    show: boolean,
    handleCustomer: (customer: Customer) => void;
    handleCloseSearchModal: () => void;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
});

const SearchCustomers: React.FC<WaitingModalProps> = ({ show, handleCustomer, handleCloseSearchModal }) => {
    const [customerResults, setCustomerResults] = useState<Customer[]>([]);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return (
        <Modal show={show} onHide={handleCloseSearchModal}>
            <Modal.Header closeButton>
                <Modal.Title>Lista de clientes</Modal.Title>
            </Modal.Header>

            <Formik
                initialValues={{
                    name: '',
                }}
                onSubmit={async values => {
                    setTypeMessage("waiting");
                    setMessageShow(true);

                    try {
                        const res = await api.get(`customers?name=${values.name}`);

                        setCustomerResults(res.data);

                        setMessageShow(false);
                    }
                    catch {
                        setTypeMessage("error");

                        setTimeout(() => {
                            setMessageShow(false);
                        }, 4000);
                    }
                }}
                validationSchema={validationSchema}
            >
                {({ handleSubmit, values, errors, touched }) => (
                    <>
                        <Modal.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="customerFormGridName">
                                    <Form.Label>Nome do cliente</Form.Label>
                                    <Form.Control type="search"
                                        placeholder="Digite para pesquisar"
                                        autoComplete="off"
                                        onChange={(e) => {
                                            values.name = e.target.value;

                                            handleSubmit();
                                        }}
                                        value={values.name}
                                        isInvalid={!!errors.name && touched.name}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                </Form.Group>

                                <Row style={{ minHeight: '40px' }}>
                                    <Col className="pt-2">
                                        {messageShow && <AlertMessage status={typeMessage} />}
                                    </Col>
                                </Row>
                            </Form>
                        </Modal.Body>

                        <Modal.Dialog scrollable style={{ marginTop: 0, width: '100%' }}>
                            <Modal.Body style={{ maxHeight: 'calc(100vh - 3.5rem)' }}>
                                <Row style={{ minHeight: '150px' }}>
                                    {
                                        !!values.name.length && <Col>
                                            {
                                                !!customerResults.length ? <ListGroup className="mt-3 mb-3">
                                                    {
                                                        customerResults.map((customer, index) => {
                                                            return <ListGroup.Item
                                                                key={index}
                                                                action
                                                                variant="light"
                                                                onClick={() => handleCustomer(customer)}
                                                            >
                                                                <Row>
                                                                    <Col>
                                                                        <h6>{customer.name}</h6>
                                                                    </Col>
                                                                </Row>
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic">
                                                                            {`${customer.document} - ${customer.city}/${customer.state}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                        })
                                                    }
                                                </ListGroup> :
                                                    <AlertMessage status="warning" message="Nenhum cliente encontrado!" />
                                            }
                                        </Col>
                                    }
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseSearchModal}>Cancelar</Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </>
                )}
            </Formik>
        </Modal>
    )
}

export default SearchCustomers;