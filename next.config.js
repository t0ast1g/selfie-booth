/** @type {import('next').NextConfig} */  
const nextConfig = {  
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

module.exports = {
  output: 'standalone', // Enables deployment as a single server bundle
};
