import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isGitHubPages ? '/cape-crisis' : '',
  assetPrefix: isGitHubPages ? '/cape-crisis/' : undefined,
};

export default nextConfig;