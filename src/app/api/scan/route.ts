import { NextResponse } from 'next/server';

// ☁️ CLOUDFLARE AI CONFIGURATION
// Credentials loaded from environment variables (set in .env.local)
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const MODEL_ID = '@cf/meta/llama-3.2-11b-vision-instruct';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'No image data provided' },
                { status: 400 }
            );
        }

        console.log("☁️ Calling Cloudflare AI...");

        // 1. Prepare Image Data (Base64 -> Array of Integers)
        // Cloudflare AI expects an array of integers for the image bytes
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Call Cloudflare API
        const cfResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL_ID}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: `You are analyzing an item for a campus marketplace app. Identify this item and respond ONLY with valid JSON (no markdown, no backticks, no other text):
{
  "objectName": "specific item name",
  "category": "one of: electronics, books, furniture, clothing, kitchen, sports, other",
  "material": "primary materials",
  "condition": "Like New, Good, Fair, or Poor",
  "estimatedCoins": number between 10-200,
  "recyclable": true or false,
  "upcycleIdeas": [
    { "title": "idea title", "description": "brief instruction (1 sentence)", "difficulty": "Easy/Medium" }
  ]
}`,
                    image: Array.from(bytes),
                }),
            }
        );

        if (!cfResponse.ok) {
            const errorText = await cfResponse.text();
            console.error('Cloudflare API Error:', errorText);
            throw new Error(`Cloudflare Error (${cfResponse.status}): ${errorText}`);
        }

        const aiResult = await cfResponse.json();

        // 🚨 DEBUG: Log the EXACT response structure
        console.log("🤖 Raw AI Result:", JSON.stringify(aiResult, null, 2).substring(0, 500) + "...");

        // 3. Parse Result
        // Cloudflare returns { result: { response: "..." } } or { result: { description: "..." } }
        const rawText = aiResult.result?.response || aiResult.result?.description;

        let parsedItem = {
            objectName: 'Unknown Item',
            category: 'Other',
            material: 'Mixed',
            condition: 'Good',
            estimatedCoins: 50,
            recyclable: true,
            upcycleIdeas: []
        };

        if (rawText) {
            // 🛡️ HANDLE OBJECT vs STRING
            if (typeof rawText === 'object') {
                console.log("ℹ️ Response is already an Object");
                parsedItem = { ...parsedItem, ...rawText };
            }
            else if (typeof rawText === 'string') {
                console.log("ℹ️ Response is a String, parsing...");
                let cleanText = rawText;
                // Remove markdown code blocks if present
                if (cleanText.includes("```json")) {
                    cleanText = cleanText.split("```json")[1].split("```")[0].trim();
                } else if (cleanText.includes("```")) {
                    cleanText = cleanText.split("```")[1].split("```")[0].trim();
                }

                try {
                    const parsed = JSON.parse(cleanText);
                    parsedItem = { ...parsedItem, ...parsed };
                } catch (e) {
                    console.warn("JSON Parse Failed, using fallback extraction", e);
                    parsedItem.objectName = cleanText.substring(0, 50).split('\n')[0].replace(/[{"},]/g, '').trim();
                }
            }
            else {
                console.warn("⚠️ Unexpected response type:", typeof rawText);
                parsedItem.objectName = String(rawText);
            }

            // Normalize Category
            if (parsedItem.category) {
                parsedItem.category = parsedItem.category.charAt(0).toUpperCase() + parsedItem.category.slice(1);
            }
        } else {
            console.warn("⚠️ No response/description found in result");
        }

        return NextResponse.json({
            success: true,
            classification: 'safe',
            xpEarned: 15,
            item: {
                ...parsedItem,
                confidence: 0.95,
                recycleInfo: 'Check local campus recycling guidelines',
                co2Savings: Math.round(parsedItem.estimatedCoins * 0.1)
            }
        });

    } catch (error: any) {
        console.error('Scan API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
