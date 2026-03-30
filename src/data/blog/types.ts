export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readTime: number;
  content: string;
  author: string;
  authorRole?: string;
}
