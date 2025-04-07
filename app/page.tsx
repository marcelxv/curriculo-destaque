import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Currículo Destaque
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Destaque seu potencial profissional com análise inteligente do seu currículo
          </p>
          <div className="flex gap-6 justify-center">
            <a
              href="/analyze"
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg text-white hover:bg-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Destacar Currículo
            </a>
            <a
              href="/pricing"
              className="rounded-xl bg-gray-800 px-8 py-4 text-lg text-blue-400 border border-blue-500/30 hover:border-blue-500 hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Ver Planos
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-colors duration-200">
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/20">
              <Image
                src="/icons/ats.svg"
                alt="ATS Icon"
                width={32}
                height={32}
                className="text-blue-500"
                style={{ color: 'rgb(59, 130, 246)' }}
              />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-white">Aprovação ATS</h3>
            <p className="text-gray-300 leading-relaxed">
              Garanta que seu currículo seja aprovado pelos sistemas de seleção automática
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-colors duration-200">
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/20">
              <Image
                src="/icons/ai.svg"
                alt="AI Icon"
                width={32}
                height={32}
                className="text-blue-500"
                style={{ color: 'rgb(59, 130, 246)' }}
              />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-white">Análise Inteligente</h3>
            <p className="text-gray-300 leading-relaxed">
              Receba sugestões personalizadas baseadas em milhares de currículos de sucesso
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-colors duration-200">
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/20">
              <Image
                src="/icons/linkedin.svg"
                alt="LinkedIn Icon"
                width={32}
                height={32}
                className="text-blue-500"
                style={{ color: 'rgb(59, 130, 246)' }}
              />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-white">Perfil Profissional</h3>
            <p className="text-gray-300 leading-relaxed">
              Destaque seu perfil no LinkedIn e atraia as melhores oportunidades
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
