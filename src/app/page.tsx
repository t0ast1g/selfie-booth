import dynamic from 'next/dynamic'

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