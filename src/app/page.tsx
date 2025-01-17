import dynamic from 'next/dynamic'
import Head from 'next/head'

const SelfieBooth = dynamic(() => import('../components/SelfieBooth'), {
  ssr: false
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <SelfieBooth />
    </main>
  )
}