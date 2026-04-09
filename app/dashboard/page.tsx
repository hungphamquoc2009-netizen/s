"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { 
  Bell, Search, User, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Sparkles, CheckCircle2, Info, AlertTriangle, 
  ChevronRight, Activity, LogOut, X, QrCode, Menu, 
  Home, Users, Calendar, Trophy, HeadphonesIcon, Copy, Link as LinkIcon, Package, Gift, Wallet, Clock, Shield, History,
  CalendarCheck, Dices, PartyPopper, Ticket 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/lib/supabase'; 

const chartData = [
  { name: 'Jan', actual: 120, expected: 130 },
  { name: 'Feb', actual: 135, expected: 138 },
  { name: 'Mar', actual: 145, expected: 145 },
  { name: 'Apr', actual: 142, expected: 152 },
  { name: 'May', actual: 157, expected: 160 },
  { name: 'Jun', actual: 175, expected: 168 },
];

const WHEEL_PRIZES = [
  { id: 1, label: '1.000đ', value: 1000, weight: 45, color: '#f8fafc' },
  { id: 2, label: '2.000đ', value: 2000, weight: 30, color: '#e2e8f0' },
  { id: 3, label: '5.000đ', value: 5000, weight: 15, color: '#bae6fd' },
  { id: 4, label: '10.000đ', value: 10000, weight: 7, color: '#7dd3fc' },
  { id: 5, label: '50.000đ', value: 50000, weight: 2, color: '#38bdf8' },
  { id: 6, label: '+1 Lượt', value: -1, weight: 1, color: '#fde047' }, 
];

