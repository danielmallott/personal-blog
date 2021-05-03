import { PostData } from "../models/post-data";

export async function generateRSSItem(post: PostData) {
    return `
        <item>
            <guid>https://www.danielmallott.com/posts/${post.id}</guid>
            <title>${post.title}</title>
            <description>${post.summary}</description>
            <link>https://www.danielmallott.com/posts/${post.id}</link>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
            <content:encoded><![CDATA[${post.htmlContent}]]></content:encoded>
        </item>
    `;
}

export async function generateRSS(posts: PostData[]) {
    const itemsList = await Promise.all(posts.map(generateRSSItem));

    return `
    <rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
      <channel>
        <title>Daniel Mallott</title>
        <link>https://www.danielmallott.com</link>
        <description>Talking .NET, SQL Server, and Software Development</description>
        <language>en</language>
        <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
        <atom:link href="https://www.danielmallott.com" rel="self" type="application/rss+xml"/>
        ${itemsList.join('')}
      </channel>
    </rss>
  `;
}
