import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Otimize seu Currículo com IA
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Análise profissional do seu currículo em segundos usando Inteligência Artificial
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <a
              href="/analyze"
              className="rounded-full bg-blue-600 px-8 py-4 text-white hover:bg-blue-700 transition"
            >
              Analisar Currículo
            </a>
            <a
              href="/pricing"
              className="rounded-full bg-white px-8 py-4 text-blue-600 border border-blue-600 hover:bg-blue-50 transition"
            >
              Ver Preços
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/icons/ats.svg"
                alt="ATS Icon"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Compatível com ATS</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Garanta que seu currículo passe pelos sistemas de triagem automática
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/icons/ai.svg"
                alt="AI Icon"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Análise com IA</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Sugestões personalizadas baseadas em milhares de currículos de sucesso
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/icons/linkedin.svg"
                alt="LinkedIn Icon"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Otimização LinkedIn</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Melhore seu perfil profissional para atrair mais oportunidades
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
