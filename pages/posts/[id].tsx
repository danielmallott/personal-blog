import Head from 'next/head';
import { useEffect } from 'react';
import Layout from '../../components/layout';
import { getAllPostIds, getPostData } from '../../lib/posts';
import Date from '../../components/date';
import Link from 'next/link';
import hljs from 'highlight.js';
import { PostData } from '../../models/post-data';

export async function getStaticProps ({ params }: any) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData
    }
  };
};

export async function getStaticPaths () {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false
  };
}

function Post ({ postData }: {postData: PostData}) {
  useEffect(() => {
    hljs.configure({
      ignoreUnescapedHTML: true
    });
    hljs.highlightAll();
  }, []);
  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <h1>{postData.title}</h1>
      <small><Date dateString={postData.date} /></small>
      <hr/>
      <div dangerouslySetInnerHTML={{ __html: postData.htmlContent }} />
      <hr />
      <div>Thanks for reading!</div>
      <footer><Link href="/">Back to home</Link></footer>
    </Layout>
  )
}

export default Post;
