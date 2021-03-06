import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Accordion, AccordionButton, Card, Dropdown, Nav, NavDropdown, Row, Col } from 'react-bootstrap';
import {
    FaColumns,
    FaUserTie,
    FaFileInvoice,
    FaList,
    FaPlus,
    FaIdCard,
    FaProjectDiagram,
    FaLayerGroup,
    FaUsers,
    FaUsersCog,
    FaBoxOpen,
    FaDolly,
    FaBriefcase,
    FaSpider,
    FaStore,
    FaPencilAlt,
    FaSkullCrossbones,
    FaBuilding,
} from 'react-icons/fa';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';

import styles from './styles.module.css';

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { itemSideBar, selectedMenu, handleItemSideBar } = useContext(SideBarContext);
    const { signed, user } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/users/reset', '/users/reset/auth', '/404', '500'];

    useEffect(() => {
        let show = false;

        if (signed && user) {
            if (!pathsNotShow.find(item => { return item === router.route })) show = true;
        }

        setShowPageHeader(show);
    }, [signed, router.route, user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleToDashboard() {
        router.push('/dashboard');
    }

    return (
        showPageHeader && user ? <div className={`${styles.sideBarContainer} d-print-none`}>
            <Accordion activeKey={itemSideBar} className={styles.accordionContainer}>
                {/* <Card className={styles.menuCard}>
                    <AccordionButton
                        as={Card.Header}
                        className={styles.menuCardHeader}
                        eventKey="dashboard"
                        onClick={handleToDashboard}
                    >
                        <div>
                            <FaColumns /> <span>Painel</span>
                        </div>
                    </AccordionButton>
                </Card> */}

                {
                    can(user, "customers", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="customers"
                            onClick={() => handleItemSideBar('customers')}
                        >
                            <div>
                                <FaUserTie /> <span>Clientes</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="customers">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/customers">
                                    <a title="Listar todos os clientes" data-title="Listar todos os clientes">
                                        <Row
                                            className={
                                                selectedMenu === 'customers-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "customers", "create") && <Link href="/customers/new">
                                        <a title="Criar um novo cliente" data-title="Criar um novo cliente">
                                            <Row
                                                className={
                                                    selectedMenu === 'customers-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "customers", "update") && <>
                                        <Dropdown.Divider />

                                        <Link href="/customers/types">
                                            <a title="Listar os tipos" data-title="Listar os tipos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'customers-types' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUsersCog size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tipos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "estimates", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="estimates"
                            onClick={() => handleItemSideBar('estimates')}
                        >
                            <div>
                                <FaFileInvoice /> <span>Or??amento</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="estimates">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/estimates">
                                    <a title="Listar todos os or??amentos" data-title="Listar todos os or??amentos">
                                        <Row
                                            className={
                                                selectedMenu === 'estimates-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "estimates", "create") && <Link href="/estimates/new">
                                        <a title="Criar um novo or??amento" data-title="Criar um novo or??amento">
                                            <Row
                                                className={
                                                    selectedMenu === 'estimates-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "estimates", "update") && <>
                                        <Link href="/estimates/status">
                                            <a title="Listar as fases." data-title="Listar as fases.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-status' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaProjectDiagram size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Fases</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "products", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="products"
                            onClick={() => handleItemSideBar('products')}
                        >
                            <div>
                                <FaDolly /> <span>Produtos</span>
                            </div>
                        </AccordionButton>
                        <Accordion.Collapse eventKey="products">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/products">
                                    <a title="Listar todos os produtos" data-title="Listar todos os produtos">
                                        <Row
                                            className={
                                                selectedMenu === 'products-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaBoxOpen size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "products", "update") && <>
                                        <Dropdown.Divider />

                                        <Link href="/products/categories">
                                            <a title="Listar os tipos" data-title="Listar as categorias">
                                                <Row
                                                    className={
                                                        selectedMenu === 'products-categories' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaLayerGroup size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Categorias</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }

                                {
                                    can(user, "inventory", "view") && <>
                                        <Dropdown.Divider />

                                        <Link href="/products/inventory">
                                            <a title="Listar os itens do estoque" data-title="Listar os itens do estoque">
                                                <Row
                                                    className={
                                                        selectedMenu === 'products-inventory' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaDolly size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Estoque</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "services", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="services"
                            onClick={() => handleItemSideBar('services')}
                        >
                            <div>
                                <FaBriefcase /> <span>Servi??os</span>
                            </div>
                        </AccordionButton>
                        <Accordion.Collapse eventKey="services">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/services">
                                    <a title="Listar os servi??os" data-title="Listar os servi??os">
                                        <Row
                                            className={
                                                selectedMenu === 'services-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaDolly size={14} />
                                            </Col>
                                            <Col>
                                                <span>Servi??os</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                <Link href="/services/orders">
                                    <a title="Listar as ordens de servi??o" data-title="Listar as ordens de servi??o">
                                        <Row
                                            className={
                                                selectedMenu === 'services-orders' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Ordens</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "services", "create") && <Link href="/services/orders/new">
                                        <a title="Criar uma nova ordem de servi??o" data-title="Criar uma nova ordem de servi??o">
                                            <Row
                                                className={
                                                    selectedMenu === 'services-orders-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "services", "update") && <>
                                        <Dropdown.Divider />

                                        <Link href="/services/prague-types">
                                            <a title="Listar todos os tipos de pragas" data-title="Listar todos os tipos de pragas">
                                                <Row
                                                    className={
                                                        selectedMenu === 'services-pragues' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaSpider size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Pragas</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/services/treatment-types">
                                            <a title="Listar todos os tipos de tratamentos" data-title="Listar todos os tipos de tratamentos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'services-treatments' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaSkullCrossbones size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tratamentos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/services/build-types">
                                            <a title="Listar todos os tipos de estabelecimentos" data-title="Listar todos os tipos de estabelecimentos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'services-builds' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaBuilding size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Locais</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "store", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="store"
                            onClick={() => handleItemSideBar('store')}
                        >
                            <div>
                                <FaStore /> <span>Loja</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="store">
                            <Card.Body className={styles.menuCardBody}>
                                {
                                    can(user, "store", "update") && <Link href="/store">
                                        <a title="Editar as informa????es da loja." data-title="Editar as informa????es da loja.">
                                            <Row
                                                className={
                                                    selectedMenu === 'store-edit' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPencilAlt size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Configurar</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "users", "view") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="users"
                            onClick={() => handleItemSideBar('users')}
                        >
                            <div>
                                <FaUsers /> <span>Usu??rios</span>
                            </div>
                        </AccordionButton>
                        <Accordion.Collapse eventKey="users">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/users">
                                    <a title="Listar todos os usu??rios" data-title="Listar todos os usu??rios">
                                        <Row
                                            className={
                                                selectedMenu === 'users-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "users", "create") && <Link href="/users/new">
                                        <a title="Criar um novo usu??rio" data-title="Criar um novo usu??rio">
                                            <Row
                                                className={
                                                    selectedMenu === 'users-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }
            </Accordion>
        </div > : null
    )
}

export function SideNavBar() {
    const { user } = useContext(AuthContext);

    return (
        user ? <Nav className="me-auto mb-3">
            {/* <Link href="/dashboard" passHref>
                <Nav.Link><FaColumns /> <span>Painel</span></Nav.Link>
            </Link> */}

            {
                can(user, "customers", "view") && <NavDropdown title="Clientes" id="customers-dropdown">
                    <Link href="/customers" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "customers", "create") && <Link href="/customers/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "customers", "update") && <>
                            <NavDropdown.Divider />

                            <Link href="/customers/types" passHref>
                                <NavDropdown.Item ><FaUsersCog size={14} /> Tipos</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "estimates", "view") && <NavDropdown title="Or??amentos" id="estimates-dropdown">
                    <Link href="/estimates" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "estimates", "create") && <Link href="/estimates/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "estimates", "update") && <>
                            <NavDropdown.Divider />

                            <Link href="/estimates/status" passHref>
                                <NavDropdown.Item ><FaProjectDiagram size={14} /> Fases</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "products", "view") && <NavDropdown title="Produtos" id="products-dropdown">
                    <Link href="/products" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "products", "update") && <>
                            <NavDropdown.Divider />

                            <Link href="/products/categories" passHref>
                                <NavDropdown.Item ><FaLayerGroup size={14} /> Categorias</NavDropdown.Item>
                            </Link>

                            <NavDropdown.Divider />

                            <Link href="/products/inventory" passHref>
                                <NavDropdown.Item ><FaDolly size={14} /> Estoque</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "services", "view") && <NavDropdown title="Servi??os" id="services-dropdown">
                    <Link href="/services" passHref>
                        <NavDropdown.Item ><FaBriefcase size={14} /> Servi??os</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "services", "update") && <>
                            <Link href="/services/orders" passHref>
                                <NavDropdown.Item ><FaList size={14} /> Ordens</NavDropdown.Item>
                            </Link>
                        </>
                    }

                    {
                        can(user, "services", "create") && <Link href="/services/orders/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "services", "update") && <>
                            <NavDropdown.Divider />

                            <Link href="/services/prague-types" passHref>
                                <NavDropdown.Item ><FaSpider size={14} /> Pragas</NavDropdown.Item>
                            </Link>

                            <Link href="/services/treatment-types" passHref>
                                <NavDropdown.Item ><FaSkullCrossbones size={14} /> Tratamentos</NavDropdown.Item>
                            </Link>

                            <Link href="/services/build-types" passHref>
                                <NavDropdown.Item ><FaBuilding size={14} /> Locais</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "store", "update") && <NavDropdown title="Loja" id="store-dropdown">
                    <Link href="/store" passHref>
                        <NavDropdown.Item ><FaStore size={14} /> Configurar</NavDropdown.Item>
                    </Link>
                </NavDropdown>
            }

            {
                can(user, "users", "view") && <NavDropdown title="Usu??rios" id="users-dropdown">
                    {
                        can(user, "users", "create") && <Link href="/users" passHref>
                            <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                        </Link>
                    }

                    <NavDropdown.Divider />

                    {
                        can(user, "users", "view") && <Link href="/users/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }
        </Nav> : <></>
    )
}

export default Sidebar;