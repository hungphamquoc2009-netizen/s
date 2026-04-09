import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

export async function GET() {
  // Lấy biến môi trường
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

  // Kiểm tra an toàn
  if (!url || !key) {
    return NextResponse.json({ 
      error: "Hệ thống thiếu chìa khóa kết nối Supabase",
      details: { url: !!url, key: !!key }
    }, { status: 500 });
  }

  try {
    const supabaseAdmin = createClient(url, key);

    // 1. Lấy danh sách đơn hàng đang chờ (pending)
    const { data: pendingOrders, error: fetchError } = await supabaseAdmin
      .from('user_packages')
      .select('*')
      .eq('status', 'pending');

    if (fetchError) {
        return NextResponse.json({ error: "Lỗi kết nối bảng: " + fetchError.message }, { status: 500 });
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ message: "Không có đơn hàng nào cần xử lý." });
    }

    // 2. Lấy dữ liệu từ ngân hàng
    const res = await fetch(API_BANK);
    const bankData = await res.json();
    const transactions = bankData.data || bankData.transactions || bankData.records || bankData || [];

    let updatedCount = 0;

    // 3. Đối soát tự động
    for (const order of pendingOrders) {
      const targetContent = order.transfer_content?.toLowerCase().trim();
      if (!targetContent) continue;
      
      const matchedTx = transactions.find((tx: any) => {
        const txString = JSON.stringify(tx).toLowerCase();
        return txString.includes(targetContent);
      });

      if (matchedTx) {
        const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || 0);

        // Thực hiện cập nhật đồng thời
        await Promise.all([
          supabaseAdmin.from('user_packages').update({ status: 'active', invested_amount: paidAmount }).eq('id', order.id),
          supabaseAdmin.from('profiles').update({ has_purchased_package: true }).eq('id', order.user_id),
          supabaseAdmin.rpc('distribute_commission', { p_buyer_id: order.user_id, p_amount: paidAmount })
        ]);

        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã xử lý xong. Cập nhật thành công ${updatedCount} đơn hàng.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi thực thi: " + error.message }, { status: 500 });
  }
}