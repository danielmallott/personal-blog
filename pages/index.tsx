import Layout from '../components/layout';
import { Row, Card, Col, Badge } from 'react-bootstrap';
import { GetStaticProps } from 'next';
import { getPostData, getSortedPostsData } from '../lib/posts';
import Date from '../components/date';
import Link from 'next/link';
import { generateRSS } from '../lib/rss';
import { PostData } from '../models/post-data';
import fs from 'fs';
import { SortedPost } from '../models/sorted-post';

export const getStaticProps: GetStaticProps = async (context: any) => {
  const allPostsData = getSortedPostsData();
  const postIds: string[] = allPostsData.map(post => post.id);
  const allPostDetails: PostData[] = await Promise.all(postIds.map(getPostData));

  const rss = await generateRSS(allPostDetails);
  fs.writeFileSync('./public/rss.xml', rss);

  return {
    props: {
      allPostsData
    }
  };
};

const Home = ({ allPostsData }: { allPostsData: SortedPost[] }) => (
  <Layout home>
    <Row>
      <h1>Latest Blog Posts</h1>
      <hr />
      <Row className='row-cols-1 row-cols-lg-2 row-cols-xl-3 g-1'>
        {allPostsData.map(({ id, date, title, summary, tags, headerImage }:
        { id: string, date: string, title: string, summary: string, tags: string, headerImage: string }
        ) => (
          <Col key={id}>
            <Link className='text-decoration-none' href={`/posts/${id}`} passHref>
              <Card>
                <Card.Img variant='top' src={headerImage} className='card-img-top' />
                <Card.Body>
                  <Card.Title>{title}</Card.Title>
                  <Card.Text>
                    {summary}
                  </Card.Text>
                  <Card.Text>
                    {tags.split(',').map((tag) => (
                      <Badge pill bg='secondary' className='me-1 bg-secondary' key={`${tag}${id}`}>{tag}</Badge>
                    ))}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <small className='text-muted'><Date dateString={date} /></small>
                </Card.Footer>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Row>
  </Layout>
);

export default Home;
