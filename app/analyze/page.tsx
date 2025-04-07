'use client';

import { useState } from 'react';
import Image from 'next/image';
import { INDUSTRIES, Industry } from '../constants/industries';
import dynamic from 'next/dynamic';

const PDFParserDynamic = dynamic(() => import('../components/PDFParser'), {
  ssr: false,
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

type Step = 'upload' | 'analyzing' | 'results';

interface AnalysisResult {
  ats: string;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  formatting: string;
}

interface APIResponse {
  rawAnalysis: string;
  structuredAnalysis: string | null;
  metadata: {
    processingTime: number;
    textLength: number;
    industry: string;
    experienceLevel: string;
  };
  error?: string;
}

interface FormData {
  industry: Industry;
  experienceLevel: 'ESTAGIO' | 'JUNIOR' | 'PLENO' | 'SENIOR';
  jobDescription?: string;
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    industry: 'GERAL',
    experienceLevel: 'PLENO',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('O arquivo é muito grande. Por favor, envie um arquivo de até 2MB.');
        setFile(null);
        return;
      }

      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, envie um arquivo PDF');
        setFile(null);
      }
    }
  };

  const handleParse = async (text: string) => {
    try {
      setProgress(30);
      setStatusMessage('Arquivo processado. Iniciando análise...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          ...formData
        }),
      });

      setProgress(70);
      setStatusMessage('Análise em andamento...');
      
      const data: APIResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar o currículo');
      }

      setProgress(90);
      setStatusMessage('Processando resultados...');
      
      const analysis = parseAnalysis(data.structuredAnalysis || data.rawAnalysis);
      setResult(analysis);
      
      setProgress(100);
      setStatusMessage('Análise concluída!');
      setStep('results');
    } catch (error) {
      setStep('upload');
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ocorreu um erro ao analisar seu currículo. Por favor, tente novamente.');
      }
    }
  };

  const handleParseError = (error: Error) => {
    console.error('PDF parsing error:', error);
    setStep('upload');
    setError(error.message);
    setProgress(0);
    setStatusMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStep('analyzing');
    setError(null);
    setProgress(0);
    setStatusMessage('Iniciando processamento do arquivo...');
    setProgress(10);
    setStatusMessage('Lendo o arquivo...');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps - Improved contrast and fluidity */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-between">
              {['Upload', 'Análise', 'Resultados'].map((stepName, idx) => (
                <div 
                  key={stepName} 
                  className={`flex flex-col items-center ${
                    step === 'upload' && idx === 0 ? 'text-blue-500 dark:text-blue-400' :
                    step === 'analyzing' && idx === 1 ? 'text-yellow-500 dark:text-yellow-400' :
                    step === 'results' && idx === 2 ? 'text-green-500 dark:text-green-400' :
                    'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-current bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
                    {idx + 1}
                  </span>
                  <span className="mt-2 text-sm font-medium">{stepName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl p-8 transition-all duration-200">
          {step === 'upload' && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                Destaque seu Currículo
              </h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Improved file upload area */}
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400">
                  <div className="text-center">
                    <Image
                      src="/icons/upload.svg"
                      alt="Upload"
                      width={64}
                      height={64}
                      className="mx-auto mb-6 text-blue-500"
                      style={{ color: 'rgb(59, 130, 246)' }}
                    />
                    <div className="text-base text-gray-600 dark:text-gray-300">
                      {file ? (
                        <p className="font-medium text-blue-500 dark:text-blue-400">{file.name}</p>
                      ) : (
                        <>
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                          >
                            <span>Envie seu currículo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept=".pdf"
                            />
                          </label>
                          <p className="mt-2">ou arraste o arquivo aqui</p>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Arquivo PDF até 2MB
                    </p>
                  </div>
                </div>

                {/* Improved form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Área Profissional
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        industry: e.target.value as Industry
                      }))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent py-3 px-4 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    >
                      {Object.entries(INDUSTRIES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value === 'TI' ? 'Tecnologia' : 
                           value === 'SAUDE' ? 'Saúde' : 
                           value === 'VENDAS' ? 'Vendas' :
                           value === 'ADMINISTRATIVO' ? 'Administrativo' :
                           value === 'ENGENHARIA' ? 'Engenharia' : 'Geral'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nível de Experiência
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        experienceLevel: e.target.value as FormData['experienceLevel']
                      }))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent py-3 px-4 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    >
                      <option value="ESTAGIO">Estágio</option>
                      <option value="JUNIOR">Júnior</option>
                      <option value="PLENO">Pleno</option>
                      <option value="SENIOR">Sênior</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição da Vaga (opcional)
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jobDescription: e.target.value
                    }))}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent py-3 px-4 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    placeholder="Cole aqui a descrição da vaga para uma análise mais precisa..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file}
                  className={`w-full py-4 px-6 rounded-xl text-white text-lg font-medium transition-all duration-200
                    ${!file 
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 transform hover:scale-[1.02]'}`}
                >
                  Destacar Currículo
                </button>
              </form>
            </>
          )}

          {step === 'analyzing' && (
            <>
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 dark:border-blue-400 border-t-transparent mx-auto mb-6"></div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Analisando seu Potencial
                </h2>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
                  <div 
                    className="bg-blue-500 dark:bg-blue-400 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                  {statusMessage}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {progress}% concluído
                </p>
              </div>
              {file && <PDFParserDynamic file={file} onParse={handleParse} onError={handleParseError} />}
            </>
          )}

          {step === 'results' && result && (
            <div className="space-y-10">
              <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
                Análise do seu Currículo
              </h2>

              {/* ATS Score - Improved visualization */}
              <section className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Índice de Aprovação ATS
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 mr-8">
                    <div className="h-5 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 dark:bg-green-400 transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${parseInt(result.ats.match(/\d+/)?.[0] || '0')}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-4xl font-bold text-green-500 dark:text-green-400 tabular-nums">
                    {result.ats.match(/\d+/)?.[0] || 0}%
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {result.ats.replace(/[\[\]]/g, '')}
                </p>
              </section>

              {/* Other sections with similar modern styling */}
              <section className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Pontos Fortes
                </h3>
                <ul className="space-y-4">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start group">
                      <span className="flex-shrink-0 h-6 w-6 text-green-500 dark:text-green-400 group-hover:scale-110 transition-transform">
                        ✓
                      </span>
                      <span className="ml-3 text-gray-600 dark:text-gray-300">
                        {strength.replace(/[\[\]]/g, '')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Sugestões de Melhoria
                </h3>
                <ul className="space-y-6">
                  {result.improvements.map((improvement, i) => (
                    <li key={i} className="group">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 h-6 w-6 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform">
                          ✗
                        </span>
                        <div className="ml-3 space-y-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                            {improvement.split('→')[0]?.trim()}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300">
                            {improvement.split('→').slice(1).join('→').trim()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Palavras-chave Sugeridas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {keyword.replace(/[\[\]]/g, '')}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Formatação
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {result.formatting.replace(/[\[\]]/g, '')}
                </p>
              </section>

              <div className="flex justify-center pt-10">
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setResult(null);
                  }}
                  className="px-8 py-4 bg-blue-500 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Analisar Novo Currículo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseAnalysis(analysis: string): AnalysisResult {
  try {
    // First try to split by sections
    const sections = analysis.split('\n\n').filter(Boolean);
    
    if (!sections.length) {
      throw new Error('Formato de análise inválido');
    }

    return {
      ats: extractSection(analysis, 'ATS_SCORE', 'ATS_COMPATIBILITY'),
      strengths: extractListItems(analysis, 'KEY_STRENGTHS'),
      improvements: extractListItems(analysis, 'CRITICAL_IMPROVEMENTS'),
      keywords: extractKeywords(analysis, 'KEYWORD_ANALYSIS'),
      formatting: extractSection(analysis, 'FORMATTING_ISSUES', 'TEMPLATE_SUGGESTION'),
    };
  } catch (error) {
    console.error('Error parsing analysis:', error);
    return {
      ats: 'Não foi possível analisar a compatibilidade ATS',
      strengths: ['Não foi possível identificar os pontos fortes'],
      improvements: ['Não foi possível gerar sugestões de melhoria'],
      keywords: ['Não foi possível extrair palavras-chave'],
      formatting: 'Não foi possível analisar a formatação',
    };
  }
}

// Helper functions for parsing
function extractSection(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start === -1) return '';
  
  const section = end === -1 
    ? text.slice(start + startMarker.length).trim()
    : text.slice(start + startMarker.length, end).trim();
    
  return section.replace(/^[:]\s*/, '');
}

function extractListItems(text: string, marker: string): string[] {
  const section = extractSection(text, marker, '\n\n');
  return section
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().replace(/^-\s*/, ''));
}

function extractKeywords(text: string, marker: string): string[] {
  const section = extractSection(text, marker, '\n\n');
  return section
    .split('\n')
    .flatMap(line => {
      const [, keywords] = line.split(':');
      return keywords 
        ? keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];
    });
} 