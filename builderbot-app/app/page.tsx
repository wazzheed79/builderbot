export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="max-w-3xl text-center px-6">
        <h1 className="text-6xl font-bold text-slate-900 mb-6">
          BuilderBot
        </h1>

        <p className="text-xl text-slate-600 mb-8">
          Create professional quotes in under 2 minutes.
        </p>

        <div className="flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Get Started
          </button>

          <button className="bg-white border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50">
            Sign In
          </button>
        </div>
      </div>
    </main>
  );
}