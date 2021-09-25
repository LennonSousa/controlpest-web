import { useEffect, useState } from 'react';
import { Row, Col, Form, InputGroup, ListGroup, Modal, Button } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { ServiceOrder } from '../ServiceOrders';
import { Service } from '../Services';
import { prettifyCurrency } from '../InputMask/masks';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface ServiceOrderItem {
    id: string;
    name: string;
    details: string;
    amount: number;
    order: number;
    estimate?: ServiceOrder;
}

interface ServiceOrderItemsProps {
    serviceOrderItem: ServiceOrderItem;
    servicesList: Service[],
    handleListItems: (updatedNewItem?: ServiceOrderItem, toDelete?: boolean) => void;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    details: Yup.string().notRequired().max(50, 'Deve conter no máximo 50 caracteres!'),
    amount: Yup.string().required('Obrigatório'),
});

const ServiceOrderItems: React.FC<ServiceOrderItemsProps> = ({ serviceOrderItem, handleListItems }) => {
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            handleListItems(serviceOrderItem, true);

            handleCloseModalEditType();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete estimate item");
            console.log(err);
        }
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col className="col-2" sm={2}><span>{prettifyCurrency(Number(serviceOrderItem.amount).toFixed(2))}</span></Col>
                    <Col className="col-5 text-cut" sm={4}><span>{serviceOrderItem.name}</span></Col>
                    <Col className="col-5 text-cut" sm={5}><span>{serviceOrderItem.details}</span></Col>

                    <Col className="text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={handleShowModalEditType}>
                            <FaPencilAlt />
                        </Button>
                    </Col>
                </Row>

                <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edtiar item</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={
                            {
                                name: serviceOrderItem.name,
                                details: serviceOrderItem.details,
                                amount: prettifyCurrency(Number(serviceOrderItem.amount).toFixed(2)),
                            }
                        }
                        onSubmit={async values => {
                            setTypeMessage("waiting");
                            setMessageShow(true);

                            try {
                                const updatedNewItem: ServiceOrderItem = {
                                    ...serviceOrderItem,
                                    name: values.name,
                                    details: values.details,
                                    amount: Number(values.amount.replaceAll(".", "").replaceAll(",", ".")),
                                }

                                handleListItems(updatedNewItem);

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 1000);
                            }
                            catch (err) {
                                console.log('error edit estimate item.');
                                console.log(err);

                                setTypeMessage("error");

                                setTimeout(() => {
                                    setMessageShow(false);
                                }, 4000);
                            }
                        }}
                        validationSchema={validationSchema}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                            <Form onSubmit={handleSubmit}>
                                <Modal.Body>
                                    <Form.Group controlId="serviceOrderItemFormGridName">
                                        <Form.Label>Serviço</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Nome do serviço"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.name}
                                            name="name"
                                            isInvalid={!!errors.name && touched.name}
                                            readOnly
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group controlId="serviceOrderItemFormGridDetails">
                                        <Form.Label>Detalhes</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Detalhes do item (opcional)"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.details}
                                            name="details"
                                            isInvalid={!!errors.details && touched.details}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.details && errors.details}</Form.Control.Feedback>
                                        <Form.Text className="text-muted text-right">{`${values.details.length}/50 caracteres.`}</Form.Text>
                                    </Form.Group>

                                    <Row className="mb-3">
                                        <Form.Group as={Col} sm={4} controlId="serviceOrderItemFormGridAmount">
                                            <Form.Label>Quantidade</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text id="btnGroupAmount">Un</InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    onChange={(e) => {
                                                        setFieldValue('amount', prettifyCurrency(e.target.value));
                                                    }}
                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                        setFieldValue('amount', prettifyCurrency(e.target.value));
                                                    }}
                                                    value={values.amount}
                                                    name="amount"
                                                    isInvalid={!!errors.amount && touched.amount}
                                                    aria-label="Valor do item"
                                                    aria-describedby="btnGroupAmount"
                                                />
                                            </InputGroup>
                                            <Form.Control.Feedback type="invalid">{touched.amount && errors.amount}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Row>
                                </Modal.Body>
                                <Modal.Footer>
                                    {
                                        messageShow ? <AlertMessage status={typeMessage} /> :
                                            <>
                                                <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                                <Button
                                                    title="Excluir item"
                                                    variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                    onClick={deleteItem}
                                                >
                                                    {
                                                        iconDelete && "Excluir"
                                                    }

                                                    {
                                                        iconDeleteConfirm && "Confirmar"
                                                    }
                                                </Button>
                                                <Button variant="success" type="submit">Salvar</Button>
                                            </>

                                    }
                                </Modal.Footer>
                            </Form>
                        )}
                    </Formik>
                </Modal>
            </ListGroup.Item>
        </>
    )
}

export default ServiceOrderItems;