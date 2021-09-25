import { useEffect, useState } from 'react';
import { Accordion, Row, Col, InputGroup, ListGroup, Modal, Form, Button, Placeholder, Spinner, Table } from 'react-bootstrap';
import { FaPencilAlt, FaExchangeAlt, FaPause, FaPlay, FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

import api from '../../api/api';
import { Category } from '../Categories';
import { InventoryAction } from '../InventoryActions';
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
    inventory_actions: InventoryAction[];
}

interface ProductsProps {
    product: Product;
    listProducts: Product[];
    categories: Category[];
    isInventory?: boolean;
    handleListProducts?: () => Promise<void>;
    handleInventoryActionsList?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(100, 'Deve conter no máximo 100 caracteres!'),
    description: Yup.string().notRequired(),
    code: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inventory_min: Yup.string().notRequired(),
    category: Yup.string().required('Obrigatório!'),
});

const inventoryActionValidationSchema = Yup.object().shape({
    type: Yup.string().required('Obrigatório!'),
    description: Yup.string().notRequired().max(50, 'Deve conter no máximo 50 caracteres!'),
    price: Yup.string().required('Obrigatório!'),
    amount: Yup.string().required('Obrigatório!'),
    inventory_amount: Yup.string().required('Obrigatório!'),
});

const Products: React.FC<ProductsProps> = (
    {
        product,
        listProducts,
        categories,
        handleListProducts,
        handleInventoryActionsList,
        isInventory = false
    }
) => {
    const [productData, setProductData] = useState<Product>();

    const [loadingData, setLoadingData] = useState(true);

    const [showModalEditProduct, setShowModalEditProduct] = useState(false);

    const handleCloseModalEditProduct = () => {
        setShowModalEditProduct(false);
        setIconDeleteConfirm(false);
        setIconDelete(true);
    }
    const handleShowModalEditProduct = () => setShowModalEditProduct(true);

    const [messageShow, setMessageShow] = useState(false);
    const [productTypeMessage, setProductMessage] = useState<statusModal>("waiting");

    const [inventoryTypeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [itemPausing, setItemPausing] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const [showModalNewItem, setShowModalNewItem] = useState(false);

    const handleCloseModalNewItem = () => setShowModalNewItem(false);
    const handleShowModalNewItem = () => setShowModalNewItem(true);

    useEffect(() => {
        if (showModalEditProduct || showModalNewItem) {
            setLoadingData(true);

            api.get(`products/${product.id}`).then(res => {
                setProductData(res.data);

                setLoadingData(false);
            }).catch(err => {
                console.log('Error to get product details, ', err);
            });
        }
    }, [showModalEditProduct, showModalNewItem, product.id]);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setProductMessage("waiting");
        setMessageShow(true);

        if (productData) {
            try {
                await api.delete(`products/${product.id}`);

                const list = listProducts.filter(item => { return item.id !== product.id });

                list.forEach(async (product, index) => {
                    try {
                        await api.put(`products/${product.id}`, {
                            title: product.title,
                            order: index,
                            category: productData.category.id,
                        });
                    }
                    catch (err) {
                        console.log('error to save products order after deleting.');
                        console.log(err)
                    }
                });

                handleCloseModalEditProduct();

                handleListProducts && handleListProducts();
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
    }

    const togglePauseItem = async () => {
        if (productData) {
            setItemPausing(true);

            try {
                await api.put(`products/${product.id}`, {
                    title: product.title,
                    paused: !product.paused,
                    order: product.order,
                    category: productData.category.id,
                });

                handleListProducts && await handleListProducts();
            }
            catch (err) {
                console.log("Error to pause product.");
                console.log(err);
            }

            setItemPausing(false);
        }
    }

    return (
        <ListGroup.Item variant={isInventory ? `${Number(product.inventory_amount) < Number(product.inventory_min) ? 'danger' : 'light'}` :
            `${!product.paused ? "light" : "danger"}`}>
            <Row className="align-items-center">
                <Col>
                    <span>{product.title}</span>
                </Col>

                <Col>
                    <span>{`R$ ${prettifyCurrency(Number(product.price).toFixed(2))}`}
                    </span>
                </Col>

                <Col>
                    <span>{`Un ${prettifyCurrency(Number(product.inventory_min).toFixed(2))}`}</span>
                </Col>

                {
                    isInventory ? <Col>
                        <strong>{`Un ${prettifyCurrency(Number(product.inventory_amount).toFixed(2))}`}</strong>
                    </Col> :
                        <Col>
                            <span>{`Un ${prettifyCurrency(Number(product.inventory_amount).toFixed(2))}`}</span>
                        </Col>
                }

                {
                    !isInventory && <>
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

                        <Col className="col-row text-end">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleShowModalEditProduct}
                            >
                                <FaPencilAlt /> Editar
                            </Button>
                        </Col>
                    </>
                }

                {
                    isInventory && <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={handleShowModalNewItem}
                        >
                            <FaPlus /> movimentar
                        </Button>
                    </Col>
                }
            </Row>

            <>
                {
                    productData && <>
                        <Modal show={showModalEditProduct} size="lg" onHide={handleCloseModalEditProduct}>
                            <Modal.Header closeButton>
                                {loadingData ? <Placeholder as={Modal.Title} animation="glow" xs={10}>
                                    <Placeholder size="lg" xs={12} />
                                </Placeholder> :
                                    <Modal.Title>Edtiar produto</Modal.Title>
                                }
                            </Modal.Header>
                            {
                                loadingData ? <>
                                    <Modal.Body>
                                        <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                            <Placeholder size="lg" xs={12} />
                                        </Placeholder>

                                        <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                            <Placeholder size="lg" xs={12} />
                                        </Placeholder>

                                        <Row className="mb-3">
                                            <Col>
                                                <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                                    <Placeholder size="lg" xs={12} />
                                                </Placeholder>
                                            </Col>

                                            <Col>
                                                <Placeholder className="mb-3" style={{ height: '5rem' }} as={Modal.Title} animation="glow" xs={12}>
                                                    <Placeholder size="lg" xs={12} />
                                                </Placeholder>
                                            </Col>

                                            <Col>
                                                <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                                    <Placeholder size="lg" xs={12} />
                                                </Placeholder>
                                            </Col>

                                            <Col>
                                                <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                                    <Placeholder size="lg" xs={12} />
                                                </Placeholder>
                                            </Col>
                                        </Row>

                                        <Placeholder className="mb-3" as={Modal.Title} animation="glow" xs={12}>
                                            <Placeholder size="lg" xs={12} />
                                        </Placeholder>
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Placeholder.Button size="lg" variant="secondary" xs={2} />
                                        <Placeholder.Button size="lg" variant="danger" xs={2} />
                                        <Placeholder.Button size="lg" variant="success" xs={2} />
                                    </Modal.Footer>
                                </> :
                                    <Formik
                                        initialValues={
                                            {
                                                title: product.title,
                                                description: product.description,
                                                code: product.code,
                                                price: prettifyCurrency(String(product.price)),
                                                inventory_amount: prettifyCurrency(String(product.inventory_amount)),
                                                inventory_min: prettifyCurrency(String(product.inventory_min)),
                                                category: productData.category.id,
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

                                                handleListProducts && await handleListProducts();

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
                                                    <Form.Group className="mb-3" controlId="productFormGridTitle">
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

                                                    <Form.Group className="mb-3" controlId="productFormGridCategory">
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

                                                    <Accordion className="mb-3">
                                                        <Accordion.Item eventKey="0">
                                                            <Accordion.Header><h6 className="text-success">Movimentações de estoque <FaExchangeAlt /></h6></Accordion.Header>
                                                            <Accordion.Body>
                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Tipo</th>
                                                                            <th>Descrição</th>
                                                                            <th>Custo médio</th>
                                                                            <th>Quantidade</th>
                                                                            <th>Em estoque</th>
                                                                            <th>Usuário</th>
                                                                            <th>Data</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            productData.inventory_actions.map(action => {
                                                                                let type = 'Entrada';

                                                                                if (action.type === 'out') type = 'Saída';

                                                                                return <tr key={action.id}>
                                                                                    <td>{type}</td>
                                                                                    <td>{action.description}</td>
                                                                                    <td>{`R$ ${prettifyCurrency(Number(action.price).toFixed(2))}`}</td>
                                                                                    <td>{`Un ${prettifyCurrency(Number(action.amount).toFixed(2))}`}</td>
                                                                                    <td>{`Un ${prettifyCurrency(Number(action.inventory_amount).toFixed(2))}`}</td>
                                                                                    <td>{action.created_by}</td>
                                                                                    <td>{format(new Date(action.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                </Table>
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    </Accordion>
                                                </Modal.Body>
                                                <Modal.Footer>
                                                    {
                                                        messageShow ? <AlertMessage status={productTypeMessage} /> :
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
                            }
                        </Modal>

                        <Modal show={showModalNewItem} onHide={handleCloseModalNewItem}>
                            <Modal.Header closeButton>
                                <Modal.Title>Nova movimentação</Modal.Title>
                            </Modal.Header>
                            <Formik
                                initialValues={
                                    {
                                        type: '',
                                        description: '',
                                        price: '0,00',
                                        amount: '0,00',
                                        inventory_amount: prettifyCurrency(Number(product.inventory_amount).toFixed(2)),
                                    }
                                }
                                onSubmit={async values => {
                                    setTypeMessage("waiting");
                                    setMessageShow(true);

                                    try {
                                        const inventoryAmount = Number(product.inventory_amount);
                                        const newAmount = Number(prettifyCurrency(values.amount).replaceAll(".", "").replaceAll(",", "."));

                                        let newInventoryAmount = 0;

                                        if (values.type === "in")
                                            newInventoryAmount = inventoryAmount + newAmount;
                                        else
                                            newInventoryAmount = inventoryAmount - newAmount;

                                        await api.post('inventory/actions', {
                                            type: values.type,
                                            description: values.description,
                                            price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                            amount: Number(values.amount.replaceAll(".", "").replaceAll(",", ".")),
                                            inventory_amount: newInventoryAmount,
                                            product: product.id
                                        });
                                        await api.put(`products/${product.id}`, {
                                            title: product.title,
                                            inventory_amount: newInventoryAmount,
                                            order: product.order,
                                            category: productData.category.id,
                                        });

                                        handleInventoryActionsList && await handleInventoryActionsList();

                                        setTypeMessage("success");

                                        setTimeout(() => {
                                            setMessageShow(false);
                                            handleCloseModalNewItem();
                                        }, 2000);
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
                                validationSchema={inventoryActionValidationSchema}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <Modal.Body>
                                            <Row className="mb-3">
                                                <Col>
                                                    <h5 className="text-success">{product.title}</h5>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3" controlId="inventoryActionFormGridType">
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

                                            <Form.Group className="mb-3" controlId="inventoryActionFormGridDescription">
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
                                                            onChange={e => {
                                                                setFieldValue('price', prettifyCurrency(e.target.value));
                                                            }}
                                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                setFieldValue('price', prettifyCurrency(e.target.value));
                                                            }}
                                                            value={values.price}
                                                            name="price"
                                                            aria-label="Valor do item"
                                                            aria-describedby="btnGroupPrice"
                                                        />
                                                    </InputGroup>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={4} controlId="inventoryActionFormGridAmount">
                                                    <Form.Label>Quantidade</Form.Label>
                                                    <InputGroup>
                                                        <InputGroup.Text id="btnGroupAmount">Un</InputGroup.Text>
                                                        <Form.Control
                                                            type="text"
                                                            onChange={e => {
                                                                setFieldValue('amount', prettifyCurrency(e.target.value));
                                                            }}
                                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                setFieldValue('amount', prettifyCurrency(e.target.value));
                                                            }}
                                                            value={values.amount}
                                                            name="amount"
                                                            aria-label="Quantidade da movimentação"
                                                            aria-describedby="btnGroupAmount"
                                                        />
                                                    </InputGroup>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={4} controlId="inventoryActionFormGridPrice">
                                                    <Form.Label>Estoque disponível</Form.Label>
                                                    <InputGroup>
                                                        <InputGroup.Text id="btnGroupPrice">Un</InputGroup.Text>
                                                        <Form.Control
                                                            type="text"
                                                            onChange={e => {
                                                                setFieldValue('inventory_amount', prettifyCurrency(e.target.value));
                                                            }}
                                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                setFieldValue('inventory_amount', prettifyCurrency(e.target.value));
                                                            }}
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
                                                messageShow ? <AlertMessage status={inventoryTypeMessage} /> :
                                                    <>
                                                        <Button variant="secondary" onClick={handleCloseModalNewItem}>Cancelar</Button>
                                                        <Button variant="success" type="submit">Salvar</Button>
                                                    </>

                                            }
                                        </Modal.Footer>
                                    </Form>
                                )}
                            </Formik>
                        </Modal>
                    </>
                }
            </>
        </ListGroup.Item>
    )
}

export default Products;