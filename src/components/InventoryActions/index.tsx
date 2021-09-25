import { useState } from 'react';
import { InputGroup, Row, Col, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Product } from '../Products';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface InventoryAction {
    id: string;
    type: "in" | "out";
    description: string;
    price: number;
    amount: number;
    inventory_amount: number;
    created_at: Date;
    created_by: string;
    product: Product;
}

interface InventoryActionsProps {
    inventoryAction: InventoryAction;
    inventoryActionsList: InventoryAction[];
    handleInventoryActionsList(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    type: Yup.string().required('Obrigatório!'),
    description: Yup.string().notRequired().max(50, 'Deve conter no máximo 50 caracteres!'),
    price: Yup.string().required('Obrigatório!'),
    amount: Yup.string().required('Obrigatório!'),
    inventory_amount: Yup.string().required('Obrigatório!'),
});

const InventoryActions: React.FC<InventoryActionsProps> = ({ inventoryAction, inventoryActionsList, handleInventoryActionsList }) => {
    const [showModalEditItem, setShowModalEditItem] = useState(false);

    const handleCloseModalEditItem = () => { setShowModalEditItem(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditItem = () => setShowModalEditItem(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`inventory/actions/${inventoryAction.id}`);

            handleCloseModalEditItem();

            handleInventoryActionsList();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete inventory actions.");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{inventoryAction.type === "in" ? "Entrada" : "Saída"}</span></Col>

                <Col><span>{prettifyCurrency(Number(inventoryAction.amount).toFixed(2))}</span></Col>
                <Col><span>{`R$ ${prettifyCurrency(Number(inventoryAction.price).toFixed(2))}`}</span></Col>
                <Col><span>{prettifyCurrency(Number(inventoryAction.inventory_amount).toFixed(2))}</span></Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditItem}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditItem} onHide={handleCloseModalEditItem}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar item</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            type: inventoryAction.type,
                            description: inventoryAction.description,
                            price: prettifyCurrency(Number(inventoryAction.price).toFixed(2)),
                            amount: prettifyCurrency(Number(inventoryAction.amount).toFixed(2)),
                            inventory_amount: prettifyCurrency(Number(inventoryAction.inventory_amount).toFixed(2)),
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (inventoryActionsList) {
                                await api.put(`inventory/actions/${inventoryAction.id}`, {
                                    type: values.type,
                                    description: inventoryAction.description,
                                    price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                    amount: Number(values.amount.replaceAll(".", "").replaceAll(",", ".")),
                                    inventory_amount: Number(values.inventory_amount.replaceAll(".", "").replaceAll(",", ".")),
                                });

                                await handleInventoryActionsList();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditItem();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit inventory actions.');
                            console.log(err);

                            setTypeMessage("error");

                            setTimeout(() => {
                                setMessageShow(false);
                            }, 4000);
                        }
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Form.Group controlId="inventoryActionFormGridType">
                                    <Form.Label>Tipo de movimentação</Form.Label>
                                    <Form.Control
                                        as="select"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.type}
                                        name="type"
                                        isInvalid={!!errors.type && touched.type}
                                    >
                                        <option hidden>...</option>
                                        <option value="in">Entrada</option>
                                        <option value="out">Saída</option>
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">{touched.type && errors.type}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group controlId="inventoryActionFormGridDescription">
                                    <Form.Label>Descrição</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Descrição da movimentação"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.description}
                                        name="description"
                                        isInvalid={!!errors.description && touched.description}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.description.length}/50 caracteres.`}</Form.Text>
                                </Form.Group>

                                <Row className="mb-3">
                                    <Form.Group as={Col} sm={4} controlId="inventoryActionFormGridPrice">
                                        <Form.Label>Custo médio</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                value={values.price}
                                                name="price"
                                                aria-label="Valor do item"
                                                aria-describedby="btnGroupPrice"
                                                readOnly
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={4} controlId="inventoryActionFormGridAmount">
                                        <Form.Label>Quantidade</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupAmount">Un</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                value={values.amount}
                                                name="amount"
                                                aria-label="Valor do item"
                                                aria-describedby="btnGroupAmount"
                                                readOnly
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={4} controlId="inventoryActionFormGridPrice">
                                        <Form.Label>Quantidade em estoque</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupPrice">Un</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                value={values.inventory_amount}
                                                name="inventory_amount"
                                                aria-label="Valor do item"
                                                aria-describedby="btnGroupPrice"
                                                readOnly
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditItem}>Cancelar</Button>
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
    )
}

export default InventoryActions;