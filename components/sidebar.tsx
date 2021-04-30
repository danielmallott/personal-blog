import { Row } from 'react-bootstrap';

function Sidebar() {
  return(
    <>
      <Row>
        <h2>To the Side</h2>
        <hr/>
      </Row>
      <Row>
        <h4>Connect with Me!</h4>
        <h5><i className="fab fa-twitter-square"></i><span className="ms-2"><a href="https://twitter.com/danielmallott" target="_blank">Twitter</a></span></h5>
        <h5><i className="fab fa-linkedin"></i><span className="ms-2"><a href="https://linkedin.com/in/danielmallott" target="_blank">LinkedIn</a></span></h5>
        <h5><i className="fab fa-github"></i><span className="ms-2"><a href="https://github.com/danielmallott/">Github</a></span></h5>
      </Row>
    </>
  );
}

export default Sidebar;