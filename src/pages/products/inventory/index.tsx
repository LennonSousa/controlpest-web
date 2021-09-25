import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { Card, Col, Container, Image, ListGroup, Row } from 'react-bootstrap';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Category } from '../../../components/Categories';
import ProductsItems from '../../../components/Products';
import { PageWaiting } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

const Inventory: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    useEffect(() => {
        handleItemSideBar('products');
        handleSelectedMenu('products-inventory');

        if (user) {
            if (can(user, "inventory", "view")) {

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

    async function handleInventoryActionsList() {
        const res = await api.get('categories');

        setCategories(res.data);
    }

    return (
        <>
            <NextSeo
                title="Estoque de produtos"
                description={`Estoque de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Estoque de produtos',
                    description: `Estoque de produtos da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Estoque de produtos | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "inventory", "update") ? <Container className="content-page">
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
                                                    categories && !!categories.length ? categories.map((category, index) => {
                                                        return <Card key={index} className="mb-3">
                                                            <Card.Body>
                                                                <Card.Title className="mb-3">{category.title}</Card.Title>
                                                                {
                                                                    category.products && !!category.products.length ? <Col>
                                                                        <ListGroup>
                                                                            <Row>
                                                                                <Col><h6 className="text-secondary">Produto</h6></Col>
                                                                                <Col><h6 className="text-secondary">Valor de venda</h6></Col>
                                                                                <Col><h6 className="text-secondary">Quantidade mínima</h6></Col>
                                                                                <Col><h6 className="text-secondary">Quantidade no estoque</h6></Col>
                                                                                <Col sm={2}></Col>
                                                                            </Row>
                                                                            {
                                                                                category.products.map((product, index) => {
                                                                                    return <ProductsItems
                                                                                        key={index}
                                                                                        product={product}
                                                                                        listProducts={category.products}
                                                                                        categories={categories}
                                                                                        isInventory
                                                                                        handleInventoryActionsList={handleInventoryActionsList}
                                                                                    />
                                                                                })
                                                                            }
                                                                        </ListGroup>
                                                                    </Col> :
                                                                        <Col>
                                                                            <Row>
                                                                                <Col className="text-center">
                                                                                    <p style={{ color: 'var(--gray)' }}>Nenhum produto registrado.</p>
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                }
                                                            </Card.Body>
                                                        </Card>
                                                    }) :
                                                        <Col>
                                                            <Row>
                                                                <Col className="text-center">
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhuma item registrado no estoque.</p>
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
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default Inventory;

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