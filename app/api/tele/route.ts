import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // Ưu tiên đọc từ file .env. Nếu Next.js bị kẹt cache không đọc được, nó sẽ tự động dùng luôn đoạn mã phía sau.
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8720503070:AAFdZz3n0vO-7EZmxb7SKeq7o0xQqQF2Nmk";
    const chatId = process.env.TELEGRAM_CHAT_ID || "-5292640793";

    // In ra terminal để bạn dễ kiểm tra
    console.log("🚀 Đang gửi tin nhắn Telegram...");
    console.log("Token:", botToken);
    console.log("Chat ID:", chatId);

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Thiếu cấu hình Telegram Bot' }, 
        { status: 400 }
      );
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Lỗi từ Telegram:", data);
      return NextResponse.json(
        { error: data.description || 'Lỗi từ Telegram API' }, 
        { status: response.status }
      );
    }

    console.log("✅ Gửi Telegram thành công!");
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("❌ Lỗi API Telegram:", error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống máy chủ' }, 
      { status: 500 }
    );
  }
}