
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Presentation } from '../types';

interface GenerationDetails {
    eventCategory: string;
    eventName: string;
    recipientName: string;
    designation: string;
    message: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
    eventHost: string;
}

export const extractTextFromImage = async (apiKey: string, base64Image: string): Promise<string> => {
    if (!apiKey) throw new Error("API_KEY is not set");
    const ai = new GoogleGenAI({ apiKey });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Extract the complete text content from this image. If the image is a document, transcribe it verbatim." },
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ]
        },
    });
    return response.text;
};

export const generatePptContent = async (apiKey: string, details: GenerationDetails): Promise<Presentation> => {
    if (!apiKey) throw new Error("API_KEY is not set");
    const ai = new GoogleGenAI({ apiKey });

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


export const generateInvitationVideo = async (apiKey: string, details: GenerationDetails, base64Image: string): Promise<string | null> => {
    if (!apiKey) throw new Error("API_KEY is not set");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        Create a short, elegant 15-second ${details.eventCategory} invitation video for ${details.recipientName}, celebrating their ${details.designation}.
        The video should be structured into four distinct scenes with smooth transitions, like an animated slideshow.
        Use the provided image as the main visual inspiration for backgrounds and thematic elements.
        The tone should be appropriate for a ${details.eventCategory}: celebratory, warm, and professional. Use a mix of elegant fonts suitable for the event.

        **Scene 1 (0-3 seconds):**
        Open with a title card. Animate a title suitable for a ${details.eventCategory} event, followed by "${details.recipientName}" in a large, stylish font. For a retirement, something like "A Journey Well Retired" is appropriate.

        **Scene 2 (3-6 seconds):**
        Transition to the formal invitation. Animate the text: "You are cordially invited to the ${details.eventName}."

        **Scene 3 (6-10 seconds):**
        Display the event details. Animate the following lines of text onto the screen:
        - Date: ${details.eventDate}
        - Time: ${details.eventTime}
        - Venue: ${details.eventVenue}

        **Scene 4 (10-15 seconds):**
        End with a warm closing. Animate the text "Looking forward to celebrating with you.", followed by "Warm Regards, ${details.eventHost}".
    `;

    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: base64Image,
            mimeType: 'image/jpeg',
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
