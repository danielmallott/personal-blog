import { Row } from 'react-bootstrap';
import { Timeline } from 'react-twitter-widgets';

function Sidebar () {
  return (
    <>
      <Row>
        <h2>To the Side</h2>
        <hr />
      </Row>
      <Row>
        <h4>My Latest Thoughts</h4>
        <Timeline
          dataSource={{
            sourceType: 'profile',
            screenName: 'danielmallott'
          }}
          options={{
            height: '400'
          }}
        />
      </Row>
      <hr />
      <Row>
        <h4>Connect with Me!</h4>
        <h5><i className='fab fa-twitter-square' /><span className='ms-2'><a href='https://twitter.com/danielmallott' target='_blank' rel='noreferrer'>Twitter</a></span></h5>
        <h5><i className='fab fa-linkedin' /><span className='ms-2'><a href='https://linkedin.com/in/danielmallott' target='_blank' rel='noreferrer'>LinkedIn</a></span></h5>
        <h5><i className='fab fa-github' /><span className='ms-2'><a href='https://github.com/danielmallott/'>Github</a></span></h5>
      </Row>

    </>
  );
}

export default Sidebar;
