import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Sends the bare root at the default language.
   * @returns Redirect from `/` to the Vietnamese route tree.
   */
  async redirects() {
    return [
      {
        source: "/",
        // Literal, not DEFAULT_LOCALE: next.config.ts loads outside the `src/*` alias.
        destination: "/vi",
        // Temporary — a permanent redirect would stick in browser caches if the default moves.
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
