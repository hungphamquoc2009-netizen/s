"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, CheckCircle2, Loader2, User, Package, Banknote } from 'lucide-react';

export default function CuuDonPage() {
  const [userId, setUserId] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  // Lấy danh sách các gói đầu tư từ database khi tải trang
  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setPackages(data);
        setSelectedPackage(data[0].name); // Chọn gói đầu tiên làm mặc định
        
        // Gợi ý giá tiền luôn nếu gói có limits
        const numericPrice = parseInt(data[0].limits.replace(/\D/g, ''), 10) || 0;
        if (numericPrice > 0) setAmount(numericPrice.toString());
      }
    };
    fetchPackages();
  }, []);

  // Cập nhật giá tiền tự động khi chọn gói khác
  const handlePackageChange = (pkgName: string) => {
    setSelectedPackage(pkgName);
    const pkg = packages.find(p => p.name === pkgName);
    if (pkg && pkg.limits) {
        const numericPrice = parseInt(pkg.limits.replace(/\D/g, ''), 10) || 0;
        if (numericPrice > 0) setAmount(numericPrice.toString());
    }
  };

  const handleCuuDon = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const cleanUserId = userId.trim();
      if (!cleanUserId) throw new Error("Vui lòng nhập User ID!");

      // 1. Lấy và kiểm tra thông tin gói đầu tư
      const pkg = packages.find(p => p.name === selectedPackage);
      if (!pkg) throw new Error("Vui lòng chọn gói đầu tư hợp lệ!");

      const numericAmount = parseInt(amount.replace(/,/g, ''));
      if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("Số tiền không hợp lệ!");

      // Tính lãi suất ngày theo chuẩn hệ thống
      const rateMatch = pkg.return_rate ? pkg.return_rate.match(/\d+/) : null;
      const yearlyRate = rateMatch ? parseInt(rateMatch[0], 10) : 0;
      const dailyRate = yearlyRate / 365 / 100;

      // 2. Kiểm tra xem User ID này có tồn tại trong hệ thống không
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', cleanUserId)
        .single();

      if (profileErr || !profile) {
        throw new Error("Không tìm thấy User ID này! Hãy bảo khách copy chính xác ID trong tab Giới thiệu.");
      }

      // 3. BƯỚC QUAN TRỌNG: Mở khóa mua gói trong profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ has_purchased_package: true })
        .eq('id', cleanUserId);
      if (updateErr) throw new Error("Lỗi cập nhật Profile: " + updateErr.message);

      // 4. BƯỚC QUAN TRỌNG: Gọi hàm RPC chia hoa hồng cho hệ thống F1, F2, F3
      const { error: rpcError } = await supabase.rpc('distribute_commission', {
        p_buyer_id: cleanUserId,
        p_amount: numericAmount
      });
      if (rpcError) throw new Error("Lỗi chia hoa hồng: " + rpcError.message);

      // 5. BƯỚC QUAN TRỌNG: Tạo gói đầu tư đưa vào trạng thái chạy sinh lãi
      const { error: pkgErr } = await supabase.from('user_packages').insert({
        user_id: cleanUserId,
        package_name: selectedPackage,
        invested_amount: numericAmount,
        daily_interest_rate: dailyRate,
        status: 'active'
      });
      if (pkgErr) throw new Error("Lỗi tạo gói đầu tư: " + pkgErr.message);

      // Thành công
      setMessage({ 
        text: `Đã cứu đơn thành công cho User: ${cleanUserId.substring(0,8)}...! Gói đã kích hoạt và hoa hồng đã được chia.`, 
        type: 'success' 
      });
      setUserId(''); // Reset form
      
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-rose-400" />
          <h1 className="text-2xl font-extrabold tracking-tight">Hệ Thống Cứu Đơn</h1>
          <p className="text-slate-400 text-sm mt-2">Duyệt nạp thủ công cho khách hàng khi Auto-Bank bị lỗi</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleCuuDon} className="space-y-6">
            
            {/* ID Khách hàng */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">User ID (Mã định danh của khách)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  required
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Ví dụ: a1b2c3d4-..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] text-slate-900 font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Khách có thể copy ID này ở đuôi link giới thiệu của họ.</p>
            </div>

            {/* Gói Đầu Tư */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Gói khách mua</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
                <select 
                  value={selectedPackage}
                  onChange={e => handlePackageChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] text-slate-900 font-medium appearance-none"
                >
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.name}>{pkg.name} ({pkg.return_rate}/năm)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Số Tiền */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền đã chuyển (VNĐ)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Banknote className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Nhập số tiền..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] text-slate-900 font-bold text-lg"
                />
              </div>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
                <span className="mt-0.5">{message.text}</span>
              </div>
            )}

            {/* Nút Submit */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1E6EFF] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Đang xử lý...</>
              ) : (
                'Duyệt Đơn & Kích Hoạt Gói'
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}