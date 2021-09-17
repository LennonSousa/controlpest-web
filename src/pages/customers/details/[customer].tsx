import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, ButtonGroup, Col, Container, Row, Tabs, Tab } from 'react-bootstrap';
import { format } from 'date-fns';
import {
    FaAngleRight,
    FaStickyNote,
    FaPencilAlt,
} from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can, translateGrant } from '../../../components/Users';
import { Customer } from '../../../components/Customers';
import { Estimate } from '../../../components/Estimates';
// import { Services } from '../../../components/Services';
import EstimateListItem from '../../../components/EstimateListItem';
// import ServicesListItem from '../../../components/ServicesListItem';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage } from '../../../components/Interfaces/AlertMessage';

import styles from './styles.module.css';

const CustomerDetails: NextPage = () => {
    const router = useRouter();
    const { customer } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [customerData, setCustomerData] = useState<Customer>();
    const [documentType, setDocumentType] = useState("CPF");

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    // Relations tabs.
    const [tabKey, setTabKey] = useState('estimates');

    const [loadingEstimates, setLoadingEstimates] = useState(false);
    const [estimatesData, setEstimatesData] = useState<Estimate[]>([]);
    const [estimatesErrorShow, setEstimatesErrorShow] = useState(false);

    const [loadingServices, setLoadingServices] = useState(false);
    // const [servicesData, setServicesData] = useState<Services[]>([]);
    const [servicesErrorShow, setServicesErrorShow] = useState(false);

    useEffect(() => {
        handleItemSideBar('customers');
        handleSelectedMenu('customers-index');

        if (user) {
            if (can(user, "customers", "view")) {
                if (customer) {
                    api.get(`customers/${customer}`).then(res => {
                        let customerRes: Customer = res.data;

                        if (customerRes.document.length > 14)
                            setDocumentType("CNPJ");

                        setCustomerData(customerRes);
                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get customer: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, customer]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (customer) {
            if (tabKey === "estimates") {
                setEstimatesErrorShow(false);
                setLoadingEstimates(true);

                api.get(`estimates?customer=${customer}`).then(res => {
                    setEstimatesData(res.data);

                    setLoadingEstimates(false);
                }).catch(err => {
                    console.log('Error to get estimates on customer, ', err);
                    setEstimatesErrorShow(true);

                    setLoadingEstimates(false);
                });

                return;
            }

            if (tabKey === "services") {
                // setServicesErrorShow(false);
                // setLoadingServices(true);

                // api.get(`services?customer=${customer}`).then(res => {
                //     setServicesData(res.data);

                //     setLoadingServices(false);
                // }).catch(err => {
                //     console.log('Error to get services on customer, ', err);
                //     setServicesErrorShow(true);

                //     setLoadingServices(false);
                // });

                // return;
            }
        }
    }, [customer, tabKey]);

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Detalhes do cliente"
                description={`Detalhes do cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Detalhes do cliente',
                    description: `Detalhes do cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Detalhes do cliente | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "customers", "view") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !customerData ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row>
                                                            <Col>
                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <PageBack href="/customers" subTitle="Voltar para a lista de clientes" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar cliente."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/customers/edit/${customerData.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row className="align-items-center">
                                                                            <Col className="col-row">
                                                                                <h3 className="form-control-plaintext text-success">{customerData.name}</h3>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{documentType}</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.document}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Nascimento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(customerData.birth), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Telefone comercial</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.phone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.cellphone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={6} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">E-mail</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.email}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={8}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Outros contatos</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.contacts}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Responsável</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.owner}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Endereço</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.address}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Cidade</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.city}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Estado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.state}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Observação <FaStickyNote /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{customerData.notes}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Tipo</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.type.name}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Criado em</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(customerData.created_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Usuário</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{customerData.created_by}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Tabs
                                                                    id="relations-tabs"
                                                                    defaultActiveKey="estimates"
                                                                    onSelect={(k) => k && setTabKey(k)}
                                                                >
                                                                    <Tab eventKey="estimates" title="Orçamentos">
                                                                        <Row className={styles.relationsContainer}>
                                                                            <Col>
                                                                                <Row className={`justify-content-center ${styles.relationsContent}`}>
                                                                                    {
                                                                                        loadingEstimates ? <Col sm={4}>
                                                                                            <AlertMessage status="waiting" />
                                                                                        </Col> :
                                                                                            <>
                                                                                                {
                                                                                                    !estimatesErrorShow ? <>
                                                                                                        {
                                                                                                            !!estimatesData.length ? <>
                                                                                                                {
                                                                                                                    estimatesData.map((estimate, index) => {
                                                                                                                        return <EstimateListItem
                                                                                                                            key={index}
                                                                                                                            estimate={estimate}
                                                                                                                        />
                                                                                                                    })
                                                                                                                }

                                                                                                                <Col>
                                                                                                                    <Row className="justify-content-end">
                                                                                                                        <Col className="col-row">
                                                                                                                            <Button
                                                                                                                                title="Ver todos os orçamentos para esse cliente."
                                                                                                                                variant="success"
                                                                                                                                onClick={() => handleRoute(`/estimates?customer=${customerData.id}`)}
                                                                                                                            >
                                                                                                                                Ver mais <FaAngleRight />
                                                                                                                            </Button>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>
                                                                                                            </> :
                                                                                                                <Col>
                                                                                                                    <Row className="justify-content-center">
                                                                                                                        <Col className="col-row">
                                                                                                                            <span className="text-success">Nenhum orçamento encontrado.</span>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>
                                                                                                        }
                                                                                                    </> : <Col sm={4}>
                                                                                                        <AlertMessage status="error" />
                                                                                                    </Col>
                                                                                                }
                                                                                            </>
                                                                                    }
                                                                                </Row>
                                                                            </Col>
                                                                        </Row>
                                                                    </Tab>

                                                                    <Tab eventKey="services" title="Ordens de serviço">
                                                                        <Row className={styles.relationsContainer}>
                                                                            <Col>
                                                                                <Row className={`justify-content-center ${styles.relationsContent}`}>
                                                                                    {
                                                                                        loadingServices ? <Col sm={4}>
                                                                                            <AlertMessage status="waiting" />
                                                                                        </Col> :
                                                                                            <>
                                                                                                {/* {
                                                                                                    !servicesErrorShow ? <>
                                                                                                        {
                                                                                                            !!servicesData.length ? <>
                                                                                                                {
                                                                                                                    servicesData.map((service, index) => {
                                                                                                                        return <ServicesListItem
                                                                                                                            key={index}
                                                                                                                            service={service}
                                                                                                                        />
                                                                                                                    })
                                                                                                                }

                                                                                                                <Col>
                                                                                                                    <Row className="justify-content-end">
                                                                                                                        <Col className="col-row">
                                                                                                                            <Button
                                                                                                                                title="Ver todos as ordens de serviço para esse cliente."
                                                                                                                                variant="success"
                                                                                                                                onClick={() => handleRoute(`/services?customer=${customerData.id}`)}
                                                                                                                            >
                                                                                                                                Ver mais <FaAngleRight />
                                                                                                                            </Button>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>
                                                                                                            </> :
                                                                                                                <Col>
                                                                                                                    <Row className="justify-content-center">
                                                                                                                        <Col className="col-row">
                                                                                                                            <span className="text-success">Nenhuma ordem de serviço encontrado.</span>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>
                                                                                                        }
                                                                                                    </> : <Col sm={4}>
                                                                                                        <AlertMessage status="error" />
                                                                                                    </Col>
                                                                                                } */}
                                                                                            </>
                                                                                    }
                                                                                </Row>
                                                                            </Col>
                                                                        </Row>
                                                                    </Tab>
                                                                </Tabs>
                                                            </Col>
                                                        </Row>
                                                    </Container>
                                            }
                                        </>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default CustomerDetails;

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