import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Lấy danh sách tất cả các tên biến môi trường (chỉ lấy tên, không lấy giá trị để bảo mật)
  const allEnvVars = Object.keys(process.env);
  
  // 2. Kiểm tra xem 2 biến quan trọng có tồn tại không
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    diagnostics: {
      message: "Kiểm tra hệ thống",
      has_URL_var: hasUrl,
      has_KEY_var: hasKey,
      url_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      // Danh sách các biến mà Vercel đang nhận diện được (để bạn xem có tên biến đó không)
      detected_vars: allEnvVars.filter(v => v.includes('SUPABASE') || v.includes('TELEGRAM'))
    }
  });
}