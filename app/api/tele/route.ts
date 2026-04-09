// Đường dẫn file: app/api/tele/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // Đọc biến môi trường từ file .env.local
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Nếu không tìm thấy Token hoặc Chat ID, báo lỗi ngay
    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Thiếu cấu hình Telegram Bot trong file .env' }, 
        { status: 400 }
      );
    }

    // Gửi request lên server của Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Hỗ trợ định dạng in đậm, in nghiêng bằng thẻ HTML
      }),
    });

    const data = await response.json();

    // Xử lý nếu Telegram báo lỗi (ví dụ sai Chat ID hoặc Token chết)
    if (!response.ok) {
      return NextResponse.json(
        { error: data.description || 'Lỗi từ Telegram API' }, 
        { status: response.status }
      );
    }

    // Thành công
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Lỗi API Telegram:", error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống máy chủ' }, 
      { status: 500 }
    );
  }
}