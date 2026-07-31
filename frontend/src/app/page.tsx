import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <main className="relative z-10 flex flex-col items-center text-center space-y-10 px-6 sm:px-12 py-16 max-w-4xl glass-panel rounded-3xl mx-4">
        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 text-sm font-semibold tracking-wide uppercase mb-2">
          Hackathon Edition
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Welcome to <br />
          <span className="animated-gradient-text">CampusPilot</span>
        </h1>
        
        <p className="text-xl md:text-2xl max-w-2xl text-slate-600 font-light leading-relaxed">
          Empowering Campus Life with AI. Get instant answers to your university questions or seamlessly escalate to human support in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mt-8">
          <Link href="/login" className="px-10 py-4 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            Get Started Now
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="px-10 py-4 text-lg font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:scale-105 transition-all shadow-sm">
            View Source
          </a>
        </div>
      </main>
    </div>
  );
}
