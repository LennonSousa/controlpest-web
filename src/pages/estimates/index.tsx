import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Row } from 'react-bootstrap';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { AuthContext } from '../../contexts/AuthContext';
import { SideBarContext } from '../../contexts/SideBarContext';
import { can } from '../../components/Users';
import { Estimate } from '../../components/Estimates';
import EstimateItem from '../../components/EstimateListItem';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';

const limit = 15;

const Estimates: NextPage = () => {
    const router = useRouter();
    const { customer } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-index');

        if (user) {
            if (can(user, "estimates", "view")) {
                let requestUrl = `estimates?limit=${limit}&page=${activePage}`;

                if (customer) requestUrl = `estimates?customer=${customer}&limit=${limit}&page=${activePage}`;

                api.get(requestUrl).then(res => {
                    setEstimates(res.data);

                    try {
                        setTotalPages(Number(res.headers['x-total-pages']));
                    }
                    catch { }

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get estimates, ', err);

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
            let requestUrl = `estimates?limit=${limit}&page=${activePage}`;

            if (customer) requestUrl = `estimates?customer=${customer}&limit=${limit}&page=${activePage}`;

            const res = await api.get(requestUrl);

            setEstimates(res.data);

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
                title="Lista de orçamentos"
                description="Lista de orçamentos da plataforma de gerenciamento da Controll Pest."
                openGraph={{
                    url: 'https://app.mtechsolar.com.br',
                    title: 'Lista de orçamentos',
                    description: 'Lista de orçamentos da plataforma de gerenciamento da Controll Pest.',
                    images: [
                        {
                            url: 'https://app.mtechsolar.com.br/assets/images/logo.jpg',
                            alt: 'Lista de orçamentos | Plataforma Controll Pest',
                        },
                        { url: 'https://app.mtechsolar.com.br/assets/images/logo.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "view") ? <>
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
                                                            !!estimates.length ? estimates.map((estimate, index) => {
                                                                return <EstimateItem key={index} estimate={estimate} />
                                                            }) :
                                                                <PageWaiting status="empty" message="Nenhum orçamento registrado." />
                                                        }
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!estimates.length && <Row className="justify-content-center align-items-center">
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

export default Estimates;

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