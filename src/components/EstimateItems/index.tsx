import { useEffect, useState } from 'react';
import { Row, Col, Form, InputGroup, ListGroup, Modal, Button } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { Estimate } from '../Estimates';
import { Service } from '../Services';
import { prettifyCurrency } from '../InputMask/masks';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface EstimateItem {
    id: string;
    name: string;
    details: string;
    amount: number;
    price: number;
    order: number;
    estimate?: Estimate;
}

interface EstimateItemsProps {
    estimateItem: EstimateItem;
    servicesList: Service[],
    handleListItems: (updatedNewItem?: EstimateItem, toDelete?: boolean) => void;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    details: Yup.string().notRequired().max(50, 'Deve conter no máximo 50 caracteres!'),
    amount: Yup.string().required('Obrigatório'),
    price: Yup.string().required('Obrigatório'),
});

const EstimateItems: React.FC<EstimateItemsProps> = ({ estimateItem, handleListItems }) => {
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const [totalPrice, setTotalPrice] = useState(0);

    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    useEffect(() => {
        handleTotalPrice(estimateItem.price, estimateItem.amount);
    }, [estimateItem]);

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            handleListItems(estimateItem, true);

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

    function handleTotalPrice(price: number, amount: number) {
        const total = Number(price) * Number(amount);

        setTotalPrice(total);
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col className="col-3" sm={1}><span>{prettifyCurrency(Number(estimateItem.amount).toFixed(2))}</span></Col>
                    <Col sm={3} className="col-4 text-cut"><span>{estimateItem.name}</span></Col>
                    <Col sm={3} className="col-5 text-cut"><span>{estimateItem.details}</span></Col>
                    <Col className="col-4" sm={2}><span>{`R$ ${prettifyCurrency(Number(estimateItem.price).toFixed(2))}`}</span></Col>
                    <Col className="col-4" sm={2}><span>{`R$ ${prettifyCurrency(totalPrice.toFixed(2))}`}</span></Col>

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
                                name: estimateItem.name,
                                details: estimateItem.details,
                                amount: prettifyCurrency(Number(estimateItem.amount).toFixed(2)),
                                price: prettifyCurrency(Number(estimateItem.price).toFixed(2)),
                            }
                        }
                        onSubmit={async values => {
                            setTypeMessage("waiting");
                            setMessageShow(true);

                            try {
                                const updatedNewItem: EstimateItem = {
                                    ...estimateItem,
                                    name: values.name,
                                    details: values.details,
                                    price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
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
                                    <Form.Group controlId="estimateItemFormGridName">
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

                                    <Form.Group controlId="estimateItemFormGridDetails">
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
                                        <Form.Group as={Col} sm={4} controlId="estimateItemFormGridPrice">
                                            <Form.Label>Preço</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    onChange={(e) => {
                                                        setFieldValue('price', prettifyCurrency(e.target.value));

                                                        const price = Number(prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", "."));
                                                        const amount = Number(values.amount.replaceAll(".", "").replaceAll(",", "."));

                                                        handleTotalPrice(price, amount);
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

                                        <Form.Group as={Col} sm={4} controlId="estimateItemFormGridAmount">
                                            <Form.Label>Quantidade</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text id="btnGroupAmount">Un</InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    onChange={(e) => {
                                                        setFieldValue('amount', prettifyCurrency(e.target.value));

                                                        const price = Number(values.price.replaceAll(".", "").replaceAll(",", "."));
                                                        const amount = Number(prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", "."));

                                                        handleTotalPrice(price, amount);
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

                                        <Form.Group as={Col} sm={4} controlId="estimateItemFormGridTotal">
                                            <Form.Label>Total</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text id="btnGroupTotal">R$</InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    value={prettifyCurrency(totalPrice.toFixed(2))}
                                                    name="total"
                                                    readOnly
                                                    aria-label="Total do item"
                                                    aria-describedby="btnGroupTotal"
                                                />
                                            </InputGroup>
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

export default EstimateItems;