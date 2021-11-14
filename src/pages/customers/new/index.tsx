import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { CustomerType } from '../../../components/CustomerTypes';
import { cpf, cnpj, cellphone } from '../../../components/InputMask/masks';
import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
    phone: Yup.string().notRequired().nullable(),
    cellphone: Yup.string().notRequired().nullable(),
    contacts: Yup.string().notRequired().nullable(),
    email: Yup.string().email('E-mail inválido!').notRequired().nullable(),
    zip_code: Yup.string().notRequired().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().notRequired(),
    number: Yup.string().notRequired(),
    neighborhood: Yup.string().notRequired(),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    owner: Yup.string().notRequired().nullable(),
    notes: Yup.string().notRequired().nullable(),
    birth: Yup.date().required('Obrigatório!'),
    type: Yup.string().required('Obrigatório!'),
});

const NewCustomer: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        handleItemSideBar('customers');
        handleSelectedMenu('customers-new');

        if (user) {
            if (can(user, "customers", "create")) {
                api.get('customers/types').then(res => {
                    setCustomerTypes(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get customer types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });
            }
        }

    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleCities(state: string) {
        const stateCities = statesCities.estados.find(item => { return item.sigla === state });

        if (stateCities)
            setCities(stateCities.cidades);
    }

    return (
        <>
            <NextSeo
                title="Criar cliente"
                description={`Criar cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Criar cliente',
                    description: `Criar cliente da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Criar cliente | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {!user || loading ? <PageWaiting status="waiting" /> :
                <>
                    {
                        can(user, "customers", "create") ? <>
                            {
                                loadingData || hasErrors ? <PageWaiting
                                    status={typeLoadingMessage}
                                    message={textLoadingMessage}
                                /> :
                                    <Container className="content-page">
                                        <Row className="mb-3">
                                            <Col>
                                                <PageBack href="/customers" subTitle="Voltar para a lista de clientes" />
                                            </Col>
                                        </Row>

                                        <Formik
                                            initialValues={{
                                                name: '',
                                                document: '',
                                                phone: '',
                                                cellphone: '',
                                                contacts: '',
                                                email: '',
                                                zip_code: '',
                                                street: '',
                                                number: '',
                                                neighborhood: '',
                                                complement: '',
                                                city: '',
                                                state: '',
                                                owner: '',
                                                notes: '',
                                                birth: format(new Date(), 'yyyy-MM-dd'),
                                                type: '',
                                            }}
                                            onSubmit={async values => {
                                                setTypeMessage("waiting");
                                                setMessageShow(true);

                                                try {
                                                    const res = await api.post('customers', {
                                                        name: values.name,
                                                        document: values.document,
                                                        phone: values.phone,
                                                        cellphone: values.cellphone,
                                                        contacts: values.contacts,
                                                        email: values.email,
                                                        zip_code: values.zip_code,
                                                        street: values.street,
                                                        number: values.number,
                                                        neighborhood: values.neighborhood,
                                                        complement: values.complement,
                                                        city: values.city,
                                                        state: values.state,
                                                        owner: values.owner,
                                                        notes: values.notes,
                                                        birth: values.birth,
                                                        type: values.type,
                                                    });

                                                    setTypeMessage("success");

                                                    setTimeout(() => {
                                                        router.push(`/customers/details/${res.data.id}`)
                                                    }, 2000);
                                                }
                                                catch {
                                                    setTypeMessage("error");

                                                    setTimeout(() => {
                                                        setMessageShow(false);
                                                    }, 4000);
                                                }
                                            }}
                                            validationSchema={validationSchema}
                                        >
                                            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                <Form onSubmit={handleSubmit}>


                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} sm={6} controlId="formGridName">
                                                            <Form.Label>Nome do cliente*</Form.Label>
                                                            <Form.Control
                                                                type="name"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.name}
                                                                name="name"
                                                                isInvalid={!!errors.name && touched.name}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={3} controlId="formGridDocument">
                                                            <Form.Label>{documentType}</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                maxLength={18}
                                                                onChange={(e) => {
                                                                    setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value), false);
                                                                    if (e.target.value.length > 14)
                                                                        setDocumentType("CNPJ");
                                                                    else
                                                                        setDocumentType("CPF");
                                                                }}
                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                    setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value));
                                                                    if (e.target.value.length > 14)
                                                                        setDocumentType("CNPJ");
                                                                    else
                                                                        setDocumentType("CPF");
                                                                }}
                                                                value={values.document}
                                                                name="document"
                                                                isInvalid={!!errors.document && touched.document}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.document && errors.document}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={3} controlId="formGridBirth">
                                                            <Form.Label>Nascimento</Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.birth}
                                                                name="birth"
                                                                isInvalid={!!errors.birth && touched.birth}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.birth && errors.birth}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} sm={3} controlId="formGridPhone">
                                                            <Form.Label>Telefone comercial</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                maxLength={15}
                                                                onChange={(e) => {
                                                                    setFieldValue('phone', cellphone(e.target.value));
                                                                }}
                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                    setFieldValue('phone', cellphone(e.target.value));
                                                                }}
                                                                value={values.phone}
                                                                name="phone"
                                                                isInvalid={!!errors.phone && touched.phone}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.phone && errors.phone}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={3} controlId="formGridCellphone">
                                                            <Form.Label>Celular</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                maxLength={15}
                                                                onChange={(e) => {
                                                                    setFieldValue('cellphone', cellphone(e.target.value));
                                                                }}
                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                    setFieldValue('cellphone', cellphone(e.target.value));
                                                                }}
                                                                value={values.cellphone}
                                                                name="cellphone"
                                                                isInvalid={!!errors.cellphone && touched.cellphone}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.cellphone && errors.cellphone}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={6} controlId="formGridEmail">
                                                            <Form.Label>E-mail</Form.Label>
                                                            <Form.Control
                                                                type="email"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.email}
                                                                name="email"
                                                                isInvalid={!!errors.email && touched.email}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} sm={8} controlId="formGridContacts">
                                                            <Form.Label>Outros contatos</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.contacts}
                                                                name="contacts"
                                                                isInvalid={!!errors.contacts && touched.contacts}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.contacts && errors.contacts}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={4} controlId="formGridOwner">
                                                            <Form.Label>Responsável</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.owner}
                                                                name="owner"
                                                                isInvalid={!!errors.owner && touched.owner}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.owner && errors.owner}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridZipCode">
                                                            <Form.Label>CEP</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                placeholder="00000000"
                                                                autoComplete="off"
                                                                onChange={e => {
                                                                    handleChange(e);

                                                                    if (e.target.value !== '' && e.target.value.length === 8) {
                                                                        setSpinnerCep(true);
                                                                        cep(e.target.value)
                                                                            .then((cep: CEP) => {
                                                                                const { street, neighborhood, city, state } = cep;

                                                                                handleCities(state);

                                                                                setFieldValue('street', street);
                                                                                setFieldValue('neighborhood', neighborhood);
                                                                                setFieldValue('city', city);
                                                                                setFieldValue('state', state);

                                                                                setSpinnerCep(false);
                                                                            })
                                                                            .catch(() => {
                                                                                setSpinnerCep(false);
                                                                            });
                                                                    }
                                                                }}
                                                                value={values.zip_code}
                                                                name="zip_code"
                                                                isInvalid={!!errors.zip_code && touched.zip_code}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.zip_code && errors.zip_code}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Col style={{ display: 'flex', alignItems: 'center' }}>
                                                            {
                                                                spinnerCep && <Spinner
                                                                    as="span"
                                                                    animation="border"
                                                                    variant="info"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                />
                                                            }
                                                        </Col>
                                                    </Row>

                                                    <Row className="mb-2">
                                                        <Form.Group as={Col} sm={10} controlId="formGridStreet">
                                                            <Form.Label>Rua</Form.Label>
                                                            <Form.Control
                                                                type="address"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.street}
                                                                name="street"
                                                                isInvalid={!!errors.street && touched.street}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.street && errors.street}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={2} controlId="formGridNumber">
                                                            <Form.Label>Número</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.number}
                                                                name="number"
                                                                isInvalid={!!errors.number && touched.number}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.number && errors.number}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} controlId="formGridComplement">
                                                            <Form.Label>Complemento</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.complement}
                                                                name="complement"
                                                                isInvalid={!!errors.complement && touched.complement}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.complement && errors.complement}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-2">
                                                        <Form.Group as={Col} sm={6} controlId="formGridNeighborhood">
                                                            <Form.Label>Bairro</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.neighborhood}
                                                                name="neighborhood"
                                                                isInvalid={!!errors.neighborhood && touched.neighborhood}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{touched.neighborhood && errors.neighborhood}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={2} controlId="formGridState">
                                                            <Form.Label>Estado</Form.Label>
                                                            <Form.Control
                                                                as="select"
                                                                onChange={(e) => {
                                                                    setFieldValue('state', e.target.value);

                                                                    handleCities(e.target.value);
                                                                }}
                                                                onBlur={handleBlur}
                                                                value={values.state ? values.state : '...'}
                                                                name="state"
                                                                isInvalid={!!errors.state && touched.state}
                                                            >
                                                                <option hidden>...</option>
                                                                {
                                                                    statesCities.estados.map((estado, index) => {
                                                                        return <option key={index} value={estado.sigla}>{estado.nome}</option>
                                                                    })
                                                                }
                                                            </Form.Control>
                                                            <Form.Control.Feedback type="invalid">{touched.state && errors.state}</Form.Control.Feedback>
                                                        </Form.Group>

                                                        <Form.Group as={Col} sm={4} controlId="formGridCity">
                                                            <Form.Label>Cidade</Form.Label>
                                                            <Form.Control
                                                                as="select"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.city ? values.city : '...'}
                                                                name="city"
                                                                isInvalid={!!errors.city && touched.city}
                                                                disabled={!!!values.state}
                                                            >
                                                                <option hidden>...</option>
                                                                {
                                                                    !!values.state && cities.map((city, index) => {
                                                                        return <option key={index} value={city}>{city}</option>
                                                                    })
                                                                }
                                                            </Form.Control>
                                                            <Form.Control.Feedback type="invalid">{touched.city && errors.city}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} sm={6} controlId="formGridType">
                                                            <Form.Label>Tipo</Form.Label>
                                                            <Form.Control
                                                                as="select"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.type}
                                                                name="type"
                                                                isInvalid={!!errors.type && touched.type}
                                                            >
                                                                <option hidden>...</option>
                                                                {
                                                                    customerTypes.map((type, index) => {
                                                                        return <option key={index} value={type.id}>{type.name}</option>
                                                                    })
                                                                }
                                                            </Form.Control>
                                                            <Form.Control.Feedback type="invalid">{touched.type && errors.type}</Form.Control.Feedback>
                                                        </Form.Group>
                                                    </Row>

                                                    <Row className="mb-3">
                                                        <Form.Group as={Col} controlId="formGridNotes">
                                                            <Form.Label>Observações</Form.Label>
                                                            <Form.Control
                                                                as="textarea"
                                                                rows={4}
                                                                style={{ resize: 'none' }}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                value={values.notes}
                                                                name="notes"
                                                            />
                                                        </Form.Group>
                                                    </Row>

                                                    <Col className="border-top mb-3"></Col>

                                                    <Row className="justify-content-end">
                                                        {
                                                            messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                <Col sm={1}>
                                                                    <Button variant="success" type="submit">Salvar</Button>
                                                                </Col>

                                                        }
                                                    </Row>
                                                </Form>
                                            )}
                                        </Formik>
                                    </Container>
                            }
                        </> :
                            <PageWaiting status="warning" message="Acesso negado!" />
                    }
                </>
            }
        </>
    )
}

export default NewCustomer;

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