import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, FormControl, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { FaCashRegister, FaClipboardList, FaCopy, FaMoneyBillWave, FaUserTie, FaPlug, FaPlus, FaSearchPlus, FaSolarPanel } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Customer } from '../../../components/Customers';
import { EstimateStatus } from '../../../components/EstimateStatus';
import EstimateItems, { EstimateItem } from '../../../components/EstimateItems';
import { Product } from '../../../components/Products';

import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import SearchCustomers from '../../../components/Interfaces/SearchCustomers';

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
    same_address: Yup.boolean().required('Obrigatório!'),
    phone: Yup.string().notRequired(),
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
    discount: Yup.string().required('Obrigatório!'),
    increase: Yup.string().required('Obrigatório!'),
    percent: Yup.boolean().notRequired(),
    notes: Yup.string().notRequired().nullable(),
    user: Yup.string().notRequired().nullable(),
    status: Yup.string().required('Obrigatório!'),
});

const NewEstimate: NextPage = () => {
    const router = useRouter();
    const { customer } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
    const [errorSelectedCustomer, setErrorSelectedCustomer] = useState(false);

    const [estimateStatusList, setEstimateStatusList] = useState<EstimateStatus[]>([]);
    const [estimateItemsList, setEstimateItemsList] = useState<EstimateItem[]>([]);
    const [productsList, setProductsList] = useState<Product[]>([]);

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [cities, setCities] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    const [totalPrice, setTotalPrice] = useState(0);
    const [finalTotalPrice, setFinalTotalPrice] = useState(0);

    // New items.
    const [details, setDetails] = useState("");
    const [price, setPrice] = useState(0);
    const [amount, setAmount] = useState(0);
    const [newItemTotalPrice, setNewItemTotalPrice] = useState(0);

    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => setShowModalEditType(false);
    const handleShowModalEditType = () => { handleResetFieldsNewItem; setShowModalEditType(true); };

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-new');

        if (user) {
            if (can(user, "estimates", "create")) {
                api.get('estimates/status').then(res => {
                    setEstimateStatusList(res.data);
                }).catch(err => {
                    console.log('Error to get estimates status, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('products').then(res => {
                    setProductsList(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get products, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                if (customer) {
                    api.get(`customers/${customer}`).then(res => {
                        setSelectedCustomer(res.data);
                    }).catch(err => {
                        console.log('Error to get customer on estimate, ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }

    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleCustomer(customer: Customer) {
        setSelectedCustomer(customer);

        setErrorSelectedCustomer(false);
        handleCloseSearchModal();
    }

    async function handleNewItemToList(newItem: EstimateItem) {
        const updatedListItems = [...estimateItemsList, newItem];

        setEstimateItemsList(updatedListItems);

        handleSubTotal(updatedListItems);
    }

    function handleNewItemTotalPrice(price: number, amount: number) {
        const total = price * amount;

        setNewItemTotalPrice(total);
    }

    const handleResetFieldsNewItem = () => {
        setDetails('');
        setAmount(0);
        setPrice(0);
    }

    async function handleListItems(updatedNewItem?: EstimateItem, toDelete?: boolean) {
        if (updatedNewItem) {
            let updatedListItems = estimateItemsList;

            if (toDelete) {
                updatedListItems = updatedListItems.filter(item => {
                    return item.id !== updatedNewItem.id;
                });

                updatedListItems = updatedListItems.map((item, index) => {
                    return {
                        ...item,
                        id: String(index),
                    };
                });

                setEstimateItemsList(updatedListItems);

                handleSubTotal(updatedListItems);

                return;
            }

            updatedListItems = updatedListItems.map(item => {
                if (item.id === updatedNewItem.id) return updatedNewItem;

                return item;
            });

            setEstimateItemsList(updatedListItems);

            handleSubTotal(updatedListItems);
        }
    }

    function handleSubTotal(listItems: EstimateItem[]) {
        let newSubTotal = 0;

        listItems.forEach(item => {
            const totalItem = item.amount * item.price;

            newSubTotal = Number(newSubTotal) + Number(totalItem);
        });

        setTotalPrice(newSubTotal);
    }

    function handleFinalTotal(subTotal: number, percent: boolean, discount: number, increase: number) {
        // Discount and increase.
        let finalPrice = subTotal - (subTotal * discount / 100);

        if (!percent) finalPrice = subTotal - discount;

        if (increase > 0) {
            finalPrice = subTotal + (subTotal * increase / 100);

            if (!percent) finalPrice = subTotal + increase;
        }

        setFinalTotalPrice(finalPrice);
    }

    return (
        <>
            <NextSeo
                title="Criar orçamento"
                description={`Criar orçamento da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Criar orçamento',
                    description: `Criar orçamento da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Criar orçamento | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Row className="mb-3">
                                                <Col>
                                                    <PageBack href="/estimates" subTitle="Voltar para a lista de orçamentos" />
                                                </Col>
                                            </Row>

                                            <Formik
                                                initialValues={{
                                                    customer: '',
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
                                                    discount: '0,00',
                                                    increase: '0,00',
                                                    percent: true,
                                                    notes: '',
                                                    user: user.id,
                                                    status: '',
                                                }}
                                                onSubmit={async values => {
                                                    if (!selectedCustomer) {
                                                        setErrorSelectedCustomer(true);
                                                        return;
                                                    }

                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {
                                                        const items = estimateItemsList.map((item, index) => {
                                                            return {
                                                                name: item.name,
                                                                details: item.details,
                                                                price: item.price,
                                                                amount: item.amount,
                                                                order: index,
                                                            }
                                                        });

                                                        const res = await api.post('estimates', {
                                                            customer: selectedCustomer.id,
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
                                                            discount: values.discount,
                                                            increase: values.increase,
                                                            percent: values.percent,
                                                            notes: values.notes,
                                                            user: values.user,
                                                            status: values.status,
                                                            items,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push(`/estimates/details/${res.data.id}`)
                                                        }, 1000);
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
                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, setValues, values, errors, touched }) => (
                                                    <Form onSubmit={handleSubmit}>
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Cliente <FaUserTie /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col sm={8}>
                                                                <Form.Label>Cliente</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <FormControl
                                                                        placeholder="Escolha um cliente"
                                                                        type="name"
                                                                        value={selectedCustomer ? selectedCustomer.name : ''}
                                                                        name="customer"
                                                                        aria-label="Nome do cliente"
                                                                        aria-describedby="btnGroupAddon"
                                                                        isInvalid={errorSelectedCustomer}
                                                                        readOnly
                                                                    />
                                                                    <Button
                                                                        id="btnGroupAddon"
                                                                        variant="success"
                                                                        onClick={handleShowSearchModal}
                                                                    >
                                                                        <FaSearchPlus />
                                                                    </Button>
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{errorSelectedCustomer && 'Obrigatório!'}</Form.Control.Feedback>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridZipCode">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="00000000"
                                                                    autoComplete="off"
                                                                    onChange={(e) => {
                                                                        handleChange(e);

                                                                        if (e.target.value !== '' && e.target.value.length === 8) {
                                                                            setSpinnerCep(true);
                                                                            cep(e.target.value)
                                                                                .then((cep: CEP) => {
                                                                                    const { street, neighborhood, city, state } = cep;

                                                                                    const stateCities = statesCities.estados.find(item => { return item.sigla === state })

                                                                                    if (stateCities)
                                                                                        setCities(stateCities.cidades);

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

                                                                        const stateCities = statesCities.estados.find(item => { return item.sigla === e.target.value })

                                                                        if (stateCities)
                                                                            setCities(stateCities.cidades);
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

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Consumo <FaPlug /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row>
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Itens <FaClipboardList /></h6>
                                                                    </Col>

                                                                    <Col sm={1}>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            onClick={handleShowModalEditType}
                                                                            title="Adicionar um novo produto a este orçamento."
                                                                        >
                                                                            <FaPlus />
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col sm={1}><h6 className="text-secondary">Quantidade</h6></Col>
                                                            <Col sm={3}><h6 className="text-secondary">Produto</h6></Col>
                                                            <Col sm={3}><h6 className="text-secondary">Detalhes</h6></Col>
                                                            <Col sm={2}><h6 className="text-secondary">Unitário</h6></Col>
                                                            <Col sm={2}><h6 className="text-secondary">Total</h6></Col>
                                                        </Row>

                                                        {
                                                            estimateItemsList && estimateItemsList.map(estimateItem => {
                                                                return <EstimateItems
                                                                    key={estimateItem.id}
                                                                    estimateItem={estimateItem}
                                                                    handleListItems={handleListItems}
                                                                    isNewItem
                                                                />
                                                            })
                                                        }

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Valores <FaCashRegister /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="align-items-center">
                                                            <Form.Group as={Col} sm={3} controlId="formGridPreSystemPrice">
                                                                <Form.Label>Subtotal</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupPreSystemPrice">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={() => {
                                                                            handleFinalTotal(
                                                                                totalPrice,
                                                                                values.percent,
                                                                                Number(values.discount.replaceAll(".", "").replaceAll(",", ".")),
                                                                                Number(values.increase.replaceAll(".", "").replaceAll(",", "."))
                                                                            )
                                                                        }}
                                                                        value={prettifyCurrency(String(totalPrice.toFixed(2)))}
                                                                        name="pre_system_value"
                                                                        aria-label="Valor do sistema "
                                                                        aria-describedby="btnGroupPreSystemPrice"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Desconto</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.discount}
                                                                        name="discount"
                                                                        isInvalid={!!errors.discount && touched.discount}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.discount && errors.discount}</Form.Control.Feedback>
                                                            </Form.Group >

                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Acréscimo</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.increase}
                                                                        name="increase"
                                                                        isInvalid={!!errors.increase && touched.increase}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.increase && errors.increase}</Form.Control.Feedback>
                                                            </Form.Group >
                                                        </Row >

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Valor final <FaMoneyBillWave /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="align-items-end">
                                                            <Form.Group as={Col} sm={3} controlId="formGridFinalSystemPrice">
                                                                <InputGroup>
                                                                    <InputGroup.Text id="btnGroupFinalSystemPrice">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(String(finalTotalPrice.toFixed(2)))}
                                                                        name="pre_system_value"
                                                                        aria-label="Valor do orçamento "
                                                                        aria-describedby="btnGroupFinalSystemPrice"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridStatus">
                                                                <Form.Label>Fase</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.status}
                                                                    name="status"
                                                                    isInvalid={!!errors.status && touched.status}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        estimateStatusList.map((status, index) => {
                                                                            return <option key={index} value={status.id}>{status.name}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.status && errors.status}</Form.Control.Feedback>
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
                                                    </Form >
                                                )
                                                }
                                            </Formik >

                                            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                                                <Modal.Header closeButton>
                                                    <Modal.Title>Adicionar produto</Modal.Title>
                                                </Modal.Header>
                                                <Formik
                                                    initialValues={
                                                        {
                                                            name: '',
                                                            details,
                                                            amount: prettifyCurrency(String(amount)),
                                                            price: prettifyCurrency(String(price)),
                                                        }
                                                    }
                                                    onSubmit={async values => {
                                                        setTypeMessage("waiting");
                                                        setMessageShow(true);

                                                        try {
                                                            const newItem: EstimateItem = {
                                                                id: String(estimateItemsList.length),
                                                                name: values.name,
                                                                details: values.details,
                                                                price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                                                amount: Number(values.amount.replaceAll(".", "").replaceAll(",", ".")),
                                                                order: estimateItemsList.length,
                                                            }

                                                            handleNewItemToList(newItem);

                                                            setTypeMessage("success");

                                                            setTimeout(() => {
                                                                setMessageShow(false);
                                                                handleCloseModalEditType();
                                                            }, 1000);
                                                        }
                                                        catch (err) {
                                                            console.log('error edit estimate item.');
                                                            console.log(err);

                                                            setTypeMessage("error");

                                                            setTimeout(() => {
                                                                setMessageShow(false);
                                                            }, 4000);
                                                        }
                                                    }}
                                                    validationSchema={validationSchema}
                                                >
                                                    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                                        <Form onSubmit={handleSubmit}>
                                                            <Modal.Body>
                                                                <Form.Group controlId="estimateItemFormGridName">
                                                                    <Form.Label>Produto</Form.Label>
                                                                    <Form.Control
                                                                        as="select"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.name}
                                                                        name="name"
                                                                        isInvalid={!!errors.name && touched.name}
                                                                    >
                                                                        <option hidden>...</option>
                                                                        {
                                                                            productsList.map((product, index) => {
                                                                                return <option key={index} value={product.title}>{`${product.title} - R$ ${prettifyCurrency(String(product.price))}`}</option>
                                                                            })
                                                                        }
                                                                    </Form.Control>
                                                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                                </Form.Group>

                                                                <Form.Group controlId="estimateItemFormGridDetails">
                                                                    <Form.Label>Detalhes</Form.Label>
                                                                    <Form.Control type="text"
                                                                        placeholder="Detalhes do item (opcional)."
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.details}
                                                                        name="details"
                                                                        isInvalid={!!errors.details && touched.details}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.details && errors.details}</Form.Control.Feedback>
                                                                    <Form.Text className="text-muted text-right">{`${values.details.length}/50 caracteres.`}</Form.Text>
                                                                </Form.Group>

                                                                <Row className="mb-3">
                                                                    <Form.Group as={Col} sm={4} controlId="estimateItemFormGridPrice">
                                                                        <Form.Label>Preço</Form.Label>
                                                                        <InputGroup>
                                                                            <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                                                            <Form.Control
                                                                                type="text"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('price', prettifyCurrency(e.target.value));

                                                                                    const price = Number(e.target.value.replaceAll(".", "").replaceAll(",", "."));
                                                                                    const amount = Number(values.amount.replaceAll(".", "").replaceAll(",", "."));

                                                                                    handleNewItemTotalPrice(price, amount);
                                                                                }}
                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                                                }}
                                                                                value={values.price}
                                                                                name="price"
                                                                                isInvalid={!!errors.price && touched.price}
                                                                                aria-label="Valor do item"
                                                                                aria-describedby="btnGroupPrice"
                                                                            />
                                                                        </InputGroup>
                                                                        <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                                                    </Form.Group>

                                                                    <Form.Group as={Col} sm={4} controlId="estimateItemFormGridAmount">
                                                                        <Form.Label>Quantidade</Form.Label>
                                                                        <InputGroup>
                                                                            <InputGroup.Text id="btnGroupAmount">Un</InputGroup.Text>
                                                                            <Form.Control
                                                                                type="text"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('amount', prettifyCurrency(e.target.value));

                                                                                    const price = Number(values.price.replaceAll(".", "").replaceAll(",", "."));
                                                                                    const amount = Number(e.target.value.replaceAll(".", "").replaceAll(",", "."));

                                                                                    handleNewItemTotalPrice(price, amount);
                                                                                }}
                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                    setFieldValue('amount', prettifyCurrency(e.target.value));
                                                                                }}
                                                                                value={values.amount}
                                                                                name="amount"
                                                                                isInvalid={!!errors.amount && touched.amount}
                                                                                aria-label="Valor do item"
                                                                                aria-describedby="btnGroupAmount"
                                                                            />
                                                                        </InputGroup>
                                                                        <Form.Control.Feedback type="invalid">{touched.amount && errors.amount}</Form.Control.Feedback>
                                                                    </Form.Group>

                                                                    <Form.Group as={Col} sm={4} controlId="estimateItemFormGridTotal">
                                                                        <Form.Label>Total</Form.Label>
                                                                        <InputGroup>
                                                                            <InputGroup.Text id="btnGroupTotal">R$</InputGroup.Text>
                                                                            <Form.Control
                                                                                type="text"
                                                                                value={prettifyCurrency(String(newItemTotalPrice))}
                                                                                name="total"
                                                                                readOnly
                                                                                aria-label="Total do item"
                                                                                aria-describedby="btnGroupTotal"
                                                                            />
                                                                        </InputGroup>
                                                                    </Form.Group>
                                                                </Row>
                                                            </Modal.Body>
                                                            <Modal.Footer>
                                                                {
                                                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                                                        <>
                                                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                        </>

                                                                }
                                                            </Modal.Footer>
                                                        </Form>
                                                    )}
                                                </Formik>
                                            </Modal>

                                            <SearchCustomers
                                                show={showSearchModal}
                                                handleCustomer={handleCustomer}
                                                handleCloseSearchModal={handleCloseSearchModal}
                                            />
                                        </Container >
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default NewEstimate;

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