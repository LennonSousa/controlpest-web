import { useState } from 'react';
import { Button, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../api/api';

import { Product } from '../../Products';
import { AlertMessage, statusModal } from '../AlertMessage';
import { prettifyCurrency } from '../../InputMask/masks';

interface WaitingModalProps {
    show: boolean,
    handleProduct: (product: Product) => void;
    handleCloseSearchModal: () => void;
}

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!'),
});

const SearchProducts: React.FC<WaitingModalProps> = ({ show, handleProduct, handleCloseSearchModal }) => {
    const [productResults, setProductResults] = useState<Product[]>([]);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return (
        <Modal show={show} onHide={handleCloseSearchModal}>
            <Modal.Header closeButton>
                <Modal.Title>Lista de produtos</Modal.Title>
            </Modal.Header>

            <Formik
                initialValues={{
                    title: '',
                }}
                onSubmit={async values => {
                    setTypeMessage("waiting");
                    setMessageShow(true);

                    try {
                        const res = await api.get(`products?title=${values.title}`);

                        setProductResults(res.data);

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
                                <Form.Group controlId="productFormGridName">
                                    <Form.Label>Nome do produto</Form.Label>
                                    <Form.Control type="search"
                                        placeholder="Digite para pesquisar"
                                        autoComplete="off"
                                        onChange={(e) => {
                                            values.title = e.target.value;

                                            handleSubmit();
                                        }}
                                        value={values.title}
                                        isInvalid={!!errors.title && touched.title}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
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
                                        !!values.title.length && <Col>
                                            {
                                                !!productResults.length ? <ListGroup className="mt-3 mb-3">
                                                    {
                                                        productResults.map((product, index) => {
                                                            return <ListGroup.Item
                                                                key={index}
                                                                action
                                                                variant="light"
                                                                onClick={() => handleProduct(product)}
                                                            >
                                                                <Row>
                                                                    <Col>
                                                                        <h6>{product.title}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic">
                                                                            {`${prettifyCurrency(String(product.inventory_amount))} - R$ ${prettifyCurrency(String(product.price))}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic">
                                                                            {product.category.title}
                                                                        </span>
                                                                    </Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                        })
                                                    }
                                                </ListGroup> :
                                                    <AlertMessage status="warning" message="Nenhum produto encontrado!" />
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

export default SearchProducts;