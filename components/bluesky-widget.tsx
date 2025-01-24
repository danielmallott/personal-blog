import { AtpAgent } from '@atproto/api';
import { useEffect, useState } from 'react';
import { Post } from 'bsky-react-post';
import 'bsky-react-post/theme.css';

export default function BlueskyWidget () {
  const initialPostIds: string[] = [];
  const [postIds, setPostIds] = useState(initialPostIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadEmbeddedPosts().then((embeddedPosts) => {
      setPostIds(embeddedPosts);
      setLoading(false);
    });
  }, [loadEmbeddedPosts]);

  return (
    <div className='bluesky-widget'>
      {loading && <span>Loading...</span>}
      {postIds.map((postId) => (
        <div key={postId} data-theme='light'>
          <Post handle='danielmallott.bsky.social' id={postId} />
        </div>
      ))}
    </div>
  );
}

function loadEmbeddedPosts (): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    const atpAgent = new AtpAgent({ service: 'https://public.api.bsky.app' });
    const uris: string[] = [];

    atpAgent.getAuthorFeed({ actor: 'did:plc:odoymahfksi6yi2ccs2go4mq' }).then(async (apiResponse) => {
      apiResponse.data.feed
        .filter((post) => post.reply === undefined && post.post.author.handle === 'danielmallott.bsky.social')
        .sort((a, b) => Date.parse(b.post.indexedAt) - Date.parse(a.post.indexedAt))
        .forEach(async (post) => {
          uris.push(post.post.uri.split('/').at(-1) ?? '');
        });

      resolve(uris);
    });
  });
}
