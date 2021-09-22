import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt, FaBars } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface TreatmentType {
    id: string;
    name: string;
    order: number;
}

interface TreatmentTypesProps {
    treatmentType: TreatmentType;
    treatmentTypesList: TreatmentType[];
    handleTreatmentTypesList(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    order: Yup.number().required(),
});

const TreatmentTypes: React.FC<TreatmentTypesProps> = ({ treatmentType, treatmentTypesList, handleTreatmentTypesList }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`treatment-types/${treatmentType.id}`);

            const list = treatmentTypesList.filter(item => { return item.id !== treatmentType.id });

            list.forEach(async (treatmentType, index) => {
                try {
                    await api.put(`treatment-types/${treatmentType.id}`, {
                        name: treatmentType.name,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save treatment types order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditType();

            handleTreatmentTypesList();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete treatment type");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{treatmentType.name}</span></Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditType}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar item</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            name: treatmentType.name,
                            order: treatmentType.order,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (treatmentTypesList) {
                                await api.put(`treatment-types/${treatmentType.id}`, {
                                    name: values.name,
                                    order: treatmentType.order
                                });

                                await handleTreatmentTypesList();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit treatment type.');
                            console.log(err);

                            setTypeMessage("error");

                            setTimeout(() => {
                                setMessageShow(false);
                            }, 4000);
                        }
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Form.Group controlId="typeFormGridName">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.name}
                                        name="name"
                                        isInvalid={!!errors.name && touched.name}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                </Form.Group>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteLine}
                                            >
                                                {
                                                    iconDelete && "Excluir"
                                                }

                                                {
                                                    iconDeleteConfirm && "Confirmar"
                                                }
                                            </Button>
                                            <Button variant="success" type="submit">Salvar</Button>
                                        </>

                                }
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </ListGroup.Item>
    )
}

export default TreatmentTypes;