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
import CustomerTypes, { CustomerType } from '../../../components/CustomerTypes';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
});

const Types: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewType, setShowModalNewType] = useState(false);

    const handleCloseModalType = () => setShowModalNewType(false);
    const handleShowModalNewType = () => setShowModalNewType(true);

    useEffect(() => {
        handleItemSideBar('customers');
        handleSelectedMenu('customers-types');

        if (user) {
            if (can(user, "customers", "view")) {

                api.get('customers/types').then(res => {
                    setCustomerTypes(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get customers, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListTypes() {
        const res = await api.get('customers/types');

        setCustomerTypes(res.data);
    }

    function handleOnDragEnd(result: DropResult) {
        if (result.destination) {
            const from = result.source.index;
            const to = result.destination.index;

            const updatedListDocs = produce(customerTypes, draft => {
                if (draft) {
                    const dragged = draft[from];

                    draft.splice(from, 1);
                    draft.splice(to, 0, dragged);
                }
            });

            if (updatedListDocs) {
                setCustomerTypes(updatedListDocs);
                saveOrder(updatedListDocs);
            }
        }
    }

    async function saveOrder(list: CustomerType[]) {
        list.forEach(async (doc, index) => {
            try {
                await api.put(`customers/types/${doc.id}`, {
                    name: doc.name,
                    order: index
                });

                handleListTypes();
            }
            catch (err) {
                console.log('error to save types order');
                console.log(err)
            }
        });
    }

    return (
        <>
            <NextSeo
                title="Tipos de cliente"
                description={`Tipos de cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Tipos de cliente',
                    description: `Tipos de cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Tipos de cliente | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "customers", "update") ? <Container className="content-page">
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
                                                    !!customerTypes.length ? <Col>
                                                        <DragDropContext onDragEnd={handleOnDragEnd}>
                                                            <Droppable droppableId="lines">
                                                                {provided => (
                                                                    <div
                                                                        {...provided.droppableProps}
                                                                        ref={provided.innerRef}
                                                                    >
                                                                        <ListGroup>
                                                                            {
                                                                                customerTypes && customerTypes.map((type, index) => {
                                                                                    return <Draggable key={type.id} draggableId={type.id} index={index}>
                                                                                        {(provided) => (
                                                                                            <div
                                                                                                {...provided.draggableProps}
                                                                                                {...provided.dragHandleProps}
                                                                                                ref={provided.innerRef}
                                                                                            >
                                                                                                <CustomerTypes
                                                                                                    type={type}
                                                                                                    listTypes={customerTypes}
                                                                                                    handleListTypes={handleListTypes}
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
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhum tipo registrado.</p>
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
                                        <Modal.Title>Criar um item</Modal.Title>
                                    </Modal.Header>
                                    <Formik
                                        initialValues={
                                            {
                                                name: '',
                                                active: true,
                                                order: 0,
                                            }
                                        }
                                        onSubmit={async values => {
                                            setTypeMessage("waiting");
                                            setMessageShow(true);

                                            try {
                                                if (customerTypes) {
                                                    await api.post('customers/types', {
                                                        name: values.name,
                                                        active: values.active,
                                                        order: customerTypes.length,
                                                    });

                                                    await handleListTypes();

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
                                                            value={values.name}
                                                            name="name"
                                                            isInvalid={!!errors.name && touched.name}
                                                        />
                                                        <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                        <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
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

export default Types;

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