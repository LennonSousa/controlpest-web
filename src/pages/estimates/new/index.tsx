import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, FormControl, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { FaCashRegister, FaClipboardList, FaMoneyBillWave, FaUserTie, FaPlus, FaSearchPlus } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Customer } from '../../../components/Customers';
import { EstimateStatus } from '../../../components/EstimateStatus';
import EstimateItems, { EstimateItem } from '../../../components/EstimateItems';
import { Service } from '../../../components/Services';

import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import SearchCustomers from '../../../components/Interfaces/SearchCustomers';
import NewEstimateItem from '../../../components/EstimateItems/New';

const validationSchema = Yup.object().shape({
    same_address: Yup.boolean().required('Obrigatório!'),
    zip_code: Yup.string().notRequired().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().required('Obrigatório!'),
    number: Yup.string().required('Obrigatório!'),
    neighborhood: Yup.string().required('Obrigatório!'),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    discount_percent: Yup.boolean().notRequired(),
    discount: Yup.string().required('Obrigatório!'),
    increase_percent: Yup.boolean().notRequired(),
    increase: Yup.string().required('Obrigatório!'),
    payment: Yup.string().notRequired().nullable(),
    expire_at: Yup.date().required('Obrigatório!'),
    finish_at: Yup.date().required('Obrigatório!'),
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
    const [servicesList, setServicesList] = useState<Service[]>([]);

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

    const [showNewEstimateItemModal, setShowNewEstimateItemModal] = useState(false);

    const handleCloseNewEstimateItemModal = () => setShowNewEstimateItemModal(false);
    const handleShowNewEstimateItemModal = () => setShowNewEstimateItemModal(true);

    const [subTotal, setSubTotal] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(true);
    const [discount, setDiscount] = useState(0);
    const [increasePercent, setIncreasePercent] = useState(true);
    const [increase, setIncrease] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

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

                api.get('services').then(res => {
                    setServicesList(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get services, ', err);

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

    useEffect(() => {
        if (selectedCustomer) {
            handleCities(selectedCustomer.state);
        }
    }, [selectedCustomer]);

    function handleCustomer(customer: Customer) {
        setSelectedCustomer(customer);

        setErrorSelectedCustomer(false);
        handleCloseSearchModal();
    }

    function handleCities(state: string) {
        const stateCities = statesCities.estados.find(item => { return item.sigla === state });

        if (stateCities)
            setCities(stateCities.cidades);
    }

    async function handleNewItemToList(newItem: EstimateItem) {
        const updatedListItems = [...estimateItemsList, newItem];

        setEstimateItemsList(updatedListItems);

        handleSubTotal(updatedListItems);
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
            const totalItem = Number(item.amount) * Number(item.price);

            newSubTotal = Number(newSubTotal) + Number(totalItem);
        });

        setSubTotal(newSubTotal);

        handleFinalTotal(newSubTotal, discountPercent, discount, increasePercent, increase);
    }

    function handleFinalTotal(subTotal: number, discount_percent: boolean, discount: number, increase_percent: boolean, increase: number) {
        // Discount and increase.
        let finalPrice = subTotal;

        if (discount_percent) finalPrice = subTotal - (subTotal * discount / 100);
        else finalPrice = subTotal - discount;

        if (increase > 0) {
            if (increase_percent) finalPrice = finalPrice + (finalPrice * increase / 100);
            else finalPrice = finalPrice + increase;
        }

        setFinalTotal(finalPrice);
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
                                                    same_address: true,
                                                    zip_code: selectedCustomer ? selectedCustomer.zip_code : '',
                                                    street: selectedCustomer ? selectedCustomer.street : '',
                                                    number: selectedCustomer ? selectedCustomer.number : '',
                                                    neighborhood: selectedCustomer ? selectedCustomer.neighborhood : '',
                                                    complement: selectedCustomer ? selectedCustomer.complement : '',
                                                    city: selectedCustomer ? selectedCustomer.city : '',
                                                    state: selectedCustomer ? selectedCustomer.state : '',
                                                    discount_percent: true,
                                                    discount: '0,00',
                                                    increase_percent: true,
                                                    increase: '0,00',
                                                    payment: '',
                                                    expire_at: format(new Date(), 'yyyy-MM-dd'),
                                                    finish_at: format(new Date(), 'yyyy-MM-dd'),
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
                                                            zip_code: values.zip_code,
                                                            street: values.street,
                                                            number: values.number,
                                                            neighborhood: values.neighborhood,
                                                            complement: values.complement,
                                                            city: values.city,
                                                            state: values.state,
                                                            discount_percent: values.discount_percent,
                                                            discount: Number(values.discount.replaceAll(".", "").replaceAll(",", ".")),
                                                            increase_percent: values.increase_percent,
                                                            increase: Number(values.increase.replaceAll(".", "").replaceAll(",", ".")),
                                                            payment: values.payment,
                                                            expire_at: `${values.expire_at} 12:00:00`,
                                                            finish_at: `${values.finish_at} 12:00:00`,
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
                                                enableReinitialize
                                            >
                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
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
                                                            <Col sm={6}>
                                                                <InputGroup>
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
                                                                <span className="invalid-feedback" style={{ display: 'block' }}>{errorSelectedCustomer && 'Obrigatório!'}</span>
                                                            </Col>

                                                            {
                                                                selectedCustomer && <>
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{
                                                                                    selectedCustomer.document.length > 14 ? "CNPJ" : "CPF"
                                                                                }</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{selectedCustomer.document}</h6>
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
                                                                                <h6 className="text-secondary">{format(new Date(selectedCustomer.birth), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </>
                                                            }
                                                        </Row>

                                                        {
                                                            selectedCustomer && <>
                                                                <Row className="mb-3">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Telefone comercial</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{selectedCustomer.phone}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.cellphone}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.email}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.contacts}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.owner}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">CEP</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{selectedCustomer.zip_code}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.street}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.number}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Complemento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{selectedCustomer.complement}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Bairro</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{selectedCustomer.neighborhood}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.city}</h6>
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
                                                                                <h6 className="text-secondary">{selectedCustomer.state}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <Form.Check
                                                                            id="same_address"
                                                                            type="switch"
                                                                            label="Mesmo local para prestação dos serviços?"
                                                                            checked={values.same_address}
                                                                            onChange={(e) => {
                                                                                setFieldValue('same_address', !values.same_address);

                                                                                if (e.target.checked) {
                                                                                    handleCities(selectedCustomer.city)

                                                                                    setFieldValue('zip_code', selectedCustomer.zip_code);
                                                                                    setFieldValue('street', selectedCustomer.street);
                                                                                    setFieldValue('number', selectedCustomer.number);
                                                                                    setFieldValue('neighborhood', selectedCustomer.neighborhood);
                                                                                    setFieldValue('complement', selectedCustomer.complement ? selectedCustomer.complement : '');
                                                                                    setFieldValue('state', selectedCustomer.state);
                                                                                    setFieldValue('city', selectedCustomer.city);

                                                                                    return
                                                                                }

                                                                                setFieldValue('zip_code', '');
                                                                                setFieldValue('street', '');
                                                                                setFieldValue('number', '');
                                                                                setFieldValue('neighborhood', '');
                                                                                setFieldValue('complement', '');
                                                                                setFieldValue('state', '');
                                                                                setFieldValue('city', '');

                                                                            }}
                                                                        />
                                                                    </Col>
                                                                </Row>

                                                                {
                                                                    !values.same_address && <>
                                                                        <Row>
                                                                            <Form.Group as={Col} lg={2} md={3} sm={3} controlId="formGridZipCode">
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
                                                                                        variant="success"
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
                                                                    </>
                                                                }
                                                            </>
                                                        }

                                                        <Col className="border-top mt-5 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col className="col-row">
                                                                        <h6 className="text-success">Itens <FaClipboardList /></h6>
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            onClick={handleShowNewEstimateItemModal}
                                                                            title="Adicionar um novo serviço a este orçamento."
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

                                                        <Col className="border-top mt-5 mb-3"></Col>

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
                                                            <Form.Group as={Col} sm={2} controlId="formGridPreSystemPrice">
                                                                <Form.Label>Subtotal</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupPreSystemPrice">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(String(subTotal.toFixed(2)))}
                                                                        name="pre_system_value"
                                                                        aria-label="Valor do sistema "
                                                                        aria-describedby="btnGroupPreSystemPrice"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridDiscount">
                                                                <Form.Label>Desconto</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupDiscount">
                                                                        <Form.Control
                                                                            as="select"
                                                                            style={{ padding: '0 0.3rem', textAlign: 'center' }}
                                                                            onChange={() => {
                                                                                setDiscountPercent(!values.discount_percent)

                                                                                handleFinalTotal(
                                                                                    subTotal,
                                                                                    !values.discount_percent,
                                                                                    discount,
                                                                                    increasePercent,
                                                                                    increase
                                                                                );

                                                                                setFieldValue('discount_percent', !values.discount_percent);
                                                                            }}
                                                                            value={values.discount_percent ? 'percent' : 'money'}
                                                                            name="discount_percent"
                                                                            isInvalid={!!errors.discount_percent && touched.discount_percent}
                                                                        >
                                                                            <option value="percent">%</option>
                                                                            <option value="money">R$</option>
                                                                        </Form.Control>
                                                                    </InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            const newDiscount = Number(
                                                                                prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", ".")
                                                                            );

                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));

                                                                            setDiscount(newDiscount);

                                                                            handleFinalTotal(
                                                                                subTotal,
                                                                                discountPercent,
                                                                                newDiscount,
                                                                                increasePercent,
                                                                                increase
                                                                            );
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

                                                            <Form.Group as={Col} sm={2} controlId="formGridIncrease">
                                                                <Form.Label>Acréscimo</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupIncrease">
                                                                        <Form.Control
                                                                            as="select"
                                                                            style={{ padding: '0 0.3rem', textAlign: 'center' }}
                                                                            onChange={() => {
                                                                                setIncreasePercent(!values.increase_percent);

                                                                                handleFinalTotal(
                                                                                    subTotal,
                                                                                    discountPercent,
                                                                                    discount,
                                                                                    !values.increase_percent,
                                                                                    increase
                                                                                );

                                                                                setFieldValue('increase_percent', !values.increase_percent);
                                                                            }}
                                                                            value={values.increase_percent ? 'percent' : 'money'}
                                                                            name="increase_percent"
                                                                            isInvalid={!!errors.increase_percent && touched.increase_percent}
                                                                        >
                                                                            <option value="percent">%</option>
                                                                            <option value="money">R$</option>
                                                                        </Form.Control>
                                                                    </InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            const newIncrease = Number(
                                                                                prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", ".")
                                                                            );

                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));

                                                                            setIncrease(newIncrease);

                                                                            handleFinalTotal(
                                                                                subTotal,
                                                                                discountPercent,
                                                                                discount,
                                                                                increasePercent,
                                                                                newIncrease,
                                                                            );
                                                                        }}
                                                                        value={values.increase}
                                                                        name="increase"
                                                                        isInvalid={!!errors.increase && touched.increase}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupIncrease"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.increase && errors.increase}</Form.Control.Feedback>
                                                            </Form.Group >

                                                            <Form.Group as={Col} sm={2} controlId="formGridTotal">
                                                                <h6 className="text-success">Valor final <FaMoneyBillWave /></h6>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupTotal">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(String(finalTotal.toFixed(2)))}
                                                                        name="total"
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupTotal"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.increase && errors.increase}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridPayment">
                                                                <Form.Label>Pagamento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Descreva o pagamento"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.payment}
                                                                    name="payment"
                                                                    isInvalid={!!errors.payment && touched.payment}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.payment && errors.payment}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridExpireAt">
                                                                <Form.Label>Validade do orçamento</Form.Label>
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

                                                            <Form.Group as={Col} sm={3} controlId="formGridFinishAt">
                                                                <Form.Label>Previsão de entrega</Form.Label>
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

                                                            <Form.Group as={Col} sm={6} controlId="formGridStatus">
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
                                                                        <Button
                                                                            variant="success"
                                                                            onClick={() => {
                                                                                if (!selectedCustomer) {
                                                                                    setErrorSelectedCustomer(true);

                                                                                    return;
                                                                                }

                                                                                setErrorSelectedCustomer(false);
                                                                            }}
                                                                            type="submit"
                                                                        >
                                                                            Salvar
                                                                        </Button>
                                                                    </Col>

                                                            }
                                                        </Row>
                                                    </Form >
                                                )
                                                }
                                            </Formik >

                                            <NewEstimateItem
                                                show={showNewEstimateItemModal}
                                                servicesList={servicesList}
                                                estimateItemsList={estimateItemsList}
                                                handleNewItemToList={handleNewItemToList}
                                                handleCloseNewEstimateItemModal={handleCloseNewEstimateItemModal}
                                            />

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