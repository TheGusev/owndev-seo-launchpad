export type { BlogPost } from './types';
import { clusterLLM } from './cluster-llm';
import { clusterAIOverviews } from './cluster-ai-overviews';
import { clusterPSEO } from './cluster-pseo';
import { clusterSchema } from './cluster-schema';
import { clusterContent } from './cluster-content';
import { clusterTechnical } from './cluster-technical';
import { blogCovers } from './covers';
import type { BlogPost } from './types';

export const blogPosts: BlogPost[] = [
  ...clusterLLM,
  ...clusterAIOverviews,
  ...clusterPSEO,
  ...clusterSchema,
  ...clusterContent,
  ...clusterTechnical,
].map(post => ({
  ...post,
  coverImage: blogCovers[post.slug] || post.coverImage,
})).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getAllTags = (): string[] => {
  const tags = new Set<string>();
  blogPosts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags);
};
