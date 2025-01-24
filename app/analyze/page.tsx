'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parseResume } from '@/utils/parser';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

type Step = 'upload' | 'analyzing' | 'results';

export const INDUSTRIES = {
  TI: 'TI',
  SAUDE: 'SAUDE',
  VENDAS: 'VENDAS',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  ENGENHARIA: 'ENGENHARIA',
  GERAL: 'GERAL',
} as const;

type Industry = keyof typeof INDUSTRIES;

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
}

interface FormData {
  industry: keyof typeof INDUSTRIES;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStep('analyzing');
    setError(null);
    setProgress(0);
    setStatusMessage('Iniciando processamento do arquivo...');

    try {
      setProgress(10);
      setStatusMessage('Lendo o arquivo...');
      const text = await parseResume(file);
      
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-between">
              {['Upload', 'Análise', 'Resultados'].map((step, idx) => (
                <div 
                  key={step} 
                  className={`flex items-center ${
                    idx === 0 && step === 'Upload' ? 'text-blue-600' :
                    idx === 1 && step === 'Análise' ? 'text-yellow-600' :
                    idx === 2 && step === 'Resultados' ? 'text-green-600' :
                    'text-gray-500'
                  }`}
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-current bg-white">
                    {idx + 1}
                  </span>
                  <span className="ml-2 text-sm font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          {step === 'upload' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Analise seu Currículo
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                  <div className="text-center">
                    <Image
                      src="/icons/upload.svg"
                      alt="Upload"
                      width={48}
                      height={48}
                      className="mx-auto mb-4 dark:invert"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {file ? (
                        <p className="font-medium">{file.name}</p>
                      ) : (
                        <>
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                            <span>Faça upload do seu currículo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept=".pdf"
                            />
                          </label>
                          <p className="mt-1">ou arraste e solte aqui</p>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      PDF até 2MB
                    </p>
                  </div>
                </div>

                {/* Additional Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Área de Atuação
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        industry: e.target.value as keyof typeof INDUSTRIES
                      }))}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nível de Experiência
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        experienceLevel: e.target.value as FormData['experienceLevel']
                      }))}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ESTAGIO">Estágio</option>
                      <option value="JUNIOR">Júnior</option>
                      <option value="PLENO">Pleno</option>
                      <option value="SENIOR">Sênior</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição da Vaga (opcional)
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jobDescription: e.target.value
                    }))}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Cole aqui a descrição da vaga para uma análise mais precisa..."
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file}
                  className={`w-full py-4 px-6 rounded-full text-white text-lg font-medium transition
                    ${!file 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Analisar Currículo
                </button>
              </form>
            </>
          )}

          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-4">Analisando seu Currículo</h2>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {statusMessage}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {progress}% concluído
              </p>
            </div>
          )}

          {step === 'results' && result && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-center mb-8">
                Análise do Currículo
              </h2>

              {/* ATS Score */}
              <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Compatibilidade ATS</h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${parseInt(result.ats.match(/\d+/)?.[0] || '0')}%` 
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-2xl font-bold text-green-600">
                    {result.ats.match(/\d+/)?.[0] || 0}%
                  </span>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {result.ats.replace(/[\[\]]/g, '')}
                </p>
              </section>

              {/* Strengths Section */}
              <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Pontos Fortes</h3>
                <ul className="space-y-3">
                  {result.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 text-green-500">✓</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {strength.replace(/[\[\]]/g, '')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Sugestões de Melhoria</h3>
                <ul className="space-y-3">
                  {result.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 text-red-500">✗</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {improvement.replace(/[\[\]]/g, '')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Palavras-chave Sugeridas</h3>
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

              <section className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Formatação</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {result.formatting.replace(/[\[\]]/g, '')}
                </p>
              </section>

              <div className="flex justify-center pt-8">
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setResult(null);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                  Analisar Outro Currículo
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