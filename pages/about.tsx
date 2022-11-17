import { Row } from 'react-bootstrap';
import Layout from '../components/layout';

function About () {
  return (
    <Layout>
      <Row>
        <h1>About Me!</h1>
        <hr/>
        <p>
          Dan Mallott is a Copenhagen-based team lead specializing in .NET, SQL Server, and distributed architectures. He has over 10 years of software development experience in healthcare and financial services. Since 2022, he has worked for <a href="https://www.e-conomic.dk/" target="_blank" rel="noreferrer">Visma e-conomic</a> leading the Platform team.
        </p>
        <p>
          Dan is also a prolific speaker, speaking at conferences such as NDC Sydney, PASS Summit, MKE Dot Net (the predecessor to Cream City Code), Code Camp NYC, and multiple SQL Saturdays throughout the United States. He is passionate about sharing his knowledge and promoting excellent conversations during his speaking engagements.
        </p>
        <p>
          In his free time, Dan plays and referees ice hockey in the Copenhagen area.
        </p>
        <p>
          This is Dan&apos;s personal blog and the views expressed on this site are his own and do not necessarily reflect the views or opinions of <a href="https://www.e-conomic.dk" target="_blank" rel="noreferrer">Visma e-conomic</a>. To learn more about <a href="https://www.e-conomic.dk/" target="_blank" rel="noreferrer">Visma e-conomic</a>, feel free to visit <a href="https://www.e-conomic.dk" target="_blank" rel="noreferrer">www.e-conomic.dk</a>.
        </p>
      </Row>
    </Layout>
  );
}

export default About;
