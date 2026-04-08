"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// ĐÃ THÊM 'Info' VÀO DÒNG IMPORT DƯỚI ĐÂY:
import { ShieldAlert, CheckCircle2, Loader2, User, Package, Banknote, Search, AlertCircle, Info } from 'lucide-react';

export default function CuuDonPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetUser, setTargetUser] = useState<{id: string, email: string} | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [amount, setAmount] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  // Lấy danh sách các gói đầu tư từ database khi tải trang
  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setPackages(data);
        setSelectedPackage(data[0].name); 
        
        const numericPrice = parseInt(data[0].limits.replace(/\D/g, ''), 10) || 0;
        if (numericPrice > 0) setAmount(numericPrice.toString());
      }
    };
    fetchPackages();
  }, []);

  const handlePackageChange = (pkgName: string) => {
    setSelectedPackage(pkgName);
    const pkg = packages.find(p => p.name === pkgName);
    if (pkg && pkg.limits) {
        const numericPrice = parseInt(pkg.limits.replace(/\D/g, ''), 10) || 0;
        if (numericPrice > 0) setAmount(numericPrice.toString());
    }
  };

  // Hàm thông minh: Bóc tách và tìm kiếm khách hàng
  const handleSearchUser = async () => {
    setIsSearching(true);
    setTargetUser(null);
    setMessage(null);

    try {
        let query = searchTerm.trim();
        if (!query) throw new Error("Vui lòng nhập thông tin cần tìm!");

        // Nếu Admin dán nguyên nội dung chuyển khoản (VD: "MUA GOITIEUCHUAN NGUYENVANA 12345")
        if (query.toUpperCase().startsWith('MUA ')) {
            const parts = query.split(' ');
            if (parts.length >= 3) {
                query = parts[2]; // Lấy đúng tên khách hàng (phần tử thứ 3)
            }
        }

        // Gọi RPC tìm kiếm user
        const { data, error } = await supabase.rpc('search_cuudon_user', { search_term: query });
        
        if (error) throw new Error("Lỗi kết nối cơ sở dữ liệu!");
        if (!data || data.length === 0) throw new Error(`Không tìm thấy tài khoản nào khớp với dữ liệu: ${query}`);
        
        if (data.length > 1) {
            throw new Error(`Tìm thấy ${data.length} tài khoản trùng tên. Vui lòng nhập Email hoặc ID thay vì Nội dung CK để đảm bảo chính xác!`);
        }

        setTargetUser(data[0]);
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
    } finally {
        setIsSearching(false);
    }
  };

  // Hàm duyệt đơn (Chạy khi Admin bấm Submit)
  const handleCuuDon = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!targetUser) {
        setMessage({ text: "Vui lòng 'Kiểm tra' và xác nhận tài khoản khách hàng trước khi duyệt!", type: 'error' });
        return;
    }

    setIsLoading(true);

    try {
      const pkg = packages.find(p => p.name === selectedPackage);
      if (!pkg) throw new Error("Vui lòng chọn gói đầu tư hợp lệ!");

      const numericAmount = parseInt(amount.replace(/,/g, ''));
      if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("Số tiền không hợp lệ!");

      const rateMatch = pkg.return_rate ? pkg.return_rate.match(/\d+/) : null;
      const yearlyRate = rateMatch ? parseInt(rateMatch[0], 10) : 0;
      const dailyRate = yearlyRate / 365 / 100;

      // 1. Mở khóa mua gói
      const { error: updateErr } = await supabase.from('profiles').update({ has_purchased_package: true }).eq('id', targetUser.id);
      if (updateErr) throw new Error("Lỗi cập nhật Profile: " + updateErr.message);

      // 2. Chia hoa hồng
      const { error: rpcError } = await supabase.rpc('distribute_commission', { p_buyer_id: targetUser.id, p_amount: numericAmount });
      if (rpcError) throw new Error("Lỗi chia hoa hồng: " + rpcError.message);

      // 3. Tạo gói đầu tư
      const { error: pkgErr } = await supabase.from('user_packages').insert({
        user_id: targetUser.id,
        package_name: selectedPackage,
        invested_amount: numericAmount,
        daily_interest_rate: dailyRate,
        status: 'active'
      });
      if (pkgErr) throw new Error("Lỗi tạo gói đầu tư: " + pkgErr.message);

      // Thành công
      setMessage({ 
        text: `Đã duyệt đơn thành công! Khách: ${targetUser.email} - Gói: ${selectedPackage} - Tiền: ${numericAmount.toLocaleString()} đ`, 
        type: 'success' 
      });
      
      // Reset form
      setSearchTerm('');
      setTargetUser(null);
      
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-[#1E6EFF]" />
          <h1 className="text-3xl font-extrabold tracking-tight">Trạm Cứu Đơn Auto</h1>
          <p className="text-slate-400 text-sm mt-2">Xử lý hóa đơn thủ công nhanh chóng bằng AI phân tích</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleCuuDon} className="space-y-6">
            
            {/* Tra cứu thông minh */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tra cứu khách hàng</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setTargetUser(null); }}
                    placeholder="Dán Nội dung CK, Email hoặc ID vào đây..." 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] text-slate-900 font-medium"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleSearchUser}
                  disabled={isSearching || !searchTerm.trim()}
                  className="px-6 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kiểm tra'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Info className="w-4 h-4"/> Hỗ trợ copy & paste trực tiếp tin nhắn báo biến động số dư.
              </p>
            </div>

            {/* Hiển thị khách hàng được chọn */}
            {targetUser && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-emerald-800 font-bold text-sm">Đã khóa mục tiêu khách hàng:</p>
                        <p className="text-emerald-900 font-bold text-lg mt-0.5">{targetUser.email}</p>
                        <p className="text-emerald-600/80 text-xs mt-1 font-mono break-all">ID: {targetUser.id}</p>
                    </div>
                </div>
            )}

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
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <span className="mt-0.5 leading-relaxed">{message.text}</span>
              </div>
            )}

            {/* Nút Submit */}
            <button 
              type="submit" 
              disabled={isLoading || !targetUser}
              className="w-full bg-[#1E6EFF] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Đang hệ thống hóa...</>
              ) : (
                'Bơm Tiền & Kích Hoạt Gói'
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}