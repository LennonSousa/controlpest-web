import { useState, useEffect } from 'react';
import { Col, Container, Image, Row, Spinner } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';

export type PageType = 'waiting' | 'success' | 'warning' | 'empty' | 'error';

interface PageWaitingProps {
    status: PageType,
    message?: string;
}

const PageWaiting: React.FC<PageWaitingProps> = ({ status, message = "Aguarde, carregando..." }) => {
    const [circleWaiting, setCircleWaiting] = useState(true);
    const [successWaiting, setSuccessWaiting] = useState(false);
    const [warningWaiting, setWarningWaiting] = useState(false);
    const [emptyWaiting, setEmptyWaiting] = useState(false);
    const [errorWaiting, setErrorWaiting] = useState(false);

    useEffect(() => {
        handleAlert(status);
    }, [status, message]);

    function handleAlert(status: PageType) {
        if (status === 'waiting') {
            setCircleWaiting(true);
            setSuccessWaiting(false);
            setErrorWaiting(false);
            return;
        }

        if (status === 'success') {
            setCircleWaiting(false);
            setSuccessWaiting(true);
            return;
        }

        if (status === 'warning') {
            setCircleWaiting(false);
            setErrorWaiting(false);
            setWarningWaiting(true);
            return;
        }

        if (status === 'empty') {
            setCircleWaiting(false);
            setErrorWaiting(false);
            setEmptyWaiting(true);
            setWarningWaiting(false);
            return;
        }

        if (status === 'error') {
            setCircleWaiting(false);
            setSuccessWaiting(false);
            setErrorWaiting(true);
            return;
        }
    }

    return <Container className="content-page justify-content-center align-items-center">
        <Row className="justify-content-center align-items-center text-center pt-5 pb-5">
            <Col>
                <Row>
                    <Col>
                        {
                            circleWaiting && <Spinner animation="border" variant="success" />
                        }
                        {
                            successWaiting && <FaCheckCircle />
                        }
                        {
                            warningWaiting && <Row className="justify-content-center mt-3 mb-3">
                                <Col sm={3}>
                                    <Image src="/assets/images/undraw_access_denied_re_awnf.svg" alt="Acesso negado!" fluid />
                                </Col>
                            </Row>
                        }

                        {
                            emptyWaiting && <Row className="justify-content-center mt-3 mb-3">
                                <Col sm={3}>
                                    <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                </Col>
                            </Row>
                        }

                        {
                            errorWaiting && <Row className="justify-content-center mt-3 mb-3">
                                <Col sm={3}>
                                    <Image src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro de conexão." fluid />
                                </Col>
                            </Row>
                        }
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <h5 className="text-success">{message}</h5>
                    </Col>
                </Row>
            </Col>
        </Row>
    </Container>
}

export { PageWaiting };