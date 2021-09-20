import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button, Col, Container, Form, Image, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import produce from 'immer';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import CategoriesItems, { Category } from '../../../components/Categories';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(100, 'Deve conter no máximo 100 caracteres!'),
});

const Categories: NextPage = () => {
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
        handleSelectedMenu('products-categories');

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

    async function handleListCategories() {
        const res = await api.get('categories');

        setCategories(res.data);
    }

    function handleOnDragEnd(result: DropResult) {
        if (result.destination) {
            const from = result.source.index;
            const to = result.destination.index;

            const updatedListDocs = produce(categories, draft => {
                if (draft) {
                    const dragged = draft[from];

                    draft.splice(from, 1);
                    draft.splice(to, 0, dragged);
                }
            });

            if (updatedListDocs) {
                setCategories(updatedListDocs);
                saveOrder(updatedListDocs);
            }
        }
    }

    async function saveOrder(list: Category[]) {
        list.forEach(async (doc, index) => {
            try {
                await api.put(`categories/${doc.id}`, {
                    title: doc.title,
                    order: index
                });

                handleListCategories();
            }
            catch (err) {
                console.log('error to save categories order');
                console.log(err)
            }
        });
    }

    return (
        <>
            <NextSeo
                title="Categorias de produtos"
                description={`Categorias de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Categorias de produtos',
                    description: `Categorias de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Categorias de produtos | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
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
                                            <FaPlus /> Criar um item
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
                                                {
                                                    !!categories.length ? <Col>
                                                        <DragDropContext onDragEnd={handleOnDragEnd}>
                                                            <Droppable droppableId="categories">
                                                                {provided => (
                                                                    <div
                                                                        {...provided.droppableProps}
                                                                        ref={provided.innerRef}
                                                                    >
                                                                        <ListGroup>
                                                                            {
                                                                                categories && categories.map((category, index) => {
                                                                                    return <Draggable key={category.id} draggableId={category.id} index={index}>
                                                                                        {(provided) => (
                                                                                            <div
                                                                                                {...provided.draggableProps}
                                                                                                {...provided.dragHandleProps}
                                                                                                ref={provided.innerRef}
                                                                                            >
                                                                                                <CategoriesItems
                                                                                                    category={category}
                                                                                                    listCategories={categories}
                                                                                                    handleListCategories={handleListCategories}
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
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhuma categoria registrada.</p>
                                                                </Col>
                                                            </Row>

                                                            <Row className="justify-content-center mt-3 mb-3">
                                                                <Col sm={3}>
                                                                    <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                }
                                            </Row>
                                    }
                                </article>

                                <Modal show={showModalNewType} onHide={handleCloseModalType}>
                                    <Modal.Header closeButton>
                                        <Modal.Title>Criar uma categoria</Modal.Title>
                                    </Modal.Header>
                                    <Formik
                                        initialValues={
                                            {
                                                title: '',
                                            }
                                        }
                                        onSubmit={async values => {
                                            setTypeMessage("waiting");
                                            setMessageShow(true);

                                            try {
                                                if (categories) {
                                                    await api.post('categories', {
                                                        title: values.title,
                                                        order: categories.length,
                                                    });

                                                    await handleListCategories();

                                                    setTypeMessage("success");

                                                    setTimeout(() => {
                                                        setMessageShow(false);
                                                        handleCloseModalType();
                                                    }, 1500);
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
                                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                            <Form onSubmit={handleSubmit}>
                                                <Modal.Body>
                                                    <Form.Group controlId="typeFormGridName">
                                                        <Form.Label>Nome</Form.Label>
                                                        <Form.Control type="text"
                                                            placeholder="Nome"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.title}
                                                            name="title"
                                                            isInvalid={!!errors.title && touched.title}
                                                        />
                                                        <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                                        <Form.Text className="text-muted text-right">{`${values.title.length}/50 caracteres.`}</Form.Text>
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

export default Categories;

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