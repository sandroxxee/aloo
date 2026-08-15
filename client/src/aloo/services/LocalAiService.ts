export class LocalAiService {
  private static mlcEngine: any = null;

  static async optimizeSearchQuery(
    userQuery: string, 
    geminiApiKey?: string | null
  ): Promise<string> {
    const prompt = `Atue como um especialista em caminhões. Converta esta frase de um cliente leigo '${userQuery}' em uma lista de até 5 palavras-chave curtas, técnicas e diretas para buscar em sites de classificados. Retorne APENAS as palavras-chave separadas por espaço.`;

    // Tier 1: Chrome Built-in AI (Gemini Nano)
    try {
      // Check for Chrome AI support
      const ai = (window as any).ai;
      if (ai && ai.languageModel && ai.languageModel.create) {
        console.log('[LocalAiService] Utilizando Chrome Built-in AI (Gemini Nano)');
        const capabilities = await ai.languageModel.capabilities();
        if (capabilities && capabilities.available !== 'no') {
          const session = await ai.languageModel.create();
          const response = await session.prompt(prompt);
          if (response) return response.replace(/\n/g, ' ').trim();
        }
      }
      
      // Fallback for older window.ai.assistant API
      if (ai && ai.assistant && ai.assistant.create) {
        console.log('[LocalAiService] Utilizando Chrome Built-in AI (Assistant API)');
        const capabilities = await ai.assistant.capabilities();
        if (capabilities && capabilities.available !== 'no') {
          const session = await ai.assistant.create();
          const response = await session.prompt(prompt);
          if (response) return response.replace(/\n/g, ' ').trim();
        }
      }
    } catch (e) {
      console.warn('[LocalAiService] Erro no Chrome Built-in AI:', e);
    }

    // Tier 2: WebLLM via WebGPU (Fallback local)
    try {
      if ((navigator as any).gpu) {
        console.log('[LocalAiService] Inicializando WebLLM (WebGPU)');
        
        // Dynamically import from CDN as requested
        // @ts-ignore
        const { CreateWebWorkerMLCEngine, CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');
        
        if (!this.mlcEngine) {
          // Using a small and fast model for client-side
          const selectedModel = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
          this.mlcEngine = await CreateMLCEngine(selectedModel, {
            initProgressCallback: (progress: any) => {
              console.log('[LocalAiService] Carregando WebLLM:', progress.text);
            }
          });
        }
        
        const messages = [
          { role: "system", content: "Você é um especialista em busca automotiva e de classificados." },
          { role: "user", content: prompt }
        ];

        const reply = await this.mlcEngine.chat.completions.create({ messages });
        const response = reply.choices[0].message.content;
        
        if (response) {
          return response.replace(/\n/g, ' ').trim();
        }
      } else {
         console.warn('[LocalAiService] WebGPU não suportado pelo navegador.');
      }
    } catch (e) {
      console.warn('[LocalAiService] Erro no WebLLM:', e);
    }

    // Tier 3: BYOK (Bring Your Own Key - Gemini API)
    if (geminiApiKey) {
      try {
        console.log('[LocalAiService] Utilizando Gemini API (BYOK)');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text.replace(/\n/g, ' ').trim();
          }
        } else {
          throw new Error('Falha na API do Gemini');
        }
      } catch (e) {
        console.error('[LocalAiService] Erro no BYOK Gemini:', e);
        throw e;
      }
    }

    throw new Error('Nenhum método de IA disponível. Verifique se seu navegador suporta Chrome AI, WebGPU, ou forneça uma chave do Gemini.');
  }
}
