import { useEffect, useState } from 'react';
import { Row, Col, InputGroup, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaBars, FaPause, FaPlay } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Category } from '../Categories';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface Product {
    id: string;
    title: string;
    description: string;
    code: string;
    price: number;
    discount: boolean;
    discount_price: number;
    inventory_amount: number;
    inventory_min: number;
    paused: boolean;
    order: number;
    category: Category;
}

interface ProductsProps {
    product: Product;
    listProducts: Product[];
    categories: Category[];
    handleListProducts(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(100, 'Deve conter no máximo 100 caracteres!'),
    description: Yup.string().notRequired(),
    code: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inventory_min: Yup.string().notRequired(),
    category: Yup.string().required('Obrigatório!'),
});

const Products: React.FC<ProductsProps> = ({ product, listProducts, categories, handleListProducts }) => {
    const [showModalEditProduct, setShowModalEditProduct] = useState(false);

    const handleCloseModalEditProduct = () => { setShowModalEditProduct(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditProduct = () => setShowModalEditProduct(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setProductMessage] = useState<statusModal>("waiting");

    const [itemPausing, setItemPausing] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setProductMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`products/${product.id}`);

            const list = listProducts.filter(item => { return item.id !== product.id });

            list.forEach(async (product, index) => {
                try {
                    await api.put(`products/${product.id}`, {
                        title: product.title,
                        order: index,
                        category: product.category.id,
                    });
                }
                catch (err) {
                    console.log('error to save products order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditProduct();

            handleListProducts();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setProductMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete product");
            console.log(err);
        }
    }

    const togglePauseItem = async () => {
        setItemPausing(true);

        try {
            await api.put(`products/${product.id}`, {
                title: product.title,
                paused: !product.paused,
                order: product.order,
                category: product.category.id,
            });

            await handleListProducts();
        }
        catch (err) {
            console.log("Error to pause product.");
            console.log(err);
        }

        setItemPausing(false);
    }

    return (
        <ListGroup.Item variant={!product.paused ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{product.title}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseItem}
                        title="Pausar produto"
                    >
                        {
                            itemPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : !product.paused ? (<><FaPause /> Pausar</>) : (<><FaPlay /> Pausado</>)
                        }
                    </Button>
                </Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditProduct}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditProduct} onHide={handleCloseModalEditProduct}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar produto</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            title: product.title,
                            description: product.description,
                            code: product.code,
                            price: prettifyCurrency(String(product.price)),
                            inventory_amount: prettifyCurrency(String(product.inventory_amount)),
                            inventory_min: prettifyCurrency(String(product.inventory_min)),
                            category: product.category.id,
                        }
                    }
                    onSubmit={async values => {
                        setProductMessage("waiting");
                        setMessageShow(true);

                        try {
                            await api.put(`products/${product.id}`, {
                                title: values.title,
                                description: values.description,
                                code: values.code,
                                price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                inventory_amount: Number(values.inventory_amount.replaceAll(".", "").replaceAll(",", ".")),
                                inventory_min: Number(values.inventory_min.replaceAll(".", "").replaceAll(",", ".")),
                                order: product.order,
                                category: values.category,
                            });

                            await handleListProducts();

                            setProductMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseModalEditProduct();
                            }, 2000);
                        }
                        catch (err) {
                            console.log('error edit product.');
                            console.log(err);

                            setProductMessage("error");

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
                                <Form.Group controlId="productFormGridTitle">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome do produto"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.title}
                                        name="title"
                                        isInvalid={!!errors.title && touched.title}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.title.length}/100 caracteres.`}</Form.Text>
                                </Form.Group>

                                <Row className="mb-3">
                                    <Form.Group as={Col} controlId="productFormGridDescription">
                                        <Form.Label>Descrição</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            style={{ resize: 'none' }}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.description}
                                            name="description"
                                        />
                                    </Form.Group>
                                </Row>

                                <Row className="mb-3">
                                    <Form.Group as={Col} sm={3} controlId="productFormGridCode">
                                        <Form.Label>Código</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Opcional"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.code}
                                            name="code"
                                            isInvalid={!!errors.code && touched.code}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.code && errors.code}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={3} controlId="productFormGridPrice">
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

                                    <Form.Group as={Col} sm={3} controlId="productFormGridInventoryAmount">
                                        <Form.Label>Estoque</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupInventory">UN</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                value={prettifyCurrency(values.inventory_amount)}
                                                name="inventory_amount"
                                                readOnly
                                                aria-label="Estoque do item"
                                                aria-describedby="btnGroupInventory"
                                            />
                                        </InputGroup>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={3} controlId="productFormGridInventoryMin">
                                        <Form.Label>Estoque</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text id="btnGroupMin">UN</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                onChange={(e) => {
                                                    setFieldValue('inventory_min', prettifyCurrency(e.target.value));
                                                }}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    setFieldValue('inventory_min', prettifyCurrency(e.target.value));
                                                }}
                                                value={prettifyCurrency(values.inventory_min)}
                                                name="inventory_min"
                                                isInvalid={!!errors.inventory_min && touched.inventory_min}
                                                aria-label="Mínimo do item"
                                                aria-describedby="btnGroupMin"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.inventory_min && errors.inventory_min}</Form.Control.Feedback>
                                    </Form.Group>
                                </Row>

                                <Form.Group controlId="productFormGridCategory">
                                    <Form.Label>Categoria</Form.Label>
                                    <Form.Control
                                        as="select"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.category}
                                        name="category"
                                        isInvalid={!!errors.category && touched.category}
                                    >
                                        <option hidden>...</option>
                                        {
                                            categories.map((category, index) => {
                                                return <option key={index} value={category.id}>{category.title}</option>
                                            })
                                        }
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">{touched.category && errors.category}</Form.Control.Feedback>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditProduct}>Cancelar</Button>
                                            <Button
                                                title="Excluir produto"
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

export default Products;