export default function FintechDashboard() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [userName, setUserName] = useState<string>('Đang tải...');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [joinDate, setJoinDate] = useState<string>('');
  
  const [balance, setBalance] = useState<number>(0);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); 
  
  const [bankAccount, setBankAccount] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null); 
  const [hasPurchasedPackage, setHasPurchasedPackage] = useState<boolean>(false);

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [events, setEvents] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [cskhLink, setCskhLink] = useState<string>('#');
  
  const [refStats, setRefStats] = useState({ f1: 0, f2: 0, f3: 0, total: 0 });
  const [referralList, setReferralList] = useState<any[]>([]); 

  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const [checkInStreak, setCheckInStreak] = useState<number>(0);
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(null);
  
  const [spinCount, setSpinCount] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [prizeMsg, setPrizeMsg] = useState<string | null>(null);

  const [giftcode, setGiftcode] = useState<string>('');
  const [giftcodeLoading, setGiftcodeLoading] = useState<boolean>(false);
  const [giftcodeMessage, setGiftcodeMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [giftcodeHistory, setGiftcodeHistory] = useState<any[]>([]);

  // TẠO MÃ GIỚI THIỆU NGẮN (6 Ký tự đầu của ID) cũng chính là ID hiển thị
  const shortRefCode = userId ? userId.substring(0, 6).toUpperCase() : '';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const maskEmail = (str: string) => {
    if (!str) return 'Ẩn danh';
    if (str.length <= 6) return str.substring(0, 1) + '***' + str.slice(-1);
    return str.substring(0, 3) + '***' + str.slice(-3);
  };

  const loadData = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      window.location.href = '/login';
      return;
    }
    
    const email = session.user.email || '';
    setUserName(email.split('@')[0]);
    setUserEmail(email);
    setUserId(session.user.id);
    if (session.user.created_at) {
        setJoinDate(new Date(session.user.created_at).toLocaleDateString('vi-VN'));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('balance, bank_account, bank_name, account_name, has_purchased_package, created_at, check_in_streak, last_check_in, spin_count')
      .eq('id', session.user.id)
      .single();
      
    if (profile) {
        setBalance(profile.balance || 0);
        setBankAccount(profile.bank_account);
        setBankName(profile.bank_name);
        setAccountName(profile.account_name); 
        setHasPurchasedPackage(profile.has_purchased_package || false);
        if (!session.user.created_at && profile.created_at) setJoinDate(new Date(profile.created_at).toLocaleDateString('vi-VN'));
        
        setCheckInStreak(profile.check_in_streak || 0);
        setLastCheckInDate(profile.last_check_in || null);
        setSpinCount(profile.spin_count || 0);
    }

    const { data: myPkgs } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active') 
      .order('purchased_at', { ascending: false });
    if (myPkgs) setMyPackages(myPkgs);

    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (txs) setTxHistory(txs);

    const { data: pkgs } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
    if (pkgs) setPackages(pkgs);

    const { data: eventsData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (eventsData) setEvents(eventsData);

    try {
        const { data: gcHistory } = await supabase
            .from('user_giftcodes')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        if (gcHistory) setGiftcodeHistory(gcHistory);
    } catch (err) {}

    try {
      const { data: lbData } = await supabase.from('leaderboards').select('*').order('invites', { ascending: false });
      if (lbData) setLeaderboardData(lbData);
    } catch (err) {}

    const { data: configData } = await supabase.from('settings').select('cskh_link').limit(1).single();
    if (configData && configData.cskh_link) setCskhLink(configData.cskh_link);

    try {
      const { data: refsData, error: refsError } = await supabase.rpc('get_my_referrals', { p_user_id: session.user.id });
      if (refsData && !refsError) {
          const f1List = refsData.filter((r: any) => r.level === 'F1');
          const f2List = refsData.filter((r: any) => r.level === 'F2');
          const f3List = refsData.filter((r: any) => r.level === 'F3');
          setRefStats({ f1: f1List.length, f2: f2List.length, f3: f3List.length, total: refsData.length });
          const sortedList = [...refsData].sort((a: any, b: any) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0));
          setReferralList(sortedList);
      }
    } catch (err) {}
  };

  useEffect(() => { loadData(); }, []);

  const handleApplyGiftcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftcode.trim()) return;
    setGiftcodeLoading(true);
    setGiftcodeMessage(null);

    const formattedCode = giftcode.trim().toUpperCase();

    try {
        const { data: codeData, error: codeErr } = await supabase
            .from('giftcodes')
            .select('*')
            .eq('code', formattedCode)
            .maybeSingle();

        if (codeErr) throw new Error('Lỗi kiểm tra mã: ' + codeErr.message);
        if (!codeData) throw new Error('Mã Code này không tồn tại!');
        if (codeData.status !== 'active') throw new Error('Mã Code đã bị khóa hoặc hết hạn!');
        if (codeData.used_count >= codeData.usage_limit) throw new Error('Mã Code này đã hết lượt sử dụng!');

        const { data: usedData, error: usedErr } = await supabase
            .from('user_giftcodes')
            .select('*')
            .eq('user_id', userId)
            .eq('code', formattedCode)
            .maybeSingle();

        if (usedErr) throw new Error('Lỗi kiểm tra lịch sử: ' + usedErr.message);
        if (usedData) throw new Error('Bạn đã sử dụng mã Code này rồi!');

        const reward = codeData.reward_amount;
        const newBalance = balance + reward;

        const { error: errUpdateBalance } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        if (errUpdateBalance) throw new Error('Có lỗi xảy ra khi cập nhật số dư. Vui lòng thử lại!');

        await supabase.from('giftcodes').update({ used_count: codeData.used_count + 1 }).eq('id', codeData.id);
        await supabase.from('user_giftcodes').insert({ user_id: userId, code: formattedCode, amount: reward });

        await supabase.from('transactions').insert({
            user_id: userId,
            type: 'nhap_code',
            amount: reward,
            status: 'success',
            bank_name: 'HỆ THỐNG',
            account_name: 'Nhập Giftcode'
        });

        setBalance(newBalance);
        setGiftcode('');
        setGiftcodeMessage({ text: `Chúc mừng! Bạn đã nhận được ${reward.toLocaleString('vi-VN')} VNĐ từ mã code.`, type: 'success' });
        loadData();

    } catch (err: any) {
        setGiftcodeMessage({ text: err.message, type: 'error' });
    } finally {
        setGiftcodeLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const isCheckedInToday = lastCheckInDate === todayStr;

  const handleCheckIn = async () => {
      if (isCheckedInToday) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      let newStreak = checkInStreak;
      if (lastCheckInDate !== yesterdayStr) {
          newStreak = 1;
      } else {
          newStreak += 1;
      }

      let rewardMessage = "";
      let addedBalance = 0;
      let addedSpin = 0;

      if (newStreak === 7) {
          addedSpin = 1;
          rewardMessage = "Điểm danh ngày 7 thành công! Bạn nhận được 1 Lượt quay may mắn.";
          newStreak = 0; 
      } else {
          addedBalance = 1000; 
          rewardMessage = `Điểm danh ngày ${newStreak} thành công! Nhận 1.000 VNĐ.`;
      }

      try {
          const updates: any = {
              check_in_streak: newStreak,
              last_check_in: todayStr,
          };
          if (addedBalance > 0) updates.balance = balance + addedBalance;
          if (addedSpin > 0) updates.spin_count = spinCount + addedSpin;

          const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
          if (error) throw error; 

          setCheckInStreak(newStreak);
          setLastCheckInDate(todayStr);
          if (addedBalance > 0) setBalance(prev => prev + addedBalance);
          if (addedSpin > 0) setSpinCount(prev => prev + addedSpin);

          if (addedBalance > 0) {
              await supabase.from('transactions').insert({
                  user_id: userId,
                  type: 'hoa_hong', 
                  amount: addedBalance,
                  status: 'success',
                  bank_name: 'HỆ THỐNG',
                  account_name: 'Thưởng điểm danh hàng ngày'
              });
          }

          alert(rewardMessage);
          loadData(); 
      } catch (err) {
          console.error(err);
          alert("Lỗi hệ thống khi điểm danh! Hãy thử lại.");
      }
  };

  const handleSpinWheel = async () => {
      if (spinCount <= 0) {
          alert("Bạn đã hết lượt quay! Hãy mua thêm gói đầu tư 60,000đ để nhận 1 lượt quay.");
          return;
      }
      if (isSpinning) return;

      setIsSpinning(true);
      setShowConfetti(false);
      setPrizeMsg(null);

      const totalWeight = WHEEL_PRIZES.reduce((sum, item) => sum + item.weight, 0);
      let randomNum = Math.random() * totalWeight;
      let selectedPrize = WHEEL_PRIZES[0];

      for (const prize of WHEEL_PRIZES) {
          if (randomNum < prize.weight) {
              selectedPrize = prize;
              break;
          }
          randomNum -= prize.weight;
      }

      const sliceAngle = 360 / WHEEL_PRIZES.length;
      const targetIndex = WHEEL_PRIZES.findIndex(p => p.id === selectedPrize.id);
      const randomOffset = Math.floor(Math.random() * (sliceAngle - 10)) - ((sliceAngle - 10) / 2);
      const targetDegree = 1800 + (360 - (targetIndex * sliceAngle)) + randomOffset;

      setWheelRotation(prev => prev + targetDegree);

      setTimeout(async () => {
          setIsSpinning(false);
          setShowConfetti(true);
          
          let newBalance = balance;
          let newSpinCount = spinCount - 1; 

          if (selectedPrize.value === -1) {
              newSpinCount += 1;
              setPrizeMsg("Tuyệt vời! Bạn quay trúng THÊM 1 LƯỢT QUAY.");
          } else {
              newBalance += selectedPrize.value;
              setPrizeMsg(`Chúc mừng! Bạn quay trúng ${selectedPrize.value.toLocaleString('vi-VN')} VNĐ.`);
          }

          try {
              const updates: any = { spin_count: newSpinCount };
              if (selectedPrize.value !== -1) updates.balance = newBalance;

              const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
              if (error) throw error;

              setSpinCount(newSpinCount);
              if (selectedPrize.value !== -1) setBalance(newBalance);

              if (selectedPrize.value !== -1) {
                  await supabase.from('transactions').insert({
                      user_id: userId,
                      type: 'trung_thuong',
                      amount: selectedPrize.value,
                      status: 'success',
                      bank_name: 'VÒNG QUAY MAY MẮN',
                      account_name: 'Trúng thưởng trực tiếp'
                  });
              }
              loadData();
          } catch (err) {
              console.error(err);
          }
      }, 4000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleOpenWithdraw = () => {
      if (myPackages.length === 0) { 
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

      if (numAmount < 30000) { alert("Số tiền rút tối thiểu là 30,000 VNĐ!"); return; }
      if (numAmount > balance) { alert("Số dư không đủ để thực hiện giao dịch này!"); return; }

      setIsProcessing(true);

      try {
          const newBalance = balance - numAmount;
          const { error: profileError } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
          if (profileError) throw profileError;

          const { error: txError } = await supabase.from('transactions').insert({
              user_id: userId, 
              type: 'rut_tien', 
              amount: numAmount, 
              status: 'pending', 
              bank_account: bankAccount, 
              bank_name: bankName,
              account_name: accountName
          });

          if (txError) {
              await supabase.from('profiles').update({ balance: balance }).eq('id', userId);
              throw txError;
          }

          const teleMessage = `🔴 <b>YÊU CẦU RÚT TIỀN MỚI</b>\n👤 Tài khoản: ${userEmail}\n💰 Số tiền: ${numAmount.toLocaleString('vi-VN')} VNĐ\n🏦 Ngân hàng: ${bankName || 'Không rõ'} - ${bankAccount || 'Không rõ'}`;
          fetch('/api/tele', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: teleMessage })
          }).catch(err => console.error('Lỗi gửi tele:', err));

          alert(`Yêu cầu rút ${numAmount.toLocaleString('vi-VN')} VNĐ đã được gửi. Hệ thống đã trừ số dư!`);
          setBalance(newBalance);
          setIsWithdrawOpen(false); 
          setAmount('');
          loadData();
      } catch (error: any) {
          console.error("Lỗi rút tiền:", error);
          alert("Lỗi tạo lệnh rút: " + error.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handlePaymentRedirect = (packageName: string) => {
      window.location.href = `/thanh-toan?package=${encodeURIComponent(packageName)}&returnUrl=/`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://finvest.fun/register?ref=${shortRefCode}`);
    setIsCopied(true); 
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClaimInterest = async (pkgId: string) => {
      try {
          const { data, error } = await supabase.rpc('claim_package_interest', { p_pkg_id: pkgId });
          if (error) throw error;
          
          if (data && data.success) {
              alert(`Chúc mừng! Bạn vừa nhận được ${Number(data.amount).toLocaleString('vi-VN')} VNĐ tiền lãi.`);
              loadData();
          } else {
              alert(data.message || 'Lỗi nhận lãi!');
          }
      } catch (err: any) {
          alert('Lỗi hệ thống: ' + err.message);
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPassMessage(null);
      if (newPassword !== confirmPassword) { setPassMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'error' }); return; }
      if (newPassword.length < 6) { setPassMessage({ text: 'Mật khẩu phải có ít nhất 6 ký tự!', type: 'error' }); return; }
      setIsUpdatingPass(true);
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          setPassMessage({ text: 'Cập nhật mật khẩu thành công!', type: 'success' });
          setNewPassword(''); setConfirmPassword('');
      } catch (err: any) {
          setPassMessage({ text: err.message || 'Lỗi cập nhật mật khẩu.', type: 'error' });
      } finally {
          setIsUpdatingPass(false);
      }
  };

  const formatTimeLeft = (diffMs: number) => {
      if (diffMs <= 0) return "Sẵn sàng nhận lãi";
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      return `${h}h ${m}m ${s}s`;
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'assets', label: 'Tài sản của tôi', icon: Wallet },
    { id: 'packages', label: 'Gói đầu tư', icon: Package },
    { id: 'giftcode', label: 'Nhập Code', icon: Ticket }, 
    { id: 'transactions', label: 'Lịch sử giao dịch', icon: History },
    { id: 'referral', label: 'Giới thiệu', icon: Users },
    { id: 'events', label: 'Sự kiện', icon: Calendar },
    { id: 'leaderboard', label: 'Đua top', icon: Trophy },
  ];

  const totalInvestedAmount = myPackages.reduce((sum, p) => sum + (p.invested_amount || 0), 0);
  const currentWheelProgress = totalInvestedAmount % 60000;
  
  // TÍNH TỔNG HOA HỒNG NHẬN ĐƯỢC
  const totalCommissionEarned = txHistory.filter(tx => tx.type === 'hoa_hong').reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div className="flex h-screen bg-[#F5F7FB] font-sans text-slate-800 overflow-hidden relative">
      
      {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden">
              <div className="absolute text-5xl animate-bounce text-emerald-500 font-bold bg-white px-8 py-4 rounded-3xl shadow-2xl border-4 border-emerald-100 flex items-center gap-3">
                  <PartyPopper className="w-12 h-12" /> {prizeMsg}
              </div>
          </div>
      )}

      {isWithdrawOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={() => setIsWithdrawOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-6 h-6" /></button>
                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><ArrowUpFromLine className="w-5 h-5 text-rose-500" /> Rút tiền về ngân hàng</h3>
                <p className="text-slate-500 text-sm mb-6">Số dư khả dụng: <strong className="text-slate-900">{balance.toLocaleString('vi-VN')} VNĐ</strong></p>
                <form onSubmit={handleWithdraw}>
                    <div className="mb-4">
                        <label className="block text-slate-700 font-bold mb-2">Số tiền rút (VNĐ)</label>
                        <input type="number" required min="30000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-lg font-bold" placeholder="Tối thiểu: 30,000 VNĐ"/>
                    </div>
                    <div className="mb-6">
                        <label className="block text-slate-700 font-bold mb-2">Tài khoản nhận</label>
                        <input type="text" readOnly value={`${bankName ? bankName + ' - ' : ''}${accountName ? accountName + ' - ' : ''}${bankAccount}`} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-slate-500 font-medium cursor-not-allowed"/>
                    </div>
                    <button disabled={isProcessing} type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800">{isProcessing ? 'Đang xử lý...' : 'Tạo Lệnh Rút'}</button>
                </form>
            </div>
        </div>
      )}

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}/>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="bg-[#1E6EFF] p-1.5 rounded-lg"><Activity className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-xl tracking-tight text-slate-900">FinVest</span>
          </div>
          <button className="ml-auto md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-[#1E6EFF]/10 text-[#1E6EFF]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#1E6EFF]' : 'text-slate-400'}`} /> {item.label}
              </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <a href={cskhLink} target="_blank" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50"><HeadphonesIcon className="w-5 h-5 text-slate-400" /> CSKH / Hỗ trợ</a>
            <button onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'profile' ? 'bg-[#1E6EFF]/10 text-[#1E6EFF]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Shield className={`w-5 h-5 ${activeTab === 'profile' ? 'text-[#1E6EFF]' : 'text-slate-400'}`} /> Thông tin cá nhân</button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-500 hover:bg-rose-50"><LogOut className="w-5 h-5" /> Đăng xuất</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
            <h2 className="text-lg font-bold text-slate-800 capitalize hidden sm:block">{activeTab === 'profile' ? 'Thông tin cá nhân' : navItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setActiveTab('profile')}>
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{userName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                              <CalendarCheck className="w-24 h-24 text-[#1E6EFF]" />
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2 relative z-10">
                                  <CalendarCheck className="w-5 h-5 text-[#1E6EFF]" /> Điểm danh hằng ngày
                              </h3>
                              <p className="text-sm text-slate-500 mb-6 relative z-10">Tích lũy 7 ngày liên tiếp để nhận 1 lượt quay Vòng Quay May Mắn.</p>
                              
                              <div className="flex justify-between items-center mb-6 relative z-10">
                                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                      const isPassed = day <= checkInStreak;
                                      const isCurrentTarget = day === checkInStreak + 1;
                                      return (
                                          <div key={day} className="flex flex-col items-center gap-2 relative">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                                                  isPassed ? 'bg-emerald-500 text-white' : 
                                                  isCurrentTarget ? 'bg-[#1E6EFF] text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'
                                              }`}>
                                                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : day}
                                              </div>
                                              <span className="text-[10px] font-medium text-slate-500 uppercase">Ngày {day}</span>
                                              {day < 7 && <div className={`absolute top-4 left-4 w-full h-1 -z-0 ${day < checkInStreak ? 'bg-emerald-500' : 'bg-slate-100'}`} style={{ width: 'calc(100% + 20px)' }}></div>}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                          
                          <button 
                              onClick={handleCheckIn}
                              disabled={isCheckedInToday}
                              className={`w-full py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all relative z-10 ${
                                  isCheckedInToday 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-blue-600 to-[#1E6EFF] text-white shadow-lg shadow-blue-500/30 hover:-translate-y-1'
                              }`}
                          >
                              {isCheckedInToday ? 'Đã điểm danh hôm nay' : 'Điểm danh ngay'}
                          </button>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center relative">
                          <h3 className="font-bold text-lg text-slate-800 mb-1 flex items-center gap-2 w-full">
                              <Dices className="w-5 h-5 text-amber-500" /> Vòng quay may mắn
                          </h3>
                          <div className="w-full flex justify-between items-center text-sm mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                              <span className="text-amber-800 font-medium">Lượt quay hiện có:</span>
                              <span className="text-xl font-black text-amber-600">{spinCount}</span>
                          </div>

                          <div className="w-full mb-6">
                              <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                                  <span>Tích lũy mua gói: {currentWheelProgress.toLocaleString()}đ</span>
                                  <span>Mục tiêu: 60.000đ</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all" style={{ width: `${Math.min((currentWheelProgress / 60000) * 100, 100)}%` }}></div>
                              </div>
                              <p className="text-[10px] text-slate-400 text-center mt-2 italic">* Cứ mỗi 60k mua gói đầu tư sẽ nhận được 1 lượt quay.</p>
                          </div>

                          <div className="relative w-48 h-48 mb-4">
                              <div 
                                  className="absolute inset-0 rounded-full border-4 border-slate-800 shadow-xl overflow-hidden"
                                  style={{
                                      background: `conic-gradient(
                                          ${WHEEL_PRIZES[0].color} 0deg 60deg,
                                          ${WHEEL_PRIZES[1].color} 60deg 120deg,
                                          ${WHEEL_PRIZES[2].color} 120deg 180deg,
                                          ${WHEEL_PRIZES[3].color} 180deg 240deg,
                                          ${WHEEL_PRIZES[4].color} 240deg 300deg,
                                          ${WHEEL_PRIZES[5].color} 300deg 360deg
                                      )`,
                                      transform: `rotate(${wheelRotation}deg)`,
                                      transition: 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)'
                                  }}
                              >
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(30deg)' }}>1k</div>
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(90deg)' }}>2k</div>
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(150deg)' }}>5k</div>
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(210deg)' }}>10k</div>
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(270deg)' }}>50k</div>
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 font-bold text-[10px] text-slate-700 origin-bottom" style={{ height: '80px', transform: 'rotate(330deg)' }}>+1 Lượt</div>
                              </div>
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-rose-500 z-10 drop-shadow-md"></div>
                              <button 
                                  onClick={handleSpinWheel}
                                  disabled={isSpinning || spinCount <= 0}
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-full font-black text-xs border-2 border-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed z-20"
                              >
                                  QUAY
                              </button>
                          </div>
                      </div>

                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Balance Growth</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E6EFF" stopOpacity={0.3}/><stop offset="95%" stopColor="#1E6EFF" stopOpacity={0}/></linearGradient>
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
                          txHistory.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${tx.type === 'nap_tien' ? 'text-blue-500 bg-blue-50' : tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                                {tx.type === 'nap_tien' && <ArrowDownToLine className="w-5 h-5" />}
                                {(tx.type === 'hoa_hong' || tx.type === 'trung_thuong' || tx.type === 'nhap_code') && <Gift className="w-5 h-5" />}
                                {tx.type === 'nhan_lai' && <TrendingUp className="w-5 h-5" />}
                                {tx.type === 'rut_tien' && <ArrowUpFromLine className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                    {tx.type === 'nap_tien' ? 'Nạp tiền' : tx.type === 'trung_thuong' ? 'Trúng thưởng vòng quay' : tx.type === 'hoa_hong' ? 'Thưởng/Hoa hồng' : tx.type === 'nhan_lai' ? 'Nhận lãi đầu tư' : tx.type === 'nhap_code' ? 'Nhập Code' : 'Rút tiền'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {new Date(tx.created_at).toLocaleDateString('vi-VN')} - <span className={`font-semibold ${tx.status === 'success' ? 'text-emerald-500' : tx.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>{tx.status === 'success' ? 'Thành công' : tx.status === 'rejected' ? 'Bị từ chối' : 'Đang xử lý'}</span>
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${tx.type === 'nap_tien' ? 'text-blue-500' : tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? 'text-emerald-500' : 'text-slate-800'}`}>
                              {tx.type === 'nap_tien' || tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div> 
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <History className="w-6 h-6 text-[#1E6EFF]" /> Lịch sử giao dịch
                </h2>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                          <th className="p-4 font-semibold">Thời gian</th>
                          <th className="p-4 font-semibold">Loại giao dịch</th>
                          <th className="p-4 font-semibold">Chi tiết (Bank / Gói)</th>
                          <th className="p-4 font-semibold text-right">Số tiền (VNĐ)</th>
                          <th className="p-4 font-semibold text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {txHistory.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500">Bạn chưa có lịch sử giao dịch nào.</td></tr>
                        ) : (
                          txHistory.map(tx => (
                            <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-slate-500 font-medium">{new Date(tx.created_at).toLocaleString('vi-VN')}</td>
                              <td className="p-4 font-medium text-slate-800">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${tx.type === 'nap_tien' ? 'text-blue-500 bg-blue-50' : tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                                    {tx.type === 'nap_tien' && <ArrowDownToLine className="w-4 h-4" />}
                                    {(tx.type === 'hoa_hong' || tx.type === 'trung_thuong' || tx.type === 'nhap_code') && <Gift className="w-4 h-4" />}
                                    {tx.type === 'nhan_lai' && <TrendingUp className="w-4 h-4" />}
                                    {tx.type === 'rut_tien' && <ArrowUpFromLine className="w-4 h-4" />}
                                  </div>
                                  {tx.type === 'nap_tien' ? 'Nạp tiền' : tx.type === 'trung_thuong' ? 'Trúng thưởng' : tx.type === 'hoa_hong' ? 'Thưởng/Hoa hồng' : tx.type === 'nhan_lai' ? 'Nhận lãi' : tx.type === 'nhap_code' ? 'Nhập Code' : 'Rút tiền'}
                                </div>
                              </td>
                              <td className="p-4 text-slate-500 max-w-[200px] truncate" title={tx.bank_name}>{tx.bank_name || '-'}</td>
                              <td className={`p-4 text-right font-bold text-base ${tx.type === 'nap_tien' ? 'text-blue-500' : tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? 'text-emerald-500' : 'text-slate-800'}`}>
                                {tx.type === 'nap_tien' || tx.type === 'hoa_hong' || tx.type === 'nhan_lai' || tx.type === 'trung_thuong' || tx.type === 'nhap_code' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {tx.status === 'success' ? 'Thành công' : tx.status === 'rejected' ? 'Bị từ chối' : 'Đang xử lý'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-[#1E6EFF]" /> Tài sản & Lợi nhuận
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                        <p className="text-slate-400 text-sm font-bold uppercase mb-2">Tổng gốc đang đầu tư</p>
                        <p className="text-4xl font-extrabold">{myPackages.filter(p => p.status === 'active').reduce((sum, p) => sum + p.invested_amount, 0).toLocaleString('vi-VN')} <span className="text-xl">VNĐ</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl p-6 text-white shadow-xl">
                        <p className="text-emerald-100 text-sm font-bold uppercase mb-2">Tổng lãi đã rút</p>
                        <p className="text-4xl font-extrabold">{myPackages.reduce((sum, p) => sum + p.total_earned, 0).toLocaleString('vi-VN')} <span className="text-xl">VNĐ</span></p>
                    </div>
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-4">Các gói đang chạy</h3>
                {myPackages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Bạn chưa mua gói đầu tư nào.</p>
                        <button onClick={() => setActiveTab('packages')} className="mt-4 px-6 py-2.5 bg-[#1E6EFF] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">Xem Gói Đầu Tư</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myPackages.map(pkg => {
                            const lastClaimDate = new Date(pkg.last_claim_at);
                            const nextClaimDate = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000); 
                            const diffMs = nextClaimDate.getTime() - currentTime.getTime();
                            const isReady = diffMs <= 0;
                            const dailyReward = pkg.invested_amount * pkg.daily_interest_rate;

                            return (
                                <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                    <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase mb-2 inline-block">Đang chạy</span>
                                                <h4 className="text-xl font-bold text-slate-800">{pkg.package_name}</h4>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 text-right">
                                                Gốc: <br/><span className="text-slate-900 text-lg">{pkg.invested_amount.toLocaleString('vi-VN')}</span>
                                            </p>
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Ngày mua: {new Date(pkg.purchased_at).toLocaleDateString('vi-VN')}</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Lãi đã rút: <strong className="text-emerald-600">{pkg.total_earned.toLocaleString('vi-VN')} ₫</strong></p>
                                    </div>
                                    <div className="p-6 md:w-1/2 flex flex-col justify-center items-center text-center">
                                        <p className="text-slate-500 text-sm font-bold mb-2 flex items-center gap-1"><Clock className="w-4 h-4"/> Chu kỳ nhận lãi 24H</p>
                                        <div className={`text-2xl font-black tracking-widest mb-4 ${isReady ? 'text-emerald-500' : 'text-blue-600 font-mono'}`}>
                                            {formatTimeLeft(diffMs)}
                                        </div>
                                        <button 
                                            onClick={() => handleClaimInterest(pkg.id)}
                                            disabled={!isReady}
                                            className={`w-full py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${isReady ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                        >
                                            {isReady ? <><Gift className="w-5 h-5"/> Nhận {dailyReward.toLocaleString('vi-VN')} VNĐ ngay</> : 'Đang sinh lời...'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
              </div>
            )}

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
                            {isHighlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6EFF] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{pkg.badge}</span>}
                            <h4 className="text-slate-500 font-medium">{pkg.name}</h4>
                            <div className="my-4">
                                <span className="text-4xl font-extrabold text-slate-900">{pkg.return_rate}</span>
                                <span className="text-slate-500 font-medium">/ ngày</span>
                            </div>
                            <div className="space-y-3 mb-6 text-sm">
                              <div className="flex justify-between border-b border-slate-50 pb-2"><span className="text-slate-500">Limits</span><span className="font-bold text-slate-800">{pkg.limits}</span></div>
                              <ul className="space-y-2 mt-4">
                                {defaultFeatures.map((feature, fIdx) => (
                                  <li key={fIdx} className="flex items-center gap-2 text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /><span>{feature}</span></li>
                                ))}
                              </ul>
                            </div>
                            <button onClick={() => handlePaymentRedirect(pkg.name)} className={`w-full py-3 rounded-xl font-bold transition-all ${isHighlight ? 'bg-[#1E6EFF] text-white hover:bg-blue-600' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>Thanh toán</button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'giftcode' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-[#1E6EFF]" /> Đổi Mã Quà Tặng
                </h2>

                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5">
                        <Gift className="w-48 h-48 text-[#1E6EFF]" />
                    </div>
                    
                    <div className="inline-flex items-center justify-center p-5 bg-blue-50 text-blue-600 rounded-full mb-6 relative z-10">
                        <Gift className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900 mb-3 relative z-10">Nhập Code - Nhận Quà Ngay</h3>
                    <p className="text-slate-500 mb-10 max-w-md mx-auto relative z-10 text-lg">
                        Nhập mã Giftcode do Admin cung cấp để nhận ngay tiền thưởng trực tiếp vào số dư.
                    </p>

                    <form onSubmit={handleApplyGiftcode} className="max-w-lg mx-auto relative z-10">
                        <input
                            type="text"
                            required
                            placeholder="Nhập mã CODE tại đây..."
                            value={giftcode}
                            onChange={(e) => setGiftcode(e.target.value.toUpperCase())}
                            className="w-full pl-6 pr-36 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#1E6EFF] focus:ring-4 focus:ring-[#1E6EFF]/10 text-xl font-black text-slate-800 tracking-widest uppercase transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={giftcodeLoading || !giftcode.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-[#1E6EFF] text-white font-bold px-8 text-lg rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            {giftcodeLoading ? 'Đang check...' : 'Xác nhận'}
                        </button>
                    </form>

                    {giftcodeMessage && (
                        <div className={`mt-8 p-4 rounded-xl font-bold flex items-center justify-center gap-2 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 ${giftcodeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {giftcodeMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            {giftcodeMessage.text}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <History className="w-5 h-5 text-slate-400" /> Lịch sử sử dụng mã của bạn
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                    <th className="p-4 font-semibold">Thời gian</th>
                                    <th className="p-4 font-semibold text-center">Mã Code</th>
                                    <th className="p-4 font-semibold text-right">Phần thưởng (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {giftcodeHistory.length === 0 ? (
                                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">Bạn chưa nhập thành công mã Giftcode nào.</td></tr>
                                ) : (
                                    giftcodeHistory.map((item, idx) => (
                                        <tr key={item.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="p-4 text-slate-500 font-medium">{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono font-bold tracking-wider">{item.code}</span>
                                            </td>
                                            <td className="p-4 text-right font-black text-emerald-600 text-base">+{item.amount.toLocaleString('vi-VN')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'referral' && (
              <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4"><LinkIcon className="w-8 h-8" /></div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Mã giới thiệu: <span className="text-[#1E6EFF] bg-blue-50 px-3 py-1 rounded-lg">{shortRefCode}</span></h2>
                  <p className="text-slate-500 text-sm mb-8 max-w-md">Chia sẻ link giới thiệu cho bạn bè để nhận ngay phần trăm hoa hồng.</p>
                  
                  <button onClick={copyReferralLink} className={`w-full max-w-sm py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-1 ${isCopied ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-gradient-to-r from-indigo-600 to-[#1E6EFF] text-white shadow-blue-500/25'}`}>
                    {isCopied ? <><CheckCircle2 className="w-6 h-6" /> Đã sao chép thành công</> : <><Copy className="w-6 h-6" /> Sao chép Link Giới Thiệu</>}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">Thống kê giới thiệu</h3>
                  
                  {/* BỔ SUNG: KHỐI THỐNG KÊ TỔNG NẠP VÀ TỔNG HOA HỒNG */}
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                          <span className="text-slate-500 font-medium mb-2">Tổng số lượt mời</span>
                          <span className="text-4xl font-extrabold text-[#1E6EFF]">{refStats.total}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                          <span className="text-slate-500 font-medium mb-2">Tổng hoa hồng nhận được</span>
                          <span className="text-4xl font-extrabold text-emerald-600">{totalCommissionEarned.toLocaleString('vi-VN')} ₫</span>
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center"><span className="text-slate-500 text-sm font-medium block mb-1">Cấp 1 (F1)</span><span className="text-2xl font-bold text-slate-800">{refStats.f1}</span></div>
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center"><span className="text-slate-500 text-sm font-medium block mb-1">Cấp 2 (F2)</span><span className="text-2xl font-bold text-slate-800">{refStats.f2}</span></div>
                       <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center"><span className="text-slate-500 text-sm font-medium block mb-1">Cấp 3 (F3)</span><span className="text-2xl font-bold text-slate-800">{refStats.f3}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Chi tiết thành viên đã mời</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                    <th className="p-4 font-semibold">Tài khoản (ID)</th>
                                    <th className="p-4 font-semibold text-center">Cấp độ</th>
                                    <th className="p-4 font-semibold text-right">Tổng nạp (VNĐ)</th>
                                    <th className="p-4 font-semibold text-right">Hoa hồng (VNĐ)</th>
                                    <th className="p-4 font-semibold">Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {referralList.length === 0 ? (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">Chưa có thành viên nào đăng ký qua link của bạn.</td></tr>
                                ) : (
                                    referralList.map((user) => {
                                        const shortUserId = user.id ? user.id.substring(0, 6).toUpperCase() : 'UNKNOWN';
                                        return (
                                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-800">
                                                ID: <span className="text-[#1E6EFF] font-bold">{shortUserId}</span>
                                                <span className="block text-xs text-slate-400 font-normal">{maskEmail(user.email)}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${user.level === 'F1' ? 'bg-blue-100 text-blue-700' : user.level === 'F2' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {user.level}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-blue-600">
                                                {(user.total_deposit || 0).toLocaleString('vi-VN')} ₫
                                            </td>
                                            <td className="p-4 text-right font-bold text-emerald-600">
                                                +{(user.total_commission || 0).toLocaleString('vi-VN')} ₫
                                            </td>
                                            <td className="p-4 text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Không rõ'}</td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              </div>
            )}

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
                      {event.image_url && (
                          <div className="mb-4 w-full h-48 sm:h-64 overflow-hidden rounded-xl border border-slate-100">
                              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                      )}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{event.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${event.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{event.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}</span>
                      </div>
                      <p className="text-slate-600 mb-4 whitespace-pre-wrap">{event.content}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-medium"><Calendar className="w-4 h-4" /> Thời gian: {event.date}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="max-w-4xl animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-t-2xl p-8 text-white text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <h2 className="text-3xl font-extrabold mb-2">Bảng Xếp Hạng Giới Thiệu</h2>
                </div>
                <div className="bg-white shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 font-bold text-slate-500 text-center w-20">Hạng</th>
                          <th className="p-4 font-bold text-slate-500">Tài khoản</th>
                          <th className="p-4 font-bold text-slate-500 text-center">Lượt mời</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardData.length === 0 ? (
                          <tr><td colSpan={3} className="p-6 text-center text-slate-500">Đang cập nhật bảng xếp hạng...</td></tr>
                        ) : (
                          leaderboardData.map((user, idx) => {
                            const rank = idx + 1;
                            return (
                              <tr key={user.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="p-4 text-center">{rank === 1 ? <span className="text-2xl">🥇</span> : rank === 2 ? <span className="text-2xl">🥈</span> : rank === 3 ? <span className="text-2xl">🥉</span> : <span className="font-bold text-slate-400">#{rank}</span>}</td>
                                <td className="p-4 font-medium text-slate-800">{user.name}</td>
                                <td className="p-4 text-center"><span className="bg-[#1E6EFF]/10 text-[#1E6EFF] px-3 py-1 rounded-full font-bold text-sm">{user.invites}</span></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-5 rounded-b-2xl border-t-0 border border-amber-100">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Cơ cấu giải thưởng
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm font-medium text-amber-700">
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm flex-1 text-center whitespace-nowrap"><span className="text-amber-500 font-bold mr-1">TOP 1:</span> 5.000.000 VNĐ</div>
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm flex-1 text-center whitespace-nowrap"><span className="text-amber-500 font-bold mr-1">TOP 2:</span> 2.000.000 VNĐ</div>
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm flex-1 text-center whitespace-nowrap"><span className="text-amber-500 font-bold mr-1">TOP 3:</span> 1.000.000 VNĐ</div>
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm flex-1 text-center whitespace-nowrap"><span className="text-amber-500 font-bold mr-1">TOP 4:</span> 500.000 VNĐ</div>
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm flex-1 text-center whitespace-nowrap"><span className="text-amber-500 font-bold mr-1">TOP 5-10:</span> 200.000 VNĐ</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#1E6EFF]" /> Thông tin cá nhân & Bảo mật
                </h2>
                
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                   <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Thông tin tài khoản</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                       <label className="text-sm text-blue-500 font-medium block mb-1">ID Tài khoản</label>
                       <p className="text-xl font-black text-[#1E6EFF] tracking-widest">{shortRefCode}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <label className="text-sm text-slate-500 font-medium block mb-1">Tên hiển thị</label>
                       <p className="text-lg font-bold text-slate-800">{userName}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <label className="text-sm text-slate-500 font-medium block mb-1">Email đăng ký</label>
                       <p className="text-lg font-bold text-slate-800">{userEmail}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <label className="text-sm text-slate-500 font-medium block mb-1">Ngày tham gia</label>
                       <p className="text-lg font-bold text-slate-800">{joinDate || 'Đang cập nhật...'}</p>
                     </div>
                   </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                   <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Đổi mật khẩu</h3>
                   <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu mới</label>
                       <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập ít nhất 6 ký tự" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E6EFF]" />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                       <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#1E6EFF]" />
                     </div>
                     
                     {passMessage && (
                       <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${passMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                         {passMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                         {passMessage.text}
                       </div>
                     )}
                     
                     <button type="submit" disabled={isUpdatingPass} className="w-full py-4 mt-2 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-70">
                       {isUpdatingPass ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                     </button>
                   </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}