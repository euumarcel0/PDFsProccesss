import * as pdfjsLib from 'pdfjs-dist';
import i18next from 'i18next';
import type { Question, ProcessedQuestions } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function detectQuestionPattern(text: string): string {
  if (!text) return '';

  const patterns = [
    { regex: /question\s+#?\d+/i, pattern: 'question #' },
    { regex: /pergunta\s+\d+/i, pattern: 'pergunta' },
    { regex: /questão\s+\d+/i, pattern: 'questão' },
    { regex: /q\.\s*\d+/i, pattern: 'q.' }
  ];

  for (const { regex, pattern } of patterns) {
    if (regex.test(text)) {
      return pattern;
    }
  }

  return '';
}

function findQuestionEndIndex(text: string): number {
  // Procura pelo ponto de interrogação
  const questionMarkIndex = text.indexOf('?');
  if (questionMarkIndex !== -1) {
    return questionMarkIndex + 1;
  }

  // Se não encontrar ponto de interrogação, procura por padrões de alternativas
  const alternativePatterns = [
    /\s+[A-E][).]/i, // Padrão para A) ou A.
    /\s+Which\s+of\s+the\s+following/i,
    /\s+What\s+should/i,
    /\s+How\s+can/i
  ];

  for (const pattern of alternativePatterns) {
    const match = text.match(pattern);
    if (match && match.index) {
      return match.index;
    }
  }

  return text.length;
}

function extractQuestionText(text: string): { questionText: string; alternatives: string } {
  // Remove qualquer texto após "Correct Answer" ou "Community vote"
  const cleanText = text.split(/Correct Answer:|Community vote/i)[0].trim();
  
  // Encontra o final da pergunta
  const questionEndIndex = findQuestionEndIndex(cleanText);
  const questionText = cleanText.substring(0, questionEndIndex).trim();
  
  // O resto do texto são as alternativas
  const alternativesText = cleanText.substring(questionEndIndex).trim();
  
  // Verifica se as alternativas começam com um padrão válido (A, B, C, D, E)
  const validAlternatives = /^[A-E][).]/.test(alternativesText.trim());
  
  return {
    questionText,
    alternatives: validAlternatives ? alternativesText : ''
  };
}

function extractAlternatives(text: string): { letter: string; text: string }[] {
  if (!text) return [];

  const alternatives: { letter: string; text: string }[] = [];
  // Regex melhorado para capturar alternativas com ) ou .
  const alternativeRegex = /([A-E])[).]\s*([^\n]+?)(?=(?:\s+[A-E][).]|$))/gi;
  
  let match;
  while ((match = alternativeRegex.exec(text)) !== null) {
    const [_, letter, content] = match;
    if (letter && content) {
      alternatives.push({
        letter: letter.toUpperCase(),
        text: content.trim()
      });
    }
  }

  return alternatives;
}

async function translateText(text: string): Promise<string> {
  if (!text) return '';
  
  try {
    return text; // Temporariamente desativando a tradução até configurar corretamente
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function extractQuestions(text: string, pattern: string): Question[] {
  if (!text || !pattern) return [];

  const questions: Question[] = [];
  const questionRegex = new RegExp(
    `(?:${pattern}\\s*#?)(\\d+)([^a-zA-Z\\d][^]*?)(?=(?:${pattern}|$))`,
    'gis'
  );

  const matches = Array.from(text.matchAll(questionRegex));
  
  for (const match of matches) {
    const [_, number, fullText] = match;
    if (!number || !fullText) continue;

    const { questionText, alternatives: alternativesText } = extractQuestionText(fullText.trim());
    const alternatives = extractAlternatives(alternativesText);

    if (alternatives.length === 0) continue;

    questions.push({
      number: parseInt(number),
      text: questionText.trim(),
      alternatives
    });
  }

  return questions;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  if (!file) {
    throw new Error('Nenhum arquivo foi fornecido.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const textContent: string[] = [];
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      if (text) {
        textContent.push(text);
      }
      if (onProgress) {
        onProgress(i, totalPages);
      }
    }

    if (textContent.length === 0) {
      throw new Error('O PDF não contém texto legível.');
    }

    return textContent;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Falha ao extrair texto do PDF. Por favor, tente novamente.');
  }
}

export async function processQuestionsFromText(texts: string[]): Promise<ProcessedQuestions> {
  if (!texts || texts.length === 0) {
    throw new Error('Nenhum texto foi fornecido para processamento.');
  }

  const fullText = texts.join('\n');
  const pattern = detectQuestionPattern(fullText);
  
  if (!pattern) {
    throw new Error('Não foi possível detectar um padrão de questões no PDF.');
  }

  const questions = extractQuestions(fullText, pattern);
  
  if (!questions || questions.length === 0) {
    throw new Error('Nenhuma questão foi encontrada no PDF.');
  }

  return {
    pattern,
    questions
  };
}

export function generateExcelData(questions: Question[]): any[] {
  if (!questions || !Array.isArray(questions)) return [];

  return questions.map(question => ({
    'Questão': question.text || '',
    'A': question.alternatives.find(alt => alt?.letter === 'A')?.text || '',
    'B': question.alternatives.find(alt => alt?.letter === 'B')?.text || '',
    'C': question.alternatives.find(alt => alt?.letter === 'C')?.text || '',
    'D': question.alternatives.find(alt => alt?.letter === 'D')?.text || '',
    'E': question.alternatives.find(alt => alt?.letter === 'E')?.text || ''
  }));
}