import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Badge, Col, Container, Button, ButtonGroup, Image, Table, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import br from 'date-fns/locale/pt-BR'
import {
    FaBuilding,
    FaPencilAlt,
    FaStickyNote,
    FaFileSignature,
    FaCashRegister,
    FaClipboardList,
    FaSpider,
    FaSkullCrossbones,
    FaPrint,
    FaShieldAlt,
    FaUserTie,
} from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Store } from '../../../../components/Store';
import { ServiceOrder } from '../../../../components/ServiceOrders';
import PageBack from '../../../../components/PageBack';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';
import { prettifyCurrency } from '../../../../components/InputMask/masks';

import styles from './styles.module.css'

const ServiceOrderPrint: NextPage = () => {
    const router = useRouter();
    const { order } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [store, setStore] = useState<Store>();
    const [data, setData] = useState<ServiceOrder>();
    const [documentType, setDocumentType] = useState("CPF");

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('services');
            handleSelectedMenu('services-orders');

            if (can(user, "services", "view")) {
                if (order) {
                    api.get(`services/orders/${order}`).then(res => {
                        const serviceOrderRes: ServiceOrder = res.data;

                        if (serviceOrderRes.customer.document.length > 14)
                            setDocumentType("CNPJ");

                        setData(serviceOrderRes);
                    }).catch(err => {
                        console.log('Error to get service order: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });

                    api.get('store').then(res => {
                        const storeRes: Store = res.data;

                        setStore(storeRes);
                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get store: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, order]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Imprimir ordem de serviço"
                description={`Imprimir ordem de serviço da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Imprimir ordem de serviço',
                    description: `Imprimir ordem de serviço da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Imprimir ordem de serviço | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "view") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data || !store ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row>
                                                            <Col>
                                                                <Row className="mb-3 d-print-none">
                                                                    <Col>
                                                                        <PageBack href={`/services/orders/details/${data.id}`} subTitle="Voltar para os detalhes da ordem de serviço" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar ordem de serviço."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/services/orders/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3 text-center">
                                                                    <Col>
                                                                        <h4 className="text-dark text-wrap text-wrap">ORDEM PARA PRESTAÇÃO DE SERVIÇOS DE
                                                                            CONTROLE QUÍMICO DE PRAGAS URBANAS</h4>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="align-items-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <h5 className="text-dark text-wrap">{store.title}</h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark text-wrap">{`${store.street}, ${store.number} - ${store.neighborhood}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark text-wrap">{store.complement}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark text-wrap">{`${store.zip_code}, ${store.city} - ${store.state}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark text-wrap">{`${store.phone}, ${store.email}`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Image fluid src="/assets/images/logo.svg" alt="Controll Pest." />
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaUserTie /> DADOS DO CLIENTE</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={6}>
                                                                        <h3 className="form-control-plaintext text-success">{data.customer.name}</h3>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{documentType}</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.document}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.phone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular secundário</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.cellphone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">E-mail</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.email}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Outros contatos</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.contacts}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={6}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Responsável</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.customer.owner}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">CEP</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.zip_code : data.zip_code}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={8}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Rua</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.street : data.street}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Número</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.number : data.number}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Complemento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.complement : data.complement}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={6}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Bairro</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.neighborhood : data.neighborhood}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Cidade</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.city : data.city}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Estado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.same_address ? data.customer.state : data.state}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Tipos de pragas <FaSpider /></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    {
                                                                        data.pragues.map((pragueType, index) => {
                                                                            return <Col className="col-row me-2" key={index}>
                                                                                <Badge
                                                                                    bg="light"
                                                                                    text="dark"
                                                                                >
                                                                                    {pragueType.prague.name}
                                                                                </Badge>
                                                                            </Col>
                                                                        })
                                                                    }
                                                                </Row>

                                                                {
                                                                    data.other_prague_type && !!data.other_prague_type.length && <>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Outros tipos de pragas</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{data.other_prague_type}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </>
                                                                }

                                                                <Row className="mt-4">
                                                                    <Col>
                                                                        <h6 className="text-success">Tipos de tratamento/produto <FaSkullCrossbones /></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    {
                                                                        data.treatments.map((treatmentType, index) => {
                                                                            return <Col className="col-row me-2" key={index}>
                                                                                <Badge
                                                                                    bg="light"
                                                                                    text="dark"
                                                                                >
                                                                                    {treatmentType.treatment.name}
                                                                                </Badge>
                                                                            </Col>
                                                                        })
                                                                    }
                                                                </Row>

                                                                {
                                                                    data.other_treatment_type && !!data.other_treatment_type.length && <>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Outros tipos de tratamentos</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{data.other_treatment_type}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </>
                                                                }

                                                                <Row className="mt-4">
                                                                    <Col>
                                                                        <h6 className="text-success">Tipo de estabelecimento <FaBuilding /></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    {
                                                                        data.builds.map((buildType, index) => {
                                                                            return <Col className="col-row me-2" key={index}>
                                                                                <Badge
                                                                                    bg="light"
                                                                                    text="dark"
                                                                                >
                                                                                    {buildType.build.name}
                                                                                </Badge>
                                                                            </Col>
                                                                        })
                                                                    }
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Descrição do local</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <h6 className="text-secondary text-wrap">{data.build_description}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Animais no local?</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.animals ? "Sim" : "Não"}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Pessoas idosas?</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.old_people ? "Sim" : "Não"}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Pessoas alérgicas?</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.allergic_people ? "Sim" : "Não"}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaClipboardList /> ITENS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Quantidade</th>
                                                                            <th>Produto</th>
                                                                            <th>Detalhes</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.items.map((item, index) => {
                                                                                return <tr key={index}>
                                                                                    <td>{prettifyCurrency(Number(item.amount).toFixed(2))}</td>
                                                                                    <td>{item.name}</td>
                                                                                    <td>{item.details}</td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                </Table>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaCashRegister /> VALORES</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-4">
                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Valor do serviço</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(Number(data.value).toFixed(2))}`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={10}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Pagamento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.payment}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row style={{ pageBreakBefore: 'always' }} className="mb-4">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col>
                                                                                <h5 className="text-dark">GARANTIA <FaShieldAlt /></h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{data.warranty}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaStickyNote /> OBSERVAÇÕES</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">{data.notes}</span>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaFileSignature /> TERMO DE ACEITE DA PROPOSTA</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            Li e estou de acordo com os termos e condições propostas neste ordem de serviço:
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Início do serviço</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.start_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Previsão de entrega</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.finish_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">{format(new Date(), 'PPPPp', { locale: br })}</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Assinatura do técnico aplicador</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Assinatura do cliente</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{data.customer.name}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{`${documentType}: ${data.customer.document}`}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <div className={`d-print-none ${styles.buttonPrintContainer}`}>
                                                            <Button
                                                                className={styles.buttonPrint}
                                                                variant="success"
                                                                onClick={() => window.print()}
                                                                title="Imprimir ordem de serviço."
                                                            >
                                                                <FaPrint />
                                                            </Button>
                                                        </div>
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

export default ServiceOrderPrint;

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