import axios from 'axios';

/**
 * V3.1 - Serviço de Voz ElevenLabs para Conversão de Pitches em PTT (Áudio)
 */
export async function generateAudioPTT(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY não configurada no servidor.');
  }

  // Voice ID: Joshua (Versatile & Professional for sales)
  const voiceId = '69786801-7056-43f1-b844-342045672654'; 
  
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Erro na ElevenLabs API:', error.response?.data || error.message);
    throw new Error('Falha ao converter texto em áudio via ElevenLabs.');
  }
}
