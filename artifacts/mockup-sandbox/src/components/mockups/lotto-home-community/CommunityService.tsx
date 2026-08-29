import React from 'react';
import { MessageCircle, Trophy, ArrowRight, Star, ThumbsUp } from 'lucide-react';

function LottoBall({ num, className = "" }: { num: number, className?: string }) {
  let colorClass = "";
  if (num <= 10) colorClass = "bg-[#FBC400] text-[#7A5A00]";
  else if (num <= 20) colorClass = "bg-[#69C8F2] text-[#004E75]";
  else if (num <= 30) colorClass = "bg-[#FF7272] text-[#750000]";
  else if (num <= 40) colorClass = "bg-[#AAAAAA] text-[#333333]";
  else colorClass = "bg-[#B0D840] text-[#3E5C00]";

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold shadow-sm ${colorClass} ${className}`}>
      {num}
    </span>
  );
}

const feedItems = [
  { id: 1, user: '민서아빠', type: 'review', badge: '3등 당첨', time: '방금 전', title: '처음으로 3등 당첨됐습니다!', text: '매주 무작정 사다가 분석 리포트를 먼저 읽는 습관이 생겼어요. 이번에는 정말 숫자가 달라 보였습니다. 커뮤니티 분들 응원 감사합니다.', likes: 24, comments: 5, avatar: 12 },
  { id: 2, user: '행운가득', type: 'discuss', badge: '번호토론', time: '15분 전', title: '이번 주 10번대 흐름 어떻게 보시나요?', text: '지난 주에 10번대가 전멸이었는데, 이번엔 무조건 나온다고 봅니다. 다들 어떻게 조합하시나요?', likes: 12, comments: 18, avatar: 25 },
  { id: 3, user: '정우성', type: 'review', badge: '2등 당첨', time: '1시간 전', title: '2등 당첨금 수령하고 왔습니다.', text: '당첨 후에도 상담팀에서 차분하게 다음 흐름을 설명해주셔서 더 믿음이 갔습니다. 기록이 남는 서비스라 좋네요.', likes: 156, comments: 42, avatar: 33 },
  { id: 4, user: '분석왕', type: 'discuss', badge: '자유게시판', time: '2시간 전', title: '나만의 제외수 잡는 꿀팁 공유합니다', text: '저는 보통 직전 5주간 흐름을 먼저 보는데요. 가장 많이 출현한 구간과 안 나온 구간의 밸런스를 맞추는 게 핵심입니다.', likes: 89, comments: 21, avatar: 41 },
];

const hotNumbers = [
  { num: 14, mentions: 452, trend: 'up' },
  { num: 27, mentions: 385, trend: 'up' },
  { num: 8, mentions: 312, trend: 'same' },
  { num: 33, mentions: 298, trend: 'down' },
  { num: 45, mentions: 256, trend: 'up' },
];

export function CommunityService() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">골든픽 커뮤니티</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#" className="text-blue-600 font-bold">라운지</a>
            <a href="#" className="hover:text-slate-900 transition-colors">당첨 인증</a>
            <a href="#" className="hover:text-slate-900 transition-colors">번호 토론</a>
            <a href="#" className="hover:text-slate-900 transition-colors">멤버십 안내</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">로그인</button>
            <button className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors shadow-sm">회원가입</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-white overflow-hidden border-b border-slate-200 relative">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 lg:py-24 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-6 border border-blue-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                현재 342명 실시간 분석 중
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6 break-keep">
                혼자하는 고민은 끝,<br/>
                <span className="text-blue-600">함께 만드는 당첨의 기적</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed break-keep">
                투명하게 공유되는 당첨 후기와 10만 회원의 데이터 토론. 
                매주 골든픽 커뮤니티에서 새로운 당첨자가 탄생합니다.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  커뮤니티 입장하기
                  <ArrowRight size={20} />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <Trophy size={20} className="text-yellow-500" />
                  당첨 내역 확인
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 via-yellow-50 to-white rounded-[3rem] blur-2xl opacity-70"></div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 bg-white p-2">
                <img 
                  src="/__mockup/images/lotto-balls-hero.png" 
                  alt="Lotto Balls" 
                  className="w-full h-auto rounded-3xl object-cover aspect-[4/3]"
                />
                
                {/* Floating live card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1 tracking-wider">1184회 실시간 공유</p>
                    <div className="flex items-center gap-1.5">
                      <LottoBall num={3} className="w-7 h-7 text-[11px]" />
                      <LottoBall num={14} className="w-7 h-7 text-[11px]" />
                      <LottoBall num={22} className="w-7 h-7 text-[11px]" />
                      <span className="text-slate-400 font-bold text-sm ml-1 tracking-widest">...</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex -space-x-2 justify-end mb-1.5">
                      <img src="https://i.pravatar.cc/100?img=1" className="w-6 h-6 rounded-full border-2 border-white shadow-sm" alt=""/>
                      <img src="https://i.pravatar.cc/100?img=2" className="w-6 h-6 rounded-full border-2 border-white shadow-sm" alt=""/>
                      <img src="https://i.pravatar.cc/100?img=3" className="w-6 h-6 rounded-full border-2 border-white shadow-sm" alt=""/>
                    </div>
                    <p className="text-[11px] font-bold text-blue-600">+124명 참여중</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Main Feed Column */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="text-blue-500 fill-blue-100" /> 실시간 라운지
                </h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl shadow-sm">전체</button>
                  <button className="px-4 py-2 text-sm font-bold bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">당첨 인증</button>
                  <button className="px-4 py-2 text-sm font-bold bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">번호 토론</button>
                </div>
              </div>

              <div className="space-y-4">
                {feedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          <img src={`https://i.pravatar.cc/150?img=${item.avatar}`} alt={item.user} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.user}</div>
                          <div className="text-[11px] font-medium text-slate-500">{item.time}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${
                        item.type === 'review' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-600 mb-5 leading-relaxed text-sm sm:text-base line-clamp-2">{item.text}</p>
                    <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
                      <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <ThumbsUp size={16} /> {item.likes}
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        <MessageCircle size={16} /> {item.comments}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-4 mt-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.99]">
                게시글 더 보기
              </button>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Membership / Consultation Action Panel */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100 via-blue-50 to-transparent rounded-bl-[100px] -z-10 opacity-70"></div>
                
                <div className="mb-6 pt-2">
                  <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold tracking-wide rounded mb-3">PREMIUM</span>
                  <h3 className="text-xl font-bold text-slate-900 leading-[1.35]">
                    전문가의 분석 번호를<br/>지금 바로 받아보세요
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <button className="group w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm">
                    <div className="text-left">
                      <div className="font-bold text-[15px]">3등 분석 멤버십</div>
                      <div className="text-blue-200 text-xs mt-1 font-medium">월 330,000원 • 주간 리포트</div>
                    </div>
                    <ArrowRight size={20} className="text-white/60 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </button>
                  
                  <button className="group w-full bg-[#FEE500] hover:bg-[#F4DC00] text-[#371D1E] rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm">
                    <div className="text-left">
                      <div className="font-bold text-[15px] flex items-center gap-1.5">
                        <MessageCircle size={16} className="fill-current" />
                        1·2등 맞춤 상담
                      </div>
                      <div className="text-black/50 text-xs mt-1 font-medium">카카오톡 채널 실시간 안내</div>
                    </div>
                    <ArrowRight size={20} className="text-black/40 group-hover:text-black/80 transition-colors group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Hot Numbers Widget */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    이번 주 HOT 번호
                  </h3>
                  <span className="text-[11px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">커뮤니티 기준</span>
                </div>
                
                <div className="space-y-3.5">
                  {hotNumbers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-4 text-center">{i + 1}</span>
                        <LottoBall num={item.num} className="w-8 h-8 text-sm group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-slate-600">{item.mentions}회 언급</span>
                      </div>
                      {item.trend === 'up' && <span className="text-[11px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">상승 ↑</span>}
                      {item.trend === 'down' && <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">하락 ↓</span>}
                      {item.trend === 'same' && <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">유지 -</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Minified Proof / Archive */}
              <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Trophy size={80} />
                </div>
                <h3 className="font-bold text-lg mb-5 flex items-center gap-2 relative z-10">
                  <Trophy size={18} className="text-yellow-400" />
                  최근 당첨 아카이브
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3.5 flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="w-11 h-11 rounded-full border-2 border-yellow-500/40 flex items-center justify-center text-yellow-500 font-bold text-sm shrink-0 bg-yellow-500/10">
                      2등
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">1181회 • 경기 성남</div>
                      <div className="text-xs text-yellow-500/80 mt-1 font-mono tracking-tight">당첨금 61,439,872원</div>
                    </div>
                  </div>
                  <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3.5 flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className="w-11 h-11 rounded-full border-2 border-slate-400/40 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0 bg-slate-500/10">
                      3등
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">1184회 • 서울 마포</div>
                      <div className="text-xs text-slate-400 mt-1 font-mono tracking-tight">당첨금 1,584,725원</div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 hover:text-white transition-colors relative z-10">
                  전체 기록 보기
                </button>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">G</div>
            <span className="font-bold text-slate-400 text-sm tracking-wide">GOLDEN PICK 커뮤니티</span>
          </div>
          <div className="text-xs text-slate-400 font-medium text-center md:text-right">
            © 2025 GOLDEN PICK. ACTUAL WINNINGS, TRANSPARENT RECORDS.<br/>
            이용약관 | 개인정보처리방침
          </div>
        </div>
      </footer>
    </div>
  );
}
