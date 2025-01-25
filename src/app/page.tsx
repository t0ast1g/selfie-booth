import dynamic from 'next/dynamic'  
import { Montserrat } from 'next/font/google';  

// Initialize Montserrat font  
const montserrat = Montserrat({   
  subsets: ['latin'],  
  display: 'swap',  
});  

const SelfieBooth = dynamic(() => import('../components/SelfieBooth'), {  
  ssr: false  
})  

export default function Home() {  
  return (  
    <main className="min-h-screen bg-gray-100">  
      {/* Title container */}  
      <div className="text-center py-6">  
        <h1 className={`${montserrat.className} text-4xl font-bold mb-3`}>  
          AI Selfie Booth  
        </h1>  
        <p className="text-lg text-gray-600 font-bold max-w-2xl mx-auto px-4 mb-6">  
          Transform your selfies with AI magic!  
        </p>  
        
        {/* Black bar */}  
        <div className="flex justify-center">  
          <div className="w-4/5 h-2 bg-[#232323] rounded-full"></div>  
        </div>  
        
        {/* Additional text in Intel Blue */}  
        <div className="text-center mt-6">  
          <p className="text-lg text-[#0171C5] font-bold max-w-2xl mx-auto px-4">  
            Press capture when you're ready to see a new world!  
          </p>  
        </div>  
      </div>  

      {/* SelfieBooth component */}  
      <SelfieBooth />  
    </main>  
  )  
}