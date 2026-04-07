"use client";

import React from 'react';
import { Activity, UserPlus, MousePointerClick, TrendingUp, ArrowRight, Gift, CheckCircle2 } from 'lucide-react';

export default function LeadIndexPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-800">
            {/* Thanh điều hướng */}
            <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="bg-[#1E6EFF] p-2 rounded-lg">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900">FinVest</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-slate-500 hover:text-[#1E6EFF] font-semibold text-sm transition-colors">Đăng nhập</a>
                        <a href="/register" className="bg-slate-900 hover:bg-[#1E6EFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">
                            Mở tài khoản
                        </a>
                    </div>
                </div>
            </nav>

            {/* PHẦN 1: HERO TẠO SỰ CHÚ Ý (HOOK) */}
            <section className="relative pt-24 pb-32 overflow-hidden bg-[#F5F7FB]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-[#1E6EFF] font-bold text-sm mb-6 animate-pulse">
                        <Gift className="w-4 h-4" />
                        <span>Đăng ký hôm nay - Nhận ngay 30.000 VNĐ</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                        Cách đơn giản nhất để <br className="hidden md:block" />
                        <span className="text-[#1E6EFF]">nhân bản tài sản của bạn</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Không cần kiến thức tài chính phức tạp. FinVest giúp bạn tự động hóa việc đầu tư và nhận lãi suất đều đặn mỗi ngày chỉ với vài cú click.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="/register" className="bg-[#1E6EFF] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group">
                            Bắt đầu ngay <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
                
                {/* Đồ họa nền */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-300/30 to-emerald-300/30 blur-3xl -z-10 rounded-full"></div>
            </section>

            {/* PHẦN 2: DẪN DẮT CÁCH HOẠT ĐỘNG (HOW IT WORKS) */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Dễ dàng bắt đầu chỉ với 3 bước</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Hành trình gia tăng tài sản của bạn chưa bao giờ đơn giản đến thế.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Đường nối giữa các bước (chỉ hiện trên desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-[#1E6EFF] to-blue-100 z-0"></div>

                        {/* Bước 1 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center mb-6 shadow-xl text-[#1E6EFF]">
                                <UserPlus className="w-10 h-10" />
                            </div>
                            <span className="text-sm font-bold text-[#1E6EFF] tracking-widest uppercase mb-2">Bước 1</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Tạo tài khoản miễn phí</h3>
                            <p className="text-slate-600">Đăng ký chỉ mất 1 phút. Hệ thống sẽ tự động tặng ngay 30.000 VNĐ vào số dư tài khoản của bạn để trải nghiệm.</p>
                        </div>

                        {/* Bước 2 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-[#1E6EFF] border-4 border-blue-100 rounded-full flex items-center justify-center mb-6 shadow-xl text-white transform scale-110">
                                <MousePointerClick className="w-10 h-10" />
                            </div>
                            <span className="text-sm font-bold text-[#1E6EFF] tracking-widest uppercase mb-2">Bước 2</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Chọn gói đầu tư</h3>
                            <p className="text-slate-600">Nạp vốn từ các cổng thanh toán an toàn và chọn gói đầu tư phù hợp với kỳ vọng sinh lời của bạn.</p>
                        </div>

                        {/* Bước 3 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center mb-6 shadow-xl text-emerald-500">
                                <TrendingUp className="w-10 h-10" />
                            </div>
                            <span className="text-sm font-bold text-emerald-500 tracking-widest uppercase mb-2">Bước 3</span>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Nhận lợi nhuận</h3>
                            <p className="text-slate-600">Theo dõi số dư tăng trưởng mỗi ngày ngay trên Dashboard. Rút vốn và lãi bất cứ khi nào bạn muốn.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PHẦN 3: HIỂN THỊ GÓI ĐẦU TƯ MỜI CHÀO */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Danh mục đầu tư sinh lời</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Minh bạch, an toàn và tỷ suất sinh lời vượt trội so với gửi tiết kiệm truyền thống.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Gói Cơ Bản */}
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">Cơ Bản</h3>
                            <div className="mb-6">
                                <span className="text-5xl font-extrabold">8%</span>
                                <span className="text-slate-500 font-medium">/năm</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-[#1E6EFF]" />
                                    <span>Vốn tối thiểu: <strong>500.000 VNĐ</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-[#1E6EFF]" />
                                    <span>Thời gian: <strong>3 tháng</strong></span>
                                </li>
                            </ul>
                            <a href="/register" className="block w-full text-center bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">Chọn gói này</a>
                        </div>

                        {/* Gói Nâng Cao */}
                        <div className="bg-gradient-to-b from-[#1E6EFF] to-blue-800 rounded-3xl p-8 transform md:-translate-y-4 shadow-2xl relative border border-blue-400/50">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                Khuyên dùng
                            </div>
                            <h3 className="text-xl font-semibold text-blue-100 mb-2">Nâng Cao</h3>
                            <div className="mb-6">
                                <span className="text-5xl font-extrabold text-white">12%</span>
                                <span className="text-blue-200 font-medium">/năm</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-blue-50">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                    <span>Vốn tối thiểu: <strong>5.000.000 VNĐ</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-blue-50">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                    <span>Thời gian: <strong>6 tháng</strong></span>
                                </li>
                            </ul>
                            <a href="/register" className="block w-full text-center bg-white text-[#1E6EFF] font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-md">Chọn gói này</a>
                        </div>

                        {/* Gói VIP */}
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">VIP Elite</h3>
                            <div className="mb-6">
                                <span className="text-5xl font-extrabold text-emerald-400">18%</span>
                                <span className="text-slate-500 font-medium">/năm</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-[#1E6EFF]" />
                                    <span>Vốn tối thiểu: <strong>50.000.000 VNĐ</strong></span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-[#1E6EFF]" />
                                    <span>Thời gian: <strong>12 tháng</strong></span>
                                </li>
                            </ul>
                            <a href="/register" className="block w-full text-center bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">Chọn gói này</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* PHẦN 4: FINAL CTA - KÊU GỌI HÀNH ĐỘNG CUỐI CÙNG */}
            <section className="py-20 bg-blue-50 text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Đã sẵn sàng để tiền làm việc cho bạn?</h2>
                    <p className="text-slate-600 mb-8 text-lg">Gia nhập cộng đồng nhà đầu tư thông minh ngay hôm nay. Chỉ mất 1 phút để tạo tài khoản.</p>
                    <a href="/register" className="inline-flex items-center justify-center gap-2 bg-[#1E6EFF] text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 hover:scale-105">
                        Mở tài khoản miễn phí <UserPlus className="w-6 h-6" />
                    </a>
                </div>
            </section>

            <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
                <p>© 2026 FinVest Platform. Đầu tư tài chính có rủi ro, vui lòng cân nhắc kỹ.</p>
            </footer>
        </div>
    );
}