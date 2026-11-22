import type { MetadataRoute } from "next";
import { SITE_URL } from "src/lib/site";

/**
 * Lets every crawler index the whole site and points it at the sitemap.
 * @returns Robots rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
