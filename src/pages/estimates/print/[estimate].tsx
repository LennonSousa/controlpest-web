import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Image, Table, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import br from 'date-fns/locale/pt-BR'
import {
    FaPencilAlt,
    FaPlug,
    FaStickyNote,
    FaMoneyBillWave,
    FaCashRegister,
    FaClipboardList,
    FaPrint,
    FaUserTie,
    FaBoxOpen,
    FaFileSignature,
    FaShieldAlt,
    FaSun,
} from 'react-icons/fa';
import draftToHtml from 'draftjs-to-html';
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Store } from '../../../components/Store';
import { Estimate } from '../../../components/Estimates';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { prettifyCurrency } from '../../../components/InputMask/masks';

import styles from './styles.module.css'

export default function PropertyDetails() {
    const router = useRouter();
    const { estimate } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [store, setStore] = useState<Store>();
    const [data, setData] = useState<Estimate>();
    const [documentType, setDocumentType] = useState("CPF");

    const [subTotal, setSubTotal] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('estimates');
            handleSelectedMenu('estimates-index');

            if (can(user, "estimates", "view")) {
                if (estimate) {
                    api.get(`estimates/${estimate}`).then(res => {
                        const estimateRes: Estimate = res.data;

                        handleTotal(estimateRes);

                        if (estimateRes.customer.document.length > 14)
                            setDocumentType("CNPJ");

                        setData(estimateRes);
                    }).catch(err => {
                        console.log('Error to get estimate: ', err);

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
    }, [user, estimate]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleTotal(estimate: Estimate) {
        let newSubTotal = 0;
        const discount_percent = estimate.discount_percent;
        const discount = estimate.discount;
        const increase_percent = estimate.increase_percent;
        const increase = estimate.increase;

        estimate.items.forEach(item => {
            const totalItem = Number(item.amount) * Number(item.price);

            newSubTotal = Number(newSubTotal) + Number(totalItem);
        });

        setSubTotal(newSubTotal);

        // Discount and increase.
        let finalPrice = newSubTotal;

        if (discount_percent) finalPrice = newSubTotal - (newSubTotal * discount / 100);
        else finalPrice = newSubTotal - discount;

        if (increase > 0) {
            if (increase_percent) finalPrice = finalPrice + (finalPrice * increase / 100);
            else finalPrice = finalPrice + increase;
        }

        setFinalTotal(finalPrice);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    const getHtml = (rawText: string) => {
        try {
            const rawContent = convertFromRaw(JSON.parse(rawText));

            const content: EditorState = EditorState.createWithContent(rawContent);

            return draftToHtml(convertToRaw(content.getCurrentContent()));
        }
        catch {
            return '';
        }
    }

    return (
        <>
            <NextSeo
                title="Imprimir orçamento"
                description="Imprimir orçamento da plataforma de gerenciamento da Mtech Solar."
                openGraph={{
                    url: 'https://app.mtechsolar.com.br',
                    title: 'Imprimir orçamento',
                    description: 'Imprimir orçamento da plataforma de gerenciamento da Mtech Solar.',
                    images: [
                        {
                            url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg',
                            alt: 'Imprimir orçamento | Plataforma Mtech Solar',
                        },
                        { url: 'https://app.mtechsolar.com.br/assets/images/logo-mtech.jpg' },
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
                                                                        <PageBack href={`/estimates/details/${data.id}`} subTitle="Voltar para os detalhes do orçamento" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar orçamento."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/estimates/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3 text-center">
                                                                    <Col>
                                                                        <h4 className="text-dark text-wrap">PROPOSTA PARA PRESTAÇÃO DE SERVIÇOS DE
                                                                            CONTROLE QUÍMICO DE PRAGAS URBANAS</h4>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="align-items-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <h5 className="text-dark">{store.title}</h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${store.street}, ${store.number} - ${store.neighborhood}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{store.complement}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${store.zip_code}, ${store.city} - ${store.state}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${store.phone}, ${store.email}`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Image fluid src="/assets/images/logo.svg" alt="Mtech Solar." />
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
                                                                            <th>Unitário</th>
                                                                            <th>Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.items.map((item, index) => {
                                                                                const total = item.amount * item.price;

                                                                                return <tr key={index}>
                                                                                    <td>{prettifyCurrency(Number(item.amount).toFixed(2))}</td>
                                                                                    <td>{item.name}</td>
                                                                                    <td>{item.details}</td>
                                                                                    <td>{`R$ ${prettifyCurrency(Number(item.price).toFixed(2))}`}</td>
                                                                                    <td>{`R$ ${prettifyCurrency(total.toFixed(2))}`}</td>
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

                                                                <Row className="mb-3">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Subtotal</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(String(subTotal.toFixed(2)))}`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Desconto</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{
                                                                                    `${data.discount_percent ? '' : 'R$ '}${prettifyCurrency(String(data.discount))} ${data.discount_percent ? '%' : ''}`
                                                                                }</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Acréscimo</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{
                                                                                    `${data.increase_percent ? '' : 'R$ '}${prettifyCurrency(String(data.increase))} ${data.increase_percent ? '%' : ''}`
                                                                                }</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Valor final <FaMoneyBillWave /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(String(finalTotal.toFixed(2)))}`} </h6>
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

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaBoxOpen /> SERVIÇOS INCLUSOS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(store.services_in) }}
                                                                        ></span>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaShieldAlt /> GARANTIAS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(store.warranty) }}
                                                                        ></span>
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
                                                                            Li e estou de acordo com os termos e condições propostas neste orçamento:
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Validade do orçamento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.expire_at), 'dd/MM/yyyy')}</h6>
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
                                                                        <h6
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(store.manager) }}
                                                                        ></h6>
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

                                                                {/* <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Vendedor</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{data.user ? data.user.name : data.created_by}</h6>
                                                                    </Col>
                                                                </Row> */}

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{store.name}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{`CNPJ: ${store.document}`}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Diretor executivo</h6>
                                                                    </Col>
                                                                </Row>


                                                            </Col>
                                                        </Row>

                                                        <div className={`d-print-none ${styles.buttonPrintContainer}`}>
                                                            <Button
                                                                className={styles.buttonPrint}
                                                                variant="success"
                                                                onClick={() => window.print()}
                                                                title="Imprimir orçamento."
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