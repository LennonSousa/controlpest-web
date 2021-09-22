import { useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { Service } from '../../Services';
import { ServiceOrderItem } from '../';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage';
import { prettifyCurrency } from '../../InputMask/masks';

interface NewServiceOrderItemProps {
    show: boolean,
    servicesList: Service[],
    estimateItemsList: ServiceOrderItem[];
    handleNewItemToList: (newItem: ServiceOrderItem) => void;
    handleCloseNewServiceOrderItemModal: () => void;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    details: Yup.string().notRequired().max(50, 'Deve conter no máximo 50 caracteres!'),
    amount: Yup.string().required('Obrigatório!'),
});

const NewServiceOrderItem: React.FC<NewServiceOrderItemProps> = (
    {
        show,
        servicesList,
        handleNewItemToList,
        estimateItemsList,
        handleCloseNewServiceOrderItemModal
    }
) => {
    // New items.
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return (
        <Modal show={show} onHide={handleCloseNewServiceOrderItemModal}>
            <Modal.Header closeButton>
                <Modal.Title>Adicionar serviço</Modal.Title>
            </Modal.Header>
            <Formik
                initialValues={
                    {
                        name: '',
                        details: '',
                        amount: '0,00',
                    }
                }
                onSubmit={async values => {
                    try {
                        const foundService = servicesList.find(item => { return item.id === values.name });

                        if (foundService) {
                            setTypeMessage("waiting");
                            setMessageShow(true);

                            const newItem: ServiceOrderItem = {
                                id: `@${estimateItemsList.length}`,
                                name: foundService.name,
                                details: values.details,
                                amount: Number(values.amount.replaceAll(".", "").replaceAll(",", ".")),
                                order: estimateItemsList.length,
                            }

                            handleNewItemToList(newItem);

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseNewServiceOrderItemModal();
                            }, 1000);
                        };


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
                            <Form.Group controlId="estimateItemFormGridName">
                                <Form.Label>Serviço</Form.Label>
                                <Form.Control
                                    as="select"
                                    onChange={e => {
                                        handleChange(e);

                                        const foundService = servicesList.find(item => { return item.id === e.target.value });

                                        if (foundService) setFieldValue('price', prettifyCurrency(String(foundService.price)));
                                    }}
                                    onBlur={handleBlur}
                                    value={values.name}
                                    name="name"
                                    isInvalid={!!errors.name && touched.name}
                                >
                                    <option hidden>...</option>
                                    {
                                        servicesList.map((service, index) => {
                                            return <option key={index} value={service.id}>{`${service.name} - R$ ${prettifyCurrency(String(service.price))}`}</option>
                                        })
                                    }
                                </Form.Control>
                                <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group controlId="estimateItemFormGridDetails">
                                <Form.Label>Detalhes</Form.Label>
                                <Form.Control type="text"
                                    placeholder="Detalhes do item (opcional)."
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
                                <Form.Group as={Col} sm={4} controlId="estimateItemFormGridAmount">
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
                                        <Button variant="secondary" onClick={handleCloseNewServiceOrderItemModal}>Cancelar</Button>
                                        <Button variant="success" type="submit">Salvar</Button>
                                    </>

                            }
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal>
    )
}

export default NewServiceOrderItem;