
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Presentation } from '../types';

interface GenerationDetails {
    eventCategory: string;
    eventName:string;
    recipientName: string;
    designation: string;
    message: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
    eventHost: string;
}

const getAiInstance = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key is not provided.");
    }
    return new GoogleGenAI({ apiKey });
};

export const extractTextFromImage = async (apiKey: string, base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAiInstance(apiKey);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Extract the complete text content from this image. If the image is a document, transcribe it verbatim." },
                { inlineData: { mimeType: mimeType, data: base64Image } }
            ]
        },
    });
    return response.text;
};

export const generatePptContent = async (apiKey: string, details: GenerationDetails): Promise<Presentation> => {
    const ai = getAiInstance(apiKey);
    const prompt = `
        You are an expert designer of invitation presentations. Based on the following details, generate a 5-slide presentation structure for a ${details.eventCategory} invitation. The tone should be appropriate for the event: warm and respectful for a retirement, joyful for a birthday or wedding, and professional for a corporate event.

        **Event Details:**
        - **Category:** ${details.eventCategory}
        - **Event Name / Purpose:** ${details.eventName}
        - **Subject/Honoree:** ${details.recipientName}
        - **Achievement / Reason:** ${details.designation}
        - **Invitation Message:** ${details.message}
        - **Date:** ${details.eventDate}
        - **Time:** ${details.eventTime}
        - **Venue:** ${details.eventVenue}
        - **Hosted By:** ${details.eventHost}

        **Slide Structure Guidelines (follow this closely):**
        - **Slide 1: Title Slide:** Create a powerful and elegant title suitable for a ${details.eventCategory}. It should include the main event title and the subject's name, "${details.recipientName}".
        - **Slide 2: The Invitation:** Formally invite the guests. State that they are invited to celebrate the occasion for the honoree and mention the reason for celebration from the 'designation' field.
        - **Slide 3: A Note of Reflection/Celebration:** Include a heartfelt message appropriate for the event. Use the provided invitation message as inspiration.
        - **Slide 4: Event Logistics:** Clearly list the details of the ceremony. It should have separate lines for "Date", "Time", and "Venue". Use the exact details provided.
        - **Slide 5: Closing Slide:** A warm closing. Include a line like "Looking forward to celebrating with you." and state who the invitation is from ("Warm Regards, ${details.eventHost}").

        Generate the output in the specified JSON format.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    slides: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                             required: ["title", "content"]
                        }
                    }
                },
                required: ["slides"]
            },
        },
    });
    
    return JSON.parse(response.text) as Presentation;
};


export const generateInvitationVideo = async (apiKey: string, presentation: Presentation, base64Image: string, mimeType: string): Promise<string | null> => {
    const ai = getAiInstance(apiKey);

    const slidesDescription = presentation.slides.map((slide, index) => `
**Scene ${index + 1}: (Based on Slide ${index + 1})**
- **Title:** "${slide.title}"
- **Content:**
  ${slide.content.map(item => `- ${item}`).join('\n  ')}
- **Visuals:** Animate this text elegantly on screen. This scene should last for about 3-4 seconds.
`).join('');

    const prompt = `
        You are an expert video creator. Create a short, elegant 15-20 second invitation video based on the following presentation content.
        The video should be structured into scenes corresponding to each slide, with smooth, professional transitions between them.
        Use the provided image as the main visual inspiration for backgrounds, colors, and thematic elements. The video's style should be sophisticated and match the tone of the presentation. Use a mix of elegant, readable fonts.

        **Presentation Content for Video Scenes:**
        ${slidesDescription}

        Please generate a high-quality video that brings this presentation to life.
    `;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: base64Image,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        return `${downloadLink}&key=${apiKey}`;
    }

    return null;
};
