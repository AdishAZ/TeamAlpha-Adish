import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <main className="flex flex-col items-center text-center space-y-8 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          CampusPilot
        </h1>
        <p className="text-xl max-w-2xl text-gray-300">
          Empowering Campus Life with AI. Get instant answers to your university questions or seamlessly escalate to human support.
        </p>
        
        <div className="flex space-x-4 mt-8">
          <Link href="/login" className="px-8 py-3 text-lg font-medium text-gray-900 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg">
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}

