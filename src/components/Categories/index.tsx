import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaBars, FaPause, FaPlay } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Product } from '../Products';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface Category {
    id: string;
    title: string;
    paused: boolean;
    order: number;
    created_at: Date;
    products: Product[];
}

interface CategoriesProps {
    category: Category;
    listCategories: Category[];
    handleListCategories(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(100, 'Deve conter no máximo 100 caracteres!'),
    order: Yup.number().required(),
});

const Categories: React.FC<CategoriesProps> = ({ category, listCategories, handleListCategories }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [itemPausing, setItemPausing] = useState(false);

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
            await api.delete(`categories/${category.id}`);

            const list = listCategories.filter(item => { return item.id !== category.id });

            list.forEach(async (category, index) => {
                try {
                    await api.put(`categories/${category.id}`, {
                        title: category.title,
                        order: index
                    });
                }
                catch (err) {
                    console.log('error to save categories order after deleting.');
                    console.log(err)
                }
            });

            handleCloseModalEditType();

            handleListCategories();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete category");
            console.log(err);
        }
    }

    const togglePauseItem = async () => {
        setItemPausing(true);

        try {
            await api.put(`categories/${category.id}`, {
                title: category.title,
                paused: !category.paused,
                order: category.order,
            });

            await handleListCategories();
        }
        catch (err) {
            console.log("Error to pause category.");
            console.log(err);
        }

        setItemPausing(false);
    }

    return (
        <ListGroup.Item variant={!category.paused ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{category.title}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseItem}
                        title="Pausar categoria"
                    >
                        {
                            itemPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : !category.paused ? (<><FaPause /> Pausar</>) : (<><FaPlay /> Pausado</>)
                        }
                    </Button>
                </Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditType}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar categoria</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            title: category.title,
                            order: category.order,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (listCategories) {
                                await api.put(`categories/${category.id}`, {
                                    title: values.title,
                                    order: category.order
                                });

                                await handleListCategories();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseModalEditType();
                                }, 2000);
                            }
                        }
                        catch (err) {
                            console.log('error edit category.');
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
                                <Form.Group controlId="categoryFormGridTitle">
                                    <Form.Label>Nome</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Nome da categoria"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.title}
                                        name="title"
                                        isInvalid={!!errors.title && touched.title}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.title.length}/100 caracteres.`}</Form.Text>
                                </Form.Group>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir categoria"
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

export default Categories;