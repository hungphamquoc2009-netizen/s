"use client";

import React, { useEffect, useState } from 'react';
import { 
  Bell, Search, User, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Sparkles, CheckCircle2, Info, AlertTriangle, 
  ChevronRight, Activity, LogOut, X, QrCode
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/lib/supabase'; 

// --- MOCK DATA ---
const chartData = [
  { name: 'Jan', actual: 120, expected: 130 },
  { name: 'Feb', actual: 135, expected: 138 },
  { name: 'Mar', actual: 145, expected: 145 },
  { name: 'Apr', actual: 142, expected: 152 },
  { name: 'May', actual: 157, expected: 160 },
  { name: 'Jun', actual: 175, expected: 168 },
];

const activeInvestments = [
  { name: 'Premium Growth', amount: '50,000,000 VND', progress: 75, timeLeft: '3 months', return: '+12%' },
  { name: 'Stable Income', amount: '20,000,000 VND', progress: 40, timeLeft: '6 months', return: '+8%' },
];

const availablePackages = [
  { name: 'Basic', return: '8%', limits: '5M - 50M', duration: '6 Months', features: ['Stable returns', 'Flexible withdrawal', 'Standard support'], highlight: false },
  { name: 'Advanced', return: '12%', limits: '50M - 200M', duration: '12 Months', features: ['High growth potential', 'Monthly payouts', 'Priority support'], highlight: true },
  { name: 'VIP Elite', return: '18%', limits: '200M+', duration: '24 Months', features: ['Maximum yield', 'Daily payouts', 'Dedicated manager'], highlight: false },
];

const notifications = [
  { id: 1, type: 'success', text: 'Dividend payout received', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-500' },
  { id: 2, type: 'info', text: 'New investment opportunities', time: '5 hours ago', icon: Info, color: 'text-blue-500' },
  { id: 3, type: 'warning', text: 'Security login from new device', time: '1 day ago', icon: AlertTriangle, color: 'text-amber-500' },
];

export default function FintechDashboard() {
  const [userName, setUserName] = useState<string>('Đang tải...');
  const [userId, setUserId] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  
  // States kiểm tra điều kiện rút tiền
  const [bankAccount, setBankAccount] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [hasPurchasedPackage, setHasPurchasedPackage] = useState<boolean>(false);

  // States cho Popup Rút tiền
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load User & Balance
  useEffect(() => {
    const loadData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        window.location.href = '/login';
        return;
      }
      
      const email = session.user.email || '';
      setUserName(email.split('@')[0]);
      setUserId(session.user.id);

      // Lấy thông tin user (Số dư, TK ngân hàng, Trạng thái gói)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, bank_account, bank_name, has_purchased_package')
        .eq('id', session.user.id)
        .single();
        
      if (profile && !profileError) {
          setBalance(profile.balance);
          setBankAccount(profile.bank_account);
          setBankName(profile.bank_name);
          setHasPurchasedPackage(profile.has_purchased_package || false);
      } else {
          setBalance(0);
      }

      // Lấy lịch sử giao dịch (Hiển thị 3 cái gần nhất)
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (txs && !txError) {
          setTxHistory(txs);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // --- HÀM KIỂM TRA TRƯỚC KHI MỞ POPUP RÚT TIỀN ---
  const handleOpenWithdraw = () => {
      // 1. Kiểm tra đã mua gói chưa
      if (!hasPurchasedPackage) {
          alert("Bạn cần phải mua ít nhất 1 gói để có thể thực hiện rút tiền!");
          return;
      }

      // 2. Kiểm tra đã liên kết ngân hàng chưa
      if (!bankAccount) {
          window.location.href = '/lien-ket-ngan-hang';
          return;
      }

      // Đủ điều kiện -> Mở popup
      setIsWithdrawOpen(true);
  };

  // --- HÀM XỬ LÝ RÚT TIỀN ---
  const handleWithdraw = async (e: React.FormEvent) => {
      e.preventDefault();
      const numAmount = parseInt(amount.replace(/,/g, ''));

      if (numAmount < 30000) {
          alert("Số tiền rút tối thiểu là 30,000 VNĐ!");
          return;
      }

      if (numAmount > balance) {
          alert("Số dư không đủ để thực hiện giao dịch này!");
          return;
      }

      setIsProcessing(true);

      // 1. Lưu giao dịch 'pending' vào DB, kẹp thêm thông tin ngân hàng đã liên kết
      await supabase.from('transactions').insert({
          user_id: userId,
          type: 'rut_tien',
          amount: numAmount,
          status: 'pending',
          bank_account: bankAccount,
          bank_name: bankName
      });

      // 2. NƠI GỌI API BANK CỦA BẠN (VD: Bắn lệnh chuyển tiền tự động ra tài khoản khách)
      /* await fetch('https://api.bank.com/transfer', {
          method: 'POST',
          body: JSON.stringify({ amount: numAmount, bank_code: bankName, account_number: bankAccount })
      });
      */

      alert(`Yêu cầu rút ${numAmount.toLocaleString('vi-VN')} VNĐ đã được gửi. Chờ xử lý!`);
      setIsProcessing(false);
      setIsWithdrawOpen(false);
      setAmount('');
  };

  // --- HÀM XỬ LÝ THANH TOÁN GÓI ---
  const handlePaymentRedirect = (packageName: string) => {
      // Chuyển hướng sang trang thanh toán riêng biệt, truyền tham số gói và URL để quay lại
      window.location.href = `/thanh-toan?package=${encodeURIComponent(packageName)}&returnUrl=/`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans text-slate-800 pb-12">
      {/* POPUP RÚT TIỀN */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={() => setIsWithdrawOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-rose-500" /> Rút tiền về ngân hàng
                </h3>
                <p className="text-slate-500 text-sm mb-6">Số dư khả dụng: <strong className="text-slate-900">{balance.toLocaleString('vi-VN')} VNĐ</strong></p>
                <form onSubmit={handleWithdraw}>
                    <div className="mb-4">
                        <label className="block text-slate-700 font-bold mb-2">Số tiền rút (VNĐ)</label>
                        <input 
                            type="number" 
                            required
                            min="30000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-lg font-bold"
                            placeholder="Tối thiểu: 30,000 VNĐ"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-700 font-bold mb-2">Tài khoản nhận (Đã liên kết)</label>
                        <input 
                            type="text" 
                            readOnly
                            value={`${bankName ? bankName + ' - ' : ''}${bankAccount}`}
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-slate-500 font-medium cursor-not-allowed"
                        />
                    </div>
                    <button disabled={isProcessing} type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors">
                        {isProcessing ? 'Đang xử lý...' : 'Tạo Lệnh Rút'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.href='/'}>
              <div className="bg-[#1E6EFF] p-2 rounded-lg group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">FinVest</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <div onClick={handleLogout} title="Đăng xuất" className="w-9 h-9 rounded-full bg-rose-50 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-rose-200 transition-all group">
              <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Welcome & Balance */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4 capitalize">Welcome back, {userName} 👋</h1>
            
            <div className="bg-gradient-to-br from-[#1E6EFF] to-blue-500 rounded-2xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
                  <div className="flex items-baseline gap-3">
                    {/* SỐ DƯ THẬT */}
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        {balance.toLocaleString('vi-VN')} <span className="text-2xl font-semibold opacity-80">VND</span>
                    </h2>
                  </div>
                </div>
                
                <div className="flex w-full md:w-auto gap-3">
                  <button onClick={handleOpenWithdraw} className="flex-1 md:flex-none bg-blue-600/30 hover:bg-blue-600/50 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold backdrop-blur-sm transition-transform hover:scale-105 flex items-center justify-center gap-2">
                    <ArrowUpFromLine className="w-4 h-4" /> Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Balance Growth</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E6EFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E6EFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                  <Tooltip cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}/>
                  <Area type="monotone" dataKey="expected" stroke="#94A3B8" strokeDasharray="5 5" fill="none" strokeWidth={2} />
                  <Area type="monotone" dataKey="actual" stroke="#1E6EFF" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Available Packages */}
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4">Available Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePackages.map((pkg, idx) => (
                <div key={idx} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl ${pkg.highlight ? 'border-[#1E6EFF] ring-2 ring-[#1E6EFF]/20 md:-translate-y-2 relative' : 'border-slate-100 hover:-translate-y-1'}`}>
                  {pkg.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6EFF] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
                  )}
                  <h4 className="text-slate-500 font-medium">{pkg.name}</h4>
                  <div className="my-4">
                    <span className="text-4xl font-extrabold text-slate-900">{pkg.return}</span>
                    <span className="text-slate-500 font-medium">/yr</span>
                  </div>
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="text-slate-500">Limits</span>
                      <span className="font-bold text-slate-800">{pkg.limits}</span>
                    </div>
                    <ul className="space-y-2 mt-4">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => handlePaymentRedirect(pkg.name)}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.highlight ? 'bg-[#1E6EFF] text-white hover:bg-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  >
                    Thanh toán
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Notifications</h3>
            <div className="space-y-4">
              {notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div key={notif.id} className="flex gap-3 items-start">
                    <div className={`mt-0.5 ${notif.color}`}><Icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{notif.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{notif.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Transactions (Lịch sử thật) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 mb-5">Recent Transactions</h3>
            <div className="space-y-5">
              {txHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Chưa có giao dịch nào.</p>
              ) : (
                  txHistory.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${tx.type === 'nap_tien' ? 'text-blue-500 bg-blue-50' : 'text-rose-500 bg-rose-50'}`}>
                        {tx.type === 'nap_tien' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{tx.type === 'nap_tien' ? 'Nạp tiền' : 'Rút tiền'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString('vi-VN')} - <span className={`font-semibold ${tx.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>{tx.status === 'pending' ? 'Đang xử lý' : 'Thành công'}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'nap_tien' ? 'text-blue-500' : 'text-slate-800'}`}>
                      {tx.type === 'nap_tien' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div> 
      </main>
    </div>
  );
}