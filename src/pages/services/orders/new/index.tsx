import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Badge, Button, Col, Container, Form, FormControl, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import {
    FaBuilding,
    FaCashRegister,
    FaClipboardList,
    FaMoneyBillWave,
    FaUserTie,
    FaPlus,
    FaSearchPlus,
    FaSpider,
    FaSkullCrossbones,
} from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Customer } from '../../../../components/Customers';
import { Service } from '../../../../components/Services';
import NewServiceOrderItem from '../../../../components/ServiceOrderItems/New';
import ServiceOrderItems, { ServiceOrderItem } from '../../../../components/ServiceOrderItems';
import { PragueType } from '../../../../components/PragueTypes';
import { BuildType } from '../../../../components/BuildTypes';
import { TreatmentType } from '../../../../components/TreatmentTypes';
import ServiceBuildTypes, { ServiceBuildType, addServiceBuild } from '../../../../components/ServiceBuildTypes';
import ServicePragueTypes, { ServicePragueType, addServicePrague } from '../../../../components/ServicePragueTypes';
import ServiceTreatmentTypes, { ServiceTreatmentType, addServiceTreatment } from '../../../../components/ServiceTreatmentTypes';

import { statesCities } from '../../../../components/StatesCities';
import PageBack from '../../../../components/PageBack';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../../components/InputMask/masks';
import SearchCustomers from '../../../../components/Interfaces/SearchCustomers';

const validationSchema = Yup.object().shape({
    same_address: Yup.boolean().required('Obrigatório!'),
    zip_code: Yup.string().notRequired().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().required('Obrigatório!'),
    number: Yup.string().required('Obrigatório!'),
    neighborhood: Yup.string().required('Obrigatório!'),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    other_prague_type: Yup.string().notRequired().nullable(),
    other_treatment_type: Yup.string().notRequired().nullable(),
    other_build_type: Yup.string().notRequired().nullable(),
    build_description: Yup.string().notRequired().nullable(),
    animals: Yup.boolean().notRequired(),
    old_people: Yup.boolean().notRequired(),
    allergic_people: Yup.boolean().notRequired(),
    value: Yup.number().notRequired(),
    payment: Yup.string().notRequired().nullable(),
    warranty: Yup.string().notRequired().nullable(),
    notes: Yup.string().notRequired().nullable(),
    start_at: Yup.date().required('Obrigatório!'),
    finish_at: Yup.date().required('Obrigatório!'),
    user: Yup.string().notRequired().nullable(),
});

