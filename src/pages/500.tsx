import { NextPage } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Col, Container, Image, Row } from 'react-bootstrap';
import { FaArrowRight } from 'react-icons/fa';

import { AlertMessage } from '../components/Interfaces/AlertMessage';

const Page500: NextPage = () => {
  return (
    <>
      <NextSeo
        title="Erro interno"
        description={`Erro interno da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`}
        openGraph={{
          url: process.env.NEXT_PUBLIC_APP_URL,
          title: 'Erro interno',
          description: `Erro interno da plataforma de gerenciamento da ${process.env.NEXT_PUBLIC_STORE_NAME}.`,
          images: [
            {
              url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg`,
              alt: `Erro interno | Plataforma ${process.env.NEXT_PUBLIC_STORE_NAME}`,
            },
            { url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/images/logo.jpg` },
          ],
        }}
      />

      <article>
        <Container className="content-page">
          <Row className="justify-content-center text-center mt-3">
            <Col>
              <h2 className="article-title">Erro interno!</h2>
            </Col>
          </Row>

          <Row className="justify-content-center mt-3">
            <Col sm={7} className="article-text">
              <AlertMessage status={"warning"} message="Algo de errado aconteceu entre você e o servidor." />
            </Col>
          </Row>

          <Row className="justify-content-center text-center mt-3">
            <Col>
              <Link href='/'>
                <a>
                  Clique aqui para voltar à página inicial <FaArrowRight size={18} />
                </a>
              </Link>
            </Col>
          </Row>

          <Row className="justify-content-center mt-5 mb-5">
            <Col sm={5}>
              <Image fluid rounded src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro interno." />
            </Col>
          </Row>
        </Container>
      </article>
    </>
  )
}

export default Page500;