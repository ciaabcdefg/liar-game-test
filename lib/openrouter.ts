import { QuestionPair } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are a question generator for a party game called "Guess the Liar". 
Your job is to generate a pair of questions: one "real" question and one "imposter" question.

Rules:
- Both questions should be on the SAME topic/theme
- The real question should be specific and clear
- The imposter question should be subtly different — same topic area but asking about something slightly different
- The difference should be enough that answers would be noticeably different, but not so obvious that the topic itself changes
- Questions should be fun, interesting, and suitable for a party game
- Questions should be open-ended (not yes/no) so players need to write a short answer
- Keep questions concise (1-2 sentences max)

Examples of good pairs:
- Real: "What's your favorite pizza topping?" / Imposter: "What's your least favorite pizza topping?"
- Real: "If you could visit any country, where would you go?" / Imposter: "If you could live in any country permanently, where would you go?"
- Real: "What's the most overrated movie of all time?" / Imposter: "What's the most underrated movie of all time?"

Respond ONLY with valid JSON in this exact format:
{"realQuestion": "...", "imposterQuestion": "..."}`;

export async function generateQuestions(apiKey: string): Promise<QuestionPair> {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Guess the Liar Game',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: 'Generate a new question pair for the game. Be creative and pick a fun topic!' },
                ],
                temperature: 1.0,
                max_tokens: 300,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('OpenRouter API error:', response.status, errorBody);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in OpenRouter response');
        }

        const parsed = JSON.parse(content);

        if (!parsed.realQuestion || !parsed.imposterQuestion) {
            throw new Error('Invalid question format from LLM');
        }

        return {
            realQuestion: parsed.realQuestion,
            imposterQuestion: parsed.imposterQuestion,
        };
    } catch (error) {
        console.error('Failed to generate questions:', error);
        // Fallback questions in case API fails
        return getFallbackQuestions();
    }
}

function getFallbackQuestions(): QuestionPair {
    const fallbacks: QuestionPair[] = [
        {
            realQuestion: "What's your favorite childhood cartoon?",
            imposterQuestion: "What's a childhood cartoon you never liked?",
        },
        {
            realQuestion: "If you could have dinner with any historical figure, who would it be?",
            imposterQuestion: "If you could have dinner with any fictional character, who would it be?",
        },
        {
            realQuestion: "What's the best vacation you've ever been on?",
            imposterQuestion: "What's the worst vacation you've ever been on?",
        },
        {
            realQuestion: "What superpower would you want to have?",
            imposterQuestion: "What superpower would be the most useless?",
        },
        {
            realQuestion: "What's a hobby you've always wanted to try?",
            imposterQuestion: "What's a hobby you tried and gave up on?",
        },
        {
            realQuestion: "What's the best gift you've ever received?",
            imposterQuestion: "What's the worst gift you've ever received?",
        },
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
