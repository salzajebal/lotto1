import React from 'react';
import { ArrowRight, Check, Headphones, MessageCircle, Play, TrendingUp, ChevronRight, Activity, ShieldCheck, BarChart3 } from 'lucide-react';

export function DataCenter() {
  return (
    <div className="min-h-screen bg-[#0d1118] font-sans text-slate-100 selection:bg-blue-500/30 selection:text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-[#0d1118]/90 backdrop-blur-md border-b border-[#e8bb51]/15">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              G
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">LOTTORICO <span className="text-blue-400">DATA</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#analysis" className="hover:text-blue-300 transition-colors">주간 분석</a>
            <a href="#records" className="hover:text-blue-300 transition-colors">당첨 데이터</a>
            <a href="#membership" className="hover:text-blue-300 transition-colors">분석 멤버십</a>
            <a href="#reviews" className="hover:text-blue-300 transition-colors">검증된 후기</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-400 hover:text-blue-300 transition-colors">로그인</button>
            <button className="hidden md:flex items-center gap-2 bg-[#1b2636] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors border border-[#31425a]">
              분석 리포트 보기 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src="/__mockup/images/lotto-balls-hero.png" alt="Lotto Balls" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        <div className="relative max-w-[1120px] mx-auto px-6 z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            1185회차 데이터 분석 완료
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            감에 의존하지 않는 <br className="hidden md:block" />
            <span className="text-yellow-400">데이터 기반 로또 분석</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            과거 10년간의 당첨 패턴, 출현 빈도, 조합 밸런스를 수학적으로 계산하여 가장 확률 높은 번호를 추천합니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full font-bold text-lg transition-transform hover:-translate-y-0.5 shadow-lg shadow-yellow-400/20">
              이번 주 추천 번호 확인하기
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 rounded-full font-bold text-lg transition-colors flex items-center justify-center gap-2">
              <Play size={20} className="fill-current" /> 분석 프로세스 영상
            </button>
          </div>
        </div>
      </section>

      {/* Analysis Dashboard */}
      <section id="analysis" className="py-16 md:py-24 relative -mt-10 bg-[#0d1118]">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="bg-[#151c28] rounded-3xl shadow-2xl shadow-black/25 border border-[#2b3b51] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#2b3b51]">
              
              {/* Left Column: This week's status */}
              <div className="p-8 lg:p-10 lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-100">이번 주 분석 현황</h2>
                    <p className="text-slate-400 mt-1">제 1185회차 예상 분석 리포트 요약</p>
                  </div>
                   <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-blue-300 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-400/25">
                    <Activity size={16} /> 분석 신뢰도 94.2%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                   <div className="bg-[#101722] rounded-2xl p-4 border border-[#2b3b51]">
                     <div className="text-slate-400 text-xs font-bold mb-1">고출현 구간</div>
                     <div className="text-2xl font-black text-slate-100">11~20</div>
                     <div className="text-emerald-400 text-xs font-bold mt-1 flex items-center gap-1"><TrendingUp size={12}/> +12%</div>
                  </div>
                   <div className="bg-[#101722] rounded-2xl p-4 border border-[#2b3b51]">
                     <div className="text-slate-400 text-xs font-bold mb-1">홀짝 비율</div>
                     <div className="text-2xl font-black text-slate-100">4 : 2</div>
                    <div className="text-slate-400 text-xs mt-1">적정 밸런스 유지</div>
                  </div>
                   <div className="bg-[#101722] rounded-2xl p-4 border border-[#2b3b51]">
                     <div className="text-slate-400 text-xs font-bold mb-1">미출현 번호</div>
                     <div className="text-2xl font-black text-slate-100">14주</div>
                     <div className="text-blue-300 text-xs font-bold mt-1">집중 관찰 필요</div>
                  </div>
                   <div className="bg-[#101722] rounded-2xl p-4 border border-[#2b3b51]">
                     <div className="text-slate-400 text-xs font-bold mb-1">총합 구간</div>
                     <div className="text-2xl font-black text-slate-100">135~145</div>
                    <div className="text-slate-400 text-xs mt-1">황금 비율 타겟</div>
                  </div>
                </div>

                <div>
                   <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                     <ShieldCheck size={16} className="text-blue-300" /> AI 추천 제외수 & 고정수
                  </h3>
                   <div className="bg-blue-500/10 border border-blue-400/25 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1">
                       <div className="text-xs font-bold text-slate-400 mb-2">강력 예상 고정수</div>
                      <div className="flex gap-2">
                        <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-600/20">12</span>
                        <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-600/20">34</span>
                      </div>
                    </div>
                     <div className="hidden sm:block w-px h-12 bg-blue-400/25"></div>
                    <div className="flex-1">
                       <div className="text-xs font-bold text-slate-400 mb-2">확률 희박 제외수</div>
                      <div className="flex gap-2 opacity-50">
                         <span className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 font-bold text-lg flex items-center justify-center line-through">03</span>
                         <span className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 font-bold text-lg flex items-center justify-center line-through">21</span>
                         <span className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 font-bold text-lg flex items-center justify-center line-through">42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Draw Comparison */}
              <div className="p-8 lg:p-10 bg-[#101722]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-100">직전 회차 복기</h3>
                  <span className="text-xs font-bold text-slate-400 bg-[#1b2636] px-2 py-1 rounded border border-[#31425a]">1184회</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-slate-400 mb-2">실제 당첨 번호</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['08', '14', '22', '28', '33', '41'].map((n) => (
                      <span key={n} className="w-8 h-8 rounded-full bg-[#1b2636] border border-[#41516a] text-slate-100 font-bold text-sm flex items-center justify-center shadow-sm">
                          {n}
                        </span>
                      ))}
                      <span className="w-8 h-8 flex items-center justify-center text-slate-500 font-bold">+</span>
                      <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-sm flex items-center justify-center">
                        05
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-slate-300">로또리코 예측 적중률</span>
                      <span className="text-2xl font-black text-blue-300">82%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[82%] h-full bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                       1184회차에서 로또리코 시스템은 총 4.5개의 당첨 번호를 예측 범위 내에서 적중시켰습니다.
                    </p>
                  </div>
                  
                  <button className="w-full py-3 bg-[#1b2636] border border-[#3a4a61] text-slate-200 font-bold rounded-xl text-sm hover:bg-[#24344a] hover:border-blue-400/50 transition-colors shadow-sm">
                    상세 복기 리포트 보기
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-16 md:py-24 bg-[#101722] border-y border-[#26364b]">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-blue-300 font-bold tracking-widest text-sm uppercase mb-3 block">Data Processing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight mb-4">
              철저한 데이터, 확실한 기준
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              매주 무작위로 번호를 고르는 대신, 체계적인 3단계 필터링을 통해 확률을 높입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 size={28} className="text-blue-300" />,
                title: "과거 출현 패턴 분석",
                desc: "역대 당첨 번호의 누적 통계를 바탕으로 자주 나오는 구간과 소외된 구간의 사이클을 추적합니다."
              },
              {
                icon: <Activity size={28} className="text-blue-300" />,
                title: "조합 밸런스 최적화",
                desc: "연속수, 끝수, 홀짝 비율, 총합 등 로또 당첨의 수학적 황금 밸런스에 맞는 번호만 추출합니다."
              },
              {
                icon: <ShieldCheck size={28} className="text-blue-300" />,
                title: "오차 보정 및 검증",
                desc: "매주 직전 회차의 실제 결과를 분석 모델에 재학습시켜 시스템의 적중률을 지속적으로 개선합니다."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#151c28] rounded-3xl p-8 border border-[#2b3b51] hover:border-blue-400/40 hover:bg-blue-500/10 transition-colors">
                <div className="w-14 h-14 bg-[#1b2636] rounded-2xl flex items-center justify-center shadow-sm border border-[#3a4a61] mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Conversion */}
      <section id="membership" className="py-20 md:py-32 bg-[#0d1118] relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="max-w-[1120px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold tracking-wide mb-6 border border-blue-400/25">
                프리미엄 분석 서비스
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight mb-6 leading-tight">
                당첨 확률을 높이는<br />
                <span className="text-blue-300">가장 현실적인 투자</span>
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                 매주 수만 개의 조합 중 로또리코 데이터 센터의 검증을 거친 최정예 번호만을 멤버십 회원에게 제공합니다.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  '매주 핵심 분석 번호 조합 제공 (알림톡 발송)',
                  '주간 분석 리포트 및 당첨 확률 브리핑 열람',
                  '데이터 기반 추천 고정수 및 제외수 제공',
                  '회원 전용 데이터 열람 커뮤니티 접근 권한'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-300">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center gap-4 p-5 bg-[#151c28] rounded-2xl border border-[#2b3b51] shadow-sm inline-flex">
                <div className="w-12 h-12 bg-yellow-400/10 text-yellow-300 rounded-full flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">1·2등 VVIP 분석은 별도 진행</div>
                  <div className="font-bold text-slate-100 text-sm">목표에 맞춘 1:1 심층 상담이 필요합니다.</div>
                </div>
              </div>
            </div>

            <div className="bg-[#151c28] rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-black/30 border border-[#3a4a61] relative">
              <div className="absolute top-0 right-10 -translate-y-1/2">
                <span className="bg-yellow-400 text-slate-900 text-xs font-black tracking-widest px-4 py-2 rounded-full uppercase shadow-lg shadow-yellow-400/30 border border-yellow-500">
                  Standard
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-100 mb-2">3등 분석 번호 멤버십</h3>
              <p className="text-slate-400 mb-8 text-sm">안정적인 확률로 현실적인 당첨을 목표로 합니다.</p>
              
              <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-[#2b3b51]">
                <span className="text-5xl font-black text-slate-100 tracking-tight">330,000</span>
                <span className="text-lg font-bold text-slate-400">원 / 1개월</span>
              </div>
              
              <div className="space-y-4">
                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                  이 플랜으로 시작하기 <ArrowRight size={20} />
                </button>
                <button className="w-full py-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] rounded-xl font-bold text-lg transition-colors shadow-sm border border-[#E5CE00] flex items-center justify-center gap-2">
                  <MessageCircle size={20} /> 카카오톡으로 빠른 상담
                </button>
              </div>
              <p className="text-center text-xs text-slate-500 mt-6">
                카카오톡 상담은 연중무휴 진행됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Winning Stories (Proof) */}
      <section id="records" className="py-20 bg-[#101722] border-t border-[#26364b]">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-3">데이터가 증명하는 결과</h2>
              <p className="text-slate-400 text-lg">최근 로또리코 분석을 통해 배출된 실제 당첨 회원들의 기록입니다.</p>
            </div>
            <button className="text-blue-300 font-bold hover:text-blue-200 transition-colors flex items-center gap-1">
              데이터 더 보기 <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { rank: '3등', draw: '1184회', loc: '서울 마포', name: '박민서', amount: '1,584,725', quote: '감으로 찍을 때와는 다르게 매주 번호를 받는 기준이 생기니 안정감이 다릅니다. 데이터는 거짓말을 안 하네요.' },
              { rank: '2등', draw: '1181회', loc: '경기 성남', name: '정우성', amount: '61,439,872', quote: '분석 리포트를 읽는 게 주말의 즐거움이었는데 이렇게 큰 결과로 돌아올 줄 몰랐습니다. 진심으로 감사드립니다.', highlight: true },
              { rank: '3등', draw: '1178회', loc: '부산 수영', name: '김하늘', amount: '1,742,091', quote: '여러 업체를 써봤지만 데이터 근거를 이렇게 명확하게 제시해주는 곳은 처음이었습니다. 1등까지 계속 갑니다!' }
            ].map((story, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${story.highlight ? 'bg-blue-700 border-blue-500 text-white shadow-xl shadow-blue-950/40 transform md:-translate-y-4' : 'bg-[#151c28] border-[#2b3b51] text-slate-100 hover:border-blue-400/50 hover:shadow-lg hover:shadow-black/20 transition-all'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-sm ${story.highlight ? 'bg-white text-blue-700' : 'bg-[#1b2636] text-blue-300 border border-[#41516a]'}`}>
                    {story.rank}
                  </div>
                  <div className={`text-right ${story.highlight ? 'text-blue-100' : 'text-slate-400'}`}>
                    <div className="text-sm font-bold">{story.draw}</div>
                    <div className="text-xs">{story.loc}</div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className={`text-xs font-bold mb-1 ${story.highlight ? 'text-blue-200' : 'text-slate-500'}`}>당첨금</div>
                  <div className="text-3xl font-black tracking-tight">{story.amount}원</div>
                </div>
                <p className={`text-sm leading-relaxed ${story.highlight ? 'text-blue-50' : 'text-slate-300'}`}>
                  "{story.quote}"
                </p>
                <div className={`mt-6 pt-6 border-t ${story.highlight ? 'border-blue-400/50 text-blue-200' : 'border-[#2b3b51] text-slate-500'} text-xs font-bold flex items-center gap-2`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${story.highlight ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{story.name.charAt(0)}</div>
                  {story.name} 님 회원 후기
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 md:py-16 border-t border-slate-800">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10 border-b border-slate-800 pb-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 font-bold text-lg">
                  G
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-200">LOTTORICO <span className="text-blue-500">DATA</span></span>
              </div>
              <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                로또는 운이 아닙니다. 정확한 데이터와 일관된 기준으로 확률을 통제하는 과정입니다. 로또리코와 함께 현명하게 도전하세요.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-bold mb-4">서비스</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">주간 분석 현황</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">당첨 데이터</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">멤버십 안내</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">고객지원</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2"><Headphones size={14} /> 카카오톡 상담</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">자주 묻는 질문</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">이용약관</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <div>© 2025 LOTTORICO DATA CENTER. ALL RIGHTS RESERVED.</div>
            <div className="flex items-center gap-4">
              <span className="cursor-pointer hover:text-slate-300">개인정보처리방침</span>
              <span className="cursor-pointer hover:text-slate-300">이용약관</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
