/**
 * MINERADOR PRO - Gemini AI Provider
 * Adapter for Google Gemini models
 */

import { AIProvider, AITask, AIResult, TaskType } from './AIOrchestrator';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  readonly isAvailable: boolean;
  readonly costPerToken = 0.0000005; // Example cost
  readonly maxContextLength = 32768;
  readonly capabilities: TaskType[] = [
    'classification',
    'entity_extraction',
    'normalization',
    'anomaly_detection',
    'query_generation',
    'semantic_similarity',
    'description_analysis',
    'intent_detection',
    'opportunity_ranking',
    'data_correction'
  ];
  
  private config: GeminiConfig;
  
  constructor(config: GeminiConfig) {
    this.config = config;
    this.isAvailable = !!config.apiKey;
  }
  
  async execute(task: AITask): Promise<AIResult> {
    const prompt = this.buildPrompt(task);
    
    const response = await fetch(
      `${this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${this.config.model || 'gemini-1.5-flash'}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
          }
        })
      }
    );
    
    const data = await response.json() as any;
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini API returned invalid response');
    }
    
    const outputText = data.candidates[0].content.parts[0].text;
    const outputData = JSON.parse(outputText);
    
    return {
      outputData,
      confidence: 0.85, // Would calculate from response metadata
      tokensUsed: data.usageMetadata?.totalTokenCount,
      model: this.config.model || 'gemini-1.5-flash',
      provider: 'Gemini'
    };
  }
  
  private buildPrompt(task: AITask): string {
    const prompts: Record<TaskType, string> = {
      classification: `Classify the following text into one of these categories: BUY, SELL, TRADE, LOOKING_FOR, URGENT_SALE, REPASSE, SERVICE_REQUEST, PARTS_REQUEST, AUCTION, DEALER, FLEET, UNKNOWN. Return JSON: {"category": "...", "confidence": 0.xx}

Text: ${JSON.stringify(task.inputData.text)}`,
      
      entity_extraction: `Extract vehicle information from the following text. Return JSON with: brand, model, year, mileage, price, phone, location (city, state).

Text: ${JSON.stringify(task.inputData.text)}`,
      
      normalization: `Normalize the following vehicle data to standard format. Return JSON with normalized fields.

Data: ${JSON.stringify(task.inputData)}`,
      
      anomaly_detection: `Analyze this advertisement for anomalies. Check for: impossible prices, suspicious discounts, wrong vehicle info, extraction errors. Return JSON: {"hasAnomaly": true/false, "anomalies": [...], "confidence": 0.xx}

Advertisement: ${JSON.stringify(task.inputData)}`,
      
      query_generation: `Generate effective search queries for finding truck advertisements in Brazil. Focus on: trucks, tractor units, trailers, heavy equipment. Include Brazilian Portuguese terms.

Context: ${JSON.stringify(task.inputData.context)}`,
      
      semantic_similarity: `Compare these two texts and return similarity score (0-1).

Text 1: ${JSON.stringify(task.inputData.text1)}
Text 2: ${JSON.stringify(task.inputData.text2)}

Return JSON: {"similarity": 0.xx}`,
      
      description_analysis: `Analyze this advertisement description for commercial intent and key information.

Description: ${JSON.stringify(task.inputData.text)}

Return JSON: {"intent": "...", "keyPoints": [...], "sentiment": "positive/neutral/negative"}`,
      
      intent_detection: `Detect the commercial intent in this text.

Text: ${JSON.stringify(task.inputData.text)}

Return JSON: {"intent": "BUY/SELL/TRADE/...", "urgency": "low/medium/high", "confidence": 0.xx}`,
      
      opportunity_ranking: `Rank this opportunity based on: price attractiveness, recency, data completeness, seller credibility.

Advertisement: ${JSON.stringify(task.inputData)}

Return JSON: {"opportunityScore": 0.xx, "reasons": [...]}`,
      
      data_correction: `Correct any errors in this extracted data based on context and common patterns.

Data: ${JSON.stringify(task.inputData)}
Context: ${JSON.stringify(task.inputData.context)}

Return JSON: {"correctedData": {...}, "changes": [...]}`
    };
    
    return prompts[task.type] || '';
  }
}
