import { QuestionPair } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function buildSystemPrompt(language: string, topic: string): string {
    const topicInstruction = topic
        ? `- Questions MUST be related to the topic: "${topic}"\n`
        : '';

    const languageInstruction = language && language !== 'English'
        ? `- All questions MUST be written in ${language}\n`
        : '';

    return `You are a question generator for a party game called "Guess the Liar". 
Your job is to generate a pair of questions: one "real" question and one "imposter" question.

Rules:
- Both questions should be on the SAME topic/theme so the answers fall in the same category
- The real question and imposter question should produce STARKLY DIFFERENT answers, even though the answers are in the same category
- For example: "Name a good anime" vs "Name a bad anime" — both answers are anime titles, but one is loved and the other is hated
- Another example: "What's the best country to visit?" vs "What's the worst country to visit?" — both name countries but with opposite sentiment
- Another example: "Name an expensive car brand" vs "Name a cheap car brand" — both are car brands but opposite ends
- The key is: answers are in the same category, but the DIFFERENCE between the imposter's answer and others' answers should be noticeable to an observant player
- Questions should be fun, interesting, and suitable for a party game
- Questions should be open-ended (not yes/no) so players need to write a short answer
- Keep questions concise (1-2 sentences max)
${topicInstruction}${languageInstruction}
Respond ONLY with valid JSON in this exact format:
{"realQuestion": "...", "imposterQuestion": "..."}`;
}

export async function generateQuestions(
    apiKey: string,
    language: string = 'English',
    topic: string = '',
    pastQuestions: string[] = [],
): Promise<QuestionPair> {
    try {
        const systemPrompt = buildSystemPrompt(language, topic);

        // Build user message with past questions to avoid
        let userMessage = 'Generate a new question pair for the game. Be creative and pick a fun topic!';
        if (pastQuestions.length > 0) {
            userMessage += `\n\nIMPORTANT: Do NOT generate questions similar to these previously used ones:\n${pastQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n\nMake sure the new question is on a DIFFERENT topic or angle.`;
        }

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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
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
            realQuestion: "Name a movie everyone loves",
            imposterQuestion: "Name a movie everyone hates",
        },
        {
            realQuestion: "What's the best food to eat on a cold day?",
            imposterQuestion: "What's the best food to eat on a hot day?",
        },
        {
            realQuestion: "Name an animal that makes a great pet",
            imposterQuestion: "Name an animal that would make a terrible pet",
        },
        {
            realQuestion: "What's a skill that's easy to learn?",
            imposterQuestion: "What's a skill that's extremely hard to learn?",
        },
        {
            realQuestion: "Name a song that always makes you happy",
            imposterQuestion: "Name a song that always makes you sad",
        },
        {
            realQuestion: "What's a cheap hobby anyone can start?",
            imposterQuestion: "What's an expensive hobby only rich people do?",
        },
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
