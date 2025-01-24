// app/api/analyze/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';

// Configuração do rate limiting
// const ratelimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(5, '60 s'),
// });

// Schema de validação Zod
const AnalysisSchema = z.object({
  text: z.string().min(500, "O currículo deve ter pelo menos 500 caracteres").max(10000),
  industry: z.enum(['TI', 'SAUDE', 'VENDAS', 'ADMINISTRATIVO', 'ENGENHARIA', 'GERAL'])
    .transform(val => val.toUpperCase() as 'TI' | 'SAUDE' | 'VENDAS' | 'ADMINISTRATIVO' | 'ENGENHARIA' | 'GERAL')
    .default('GERAL'),
  jobDescription: z.string().max(1000).optional(),
  experienceLevel: z.enum(['ESTAGIO', 'JUNIOR', 'PLENO', 'SENIOR']).default('PLENO')
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {


  try {
    // Validação dos dados
    const rawData = await req.json();
    
    // Pre-process the industry field to uppercase
    const normalizedData = {
      ...rawData,
      industry: (rawData.industry || 'GERAL').toUpperCase()
    };

    // Log incoming data for debugging
    console.log('📥 Incoming request:', {
      industry: normalizedData.industry,
      textLength: normalizedData.text?.length,
      experienceLevel: normalizedData.experienceLevel
    });

    const parsedData = AnalysisSchema.parse(normalizedData);
    
    // Log parsed data
    console.log('✅ Parsed data:', {
      industry: parsedData.industry,
      textLength: parsedData.text.length,
      experienceLevel: parsedData.experienceLevel
    });

    const { 
      text,
      industry,
      jobDescription = '',
      experienceLevel
    } = parsedData;

    // Sanitização avançada
    const sanitizedText = text
      .slice(0, 3000)
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Estrutura do prompt otimizada
    const systemPrompt = `Você é um especialista em RH com certificação ATS. Siga rigorosamente:

    1. **Análise Estrutural** (40%)
    - Compatibilidade com Gupy/Vagas.com
    - Formato cronológico reverso
    - Densidade de palavras-chave

    2. **Otimização Semântica** (30%)
    - Mapeamento de sinônimos setoriais
    - Correspondência contextual com a vaga
    - Uso de verbos de ação quantificáveis

    3. **Análise de Mercado** (30%)
    - Progressão de carreira lógica
    - Compatibilidade salarial implícita
    - Gap analysis temporal

    **Formato de Resposta OBRIGATÓRIO:**
    --------------------------
    ATS_SCORE: [0-100]/100
    ATS_COMPATIBILITY: [COMPATÍVEL|PARCIAL|INCOMPATÍVEL]
    
    KEY_STRENGTHS:
    - [Força 1] + [Métrica]
    - [Força 2] + [Métrica]
    
    CRITICAL_IMPROVEMENTS:
    - [Prioridade 1] → [Solução]
    - [Prioridade 2] → [Solução]
    
    KEYWORD_ANALYSIS:
    Setoriais: [kw1, kw2, kw3]
    Soft Skills: [ss1, ss2]
    Tecnologias: [tech1, tech2]
    
    FORMATTING_ISSUES:
    - [Problema 1]
    - [Problema 2]
    
    TEMPLATE_SUGGESTION: [Modelo Recomendado]`;

    const userPrompt = `**Área:** ${industry}
    **Nível:** ${experienceLevel}
    **Descrição da Vaga:** ${jobDescription.slice(0,500)}
    **Currículo:** ${sanitizedText}`;

    // Chamada à API
    const startTime = Date.now();
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "text" }
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    
    const data = await response.json();
    const analysisTime = Date.now() - startTime;

    // Validação da resposta
    const analysisContent = data.choices[0].message.content;
    const validationResult = validateAnalysisStructure(analysisContent);

    if (!validationResult.valid) {
      throw new Error(`Formato de análise inválido: ${validationResult.error}`);
    }

    return NextResponse.json({
      ...parseAnalysisResponse(analysisContent),
      metadata: {
        processingTime: analysisTime,
        textLength: sanitizedText.length,
        industry,
        experienceLevel
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return handleAnalysisError(error);
  }
}

// Funções auxiliares
function validateAnalysisStructure(content: string) {
  const requiredSections = [
    'ATS_SCORE:', 'KEY_STRENGTHS:', 'CRITICAL_IMPROVEMENTS:',
    'KEYWORD_ANALYSIS:', 'FORMATTING_ISSUES:', 'TEMPLATE_SUGGESTION:'
  ];

  const missing = requiredSections.filter(section => !content.includes(section));
  return {
    valid: missing.length === 0,
    error: missing.length > 0 ? `Seções faltando: ${missing.join(', ')}` : null
  };
}

function parseAnalysisResponse(content: string) {
  const sections = content.split('\n--------------------------\n');
  return {
    rawAnalysis: content,
    structuredAnalysis: sections.length > 1 ? sections[1] : null
  };
}

function handleAnalysisError(error: unknown) {
  const defaultError = {
    error: 'Erro na análise do currículo',
    details: 'Falha interna no processamento',
    status: 500
  };

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    const statusMap: Record<string, number> = {
      'rate limit': 429,
      'quota': 429,
      'invalid request': 400
    };

    const status = Object.entries(statusMap).find(([key]) => 
      error.message.toLowerCase().includes(key)
    )?.[1] || 500;

    return NextResponse.json(
      { error: error.message, details: error.stack },
      { status }
    );
  }

  return NextResponse.json(defaultError, { status: 500 });
}