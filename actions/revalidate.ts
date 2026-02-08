'use server';

/**
 * Revalidate cache on the frontend website by invalidating specific cache tags.
 * This calls the frontend's /api/revalidate endpoint with the specified tags.
 */
export async function revalidateFrontend(tags: string[]): Promise<boolean> {
  const frontendRevalidateUrl = process.env.FRONTEND_REVALIDATE_URL;
  const frontendRevalidateToken = process.env.FRONTEND_REVALIDATE_TOKEN;

  if (!frontendRevalidateUrl || !frontendRevalidateToken) {
    console.error('Missing FRONTEND_REVALIDATE_URL or FRONTEND_REVALIDATE_TOKEN');
    return false;
  }

  try {
    const response = await fetch(frontendRevalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-token': frontendRevalidateToken,
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      console.error('Failed to revalidate frontend:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error revalidating frontend:', error);
    return false;
  }
}

/**
 * Revalidate article caches.
 * Invalidates: articles list, specific article, homepage article sections
 */
export async function revalidateArticle(slug: string): Promise<boolean> {
  return revalidateFrontend([
    'articles',
    `article-${slug}`,
    'latest-articles',
    'top-articles',
    'featured-article',
  ]);
}

/**
 * Revalidate all article-related caches (for deletion).
 */
export async function revalidateArticles(): Promise<boolean> {
  return revalidateFrontend([
    'articles',
    'latest-articles',
    'top-articles',
    'featured-article',
  ]);
}

/**
 * Revalidate individual caches.
 * Invalidates: individuals list, specific individual
 */
export async function revalidateIndividual(slug: string): Promise<boolean> {
  return revalidateFrontend(['individuals', `individual-${slug}`]);
}

/**
 * Revalidate all individual-related caches (for deletion).
 */
export async function revalidateIndividuals(): Promise<boolean> {
  return revalidateFrontend(['individuals']);
}

/**
 * Revalidate post caches.
 */
export async function revalidatePosts(): Promise<boolean> {
  return revalidateFrontend(['posts']);
}

/**
 * Revalidate category caches.
 * Also revalidates articles since articles display category info.
 */
export async function revalidateCategories(): Promise<boolean> {
  return revalidateFrontend(['categories', 'articles']);
}

/**
 * Revalidate tag caches.
 */
export async function revalidateTags(): Promise<boolean> {
  return revalidateFrontend(['tags']);
}

/**
 * Revalidate type caches.
 * Also revalidates individuals since individuals display type info.
 */
export async function revalidateTypes(): Promise<boolean> {
  return revalidateFrontend(['types', 'individuals']);
}

/**
 * Revalidate site settings caches.
 */
export async function revalidateSiteSettings(): Promise<boolean> {
  return revalidateFrontend(['site-settings']);
}

/**
 * Revalidate all content caches (for major changes).
 */
export async function revalidateAll(): Promise<boolean> {
  return revalidateFrontend([
    'articles',
    'latest-articles',
    'top-articles',
    'featured-article',
    'individuals',
    'posts',
    'categories',
    'tags',
    'types',
  ]);
}
