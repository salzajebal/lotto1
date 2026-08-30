import React from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, FileCheck, MapPin, Play, Search, ShieldCheck, Clock, Download, ExternalLink, MessageSquare } from 'lucide-react';

export function ProofArchive() {
  const receipts = [
    { rank: '1등', amount: '5,000,000,000원', round: '1184', date: '2023.10.28', location: '서울 마포구', nums: ['03', '08', '14', '23', '33', '45'], theme: 'blue' },
    { rank: '2등', amount: '61,439,872원', round: '1181', date: '2023.10.07', location: '경기 성남시', nums: ['07', '12', '18', '29', '34', '42'], theme: 'slate' },
    { rank: '3등', amount: '1,584,725원', round: '1178', date: '2023.09.16', location: '부산 수영구', nums: ['11', '15', '22', '31', '38', '40'], theme: 'slate' },
  ];

  const archiveData = [
    { round: '1184', rank: '3등', amount: '1,584,725원', location: '서울 서초구', date: '2023.10.28' },
    { round: '1184', rank: '3등', amount: '1,584,725원', location: '대전 해운대구', date: '2023.10.28' },
    { round: '1183', rank: '2등', amount: '54,201,110원', location: '인천 동구', date: '2023.10.21' },
    { round: '1183', rank: '3등', amount: '1,420,900원', location: '경기 용인시', date: '2023.10.21' },
    { round: '1181', rank: '2등', amount: '61,439,872원', location: '경기 성남시', date: '2023.10.07' },
    { round: '1180', rank: '1등', amount: '2,140,500,000원', location: '서울 강남구', date: '2023.09.30' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F8] text-[#0F172A] font-sans selection:bg-blue-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-blue-600" />
            <span className="font-extrabold text-lg tracking-tight">LOTTORICO <span className="text-slate-400 font-normal">| ARCHIVE</span></span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="text-blue-600">당첨 증빙</a>
            <a href="#" className="hover:text-slate-900 transition-colors">당첨자 인터뷰</a>
            <a href="#" className="hover:text-slate-900 transition-colors">분석 기준</a>
            <a href="#" className="hover:text-slate-900 transition-colors">멤버십</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900">로그인</button>
            <button className="px-4 py-2 bg-[#0F172A] text-white text-sm font-medium rounded hover:bg-slate-800 transition-colors">
              카카오톡 문의
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[480px] bg-slate-900 flex items-center">
        <img src="/__mockup/images/lotto-balls-hero.png" alt="Lotto balls background" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent" />
        
        <div className="relative z-10 w-full max-w-[1120px] mx-auto px-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono font-bold mb-6 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              VERIFIED ARCHIVE
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              말보다 먼저, <br/>
              <span className="text-yellow-400">기록을 증명합니다.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8 font-medium">
              화려한 문구로 포장하지 않습니다.<br/>
              투명하게 기록된 당첨 회차, 구매 지역, 당첨 등수가<br/>
              로또리코 분석의 유일한 증거입니다.
            </p>
            <div className="flex gap-3">
              <button className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-2">
                최신 증빙 자료 보기 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Status Ticker */}
      <div className="border-b border-[#E2E8F0] bg-white shadow-sm">
        <div className="max-w-[1120px] mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-slate-700 font-mono font-medium">
            <span className="flex items-center gap-2"><FileCheck size={16} className="text-blue-600"/> 누적 증빙 자료: <strong className="text-slate-900">2,841건</strong></span>
            <span className="hidden sm:flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600"/> 1184회 당첨: <strong className="text-slate-900">12명</strong></span>
          </div>
          <div className="text-slate-500 text-xs flex items-center gap-1.5">
            <Clock size={14} /> 마지막 업데이트: 2023.10.28 20:45
          </div>
        </div>
      </div>

      <main className="max-w-[1120px] mx-auto px-6 py-20 space-y-32">
        
        {/* Section 1: Winning Receipts */}
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">최신 당첨 영수증</h2>
              <p className="text-slate-500 font-medium">실제 당첨 회원들이 직접 보내주신 검증된 내역입니다.</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1">
              전체 영수증 보기 <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {receipts.map((receipt, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] shadow-sm flex flex-col relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div className={`absolute top-0 left-0 w-full h-1 ${receipt.theme === 'blue' ? 'bg-blue-600' : 'bg-slate-800'}`} />
                <div className="p-7 border-b border-dashed border-[#CBD5E1]">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">LOTTO 6/45</span>
                    <span className="text-xs font-mono text-slate-400">{receipt.date}</span>
                  </div>
                  <h4 className="text-4xl font-extrabold tracking-tighter mb-2 text-slate-900">{receipt.rank}</h4>
                  <div className={`text-2xl font-mono font-bold ${receipt.theme === 'blue' ? 'text-blue-600' : 'text-slate-800'}`}>{receipt.amount}</div>
                </div>
                <div className="p-7 bg-[#F8FAFC]">
                  <div className="text-xs text-slate-400 mb-3 font-mono font-bold tracking-widest">WINNING NUMBERS</div>
                  <div className="flex gap-2 mb-6">
                    {receipt.nums.map((n, idx) => (
                      <div key={idx} className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-mono font-bold text-slate-700 shadow-sm">
                        {n}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400"/>
                      <span>{receipt.location}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">#{receipt.round}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Archive Table */}
        <section>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">전체 당첨 내역</h2>
              <p className="text-slate-500 font-medium">분석 번호를 통해 배출된 모든 당첨 기록을 투명하게 공개합니다.</p>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="회차, 지역 검색..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#E2E8F0] rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 border-b border-[#E2E8F0] text-xs font-bold text-slate-500 uppercase tracking-widest">
              <div className="pl-4">회차 / 일자</div>
              <div>당첨 등수</div>
              <div>당첨 금액</div>
              <div>당첨 지역</div>
              <div className="text-right pr-4">상세 증빙</div>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {archiveData.map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="pl-4">
                    <div className="font-mono text-slate-900 font-bold text-lg">{item.round}회</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{item.date}</div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded font-bold text-xs ${
                      item.rank === '1등' ? 'bg-blue-100 text-blue-700' : 
                      item.rank === '2등' ? 'bg-slate-800 text-white' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.rank}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-slate-800 text-base">{item.amount}</div>
                  <div className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" /> {item.location}
                  </div>
                  <div className="text-right pr-4">
                    <button className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors inline-flex">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#E2E8F0] bg-slate-50 flex justify-center">
              <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2">
                내역 더 불러오기 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Interview Proofs */}
        <section className="bg-[#0F172A] rounded-2xl p-10 md:p-16 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-bold mb-6">
                MEMBER INTERVIEW
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6">
                숫자 뒤에 있는<br/>
                <span className="text-yellow-400">사람의 이야기</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                모든 당첨 내역은 철저한 검증을 거칩니다.<br/>
                당첨 회원들의 육성 인터뷰와 실제 구매 영수증을 통해<br/>
                결과에 대한 확신을 더합니다.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-300 p-4 rounded bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Play size={20} className="ml-1" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">1181회 2등 당첨자 인터뷰</div>
                    <div className="text-xs text-slate-400 font-mono">03:42 • 2023.10.12</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300 p-4 rounded bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                    <Play size={20} className="ml-1" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">1178회 3등 당첨자 인터뷰</div>
                    <div className="text-xs text-slate-400 font-mono">05:15 • 2023.09.20</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-yellow-400 font-mono font-bold text-sm mb-2">1184회 1등 당첨</div>
                <div className="text-xl font-bold text-white">"정말 믿기지 않았는데, 확인하는 순간 눈물이 났습니다"</div>
              </div>
              <div className="w-20 h-20 rounded-full bg-blue-600/90 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Play size={32} className="ml-2" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Membership CTA */}
        <section>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">근거 있는 선택을 시작하세요</h2>
            <p className="text-slate-500 font-medium text-lg">데이터에 기반한 투명한 분석 번호를 매주 받아보실 수 있습니다.</p>
          </div>

          <div className="max-w-2xl mx-auto bg-white border border-[#E2E8F0] shadow-lg rounded-xl overflow-hidden">
            <div className="p-10 border-b border-[#E2E8F0]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-blue-600 font-bold text-sm mb-2 tracking-wide">STANDARD PLAN</div>
                  <h3 className="text-2xl font-extrabold text-slate-900">3등 분석 번호 멤버십</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold font-mono text-slate-900 tracking-tighter">330,000<span className="text-xl text-slate-400 font-sans ml-1">원</span></div>
                  <div className="text-sm text-slate-500 mt-1 font-medium">1개월 기준</div>
                </div>
              </div>
              
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
                  매주 핵심 분석 번호 제공
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
                  회차별 분석 리포트 열람
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
                  멤버 전용 커뮤니티 입장
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 size={20} className="text-blue-600 flex-shrink-0" />
                  당첨 결과 복기 및 상담
                </li>
              </ul>

              <button className="w-full py-4 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded text-lg transition-colors shadow-md">
                멤버십 신청하기
              </button>
            </div>
            <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 font-medium text-center sm:text-left">
                <span className="block font-bold text-slate-900 mb-1">1·2등 분석은 별도 상담으로 진행됩니다.</span>
                회원님의 목표에 맞춰 전문 상담원이 안내해드립니다.
              </div>
              <button className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold text-sm rounded transition-colors flex items-center gap-2 flex-shrink-0">
                <MessageSquare size={16} /> 카카오톡 상담
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-16 mt-20">
        <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} className="text-slate-400" />
              <span className="font-extrabold text-slate-900 tracking-tight">LOTTORICO</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              투명한 기록과 데이터 기반의 분석으로<br/>
              근거 있는 로또 번호를 제공합니다.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">바로가기</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">당첨 증빙 아카이브</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">분석 방법론</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">멤버십 안내</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">고객센터</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>평일 10:00 - 18:00</li>
              <li>주말 및 공휴일 휴무</li>
              <li className="pt-2"><a href="#" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">카카오톡으로 문의하기 <ExternalLink size={14} /></a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1120px] mx-auto px-6 mt-16 pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2024 LOTTORICO. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-600">이용약관</a>
            <a href="#" className="hover:text-slate-600 font-bold">개인정보처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
