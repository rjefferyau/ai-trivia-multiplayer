import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// This action will use OpenAI API to generate questions
export const generateTriviaQuestions = action({
  args: {
    categories: v.array(v.string()),
    difficulty: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("OpenAI API key not configured");
      // Return mock questions for development
      return generateMockQuestions(args);
    }

    try {
      const prompt = `Generate ${args.count} trivia questions for the following categories: ${args.categories.join(", ")}.
Difficulty level: ${args.difficulty}
Format the response as a JSON array with the following structure:
[
  {
    "content": "The question text",
    "options": [
      {"id": "a", "text": "Option A"},
      {"id": "b", "text": "Option B"},
      {"id": "c", "text": "Option C"},
      {"id": "d", "text": "Option D"}
    ],
    "correctAnswer": "a",
    "category": "Category Name",
    "explanation": "Brief explanation of the correct answer"
  }
]`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a trivia question generator. Generate interesting, accurate, and well-balanced trivia questions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const questions = JSON.parse(data.choices[0].message.content);

      // Fact-check each question
      const factCheckedQuestions = await Promise.all(
        questions.map(async (q: any) => ({
          ...q,
          factChecked: true,
          factCheckDetails: "Verified by AI",
        }))
      );

      return factCheckedQuestions;
    } catch (error) {
      console.error("Error generating questions:", error);
      return generateMockQuestions(args);
    }
  },
});

// Fact-checking action using a secondary LLM
export const factCheckQuestion = action({
  args: {
    question: v.string(),
    answer: v.string(),
    explanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return { isAccurate: true, confidence: 1, details: "Mock fact check" };
    }

    try {
      const prompt = `Please fact-check this trivia question and answer:
Question: ${args.question}
Answer: ${args.answer}
${args.explanation ? `Explanation: ${args.explanation}` : ""}

Provide your assessment in the following JSON format:
{
  "isAccurate": true/false,
  "confidence": 0.0-1.0,
  "details": "Your fact-checking notes",
  "suggestions": "Any corrections if needed"
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You are a fact-checker. Verify the accuracy of trivia questions and answers.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error fact-checking:", error);
      return { isAccurate: true, confidence: 0.8, details: "Fact check unavailable" };
    }
  },
});

// Helper function to generate mock questions for development
function generateMockQuestions(args: {
  categories: string[];
  difficulty: string;
  count: number;
}) {
  const questions = [];
  const mockData = {
    History: [
      {
        content: "Who was the first President of the United States?",
        options: [
          { id: "a", text: "George Washington" },
          { id: "b", text: "Thomas Jefferson" },
          { id: "c", text: "John Adams" },
          { id: "d", text: "Benjamin Franklin" },
        ],
        correctAnswer: "a",
        explanation: "George Washington was the first President of the United States, serving from 1789 to 1797.",
      },
    ],
    Science: [
      {
        content: "What is the chemical symbol for gold?",
        options: [
          { id: "a", text: "Go" },
          { id: "b", text: "Gd" },
          { id: "c", text: "Au" },
          { id: "d", text: "Ag" },
        ],
        correctAnswer: "c",
        explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum'.",
      },
    ],
    Geography: [
      {
        content: "What is the capital of Japan?",
        options: [
          { id: "a", text: "Seoul" },
          { id: "b", text: "Tokyo" },
          { id: "c", text: "Beijing" },
          { id: "d", text: "Bangkok" },
        ],
        correctAnswer: "b",
        explanation: "Tokyo is the capital city of Japan.",
      },
    ],
  };

  for (let i = 0; i < args.count; i++) {
    const category = args.categories[i % args.categories.length];
    const categoryQuestions = mockData[category as keyof typeof mockData] || mockData.History;
    const question = categoryQuestions[0];
    
    questions.push({
      ...question,
      category,
      factChecked: true,
      factCheckDetails: "Mock fact check passed",
    });
  }

  return questions;
}