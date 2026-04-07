import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Kết nối với Database của bạn

export async function POST(request: Request) {
    try {
        // 1. Lấy headers và cấu hình Secret Key
        const mySecretKey = process.env.API_BANK_SECRET || 'SECRET_KEY_CUA_BAN'; 
        const signature = request.headers.get('signature');

        // 2. Kiểm tra Signature bảo mật (Giống y hệt đoạn if PHP của bạn)
        if (signature !== mySecretKey) {
            return NextResponse.json({ status: false, msg: "Invalid Signature" }, { status: 401 });
        }

        // 3. Đọc dữ liệu JSON gửi về
        const data = await request.json();

        // 4. Xử lý giao dịch
        if (data && data.transactions) {
            for (const trans of data.transactions) {
                const amount = Number(trans.amount); // Số tiền nạp
                const des = String(trans.description).toUpperCase(); // Nội dung chuyển khoản (chuyển thành in hoa)
                const tid = String(trans.transactionID); // Mã giao dịch ngân hàng

                // BƯỚC QUAN TRỌNG: XỬ LÝ CỘNG TIỀN
                // Giả sử cú pháp chuyển khoản bạn yêu cầu khách ghi là: "NAP <Email>" 
                // Ví dụ khách ghi: "NAP nguyenvana@gmail.com"
                if (des.includes('NAP')) {
                    // Tách lấy email từ nội dung chuyển khoản
                    const emailParts = des.split('NAP ');
                    if (emailParts.length > 1) {
                        const userEmail = emailParts[1].trim().toLowerCase();

                        // A. Tìm user ID dựa trên email trong hệ thống
                        const { data: userProfile } = await supabase
                            .from('profiles')
                            .select('id, balance')
                            .eq('email', userEmail)
                            .single();

                        if (userProfile) {
                            const userId = userProfile.id;
                            const currentBalance = Number(userProfile.balance);

                            // B. Cộng tiền vào Két sắt (profiles)
                            await supabase
                                .from('profiles')
                                .update({ balance: currentBalance + amount })
                                .eq('id', userId);

                            // C. Lưu lịch sử giao dịch (Ghi nhận đã nạp thành công)
                            await supabase
                                .from('transactions')
                                .insert({
                                    user_id: userId,
                                    type: 'nap_tien',
                                    amount: amount,
                                    status: 'completed' // Đánh dấu là thành công luôn
                                });
                                
                            console.log(`Đã cộng ${amount} cho tài khoản ${userEmail}`);
                        }
                    }
                }
            }
        }

        // 5. Trả về kết quả cho API Bank biết đã nhận thành công
        return NextResponse.json({ status: true, msg: "OK" });

    } catch (error) {
        console.error("Lỗi Webhook:", error);
        return NextResponse.json({ status: false, msg: "Lỗi máy chủ nội bộ" }, { status: 500 });
    }
}