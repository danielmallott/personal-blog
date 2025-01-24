import { Row } from 'react-bootstrap';
import BlueskyWidget from './bluesky-widget';

function Sidebar () {
  return (
    <>
      <Row>
        <h2>To the Side</h2>
        <hr />
      </Row>
      <Row>
        <h4>My Latest Thoughts</h4>
        <BlueskyWidget />
      </Row>
      <hr />
      <Row>
        <h4>Connect with Me!</h4>
        <h5><i className='fab fa-bluesky' /><span className='ms-2'><a href='https://bsky.app/profile/danielmallott.bsky.social' target='_blank' rel='noreferrer'>Bluesky</a></span></h5>
        <h5><i className='fab fa-linkedin' /><span className='ms-2'><a href='https://linkedin.com/in/danielmallott' target='_blank' rel='noreferrer'>LinkedIn</a></span></h5>
        <h5><i className='fab fa-github' /><span className='ms-2'><a href='https://github.com/danielmallott/'>Github</a></span></h5>
      </Row>

    </>
  );
}

export default Sidebar;
