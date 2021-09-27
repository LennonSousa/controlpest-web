import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Image, Form, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import {
    FaAward,
    FaPencilAlt,
    FaSave,
    FaPrint,
} from 'react-icons/fa';
import draftToHtml from 'draftjs-to-html';
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Store } from '../../../components/Store';
import { Estimate } from '../../../components/Estimates';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';

import styles from './styles.module.css';

const validationSchema = Yup.object().shape({
    finish_at: Yup.date().required('Obrigatório!'),
    expire_at: Yup.date().required('Obrigatório!'),
});

const EstimatePrint: NextPage = () => {
    const router = useRouter();
    const { estimate } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [store, setStore] = useState<Store>();
    const [data, setData] = useState<Estimate>();
    const [documentType, setDocumentType] = useState("CPF");

    const [finishAt, setFinishAt] = useState(new Date());
    const [expireAt, setExpireAt] = useState(new Date());

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

                        if (estimateRes.customer.document.length > 14)
                            setDocumentType("CNPJ");

                        setFinishAt(estimateRes.finish_at);
                        setExpireAt(estimateRes.expire_at);

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
                title="Imprimir certificado"
                description={`Imprimir certificado da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Imprimir certificado',
                    description: `Imprimir certificado da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Imprimir certificado | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
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
                                                                <Row className="d-print-none">
                                                                    <Col>
                                                                        <PageBack href={`/estimates/details/${data.id}`} subTitle="Voltar para os detalhes do certificado" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar certificado."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/estimates/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="d-print-none">
                                                                    <Col>
                                                                        <Formik
                                                                            initialValues={
                                                                                {
                                                                                    finish_at: format(new Date(data.finish_at), 'yyyy-MM-dd'),
                                                                                    expire_at: format(new Date(data.expire_at), 'yyyy-MM-dd'),
                                                                                }
                                                                            }
                                                                            onSubmit={values => {
                                                                                try {
                                                                                    setFinishAt(new Date(`${values.finish_at} 12:00:00`));
                                                                                    setExpireAt(new Date(`${values.expire_at} 12:00:00`));
                                                                                }
                                                                                catch {
                                                                                }
                                                                            }}
                                                                            validationSchema={validationSchema}
                                                                        >
                                                                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                                                                <Form onSubmit={handleSubmit}>
                                                                                    <Row className="mb-3 align-items-end">
                                                                                        <Form.Group as={Col} sm={3} controlId="formGridFinishAt">
                                                                                            <Form.Label>Execução dos serviços</Form.Label>
                                                                                            <Form.Control
                                                                                                type="date"
                                                                                                onChange={handleChange}
                                                                                                onBlur={handleBlur}
                                                                                                value={values.finish_at}
                                                                                                name="finish_at"
                                                                                                isInvalid={!!errors.finish_at && touched.finish_at}
                                                                                            />
                                                                                            <Form.Control.Feedback type="invalid">{touched.finish_at && errors.finish_at}</Form.Control.Feedback>
                                                                                        </Form.Group>

                                                                                        <Form.Group as={Col} sm={3} controlId="formGridFinishAt">
                                                                                            <Form.Label>Validade do certificado</Form.Label>
                                                                                            <Form.Control
                                                                                                type="date"
                                                                                                onChange={handleChange}
                                                                                                onBlur={handleBlur}
                                                                                                value={values.expire_at}
                                                                                                name="expire_at"
                                                                                                isInvalid={!!errors.expire_at && touched.expire_at}
                                                                                            />
                                                                                            <Form.Control.Feedback type="invalid">{touched.expire_at && errors.expire_at}</Form.Control.Feedback>
                                                                                        </Form.Group>

                                                                                        <Col className="col-row">
                                                                                            <Button variant="success" type="submit"><FaSave /></Button>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Form>
                                                                            )}
                                                                        </Formik>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center align-items-center mb-4 text-center">
                                                                    <Col className="col-5">
                                                                        <Image fluid src="/assets/images/logo-h.svg" alt="Controll Pest." />
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center align-items-center mb-2 text-center">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <h5 className="text-dark text-wrap">{store.title}</h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark text-wrap">{store.document}</h6>
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
                                                                </Row>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h1 className="text-dark text-center"><FaAward /> CERTIFICADO</h1>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="text-center">
                                                                    <Col>
                                                                        <h2 className="form-control-plaintext text-success text-wrap">{data.customer.name}</h2>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1 text-center">
                                                                    <Col>
                                                                        <h6 className="text-secondary text-wrap">{`${documentType}: ${data.customer.document},
                                                                        ${data.same_address ? data.customer.street : data.street}, ${data.same_address ? data.customer.number : data.number},
                                                                        ${data.same_address ? data.customer.neighborhood : data.neighborhood}, 
                                                                        ${data.same_address ? data.customer.city : data.city} - ${data.same_address ? data.customer.state : data.state}, 
                                                                        ${data.same_address ? data.customer.zip_code : data.zip_code}`}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1 text-center">
                                                                    <Col>
                                                                        <h5 className="text-secondary text-wrap">{`Os seguintes serviços: ${data.items.map(item => { return ` ${item.name}` })}, 
                                                                        foram execultados de acordo com as normas exigidas pelo ministério da Saúde e Vigilância Sanitária, 
                                                                        RDC 52.`}<br />
                                                                            {`Execução dos serviços ${format(new Date(finishAt), 'dd/MM/yyyy')}.`}
                                                                            <strong className="text-danger">{` Validade: ${format(new Date(expireAt), 'dd/MM/yyyy')}.`}</strong></h5>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h5
                                                                            className="text-wrap text-center"
                                                                            style={{}}
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(store.manager) }}
                                                                        ></h5>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-1 text-center">
                                                                    <Col>
                                                                        <h6 className="text-danger text-wrap">CENTRO DE INFORMAÇÕES TOXICOLOGICAS</h6>
                                                                        <h6 className="text-danger text-wrap">0800 712 300</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <div className={`d-print-none ${styles.buttonPrintContainer}`}>
                                                            <Button
                                                                className={styles.buttonPrint}
                                                                variant="success"
                                                                onClick={() => window.print()}
                                                                title="Imprimir certificado."
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

export default EstimatePrint;

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