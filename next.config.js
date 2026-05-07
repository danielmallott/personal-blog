/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api', 'import']
  }
};

module.exports = nextConfig;