const NewServiceOrder: NextPage = () => {
    const router = useRouter();
    const { customer } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
    const [errorSelectedCustomer, setErrorSelectedCustomer] = useState(false);

    const [serviceOrderItemsList, setServiceOrderItemsList] = useState<ServiceOrderItem[]>([]);
    const [servicesList, setServicesList] = useState<Service[]>([]);

    const [pragueTypesList, setPragueTypesList] = useState<PragueType[]>([]);
    const [treatmentTypesList, setTreatmentTypesList] = useState<TreatmentType[]>([]);
    const [buildTypesList, setBuildTypesList] = useState<BuildType[]>([]);

    const [servicePragueTypesList, setServicePragueTypesList] = useState<ServicePragueType[]>([]);
    const [serviceTreatmentTypesList, setServiceTreatmentTypesList] = useState<ServiceTreatmentType[]>([]);
    const [serviceBuildTypesList, setServiceBuildTypesList] = useState<ServiceBuildType[]>([]);

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

    const [showNewServiceOrderItemModal, setShowNewServiceOrderItemModal] = useState(false);

    const handleCloseNewServiceOrderItemModal = () => setShowNewServiceOrderItemModal(false);
    const handleShowNewServiceOrderItemModal = () => setShowNewServiceOrderItemModal(true);

    useEffect(() => {
        handleItemSideBar('services');
        handleSelectedMenu('services-orders-new');

        if (user) {
            if (can(user, "services", "create")) {
                api.get('services').then(res => {
                    setServicesList(res.data);
                }).catch(err => {
                    console.log('Error to get services, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('prague-types').then(res => {
                    setPragueTypesList(res.data);
                }).catch(err => {
                    console.log('Error to get prague types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('treatment-types').then(res => {
                    setTreatmentTypesList(res.data);
                }).catch(err => {
                    console.log('Error to get treatment types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('build-types').then(res => {
                    setBuildTypesList(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get build types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                if (customer) {
                    api.get(`customers/${customer}`).then(res => {
                        setSelectedCustomer(res.data);
                    }).catch(err => {
                        console.log('Error to get customer on serviceOrder, ', err);

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

    async function handleNewItemToList(newItem: ServiceOrderItem) {
        const updatedListItems = [...serviceOrderItemsList, newItem];

        setServiceOrderItemsList(updatedListItems);
    }

    async function handleNewServicePragueTypeToList(pragueType: PragueType) {
        setServicePragueTypesList(addServicePrague(pragueType, servicePragueTypesList.length, servicePragueTypesList));
    }

    async function handleNewServiceTreatmentTypeToList(treatmentType: TreatmentType) {
        setServiceTreatmentTypesList(addServiceTreatment(treatmentType, serviceTreatmentTypesList.length, serviceTreatmentTypesList));
    }

    async function handleNewServiceBuildTypeToList(buildType: BuildType) {
        setServiceBuildTypesList(addServiceBuild(buildType, serviceBuildTypesList.length, serviceBuildTypesList));
    }

    function handleServicePragueTypesList(servicePragueType: ServicePragueType) {
        const updatedListItems = servicePragueTypesList.filter(item => {
            return item.id !== servicePragueType.id;
        });

        setServicePragueTypesList(updatedListItems);
    }

    function handleServiceTreatmentTypesList(serviceTreatmentType: ServiceTreatmentType) {
        const updatedListItems = serviceTreatmentTypesList.filter(item => {
            return item.id !== serviceTreatmentType.id;
        });

        setServiceTreatmentTypesList(updatedListItems);
    }

    function handleServiceBuildTypesList(serviceBuildType: ServiceBuildType) {
        const updatedListItems = serviceBuildTypesList.filter(item => {
            return item.id !== serviceBuildType.id;
        });

        setServiceBuildTypesList(updatedListItems);
    }

    async function handleListItems(updatedNewItem?: ServiceOrderItem, toDelete?: boolean) {
        if (updatedNewItem) {
            let updatedListItems = serviceOrderItemsList;

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

                setServiceOrderItemsList(updatedListItems);

                return;
            }

            updatedListItems = updatedListItems.map(item => {
                if (item.id === updatedNewItem.id) return updatedNewItem;

                return item;
            });

            setServiceOrderItemsList(updatedListItems);
        }
    }

    return (
        <>
            <NextSeo
                title="Criar ordem de serviço"
                description={`Criar ordem de serviço da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Criar ordem de serviço',
                    description: `Criar ordem de serviço da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Criar ordem de serviço | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "services", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Row className="mb-3">
                                                <Col>
                                                    <PageBack href="/services-orders" subTitle="Voltar para a lista de ordens de serviço" />
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
                                                    other_prague_type: '',
                                                    other_treatment_type: '',
                                                    build_description: '',
                                                    animals: false,
                                                    old_people: false,
                                                    allergic_people: false,
                                                    value: '0,00',
                                                    payment: '',
                                                    warranty: '',
                                                    notes: '',
                                                    start_at: format(new Date(), 'yyyy-MM-dd'),
                                                    finish_at: format(new Date(), 'yyyy-MM-dd'),
                                                    user: user.id,
                                                }}
                                                onSubmit={async values => {
                                                    if (!selectedCustomer) {
                                                        setErrorSelectedCustomer(true);
                                                        return;
                                                    }

                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {
                                                        const items = serviceOrderItemsList.map((item, index) => {
                                                            return {
                                                                name: item.name,
                                                                details: item.details,
                                                                amount: item.amount,
                                                                order: index,
                                                            }
                                                        });

                                                        const res = await api.post('services-orders', {
                                                            same_address: values.same_address,
                                                            zip_code: values.zip_code,
                                                            street: values.street,
                                                            number: values.number,
                                                            neighborhood: values.neighborhood,
                                                            complement: values.complement,
                                                            city: values.city,
                                                            state: values.state,
                                                            other_prague_type: values.other_prague_type,
                                                            other_treatment_type: values.other_treatment_type,
                                                            build_description: values.build_description,
                                                            animals: values.animals,
                                                            old_people: values.old_people,
                                                            allergic_people: values.allergic_people,
                                                            value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                                            payment: values.payment,
                                                            warranty: values.warranty,
                                                            notes: values.notes,
                                                            start_at: `${values.start_at} 12:00:00`,
                                                            finish_at: `${values.finish_at} 12:00:00`,
                                                            user: values.user,
                                                            customer: selectedCustomer.id,
                                                            items,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push(`/services-orders/details/${res.data.id}`)
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
                                                                        <h6 className="text-success">Tipos de pragas <FaSpider /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                {
                                                                    pragueTypesList.map((pragueType, index) => {
                                                                        const foundServicePragueType = servicePragueTypesList.find(item => { return item.prague.id === pragueType.id });

                                                                        if (foundServicePragueType) {
                                                                            return <ServicePragueTypes
                                                                                key={index}
                                                                                servicePragueType={foundServicePragueType}
                                                                                handleServicePragueTypesList={handleServicePragueTypesList}
                                                                            />
                                                                        }

                                                                        return <Badge
                                                                            key={index}
                                                                            className="badge-item-type"
                                                                            bg="light"
                                                                            text="dark"
                                                                            onClick={() => handleNewServicePragueTypeToList(pragueType)}
                                                                        >
                                                                            {pragueType.name}
                                                                        </Badge>
                                                                    })
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridPragueType">
                                                                <Form.Label>EM CASO DE OUTRO TIPO DE PRAGA, ESPECIFICAR:</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Outros tipos"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.other_prague_type}
                                                                    name="other_prague_type"
                                                                    isInvalid={!!errors.other_prague_type && touched.other_prague_type}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.other_prague_type && errors.other_prague_type}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mt-5 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col className="col-row">
                                                                        <h6 className="text-success">Tipo do trabamento/produto <FaSkullCrossbones /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                {
                                                                    treatmentTypesList.map((treatmentType, index) => {
                                                                        const foundServiceTreatmentType = serviceTreatmentTypesList.find(item => { return item.treatment.id === treatmentType.id });

                                                                        if (foundServiceTreatmentType) {
                                                                            return <ServiceTreatmentTypes
                                                                                key={index}
                                                                                serviceTreatmentType={foundServiceTreatmentType}
                                                                                handleServiceTreatmentTypesList={handleServiceTreatmentTypesList}
                                                                            />
                                                                        }

                                                                        return <Badge
                                                                            key={index}
                                                                            className="badge-item-type"
                                                                            bg="light"
                                                                            text="dark"
                                                                            onClick={() => handleNewServiceTreatmentTypeToList(treatmentType)}
                                                                        >
                                                                            {treatmentType.name}
                                                                        </Badge>
                                                                    })
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridTreatmentType">
                                                                <Form.Label>EM CASO DE OUTRO TRATAMENTO OU PRODUTO, ESPECIFICAR:</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Outros tipos"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.other_treatment_type}
                                                                    name="other_treatment_type"
                                                                    isInvalid={!!errors.other_treatment_type && touched.other_treatment_type}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.other_treatment_type && errors.other_treatment_type}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mt-5 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col className="col-row">
                                                                        <h6 className="text-success">Tipo do estabelecimento <FaBuilding /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                {
                                                                    buildTypesList.map((buildType, index) => {
                                                                        const foundServiceBuildType = serviceBuildTypesList.find(item => { return item.build.id === buildType.id });

                                                                        if (foundServiceBuildType) {
                                                                            return <ServiceBuildTypes
                                                                                key={index}
                                                                                serviceBuildType={foundServiceBuildType}
                                                                                handleServiceBuildTypesList={handleServiceBuildTypesList}
                                                                            />
                                                                        }

                                                                        return <Badge
                                                                            key={index}
                                                                            className="badge-item-type"
                                                                            bg="light"
                                                                            text="dark"
                                                                            onClick={() => handleNewServiceBuildTypeToList(buildType)}
                                                                        >
                                                                            {buildType.name}
                                                                        </Badge>
                                                                    })
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridBuildDescription">
                                                                <Form.Label>Descrição do local</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Descreva o tipo de local"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.build_description}
                                                                    name="build_description"
                                                                    isInvalid={!!errors.build_description && touched.build_description}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.build_description && errors.build_description}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="animals"
                                                                    label="Animais no local?"
                                                                    checked={values.animals}
                                                                    onChange={() => { setFieldValue('animals', !values.animals) }}
                                                                />
                                                            </Col>

                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="old_people"
                                                                    label="Pessoas idosas?"
                                                                    checked={values.old_people}
                                                                    onChange={() => { setFieldValue('old_people', !values.old_people) }}
                                                                />
                                                            </Col>

                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="allergic_people"
                                                                    label="Pessoas alérgicas?"
                                                                    checked={values.allergic_people}
                                                                    onChange={() => { setFieldValue('allergic_people', !values.allergic_people) }}
                                                                />
                                                            </Col>
                                                        </Row>

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
                                                                            onClick={handleShowNewServiceOrderItemModal}
                                                                            title="Adicionar um novo serviço a este ordem de serviço."
                                                                        >
                                                                            <FaPlus />
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col sm={2}><h6 className="text-secondary">Quantidade</h6></Col>
                                                            <Col sm={4}><h6 className="text-secondary">Produto</h6></Col>
                                                            <Col sm={5}><h6 className="text-secondary">Detalhes</h6></Col>
                                                        </Row>

                                                        {
                                                            serviceOrderItemsList && serviceOrderItemsList.map(serviceOrderItem => {
                                                                return <ServiceOrderItems
                                                                    key={serviceOrderItem.id}
                                                                    serviceOrderItem={serviceOrderItem}
                                                                    servicesList={servicesList}
                                                                    handleListItems={handleListItems}
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
                                                            <Form.Group as={Col} sm={2} controlId="formGridTotal">
                                                                <h6 className="text-success">Valor do serviço <FaMoneyBillWave /></h6>
                                                                <InputGroup>
                                                                    <InputGroup.Text id="btnGroupTotal">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('value', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            setFieldValue('value', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={prettifyCurrency(values.value)}
                                                                        name="value"
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupValue"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.value && errors.value}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={10} controlId="formGridPayment">
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
                                                            <Form.Group as={Col} controlId="formGridPayment">
                                                                <Form.Label>Garantia</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Descreva a garantia do serviço"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.warranty}
                                                                    name="warranty"
                                                                    isInvalid={!!errors.warranty && touched.warranty}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.warranty && errors.warranty}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridExpireAt">
                                                                <Form.Label>Início do serviço</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.start_at}
                                                                    name="start_at"
                                                                    isInvalid={!!errors.start_at && touched.start_at}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.start_at && errors.start_at}</Form.Control.Feedback>
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

                                            <NewServiceOrderItem
                                                show={showNewServiceOrderItemModal}
                                                servicesList={servicesList}
                                                serviceOrderItemsList={serviceOrderItemsList}
                                                handleNewItemToList={handleNewItemToList}
                                                handleCloseNewServiceOrderItemModal={handleCloseNewServiceOrderItemModal}
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

export default NewServiceOrder;

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