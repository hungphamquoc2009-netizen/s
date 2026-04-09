import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Kiểm tra xem đã cấu hình biến môi trường chưa
    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Thiếu cấu hình Telegram Bot' }, { status: 500 });
    }

    // URL API của Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Bắn request sang Telegram
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML', // Sử dụng định dạng HTML cho tin nhắn đẹp hơn
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', errorData);
      return NextResponse.json({ error: 'Lỗi khi gửi tin nhắn Telegram' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Tele API Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}