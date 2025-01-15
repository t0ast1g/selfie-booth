/** @type {import('next').NextConfig} */  
const nextConfig = {  
  output: 'standalone', // This enables standalone mode for Next.js
  images: {  
    remotePatterns: [  
      {  
        protocol: 'https',  
        hostname: 'replicate.delivery',  
      },  
      {  
        protocol: 'https',  
        hostname: 'pbxt.replicate.delivery',  
      }  
    ],  
  },  
}  

module.exports = nextConfig;