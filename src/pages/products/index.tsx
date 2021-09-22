import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Accordion, Button, Col, Container, Form, Image, InputGroup, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { prettifyCurrency } from '../../components/InputMask/masks';


import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { Category } from '../../components/Categories';
import ProductsItems from '../../components/Products';
import { PageWaiting } from '../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(100, 'Deve conter no máximo 100 caracteres!'),
    description: Yup.string().notRequired(),
    code: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inventory_min: Yup.string().notRequired(),
    category: Yup.string().required('Obrigatório!'),
});

const Products: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewType, setShowModalNewType] = useState(false);

    const handleCloseModalType = () => setShowModalNewType(false);
    const handleShowModalNewType = () => setShowModalNewType(true);

    useEffect(() => {
        handleItemSideBar('products');
        handleSelectedMenu('products-index');

        if (user) {
            if (can(user, "products", "view")) {

                api.get('categories').then(res => {
                    setCategories(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get categories, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListProducts() {
        const res = await api.get('categories');

        setCategories(res.data);
    }

    function handleOnDragEnd(result: DropResult) {
        // if (result.destination) {
        //     const from = result.source.index;
        //     const to = result.destination.index;

        //     const updatedListDocs = produce(categories, draft => {
        //         if (draft) {
        //             const dragged = draft[from];

        //             draft.splice(from, 1);
        //             draft.splice(to, 0, dragged);
        //         }
        //     });

        //     if (updatedListDocs) {
        //         setCategories(updatedListDocs);
        //         saveOrder(updatedListDocs);
        //     }
        // }
    }

    async function saveOrder(list: Category[]) {
        // list.forEach(async (doc, index) => {
        //     try {
        //         await api.put(`products/${doc.id}`, {
        //             title: doc.title,
        //             order: index,
        //         });

        //         handleListProducts();
        //     }
        //     catch (err) {
        //         console.log('error to save products order');
        //         console.log(err)
        //     }
        // });
    }

    return (
        <>
            <NextSeo
                title="Lista de produtos"
                description={`Lista de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Lista de produtos',
                    description: `Lista de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Lista de produtos | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "products", "update") ? <Container className="content-page">
                                <Row>
                                    <Col>
                                        <Button variant="outline-success" onClick={handleShowModalNewType}>
                                            <FaPlus /> Criar um produto
                                        </Button>
                                    </Col>
                                </Row>

                                <article className="mt-3">
                                    {
                                        loadingData ? <Col>
                                            <Row>
                                                <Col>
                                                    <AlertMessage status={typeLoadingMessage} message={textLoadingMessage} />
                                                </Col>
                                            </Row>

                                            {
                                                typeLoadingMessage === "error" && <Row className="justify-content-center mt-3 mb-3">
                                                    <Col sm={3}>
                                                        <Image src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro de conexão." fluid />
                                                    </Col>
                                                </Row>
                                            }
                                        </Col> :
                                            <Row>
                                                <Accordion>
                                                    {
                                                        categories && categories.map((category, index) => {
                                                            return <Accordion.Item key={index} eventKey={String(index)}>
                                                                <Accordion.Header>{category.title}</Accordion.Header>
                                                                <Accordion.Body>
                                                                    {
                                                                        category.products && !!category.products.length ? <Col>
                                                                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                                                                <Droppable droppableId={category.id}>
                                                                                    {provided => (
                                                                                        <div
                                                                                            {...provided.droppableProps}
                                                                                            ref={provided.innerRef}
                                                                                        >
                                                                                            <ListGroup>
                                                                                                {
                                                                                                    category.products.map((product, index) => {
                                                                                                        return <Draggable key={product.id} draggableId={product.id} index={index}>
                                                                                                            {(provided) => (
                                                                                                                <div
                                                                                                                    {...provided.draggableProps}
                                                                                                                    {...provided.dragHandleProps}
                                                                                                                    ref={provided.innerRef}
                                                                                                                >
                                                                                                                    <ProductsItems
                                                                                                                        product={product}
                                                                                                                        listProducts={category.products}
                                                                                                                        categories={categories}
                                                                                                                        handleListProducts={handleListProducts}
                                                                                                                    />
                                                                                                                </div>
                                                                                                            )}

                                                                                                        </Draggable>
                                                                                                    })
                                                                                                }
                                                                                            </ListGroup>
                                                                                            {provided.placeholder}
                                                                                        </div>
                                                                                    )}
                                                                                </Droppable>
                                                                            </DragDropContext>
                                                                        </Col> :
                                                                            <Col>
                                                                                <Row>
                                                                                    <Col className="text-center">
                                                                                        <p style={{ color: 'var(--gray)' }}>Nenhum produto registrado.</p>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>
                                                                    }

                                                                </Accordion.Body>
                                                            </Accordion.Item>
                                                        })
                                                    }
                                                </Accordion>
                                            </Row>
                                    }
                                </article>

                                <Modal show={showModalNewType} onHide={handleCloseModalType}>
                                    <Modal.Header closeButton>
                                        <Modal.Title>Criar um produto</Modal.Title>
                                    </Modal.Header>
                                    <Formik
                                        initialValues={
                                            {
                                                title: '',
                                                description: '',
                                                code: '',
                                                price: '0,00',
                                                inventory_min: '0,00',
                                                category: '',
                                            }
                                        }
                                        onSubmit={async values => {


                                            try {
                                                if (categories) {
                                                    const foundCategory = categories.find(category => { return category.id === values.category });

                                                    if (foundCategory) {
                                                        setTypeMessage("waiting");
                                                        setMessageShow(true);

                                                        await api.post('products', {
                                                            title: values.title,
                                                            description: values.description,
                                                            code: values.code,
                                                            price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                                            inventory_min: Number(values.inventory_min.replaceAll(".", "").replaceAll(",", ".")),
                                                            order: foundCategory.products.length,
                                                            category: values.category,
                                                        });

                                                        await handleListProducts();

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            setMessageShow(false);
                                                            handleCloseModalType();
                                                        }, 1500);
                                                    }
                                                }
                                            }
                                            catch (err) {
                                                setTypeMessage("error");

                                                setTimeout(() => {
                                                    setMessageShow(false);
                                                }, 4000);

                                                console.log('error create customer type.');
                                                console.log(err);
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

                                                        <Form.Group as={Col} sm={5} controlId="productFormGridPrice">
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

                                                        <Form.Group as={Col} sm={4} controlId="productFormGridInventoryMin">
                                                            <Form.Label>Estoque mínimo</Form.Label>
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
                                                                <Button variant="secondary" onClick={handleCloseModalType}>
                                                                    Cancelar
                                                                </Button>
                                                                <Button variant="success" type="submit">Salvar</Button>
                                                            </>

                                                    }
                                                </Modal.Footer>
                                            </Form>
                                        )}
                                    </Formik>
                                </Modal>
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default Products;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}