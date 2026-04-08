"use client";

import React, { useEffect, useState } from 'react';
import { 
  Bell, Search, User, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Sparkles, CheckCircle2, Info, AlertTriangle, 
  ChevronRight, Activity, LogOut, X, QrCode, Menu, 
  Home, Users, Calendar, Trophy, HeadphonesIcon, Copy, Link as LinkIcon, Package
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/lib/supabase'; 

// --- MOCK DATA (Biểu đồ) ---
// Giữ nguyên dữ liệu biểu đồ vì đây thường là dữ liệu tính toán động hoặc admin chưa yêu cầu đổi
const chartData = [
  { name: 'Jan', actual: 120, expected: 130 },
  { name: 'Feb', actual: 135, expected: 138 },
  { name: 'Mar', actual: 145, expected: 145 },
  { name: 'Apr', actual: 142, expected: 152 },
  { name: 'May', actual: 157, expected: 160 },
  { name: 'Jun', actual: 175, expected: 168 },
];

export default function FintechDashboard() {
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // --- DATA STATES ---
  const [userName, setUserName] = useState<string>('Đang tải...');
  const [userId, setUserId] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); 
  
  const [bankAccount, setBankAccount] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [hasPurchasedPackage, setHasPurchasedPackage] = useState<boolean>(false);

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- NEW FEATURES STATES (Dữ liệu thật từ DB) ---
  const [events, setEvents] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [cskhLink, setCskhLink] = useState<string>('#');
  
  // States cho tính năng Giới thiệu
  const [refStats, setRefStats] = useState({ f1: 0, f2: 0, f3: 0, total: 0 });
  const [referralList, setReferralList] = useState<any[]>([]); // Lưu danh sách chi tiết người F1, F2, F3

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

      // 1. Fetch Profile Data
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

      // 2. Fetch Transactions
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (txs && !txError) setTxHistory(txs);

      // 3. Fetch Packages
      const { data: pkgs, error: pkgsError } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: true });

      if (pkgs && !pkgsError) setPackages(pkgs);

      // 4. Fetch Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (eventsData) setEvents(eventsData);

      // 5. Fetch Leaderboard
      const { data: lbData } = await supabase
        .from('leaderboards')
        .select('*')
        .order('invites', { ascending: false });
      if (lbData) setLeaderboardData(lbData);

      // 6. Fetch CSKH Link
      const { data: configData } = await supabase
        .from('settings')
        .select('cskh_link')
        .limit(1)
        .single();
      if (configData && configData.cskh_link) setCskhLink(configData.cskh_link);

      // 7. TỰ ĐỘNG TÍNH TOÁN F1, F2, F3 TỪ BẢNG PROFILES
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, referred_by, created_at');

      if (allProfiles) {
        // Tìm F1: những người có referred_by là ID của user hiện tại
        const f1List = allProfiles.filter(p => p.referred_by === session.user.id).map(p => ({ ...p, level: 'F1' }));
        const f1Ids = f1List.map(p => p.id);

        // Tìm F2: những người có referred_by nằm trong danh sách ID của F1
        const f2List = allProfiles.filter(p => p.referred_by && f1Ids.includes(p.referred_by)).map(p => ({ ...p, level: 'F2' }));
        const f2Ids = f2List.map(p => p.id);

        // Tìm F3: những người có referred_by nằm trong danh sách ID của F2
        const f3List = allProfiles.filter(p => p.referred_by && f2Ids.includes(p.referred_by)).map(p => ({ ...p, level: 'F3' }));

        // Cập nhật thống kê số lượng
        setRefStats({ 
            f1: f1List.length, 
            f2: f2List.length, 
            f3: f3List.length, 
            total: f1List.length + f2List.length + f3List.length 
        });

        // Gộp danh sách để hiển thị chi tiết (Sắp xếp người mới nhất lên đầu)
        const combinedList = [...f1List, ...f2List, ...f3List].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
        setReferralList(combinedList);
      }
    };
    
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleOpenWithdraw = () => {
      if (!hasPurchasedPackage) {
          alert("Bạn cần phải mua ít nhất 1 gói để có thể thực hiện rút tiền!");
          return;
      }
      if (!bankAccount) {
          window.location.href = '/lien-ket-ngan-hang';
          return;
      }
      setIsWithdrawOpen(true);
  };

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

      await supabase.from('transactions').insert({
          user_id: userId,
          type: 'rut_tien',
          amount: numAmount,
          status: 'pending',
          bank_account: bankAccount,
          bank_name: bankName
      });

      alert(`Yêu cầu rút ${numAmount.toLocaleString('vi-VN')} VNĐ đã được gửi. Chờ xử lý!`);
      setIsProcessing(false);
      setIsWithdrawOpen(false);
      setAmount('');
  };

  const handlePaymentRedirect = (packageName: string) => {
      window.location.href = `/thanh-toan?package=${encodeURIComponent(packageName)}&returnUrl=/`;
  };

  const copyReferralLink = () => {
    const link = `https://finvest.fun/register?ref=${userId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- NAVIGATION CONFIG ---
  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'packages', label: 'Gói đầu tư', icon: Package },
    { id: 'referral', label: 'Giới thiệu', icon: Users },
    { id: 'events', label: 'Sự kiện', icon: Calendar },
    { id: 'leaderboard', label: 'Đua top', icon: Trophy },
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FB] font-sans text-slate-800 overflow-hidden">
      
      {/* --- MODAL RÚT TIỀN --- */}
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

      {/* --- OVERLAY CHO MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-[#1E6EFF] p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">FinVest</span>
          </div>
          <button className="ml-auto md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? 'bg-[#1E6EFF]/10 text-[#1E6EFF]' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1E6EFF]' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <a
              href={cskhLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <HeadphonesIcon className="w-5 h-5 text-slate-400" />
              CSKH / Hỗ trợ
            </a>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label || 'Bảng điều khiển'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{userName}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            
            {/* ================= TAB: TRANG CHỦ ================= */}
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-4 capitalize">Welcome back, {userName} 👋</h1>
                    <div className="bg-gradient-to-br from-[#1E6EFF] to-blue-500 rounded-2xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
                          <div className="flex items-baseline gap-3">
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
                </div>

                <div className="xl:col-span-4 space-y-6">
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
              </div>
            )}

            {/* ================= TAB: GÓI ĐẦU TƯ ================= */}
            {activeTab === 'packages' && (
              <div className="max-w-7xl animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Package className="w-6 h-6 text-[#1E6EFF]" /> Danh sách Gói đầu tư
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packages.length === 0 ? (
                      <p className="text-slate-500 bg-white p-6 rounded-2xl border border-slate-100 text-center col-span-3">Hiện tại chưa có gói đầu tư nào.</p>
                  ) : (
                      packages.map((pkg, idx) => {
                        const defaultFeatures = ['Lợi nhuận ổn định', 'Rút tiền linh hoạt', 'Hỗ trợ tiêu chuẩn'];
                        const isHighlight = pkg.badge && pkg.badge.trim() !== '';

                        return (
                          <div key={pkg.id || idx} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-xl ${isHighlight ? 'border-[#1E6EFF] ring-2 ring-[#1E6EFF]/20 md:-translate-y-2 relative' : 'border-slate-100 hover:-translate-y-1'}`}>
                            {isHighlight && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6EFF] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{pkg.badge}</span>
                            )}
                            <h4 className="text-slate-500 font-medium">{pkg.name}</h4>
                            <div className="my-4">
                              <span className="text-4xl font-extrabold text-slate-900">{pkg.return_rate}</span>
                              <span className="text-slate-500 font-medium">/yr</span>
                            </div>
                            <div className="space-y-3 mb-6 text-sm">
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-500">Limits</span>
                                <span className="font-bold text-slate-800">{pkg.limits}</span>
                              </div>
                              <ul className="space-y-2 mt-4">
                                {defaultFeatures.map((feature, fIdx) => (
                                  <li key={fIdx} className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <button 
                              onClick={() => handlePaymentRedirect(pkg.name)}
                              className={`w-full py-3 rounded-xl font-bold transition-all ${isHighlight ? 'bg-[#1E6EFF] text-white hover:bg-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                            >
                              Thanh toán
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB: GIỚI THIỆU ================= */}
            {activeTab === 'referral' && (
              <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
                {/* Nút Sao chép Link */}
                <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Mã giới thiệu của bạn</h2>
                  <p className="text-slate-500 text-sm mb-8 max-w-md">Chia sẻ link giới thiệu cho bạn bè để nhận ngay phần trăm hoa hồng hấp dẫn mỗi khi họ tham gia đầu tư.</p>
                  
                  <button 
                    onClick={copyReferralLink}
                    className={`w-full max-w-sm py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-1 ${isCopied ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-gradient-to-r from-indigo-600 to-[#1E6EFF] text-white shadow-blue-500/25'}`}
                  >
                    {isCopied ? <><CheckCircle2 className="w-6 h-6" /> Đã sao chép thành công</> : <><Copy className="w-6 h-6" /> Sao chép Link Giới Thiệu</>}
                  </button>
                </div>

                {/* Thống kê giới thiệu */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Thống kê giới thiệu</h3>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl w-full md:w-1/3 border border-blue-100">
                        <span className="text-slate-500 font-medium mb-2">Tổng số lượt mời</span>
                        <span className="text-5xl font-extrabold text-[#1E6EFF]">{refStats.total}</span>
                    </div>
                    <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                          <span className="text-slate-500 text-sm font-medium block mb-1">Cấp 1 (F1)</span>
                          <span className="text-2xl font-bold text-slate-800">{refStats.f1}</span>
                       </div>
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                          <span className="text-slate-500 text-sm font-medium block mb-1">Cấp 2 (F2)</span>
                          <span className="text-2xl font-bold text-slate-800">{refStats.f2}</span>
                       </div>
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                          <span className="text-slate-500 text-sm font-medium block mb-1">Cấp 3 (F3)</span>
                          <span className="text-2xl font-bold text-slate-800">{refStats.f3}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* BẢNG CHI TIẾT THÀNH VIÊN (MỚI THÊM) */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Chi tiết thành viên đã mời</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                    <th className="p-4 font-semibold">Tài khoản (ID)</th>
                                    <th className="p-4 font-semibold text-center">Cấp độ</th>
                                    <th className="p-4 font-semibold">Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {referralList.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="p-6 text-center text-slate-500">Chưa có thành viên nào đăng ký qua link của bạn.</td>
                                    </tr>
                                ) : (
                                    referralList.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-800">
                                                User_{user.id.substring(0, 8)}...
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                                                    user.level === 'F1' ? 'bg-blue-100 text-blue-700' :
                                                    user.level === 'F2' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {user.level}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Không rõ'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chính sách hoa hồng */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Chính sách hoa hồng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center">
                      <div className="text-blue-600 font-extrabold text-5xl mb-2">30%</div>
                      <h4 className="font-bold text-slate-800 text-lg">Cấp 1 (F1)</h4>
                      <p className="text-slate-500 text-sm mt-2">Hoa hồng trực tiếp từ người bạn mời đăng ký.</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 text-center">
                      <div className="text-emerald-600 font-extrabold text-5xl mb-2">3%</div>
                      <h4 className="font-bold text-slate-800 text-lg">Cấp 2 (F2)</h4>
                      <p className="text-slate-500 text-sm mt-2">Hoa hồng từ người do F1 của bạn giới thiệu.</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 text-center">
                      <div className="text-amber-600 font-extrabold text-5xl mb-2">1%</div>
                      <h4 className="font-bold text-slate-800 text-lg">Cấp 3 (F3)</h4>
                      <p className="text-slate-500 text-sm mt-2">Hoa hồng từ người do F2 của bạn giới thiệu.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB: SỰ KIỆN ================= */}
            {activeTab === 'events' && (
              <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#1E6EFF]" /> Sự kiện & Thông báo
                </h2>
                {events.length === 0 ? (
                  <p className="text-slate-500 bg-white p-6 rounded-2xl border border-slate-100 text-center">Hiện tại chưa có sự kiện nào.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${event.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {event.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4">{event.content}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                        <Calendar className="w-4 h-4" /> Thời gian: {event.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ================= TAB: ĐUA TOP ================= */}
            {activeTab === 'leaderboard' && (
              <div className="max-w-4xl animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-t-2xl p-8 text-white text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <h2 className="text-3xl font-extrabold mb-2">Bảng Xếp Hạng Giới Thiệu</h2>
                  <p className="text-amber-100">Top những nhà đầu tư xuất sắc nhất tháng</p>
                </div>
                <div className="bg-white rounded-b-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 font-bold text-slate-500 text-center w-20">Hạng</th>
                          <th className="p-4 font-bold text-slate-500">Tài khoản</th>
                          <th className="p-4 font-bold text-slate-500 text-center">Lượt mời</th>
                          <th className="p-4 font-bold text-slate-500 text-right">Phần thưởng dự kiến</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardData.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-500">Đang cập nhật bảng xếp hạng...</td>
                          </tr>
                        ) : (
                          leaderboardData.map((user, idx) => {
                            const rank = idx + 1;
                            return (
                              <tr key={user.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center">
                                  {rank === 1 ? <span className="text-2xl">🥇</span> : 
                                   rank === 2 ? <span className="text-2xl">🥈</span> : 
                                   rank === 3 ? <span className="text-2xl">🥉</span> : 
                                   <span className="font-bold text-slate-400">#{rank}</span>}
                                </td>
                                <td className="p-4 font-medium text-slate-800">{user.name}</td>
                                <td className="p-4 text-center">
                                  <span className="bg-[#1E6EFF]/10 text-[#1E6EFF] px-3 py-1 rounded-full font-bold text-sm">
                                    {user.invites}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-bold text-amber-600">{user.reward}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}