import { useState } from 'react';
import { Row, Col, InputGroup, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface Service {
    id: string;
    name: string;
    price: number;
    order: number;
}

interface ServicesProps {
    service: Service;
    servicesList: Service[];
    handleServicesList(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    price: Yup.string().notRequired(),
});

const Services: React.FC<ServicesProps> = ({ service, servicesList, handleServicesList }) => {
    const [showModalEditService, setShowModalEditService] = useState(false);

    const handleCloseModalEditService = () => { setShowModalEditService(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditService = () => setShowModalEditService(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setServiceMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setServiceMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`services/${service.id}`);

            const list = servicesList.filter(item => { return item.id !== service.id });

            list.forEach(async (service, index) => {
                try {
                    await api.put(`services/${service.id}`, {
                        name: service.name,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save services order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditService();

            handleServicesList();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setServiceMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete type");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{service.name}</span></Col>

                <Col><span>{`R$ ${prettifyCurrency(String(service.price))}`}</span></Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditService}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditService} onHide={handleCloseModalEditService}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar serviço</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            name: service.name,
                            price: prettifyCurrency(String(service.price)),
                        }
                    }
                    onSubmit={async values => {
                        setServiceMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (servicesList) {
                                await api.put(`services/${service.id}`, {
                                    name: values.name,
                                    price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                    order: service.order
                                });

                                await handleServicesList();

                                setServiceMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditService();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit service.');
                            console.log(err);

                            setServiceMessage("error");

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
                                <Form.Group controlId="serviceFormGridName">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.name}
                                        name="name"
                                        isInvalid={!!errors.name && touched.name}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.name.length}/100 caracteres.`}</Form.Text>
                                </Form.Group>

                                <Row className="mb-3">
                                    <Form.Group as={Col} sm={4} controlId="serviceFormGridPrice">
                                        <Form.Label>Preço</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                onChange={(e) => {
                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                }}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                }}
                                                value={values.price}
                                                name="price"
                                                isInvalid={!!errors.price && touched.price}
                                                aria-label="Valor do item"
                                                aria-describedby="btnGroupPrice"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                    </Form.Group>
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditService}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteLine}
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
    )
}

export default Services;