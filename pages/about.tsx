import { Row } from 'react-bootstrap';
import Layout from '../components/layout';

function About () {
  return (
    <Layout>
      <Row>
        <h1>About Me!</h1>
        <hr/>
        <p>
          Dan Mallott is a Chicago-based consultant specializing in .NET, SQL Server, and distributed architectures. He has over 10 years of software development experience in healthcare and financial services. Since 2016, he has worked for <a href="https://westmonroe.com" target="_blank" rel="noreferrer">West Monroe</a> on a variety of clients.
        </p>
        <p>
          Dan is also a prolific speaker, speaking at conferences such as NDC Sydney, PASS Summit, MKE Dot Net (the predecessor to Cream City Code), Code Camp NYC, and multiple SQL Saturdays throughout the United States. He is passionate about sharing his knowledge and promoting excellent conversations during his speaking engagements.
        </p>
        <p>
          In his free time, Dan plays and referees ice hockey in the Chicago area, including being selected to officiate multiple league and state championship games over the past three years.
        </p>
        <p>
          This is Dan&apos;s personal blog and the views expressed on this site are his own and do not necessarily reflect the views or opinions of <a href="https://westmonroe.com" target="_blank" rel="noreferrer">West Monroe</a>. To learn more about <a href="https://westmonroe.com" target="_blank" rel="noreferrer">West Monroe</a>, feel free to visit <a href="https://westmonroe.com" target="_blank" rel="noreferrer">www.westmonroe.com</a>.
        </p>
      </Row>
    </Layout>
  );
}

export default About;
