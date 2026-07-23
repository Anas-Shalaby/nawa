import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { patientName, allergies, chronicDiseases, lastDiagnosis, totalVisits, locale } = body;

    const isAr = locale === "ar";
    
    // Construct the prompt for the AI
    const systemPrompt = isAr
      ? `أنت Nawah AI، مساعد طبي ذكي ضمن نظام إدارة عيادات فاخر. يجب عليك قراءة السجل الطبي التالي للمريض وتقديم ملخص طبي احترافي وموجه للطبيب المعالج. يجب أن يكون ردك مختصراً جداً (3-4 أسطر كحد أقصى) وبدون مقدمات طويلة. استخدم نبرة احترافية، وقدم اقتراحاً بسيطاً أو ملاحظة طبية بخصوص الجلسة الحالية بناءً على الأمراض المزمنة أو التشخيص الأخير.`
      : `You are Nawah AI, an intelligent medical assistant in a premium clinic management system. Read the following patient history and provide a highly professional, concise medical summary for the treating doctor. Your response must be very brief (3-4 lines max) without long introductions. Use a professional tone and suggest a simple clinical focus or observation for the current session based on chronic conditions or recent diagnoses.`;

    const patientData = isAr
      ? `اسم المريض: ${patientName}
إجمالي الزيارات السابقة: ${totalVisits}
الأمراض المزمنة: ${chronicDiseases?.length ? chronicDiseases.join("، ") : "لا يوجد"}
الحساسية: ${allergies?.length ? allergies.join("، ") : "لا يوجد"}
آخر تشخيص معروف: ${lastDiagnosis || "غير متوفر"}`
      : `Patient Name: ${patientName}
Total Previous Visits: ${totalVisits}
Chronic Conditions: ${chronicDiseases?.length ? chronicDiseases.join(", ") : "None"}
Allergies: ${allergies?.length ? allergies.join(", ") : "None"}
Last Known Diagnosis: ${lastDiagnosis || "N/A"}`;

    const prompt = `${systemPrompt}\n\n[بيانات المريض]\n${patientData}\n\nالرد (بصيغة الطبيب مباشرة):`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ summary: text });
  } catch (error: any) {
    console.error("[Nawah AI Error]", error);
    return NextResponse.json(
      { error: "Failed to generate AI summary." },
      { status: 500 }
    );
  }
}
