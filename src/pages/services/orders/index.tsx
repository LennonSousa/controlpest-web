import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Row } from 'react-bootstrap';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { AuthContext } from '../../../contexts/AuthContext';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { can } from '../../../components/Users';
import { ServiceOrder } from '../../../components/ServiceOrders';
import ServiceOrderItem from '../../../components/ServiceOrderListItem';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { Paginations } from '../../../components/Interfaces/Pagination';

const limit = 15;

export default function ServiceOrders() {
    const router = useRouter();
    const { customer } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('services');
        handleSelectedMenu('services-index');

        if (user) {
            if (can(user, "services", "view")) {
                let requestUrl = `services/orders?limit=${limit}&page=${activePage}`;

                if (customer) requestUrl = `services/orders?customer=${customer}&limit=${limit}&page=${activePage}`;

                api.get(requestUrl).then(res => {
                    setServiceOrders(res.data);

                    try {
                        setTotalPages(Number(res.headers['x-total-pages']));
                    }
                    catch { }

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get serviceOrders, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleActivePage(page: number) {
        setLoadingData(true);
        setActivePage(page);

        try {
            let requestUrl = `services/orders?limit=${limit}&page=${activePage}`;

            if (customer) requestUrl = `services/orders?customer=${customer}&limit=${limit}&page=${activePage}`;

            const res = await api.get(requestUrl);

            setServiceOrders(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
    }

    return (
        <>
            <NextSeo
                title="Lista de ordens de serviço"
                description="Lista de ordens de serviço da plataforma de gerenciamento da Controll Pest."
                openGraph={{
                    url: 'https://app.mtechsolar.com.br',
                    title: 'Lista de ordens de serviço',
                    description: 'Lista de ordens de serviço da plataforma de gerenciamento da Controll Pest.',
                    images: [
                        {
                            url: 'https://app.mtechsolar.com.br/assets/images/logo.jpg',
                            alt: 'Lista de ordens de serviço | Plataforma Controll Pest',
                        },
                        { url: 'https://app.mtechsolar.com.br/assets/images/logo.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "services", "view") ? <>
                                <Container className="page-container">
                                    <Row>
                                        {
                                            loadingData ? <PageWaiting
                                                status={typeLoadingMessage}
                                                message={textLoadingMessage}
                                            /> :
                                                <Col>
                                                    <Row>
                                                        {
                                                            !!serviceOrders.length ? serviceOrders.map((serviceOrder, index) => {
                                                                return <ServiceOrderItem key={index} serviceOrder={serviceOrder} />
                                                            }) :
                                                                <PageWaiting status="empty" message="Nenhuma ordem de serviço registrada." />
                                                        }
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!serviceOrders.length && <Row className="justify-content-center align-items-center">
                                                    <Col className="col-row">
                                                        <Paginations
                                                            pages={totalPages}
                                                            active={activePage}
                                                            handleActivePage={handleActivePage}
                                                        />
                                                    </Col>
                                                </Row>
                                            }
                                        </Col>
                                    </Row>
                                </Container>
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

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