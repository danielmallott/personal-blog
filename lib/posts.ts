import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SortedPost } from '../models/sorted-post';
import { PostData } from '../models/post-data';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import remarkParse from 'remark-parse';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkNotePlugin from './remark-note-plugin';

const postsDirectory: string = path.join(process.cwd(), 'posts');

export function getSortedPostsData (): SortedPost[] {
  const fileNames: string[] = fs.readdirSync(postsDirectory);
  const allPostsData: SortedPost[] = fileNames.map(fileName => {
    const id: string = fileName.replace(/\.md$/, '');
    const fullPath: string = path.join(postsDirectory, fileName);
    const fileContents: string = fs.readFileSync(fullPath, 'utf-8');

    const matterResult: matter.GrayMatterFile<string> = matter(fileContents);

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      summary: matterResult.data.summary,
      tags: matterResult.data.tags,
      headerImage: matterResult.data.headerImage
    };
  });

  return allPostsData.sort((a: SortedPost, b: SortedPost) => {
    if (a.date < b.date) {
      return 1;
    } else if (a.date > b.date) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * Gets all post ids.
 *
 * A post id is simply the name of the file with the '.md' stripped off.
 * @returns Post Ids.
 */
export function getAllPostIds () {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    };
  });
}

export async function getPostData (id: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf-8');

  const matterResult = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkNotePlugin)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    htmlContent: contentHtml,
    title: matterResult.data.title,
    date: matterResult.data.date,
    summary: matterResult.data.summary,
    tags: matterResult.data.tags,
    headerImage: matterResult.data.headerImage
  };
}
