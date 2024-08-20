import Head from 'next/head';
import { ReactNode } from 'react';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import Sidebar from './sidebar';

const siteTitle = "Dan Mallott's Blog";

function Layout ({ children, home }: { children: ReactNode, home?: boolean }) {
  return (
    <>
      <Head>
        <title>Dan Mallott&apos;s Blog</title>
        <link rel='icon' href='/favicon.ico' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='description' content="Dan Mallott's Blog" />
        <meta name='og:title' content={siteTitle} />
      </Head>
      <Navbar bg='dark' variant='dark' expand='lg'>
        <Container className='container-fluid'>
          <Navbar.Brand href='/'>
            Dan Mallott
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='mr-auto'>
              <Nav.Link href='/'>Home</Nav.Link>
              <Nav.Link href='/about'>About Me</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Row>
          <Col sm={1} className='pt-5' />
          <Col sm={7} className='pt-5'>{children}</Col>
          <Col sm={3} className='pt-5'><Sidebar /></Col>
          <Col sm={1} className='pt-5' />
        </Row>
      </Container>
    </>
  );
}

export default Layout;
