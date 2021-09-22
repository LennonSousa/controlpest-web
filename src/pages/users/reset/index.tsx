import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, Image, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';
import Cookies from 'js-cookie';

import api from '../../../api/api';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

import styles from '../../../styles/Home.module.css';

const validationSchema = Yup.object().shape({
    email: Yup.string().email('E-mail inválido!').required('Obrigatório!'),
});

const NewCustomer: NextPage = () => {
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModal, setShowModal] = useState(false);

    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = () => setShowModal(true);

    useEffect(() => {
        Cookies.remove('user');
        Cookies.remove('token');
    }, []);

    return (
        <>
            <NextSeo
                title="Recuperar senha"
                description={`Recuperar senha da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
                openGraph={{
                    url: process.env.NEXT_PUBLIC_APP_URL,
                    title: 'Recuperar senha',
                    description: `Recuperar senha da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                    images: [
                        {
                            url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
                            alt: `Recuperar senha | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
                        },
                        { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
                    ],
                }}
            />

            {
                <div className={styles.pageContainer}>
                    <Container>
                        <Row className="justify-content-center align-items-center">
                            <Col sm={12} className={`${styles.formContainer} col-11`}>
                                <Row className="justify-content-center align-items-center">
                                    <Col md={6} className="mt-1 mb-4">
                                        <Row className="justify-content-center align-items-center">
                                            <Col sm={8}>
                                                <Image fluid src="/assets/images/logo-mtech.svg" alt="Mtech Solar." />
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col md={4} className="mt-1 mb-1">
                                        <Formik
                                            initialValues={{
                                                email: '',
                                            }}
                                            onSubmit={async values => {
                                                setTypeMessage("waiting");
                                                setMessageShow(true);

                                                try {
                                                    await api.post('users/reset', {
                                                        email: values.email,
                                                    });

                                                    setTypeMessage("success");
                                                    handleShowModal();
                                                }
                                                catch {
                                                    setTypeMessage("error");

                                                    setTimeout(() => {
                                                        setMessageShow(false);
                                                    }, 4000);
                                                }
                                            }}
                                            validationSchema={validationSchema}
                                            validateOnChange={false}
                                        >
                                            {({ handleBlur, handleChange, handleSubmit, values, errors, touched }) => (
                                                <Form onSubmit={handleSubmit}>
                                                    <Row>
                                                        <Col>
                                                            <h3 className="text-success">Recuperar senha</h3>

                                                            <Form.Group className="mb-4" controlId="formResetEmail">
                                                                <Form.Label>Seu e-mail</Form.Label>
                                                                <Form.Control type="email"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.email}
                                                                    name="email"
                                                                    isInvalid={!!errors.email && touched.email}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Row className="justify-content-end">
                                                        {
                                                            messageShow ? <Col sm={12}><AlertMessage status={typeMessage} /></Col> :
                                                                <Col className="col-row">
                                                                    <Button variant="success" type="submit">Solicitar</Button>
                                                                </Col>

                                                        }
                                                    </Row>

                                                    <Row className="mt-4">
                                                        <Col>
                                                            <Link href="/">
                                                                <a
                                                                    title="Lembra da senha? Entrar no sistema."
                                                                    data-title="Lembra da senha? Entrar no sistema."
                                                                >
                                                                    <Row>
                                                                        <Col sm={1}>
                                                                            <FaKey size={14} /> <span>Lembra da senha? Entrar no sistema.</span>
                                                                        </Col>
                                                                    </Row>
                                                                </a>
                                                            </Link>
                                                        </Col>
                                                    </Row>
                                                </Form>
                                            )}
                                        </Formik>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Modal
                            show={showModal}
                            onHide={handleCloseModal}
                            backdrop="static"
                            keyboard={false}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Solicitação enviada!</Modal.Title>
                            </Modal.Header>

                            <Modal.Body>
                                <Row className="justify-content-center align-items-center mb-3">
                                    <Col sm={8}>
                                        <Image fluid src="/assets/images/undraw_mail_re_duel.svg" alt="Solicitação enviada!" />
                                    </Col>
                                </Row>
                                <Row className="justify-content-center align-items-center text-center">
                                    <Col>
                                        <h5 className="text-success">Enviamos um código para o seu e-mail.</h5>
                                        <h6 className="text-secondary">Abra o e-mail e siga as instruções lá contidas.</h6>
                                    </Col>
                                </Row>
                            </Modal.Body>

                            <Modal.Footer>
                                <Button variant="success" onClick={handleCloseModal}>
                                    Fechar
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </Container>
                </div>
            }
        </>
    )
}

export default NewCustomer;