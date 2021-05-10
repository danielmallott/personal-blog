import { SitemapStream, streamToPromise } from 'sitemap';
import { getSortedPostsData } from '../../lib/posts';

export default async (req: any, res: any) => {
  try {
    const smStream = new SitemapStream({
      hostname: `https://${req.headers.host}`
    });

    const posts = getSortedPostsData();

    posts.forEach(post => {
      smStream.write({
        url: `/posts/${post.id}`,
        changefreq: 'daily',
        priority: 0.9
      });
    });

    smStream.end();

    const sitemapOutput = (await streamToPromise(smStream)).toString();

    res.writeHead(200, {
      'Content-Type': 'application/xml'
    });

    res.end(sitemapOutput);
  } catch (e) {
    console.log(e);
    res.send(JSON.stringify(e));
  }
}
