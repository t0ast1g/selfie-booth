import './globals.css';  
import type { Metadata } from 'next';  
import Image from 'next/image';  
import { Montserrat } from 'next/font/google';  

// Initialize Montserrat font  
const montserrat = Montserrat({   
  subsets: ['latin'],  
  display: 'swap',  
});  


export default function RootLayout({  
  children,  
}: {  
  children: React.ReactNode;  
}) {  
  return (  
    <html lang="en">  
      <body className={`min-h-screen relative bg-white`}>  
        {/* Vertical gold bars */}  
        <div className="fixed left-0 top-0 w-4 h-full bg-[#CAB268] z-10" />  
        <div className="fixed right-0 top-0 w-4 h-full bg-[#CAB268] z-10" />  
        
        {/* Horizontal blue bars */}  
        <div className="fixed top-0 left-0 w-full h-4 bg-[#0171C5] z-20" />  
        <div className="fixed bottom-0 left-0 w-full h-4 bg-[#0171C5] z-20" />  
        
        {/* Main content wrapper */}  
        <div className="relative z-0">  
          {/* Logo container */}  
          <div className="flex justify-center py-6 pt-8">  
            <Image   
              src="/2025-01-23_BrandAssests_Logos_BlackGold_IntelBlue.png"  
              alt="AI Owl LLC 2024"  
              width={269}  
              height={84}  
              priority  
              className="h-auto"  
            />  
          </div>  
          
          {/* Page content */}  
          <main className="max-w-6xl mx-auto px-8 pb-8">  
            {children}  
          </main>  
        </div>  
      </body>  
    </html>  
  );  
}