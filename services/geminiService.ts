import { GoogleGenAI, Type } from "@google/genai";
import { BlogPost } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Find trending topics using Search Tool and return structured JSON
 */
export const generateTrendingTopics = async (context?: string): Promise<Partial<BlogPost>[]> => {
  const model = "gemini-3-flash-preview";
  
  const contextInstruction = context?.trim() 
    ? `**USER CONTEXT OVERRIDE:** The user has explicitly requested to focus on the domain/theme of: "${context}". 
       Ensure ALL 5 topics and twists strongly relate to "${context}" while strictly maintaining the "Distinguished Architect" persona defined below. 
       Do not deviate from this domain.` 
    : '';

  const prompt = `
    Find 5 trending topics or emerging discussions in Artificial Intelligence from the last 24-48 hours.
    
    ${contextInstruction}
    
    **CRITICAL FILTERING & STYLE GUIDE:**
    You are acting as a Distinguished Software Architect with 19+ years of experience. You do NOT write generic tech news. You write about **Architecture, Systems Thinking, and Pattern Recognition**.
    
    Select topics that allow for the following specific types of "Twists" (Use these examples as a compass for the tone/depth required):
    
    1. **Architectural Deja Vu:** (e.g., "Agents are just Microservices with worse governance," or "Prompt Engineering is just brittle hard-coding re-branded").
    2. **Physics/Biology Analogies:** (e.g., "Swarm Intelligence vs Centralized Planning," "The Observer Effect in AI Evaluation," or "Thermodynamics of Large Context Windows").
    3. **The "Unsexy" Enterprise Reality:** (e.g., "AI in air-gapped environments," "The death of deterministic logic in compliance," or "Technical Debt in RAG pipelines").
    4. **Paradigm Shifts:** (e.g., "From Building Software to Gardening Conditions," or "Designing systems you are not allowed to trust").

    **OUTPUT REQUIREMENTS:**
    Return a JSON list. Each item must have:
    - topic: The core trending news topic.
    - twist: The intellectual hook/analogy.
    - title: A provocative, "page-turning" title. It should sound like a manifesto or a warning.

    **Example Titles to Emulate:**
    - "Agents Are the New Microservices — and We’re Repeating the Same Mistakes"
    - "If Intelligence Is Emergent, Why Are We Still Designing AI Like Software?"
    - "The Architecture Skill No One Is Hiring For: Decision Decomposition"
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              twist: { type: Type.STRING },
              title: { type: Type.STRING },
            },
            required: ["topic", "twist", "title"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const rawData = JSON.parse(jsonText);
    
    return rawData.map((item: any, index: number) => ({
      id: `post-${Date.now()}-${index}`,
      topic: item.topic,
      twist: item.twist,
      title: item.title,
      status: 'pending',
      goals: [],
      summary: '',
      conclusion: ''
    }));
  } catch (error) {
    console.error("Error generating topics:", error);
    throw new Error("Failed to fetch trending topics. Please try again.");
  }
};

/**
 * Step 2: Generate the content (Summary, Goals, Conclusion) for a specific post
 */
export const generatePostContent = async (post: BlogPost): Promise<Partial<BlogPost>> => {
  const model = "gemini-3-flash-preview";

  const userPersona = `
    I am a seasoned engineer and architect with over 19 years of experience. I have led global teams, filed patents, and reimagined enterprise platforms.
    My strength is **Deep Systems Thinking**. I don't just use tools; I deconstruct them. 
    I view AI through the lens of:
    - Distributed Systems (CAP theorem, consistency, latency)
    - Governance & Risk (Compliance, Licensing, Safety)
    - Biological/Physical Systems (Emergence, Entropy, Evolution)
    - Leadership (Team topology, decision fatigue, mentorship)
  `;
  
  const prompt = `
    Write a blog post component for the following topic:
    Title: ${post.title}
    Core Topic: ${post.topic}
    Twist/Angle: ${post.twist}

    **AUTHOR PERSONA & VOICE:**
    ${userPersona}
    
    **CRITICAL STYLE INSTRUCTION: SIMPLICITY**
    The user wants the **unique concept** to stand out, NOT the vocabulary.
    - **Simplify the language.** Use plain, direct English. 
    - Avoid academic fluff, buzzwords, and overly complex sentence structures.
    - Explain high-level architectural concepts clearly, as if explaining to a smart colleague over coffee.
    - True seniority is demonstrated by making complex ideas sound simple.

    **MANDATORY SIGNALS TO INCLUDE:**
    The content must demonstrate specific "Signals" that catch the attention of high-level industry peers and recruiters:
    1. **Pattern Recognition:** Connect the current AI trend to historical software patterns (e.g., SOA, early Cloud, Mainframes).
    2. **Enterprise Realism:** Acknowledge constraints. Discuss trade-offs, failure modes, and "Day 2" operations.
    3. **Architectural Clarity:** Instead of jargon bombing, provide clear mental models for complex behaviors (e.g., "idempotency," "race conditions").
    4. **Thought Leadership:** Challenge the status quo with your specific twist.

    **OUTPUT REQUIREMENTS:**
    1. **Summary (150-200 words):** A clear, engaging hook. Define the problem space through your unique "Twist" using simple language.
    2. **3 Core Goals:** 
       - Goal 1: An Architectural Pattern/Mental Model.
       - Goal 2: A Leadership/Team Strategy for this era.
       - Goal 3: A "Hidden Risk" or "Counter-intuitive Opportunity".
    3. **Conclusion (100 words):** A philosophically grounding closing statement that triggers imagination.

    Return JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          goals: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            minItems: 3,
            maxItems: 3
          },
          conclusion: { type: Type.STRING },
        },
        required: ["summary", "goals", "conclusion"],
      },
    },
  });

  const content = JSON.parse(response.text || "{}");
  return {
    ...content
  };
};

/**
 * Step 3: Generate a Claymation Image for the post
 */
export const generateClaymationImage = async (post: BlogPost): Promise<string> => {
  // Using gemini-2.5-flash-image for standard generation
  const model = "gemini-2.5-flash-image"; 

  const prompt = `Generate an image.
    Create a highly detailed, artistic claymation style image for a blog post titled "${post.title}".
    
    **Concept:** The image must visualize the abstract architectural twist: "${post.twist}".
    
    **Visual Metaphors to explore (Pick one based on the twist):**
    - "Agents as Microservices": Clay robots tangled in strings (representing dependency hell).
    - "Emergent Intelligence": Clay ants building a complex digital cathedral.
    - "Quantum/Observer": A clay figure looking at a box, and the box changing shape.
    - "Tech Debt": A beautiful clay futuristic tower built on a crumbling clay foundation.

    **Style:** Polymer clay texture, stop-motion animation aesthetic, cinematic studio lighting, shallow depth of field, 4k detail.
    **Mood:** Whimsical but intellectual.
    Do not include text in the image.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    // Extract image from response parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Log text if available for debugging why image wasn't generated
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
      console.warn("Model returned text instead of image:", textPart.text);
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    // Return a placeholder if generation fails to avoid crashing the whole flow
    return `https://picsum.photos/seed/${encodeURIComponent(post.id)}/800/450?grayscale`; 
  }
};