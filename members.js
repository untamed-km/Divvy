const MKT_CACHE_KEY='distrofi_mkt_cache';
const MKT_CACHE_TTL=60000; // 60 seconds

// CoinGecko ID map
const COINGECKO_IDS={BTC:'bitcoin',ETH:'ethereum',SOL:'solana',XRP:'ripple',ADA:'cardano',DOGE:'dogecoin',AVAX:'avalanche-2',LINK:'chainlink',MATIC:'matic-network',DOT:'polkadot'};

function getMktCache(){try{const c=JSON.parse(sessionStorage.getItem(MKT_CACHE_KEY)||'{}');return c;}catch(e){return{};}}
function setMktCache(data){try{sessionStorage.setItem(MKT_CACHE_KEY,JSON.stringify({data,ts:Date.now()}));}catch(e){}}
function isMktCacheFresh(){try{const c=JSON.parse(sessionStorage.getItem(MKT_CACHE_KEY)||'{}');return c.ts&&(Date.now()-c.ts)<MKT_CACHE_TTL;}catch(e){return false;}}

async function fetchFinnhubQuote(sym){
  const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`);
  if(!r.ok)return null;
  const d=await r.json();
  if(!d.c)return null;
  const price=d.c,prev=d.pc,chg=((price-prev)/prev*100);
  return{price:'$'+price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),chg:(chg>=0?'+':'')+chg.toFixed(2)+'%',up:chg>=0};
}

async function fetchFinnhubSpark(sym){
  const to=Math.floor(Date.now()/1000);
  const from=to-7*24*3600;
  const r=await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
  if(!r.ok)return null;
  const d=await r.json();
  return d.c&&d.c.length>1?d.c:null;
}

async function fetchCoinGeckoPrices(ids){
  const joined=ids.join(',');
  const r=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${joined}&vs_currencies=usd&include_24hr_change=true`);
  if(!r.ok)return null;
  return await r.json();
}

function fmtCryptoPrice(p){
  if(p>=1000)return'$'+p.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  if(p>=1)return'$'+p.toFixed(2);
  return'$'+p.toFixed(4);
}

async function fetchLiveMarketData(){
  if(isMktCacheFresh()){
    const cache=getMktCache();
    if(cache.data)applyMarketData(cache.data);
    return;
  }
  // Show loading state
  const st=document.getElementById('mkt-stocks');
  const cr=document.getElementById('mkt-crypto');
  if(st)st.innerHTML='<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px"><i class="ti ti-loader-2" style="font-size:20px;display:block;margin:0 auto 8px;animation:spin 1s linear infinite"></i>Loading live prices…</div>';
  if(cr)cr.innerHTML='<div style="height:20px"></div>';

  try{
    const wl=getWatchlist();
    const liveData={stocks:{},crypto:{}};

    // Fetch stocks in parallel
    await Promise.all(wl.stocks.map(async sym=>{
      const [quote,spark]=await Promise.all([fetchFinnhubQuote(sym),fetchFinnhubSpark(sym)]);
      if(quote)liveData.stocks[sym]={...quote,spark:spark||null};
    }));

    // Fetch crypto
    const cgIds=wl.crypto.map(sym=>COINGECKO_IDS[sym]).filter(Boolean);
    if(cgIds.length){
      const prices=await fetchCoinGeckoPrices(cgIds);
      if(prices){
        wl.crypto.forEach(sym=>{
          const id=COINGECKO_IDS[sym];
          if(id&&prices[id]){
            const p=prices[id].usd,chg=prices[id].usd_24h_change||0;
            liveData.crypto[sym]={price:fmtCryptoPrice(p),chg:(chg>=0?'+':'')+chg.toFixed(2)+'%',up:chg>=0};
          }
        });
      }
    }

    setMktCache(liveData);
    applyMarketData(liveData);
  }catch(e){
    console.warn('Market fetch error:',e);
    renderMarketsWithData(null); // fallback to static
  }
}

function applyMarketData(liveData){
  // Patch MKT_STOCKS with live data
  MKT_STOCKS.forEach(s=>{
    const d=liveData.stocks[s.sym];
    if(d){s.price=d.price;s.chg=d.chg;s.up=d.up;if(d.spark)s.spark=d.spark;}
  });
  // Patch MKT_CRYPTO with live data
  MKT_CRYPTO.forEach(s=>{
    const d=liveData.crypto[s.sym];
    if(d){s.price=d.price;s.chg=d.chg;s.up=d.up;}
  });
  renderMarketsWithData(liveData);
}

// ── Live financial news ──────────────────────────────────────────
const NEWS_CACHE_KEY='distrofi_news_cache';
const NEWS_CACHE_TTL=15*60*1000; // 15 minutes

function isNewsCacheFresh(){try{const c=JSON.parse(sessionStorage.getItem(NEWS_CACHE_KEY)||'{}');return c.ts&&(Date.now()-c.ts)<NEWS_CACHE_TTL;}catch(e){return false;}}
function getNewsCache(){try{return JSON.parse(sessionStorage.getItem(NEWS_CACHE_KEY)||'{}').data||null;}catch(e){return null;}}
function setNewsCache(data){try{sessionStorage.setItem(NEWS_CACHE_KEY,JSON.stringify({data,ts:Date.now()}));}catch(e){}}

function timeAgo(unixTs){
  const diff=Math.floor((Date.now()/1000)-unixTs);
  if(diff<60)return'just now';
  if(diff<3600)return Math.floor(diff/60)+'m ago';
  if(diff<86400)return Math.floor(diff/3600)+'h ago';
  return Math.floor(diff/86400)+'d ago';
}

async function fetchLiveNews(){
  if(isNewsCacheFresh()){
    const cached=getNewsCache();
    if(cached){renderNewsWithData(cached);return;}
  }
  const nw=document.getElementById('mkt-news');
  if(nw)nw.innerHTML='<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px"><i class="ti ti-loader-2" style="font-size:20px;display:block;margin:0 auto 8px;animation:spin 1s linear infinite"></i>Loading news…</div>';
  try{
    const r=await fetch(`https://finnhub.io/api/v1/news?category=general&minId=0&token=${FINNHUB_KEY}`);
    if(!r.ok)throw new Error('News fetch failed');
    const data=await r.json();
    const articles=data.filter(a=>a.headline&&a.url&&a.source).slice(0,8);
    setNewsCache(articles);
    renderNewsWithData(articles);
  }catch(e){
    console.warn('News fetch error:',e);
    renderNewsWithData(null);
  }
}

function renderNewsWithData(articles){
  const nw=document.getElementById('mkt-news');
  if(!nw)return;
  if(!articles||!articles.length){
    // Fallback to hardcoded
    nw.innerHTML=MKT_NEWS.map((n,i)=>`<div onclick="openMktNews(${i})" style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px;margin-bottom:8px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:10px;font-weight:600;color:var(--accent);background:#6366f114;padding:3px 8px;border-radius:99px">${n.cat}</span><span style="font-size:11px;color:var(--muted)">${n.src}</span></div>
      <div style="font-size:14px;font-weight:600;line-height:1.4;margin-bottom:4px">${n.title}</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.4">${n.summary}</div>
      <div style="font-size:11px;color:var(--accent);margin-top:8px;display:flex;align-items:center;gap:4px"><i class="ti ti-external-link" style="font-size:12px"></i> Read article</div>
    </div>`).join('');
    return;
  }
  nw.innerHTML=articles.map(a=>`<div onclick="window.open('${a.url.replace(/'/g,'')}','_blank')" style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px;margin-bottom:8px;cursor:pointer">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:10px;font-weight:600;color:var(--accent);background:#6366f114;padding:3px 8px;border-radius:99px">Markets</span>
      <span style="font-size:11px;color:var(--muted)">${a.source} · ${timeAgo(a.datetime)}</span>
    </div>
    <div style="font-size:14px;font-weight:600;line-height:1.4;margin-bottom:4px">${a.headline}</div>
    ${a.summary?`<div style="font-size:12px;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.summary}</div>`:''}
    <div style="font-size:11px;color:var(--accent);margin-top:8px;display:flex;align-items:center;gap:4px"><i class="ti ti-external-link" style="font-size:12px"></i> Read article</div>
  </div>`).join('');
}

function renderMarketsWithData(liveData){
  const wl=getWatchlist();
  const st=document.getElementById('mkt-stocks');
  const cr=document.getElementById('mkt-crypto');
  if(st){const shown=MKT_STOCKS.filter(s=>wl.stocks.includes(s.sym));st.innerHTML=(shown.length?shown.map(s=>{const i=MKT_STOCKS.indexOf(s);return `<div onclick="openMktChart('stock',${i})" style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer"><div style="width:40px;height:40px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:700;color:var(--text)">${s.sym}</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${s.name}</div><div style="font-size:12px;color:var(--muted)">${s.price}</div></div>${sparkSVG(s.spark,s.up)}<div style="font-size:13px;font-weight:600;color:${s.up?'var(--green)':'var(--red)'};flex-shrink:0;min-width:54px;text-align:right">${s.chg}</div></div>`;}).join(''):'<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">Tap Customize to add stocks</div>')+(!liveData?'<div style="font-size:11px;color:var(--muted);text-align:center;padding:4px 0">Prices may be delayed</div>':'');}
  if(cr){const shownC=MKT_CRYPTO.filter(s=>wl.crypto.includes(s.sym));cr.innerHTML=shownC.length?shownC.map(s=>{const i=MKT_CRYPTO.indexOf(s);return `<div onclick="openMktChart('crypto',${i})" style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer"><div style="width:40px;height:40px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:var(--accent)">${s.sym}</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${s.name}</div><div style="font-size:12px;color:var(--muted)">${s.price}</div></div>${sparkSVG(s.spark,s.up)}<div style="font-size:13px;font-weight:600;color:${s.up?'var(--green)':'var(--red)'};flex-shrink:0;min-width:54px;text-align:right">${s.chg}</div></div>`;}).join(''):'';}
}

// ── Default watchlist (free tier sees these; Pro can customize)
const DEFAULT_WATCH_STOCKS=['SPY','AAPL','TSLA','NVDA'];
const DEFAULT_WATCH_CRYPTO=['BTC','ETH','SOL'];
const WATCH_KEY='distrofi_watchlist';
function getWatchlist(){
  try{const w=JSON.parse(localStorage.getItem(WATCH_KEY)||'null');if(w&&w.stocks&&w.crypto)return w;}catch(e){}
  return{stocks:[...DEFAULT_WATCH_STOCKS],crypto:[...DEFAULT_WATCH_CRYPTO]};
}
function saveWatchlist(w){localStorage.setItem(WATCH_KEY,JSON.stringify(w));}
function toggleWatch(type,sym){
  const w=getWatchlist();
  const arr=w[type];
  const idx=arr.indexOf(sym);
  if(idx>=0){
    if(arr.length<=1)return; // keep at least one
    arr.splice(idx,1);
  }else{
    arr.push(sym);
  }
  saveWatchlist(w);
  renderWatchEditor(type);
  renderMarketplace();
}
const MKT_NEWS=[
  {title:'Federal Reserve holds interest rates steady for third consecutive meeting',summary:'The Fed signaled it needs more data before cutting rates, with officials citing persistent services inflation.',src:'Reuters',cat:'Policy',url:'https://www.reuters.com/markets/us/federal-reserve/'},
  {title:'How to build an emergency fund in 6 months',summary:'Financial planners recommend saving 3-6 months of expenses. Here\'s a realistic step-by-step plan.',src:'NerdWallet',cat:'Personal Finance',url:'https://www.nerdwallet.com/article/banking/emergency-fund-why-it-matters'},
  {title:'Inflation cools to lowest level in three years',summary:'The CPI report showed price growth slowing across food, shelter, and energy — good news for household budgets.',src:'CNBC',cat:'Economy',url:'https://www.cnbc.com/economy/'},
  {title:'The case for automating your savings',summary:'Studies show people who automate transfers save 2-3x more than those who move money manually each month.',src:'Investopedia',cat:'Savings',url:'https://www.investopedia.com/articles/personal-finance/040915/how-automate-your-savings.asp'},
  {title:'Index funds vs. ETFs: what\'s the difference?',summary:'Both offer low-cost diversification, but there are key differences in how they\'re bought, sold, and taxed.',src:'Investopedia',cat:'Investing',url:'https://www.investopedia.com/articles/investing/102015/etf-vs-index-fund.asp'},
];
const LESSONS_READ_KEY='distrofi_lessons_read';
function getReadLessons(){try{return JSON.parse(localStorage.getItem(LESSONS_READ_KEY)||'[]');}catch(e){return[];}}
function markLessonRead(i){const r=getReadLessons();if(!r.includes(i)){r.push(i);localStorage.setItem(LESSONS_READ_KEY,JSON.stringify(r));}}

const MKT_LEARN=[
  {title:'What Is Financial Independence',mins:'4 min',icon:'ti-trending-up',
   body:'Financial independence means having enough saved and invested that your money covers your living expenses — so work becomes optional. It\'s not about being rich; it\'s about having choices. The path starts with spending less than you earn and directing the difference toward assets. Most people reach it by cutting lifestyle creep and investing consistently over time.',
   tip:'Use DistroFi\'s spending buckets to spot where lifestyle creep is happening, then redirect that freed-up cash to a savings goal labeled "FI Fund."',
   url:'https://www.investopedia.com/terms/f/financial-independence-retire-early-fire.asp'},
  {title:'Investing 101 for Beginners',mins:'5 min',icon:'ti-chart-arcs',
   body:'Investing means putting money to work so it can grow over time — instead of sitting idle in a checking account. The stock market has historically returned around 7-10% per year on average, far outpacing inflation. You don\'t need a lot to start; index funds let you own a tiny slice of hundreds of companies at once for very low fees. The most important move is simply starting early, even with small amounts.',
   tip:'Track your 401k contributions alongside your take-home pay in DistroFi\'s 401k tracker to see exactly how much of your income is already working for you.',
   url:'https://www.nerdwallet.com/article/investing/how-to-start-investing'},
  {title:'The 50/30/20 Budget Rule',mins:'3 min',icon:'ti-wallet',
   body:'The 50/30/20 rule divides your after-tax income into three buckets: 50% for needs (rent, groceries, utilities), 30% for wants (dining out, subscriptions, fun), and 20% for savings and debt repayment. It\'s a simple starting point that works for most income levels. The power is in the clarity — you always know whether a purchase comes from your "wants" budget or is crowding out savings. Adjust the percentages as your income or goals change.',
   tip:'Set up three spending buckets in DistroFi labeled Needs, Wants, and Savings, then assign each transaction to see your real split at a glance.',
   url:'https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp'},
  {title:'How Compound Interest Works',mins:'4 min',icon:'ti-pig-money',
   body:'Compound interest means you earn interest not just on your original money, but on all the interest it\'s already earned — growth stacking on top of growth. Over decades, this creates an exponential curve that rewards people who start early far more than those who invest more but start late. A $5,000 investment at 25 can be worth more at 65 than $20,000 invested at 45. Time in the market is the single most powerful variable in your wealth equation.',
   tip:'Link a savings goal in DistroFi to your investment account so you can watch the balance grow and stay motivated to contribute every pay cycle.',
   url:'https://www.investopedia.com/terms/c/compoundinterest.asp'},
  {title:'Pay Off Debt Faster: Two Methods',mins:'5 min',icon:'ti-credit-card',
   body:'The avalanche method has you attack the debt with the highest interest rate first, saving the most money overall. The snowball method targets the smallest balance first, giving you quick wins that build momentum. Mathematically, avalanche wins — but snowball wins psychologically for many people, and the best strategy is the one you\'ll actually stick to. Either way, paying even $50 extra per month can cut years off a debt payoff timeline.',
   tip:'Use DistroFi\'s bill planner to schedule extra debt payments on your highest-rate card right after payday, before that money can disappear into spending.',
   url:'https://www.nerdwallet.com/article/finance/what-is-the-debt-avalanche-method'},
  {title:'Build a Solid Emergency Fund',mins:'4 min',icon:'ti-shield-check',
   body:'An emergency fund is 3-6 months of living expenses kept in cash, separate from your regular checking account. It\'s your financial shock absorber — job loss, car repairs, and medical bills stop being crises and become inconveniences you\'ve already planned for. Without one, unexpected costs often go straight onto a credit card, creating debt that compounds the problem. Start with a $1,000 mini-fund as a first milestone, then build from there.',
   tip:'Create a savings goal in DistroFi called "Emergency Fund" with your target amount, then automate a fixed contribution to it at the start of every pay cycle.',
   url:'https://www.investopedia.com/terms/e/emergency_fund.asp'},
  {title:'Roth IRA vs. Traditional IRA',mins:'5 min',icon:'ti-building-bank',
   body:'Both IRAs let your investments grow tax-advantaged, but they differ on when you pay taxes. With a Traditional IRA, contributions may be tax-deductible now, but you pay income tax when you withdraw in retirement. With a Roth IRA, you contribute after-tax dollars today and withdrawals in retirement are completely tax-free. If you expect to be in a higher tax bracket in retirement — or just want tax-free income later — the Roth is typically the better bet for younger earners.',
   tip:'Log your IRA contributions in DistroFi\'s income tracking section so you can see how much of your annual $7,000 limit you\'ve used and plan contributions around your pay cycle.',
   url:'https://www.nerdwallet.com/article/investing/roth-ira-vs-traditional-ira'},
  {title:'How to Read Your Pay Stub',mins:'4 min',icon:'ti-cash',
   body:'Your gross pay is what you earned; your net pay is what hits your bank account after deductions. The gap between them includes federal and state income taxes, Social Security (6.2%), Medicare (1.45%), health insurance premiums, and any 401k contributions. Understanding each line helps you catch errors, plan around your real take-home, and make informed decisions about benefits elections. Many people are surprised to find they\'re already contributing to a retirement plan — or that they\'re not.',
   tip:'Enter your net pay into DistroFi\'s income tracking tool each pay period so your spending buckets and savings goals are always based on money you actually have.',
   url:'https://www.investopedia.com/articles/personal-finance/070215/how-decode-your-pay-stub.asp'},
];
const MKT_AFFILIATE=[];
const DEALS_PRODUCTS=[
  {
    icon:'ti-building-bank',
    color:'#22c55e',
    badge:'Earn up to $425',
    title:'SoFi Checking & Savings',
    sub:'Get $25 just for opening — up to $425 total',
    desc:'Open a SoFi Checking and Savings account and earn $25 instantly. Set up a direct deposit of $1,000+ and unlock an additional $50 or $400 bonus. High-yield savings rate included. Terms apply.',
    cta:'Open SoFi account',
    url:'https://www.sofi.com/invite/money?gcp=616e05e1-1b98-4338-ac5b-94087c6e5b22&isAliasGcp=false',
  },
  {
    icon:'ti-trending-up',
    color:'#6366f1',
    badge:'$0 commissions',
    title:'Webull — Free Investing',
    sub:'Stocks, ETFs & options — no fees',
    desc:'Invest in stocks, ETFs, options, and crypto with zero commissions. Webull offers advanced charting, extended trading hours, and fractional shares so you can start with any amount.',
    cta:'Start investing on Webull',
    url:'https://www.webull.com/s/FCxusQlAfSgei9eqR6',
  },
  {
    icon:'ti-currency-bitcoin',
    color:'#f59e0b',
    badge:'Get $20 in Bitcoin',
    title:'Coinbase — Buy Crypto',
    sub:'We both earn $20 in Bitcoin',
    desc:'Sign up for Coinbase using this link and we each get $20 in Bitcoin after you buy or sell $100 in crypto. The easiest way to get started with cryptocurrency — secure, regulated, and beginner-friendly.',
    cta:'Claim $20 in Bitcoin',
    url:'https://coinbase.com/join/5L4L4EC?src=android-share',
  },
  {
    icon:'ti-gas-station',
    color:'#ec4899',
    badge:'Up to 15¢/gal cash back',
    title:'Upside — Cash Back on Gas',
    sub:'Gas, groceries & restaurants',
    desc:'Get 15¢ per gallon extra cash back on your first gas fill-up and 10% extra cash back on your first restaurant or grocery purchase. Use code BPXYR at signup — free to join, real cash paid out.',
    cta:'Download Upside — code BPXYR',
    url:'https://upside.app.link/BPXYR',
  },
];
const SHOP_PRODUCTS=[
  {
    icon:'ti-table',
    color:'#6366f1',
    title:'Budget Master Template',
    sub:'Excel & Google Sheets',
    desc:'A pre-built pay-period budget template with income tracking, bill planner, spending categories, and a savings waterfall — ready to use in minutes.',
    price:'$9',
    badge:'',
    url:'https://distrofi.org',
  },
  {
    icon:'ti-file-spreadsheet',
    color:'#22c55e',
    title:'Financial Planning Worksheet Pack',
    sub:'5-sheet bundle',
    desc:'Net worth tracker, debt payoff planner, retirement estimator, savings goal sheet, and a 12-month cash flow overview. All in one download.',
    price:'$14',
    badge:'Bundle',
    url:'https://distrofi.org',
  },
  {
    icon:'ti-download',
    color:'#f59e0b',
    title:'Pro Export Add-on',
    sub:'Advanced CSV + Excel export',
    desc:'Export your full DistroFi budget history with charts, category breakdowns, and net worth trends — formatted for spreadsheets and tax prep.',
    price:'$7',
    badge:'Coming soon',
    url:'',
  },
];

function sparkSVG(data,up){
  const w=64,h=24,max=Math.max(...data),min=Math.min(...data),range=(max-min)||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1)*w).toFixed(1)},${(h-((v-min)/range)*h).toFixed(1)}`).join(' ');
  const col=up?'#22c55e':'#ef4444';
  return`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="flex-shrink:0"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}


const MEMBERS_TITLES={hub:'Members',markets:'Markets',news:'Financial News',learn:'Learn',shop:'Shop',deals:'Member Deals'};
function toggleInsights(){
  const exp=document.getElementById('insights-expanded');
  const chev=document.getElementById('insights-chevron');
  if(!exp)return;
  const open=exp.style.display==='block';
  exp.style.display=open?'none':'block';
  if(chev)chev.style.transform=open?'':'rotate(180deg)';
}

function showMembersView(view){
  if(view==='markets')fetchLiveMarketData();
  if(view==='news')fetchLiveNews();
  const views=['hub','markets','news','learn','shop','deals'];
  views.forEach(v=>{
    const el=document.getElementById('members-'+(v==='hub'?'hub':v));
    if(el)el.style.display=(v===view||(v==='hub'&&view==='hub'))?'block':'none';
  });
  // Update top bar title
  const title=document.getElementById('members-title');
  if(title)title.textContent=MEMBERS_TITLES[view]||'Members';
  // Back button: hub → go home via nav, sub-view → go to hub
  const backBtn=document.getElementById('members-back-btn');
  if(backBtn){
    if(view==='hub'){
      backBtn.onclick=()=>showScreen('home',document.querySelectorAll('.nav-btn')[0]);
    } else {
      backBtn.onclick=()=>showMembersHub();
    }
  }
  // Remove inline back buttons from sub-views (top bar handles it)
  const screen=document.getElementById('screen-marketplace');
  if(screen)screen.scrollTop=0;
}
function showMembersHub(){showMembersView('hub');}

function openWatchEditor(type){
  if(!gateFeature('watchlist')){return;}
  renderWatchEditor(type);
}
function renderWatchEditor(type){
  const wl=getWatchlist();
  const catalog=type==='stocks'?MKT_STOCKS:MKT_CRYPTO;
  const selected=wl[type];
  const title=type==='stocks'?'Customize stocks':'Customize crypto';
  const rows=catalog.map(item=>{
    const on=selected.includes(item.sym);
    const isCrypto=type==='crypto';
    return `<div onclick="toggleWatch('${type}','${item.sym}')" style="display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
      <div style="width:34px;height:34px;border-radius:${isCrypto?'50%':'9px'};background:var(--card2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:700;color:${isCrypto?'var(--accent)':'var(--text)'}">${item.sym}</div>
      <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div><div style="font-size:12px;color:var(--muted)">${item.price}</div></div>
      <div style="width:24px;height:24px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${on?'var(--accent)':'transparent'};border:1.5px solid ${on?'var(--accent)':'var(--border)'}">
        ${on?'<i class="ti ti-check" style="font-size:15px;color:#fff"></i>':''}
      </div>
    </div>`;
  }).join('');
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">${title}</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.5">Choose which ${type==='stocks'?'stocks':'coins'} appear in your Marketplace. Tap to add or remove.</p>
    <div id="watch-editor-rows">${rows}</div>
    <div class="modal-btns" style="margin-top:16px">
      <button class="btn btn-primary" onclick="closeModal()">Done</button>
    </div>
  </div></div>`;
}

function openDeal(i){
  const p=DEALS_PRODUCTS[i];
  if(p.url){window.open(p.url,'_blank');}
  else{showToast('Link coming soon!');}
}
function openShopProduct(i){
  const p=SHOP_PRODUCTS[i];
  if(p.url){window.open(p.url,'_blank');}
  else{showToast('Coming soon — check back shortly!');}
}
function renderMarketplace(){
  const dot=document.getElementById('members-lock-dot');
  if(dot)dot.style.display=isPro()?'none':'block';
  const gate=document.getElementById('members-gate');
  const content=document.getElementById('members-content');
  if(!isPro()){if(gate)gate.style.display='flex';if(content)content.style.display='none';return;}
  if(gate)gate.style.display='none';
  if(content)content.style.display='block';

  // ── Mini stats row ──
  const statsMini=document.getElementById('members-stats-mini');
  if(statsMini){
    const rem=remaining(),saved=(C.savings?.perPaycheck||0)+currentExtraSavings();
    const diff=Math.ceil((new Date(C.endDate+'T00:00:00')-new Date())/(864e5));
    const tier=isCouplePro()?'COUPLES':'PRO';
    const col=isCouplePro()?'#ec4899':'#6366f1';
    statsMini.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:16px;font-weight:700">Members</div>
      <span style="background:${col};color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:99px;letter-spacing:.04em">${tier}</span>
    </div>
    <div style="display:flex;gap:8px">
      <div style="flex:1;background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Remaining</div>
        <div style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;color:${rem<0?'var(--red)':rem<200?'var(--amber)':'var(--green)'}">${fmt(rem)}</div>
      </div>
      <div style="flex:1;background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Saved</div>
        <div style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--green)">${fmt(saved)}</div>
      </div>
      <div style="flex:1;background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Days left</div>
        <div style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;color:${diff<=3?'var(--amber)':'var(--text)'}">${diff>0?diff:0}</div>
      </div>
    </div>`;
  }

  // ── AI Insights — collapsed hub card + expandable ──
  const insight=document.getElementById('members-insight');
  if(insight){
    const spent=totalSpent(),income=totalIncome(),rem=remaining();
    const pct=income>0?Math.round((spent/income)*100):0;
    const saved=(C.savings?.perPaycheck||0)+currentExtraSavings();
    const bills=totalBills()-paidBillsAmt();
    const signals=[];
    if(rem<0) signals.push({icon:'ti-alert-circle',col:'var(--red)',msg:`Over budget by ${fmt(Math.abs(rem))} — review your top spending buckets.`});
    else if(pct>70) signals.push({icon:'ti-alert-triangle',col:'var(--amber)',msg:`${pct}% of income spent. You\'re in the cautious zone.`});
    else signals.push({icon:'ti-circle-check',col:'var(--green)',msg:`On track — ${pct}% of income spent with ${fmt(rem)} remaining.`});
    if(bills>0) signals.push({icon:'ti-receipt-2',col:'var(--amber)',msg:`${fmt(bills)} in unpaid bills this period.`});
    if(saved===0&&income>0) signals.push({icon:'ti-pig-money',col:'var(--muted)',msg:`No savings logged this period.`});
    else if(saved>0) signals.push({icon:'ti-pig-money',col:'var(--green)',msg:`${fmt(saved)} saved this period — great habit.`});
    const allTime=allTimeSavings()+allTime401K().total+allTimeInvestments().grand;
    if(allTime>0) signals.push({icon:'ti-trending-up',col:'var(--accent)',msg:`Net worth tracked: ${fmt(allTime)}.`});
    const top=signals[0];
    const extra=signals.length-1;
    const insightBorderCol=rem<0?'var(--red)':pct>70?'var(--amber)':'var(--green)';
    insight.innerHTML=`<div style="background:var(--card);border:0.5px solid var(--border);border-left:3px solid ${insightBorderCol};border-radius:14px;padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px" onclick="toggleInsights()" style="cursor:pointer">
        <div style="width:36px;height:36px;border-radius:10px;background:#6366f118;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-sparkles" style="font-size:18px;color:var(--accent)"></i></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <i class="ti ${top.icon}" style="font-size:14px;color:${top.col};flex-shrink:0"></i>
            <span style="font-size:13px;color:var(--text);line-height:1.4">${top.msg}</span>
          </div>
          ${extra>0?`<div style="font-size:11px;color:var(--accent);margin-top:2px">+${extra} more insight${extra!==1?'s':''} — tap to expand</div>`:''}
        </div>
        <i class="ti ti-chevron-down" id="insights-chevron" style="font-size:16px;color:var(--muted);flex-shrink:0;transition:transform .2s"></i>
      </div>
      <div id="insights-expanded" style="display:none;margin-top:12px;border-top:0.5px solid var(--border);padding-top:10px">
        ${signals.slice(1).map(s=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:0.5px solid var(--border)">
          <i class="ti ${s.icon}" style="font-size:15px;color:${s.col};flex-shrink:0;margin-top:1px"></i>
          <span style="font-size:13px;line-height:1.5;color:var(--text)">${s.msg}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  // ── Net Worth card ──
  const nwCard=document.getElementById('members-networth');
  if(nwCard){
    const savingsTotal=allTimeSavings();
    const k401Total=allTime401K().total;
    const investTotal=allTimeInvestments().grand;
    const netWorth=savingsTotal+k401Total+investTotal;
    const total=savingsTotal+k401Total+investTotal||1;
    // Cycle-by-cycle net worth trend
    const allCycles=[...STATE.history,C];
    let running=0;
    const trendPts=allCycles.map(cyc=>{
      running+=((cyc.savings?.perPaycheck||0)+(cyc.savings?.extra||[]).reduce((a,e)=>a+(e.amount||0),0));
      running+=((cyc.k401?.me||0)+(cyc.k401?.emp||0));
      running+=(cyc.investments||[]).reduce((s,i)=>s+(i.amount||0),0);
      return running;
    });
    const trendMax=Math.max(...trendPts,1);
    const trendMin=Math.min(...trendPts,0);
    const range=trendMax-trendMin||1;
    const w=280,h=48;
    const pts=trendPts.map((v,i)=>`${(i/(Math.max(trendPts.length-1,1))*w).toFixed(1)},${(h-((v-trendMin)/range)*h*0.9).toFixed(1)}`).join(' ');
    const isGrowing=trendPts.length>1&&trendPts[trendPts.length-1]>trendPts[0];
    const breakdown=[
      {label:'Savings',val:savingsTotal,col:'#22c55e'},
      {label:'401k',val:k401Total,col:'#3b82f6'},
      {label:'Invested',val:investTotal,col:'#a855f7'},
    ];
    nwCard.innerHTML=`<div style="background:var(--card);border:0.5px solid var(--border);border-left:3px solid var(--accent);border-radius:16px;padding:16px;margin-bottom:4px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)">Net Worth</div>
        ${isGrowing?'<span style="font-size:11px;color:var(--green);display:flex;align-items:center;gap:3px"><i class="ti ti-trending-up" style="font-size:13px"></i> Growing</span>':''}
      </div>
      <div style="font-size:32px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.5px;color:var(--text);margin-bottom:14px">${fmt(netWorth)}</div>
      ${trendPts.length>1?`<div style="margin-bottom:14px;border-radius:8px;overflow:hidden">
        <svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block">
          <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
          <polyline points="0,${h} ${pts} ${w},${h}" fill="var(--accent)" fill-opacity="0.08"/>
        </svg>
      </div>`:''}
      <div style="display:flex;gap:0;border-radius:6px;overflow:hidden;height:6px;margin-bottom:12px">
        ${netWorth>0?breakdown.filter(b=>b.val>0).map(b=>`<div style="flex:${b.val};background:${b.col};opacity:.8"></div>`).join(''):'<div style="flex:1;background:var(--border)"></div>'}
      </div>
      <div style="display:flex;justify-content:space-between">
        ${breakdown.map(b=>`<div style="text-align:center"><div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${b.col}">${fmt(b.val)}</div><div style="font-size:10px;color:var(--muted);margin-top:1px;text-transform:uppercase;letter-spacing:.04em">${b.label}</div></div>`).join('')}
      </div>
    </div>`;
  }

  // ── Couples section ──
  const cs=document.getElementById('members-couples');
  if(cs){
    if(isCouplePro()){
      const p=getPartners();
      const linked=!!(getHouseholdId()&&p.p2);
      cs.style.display='block';
      cs.innerHTML=`<div class="section-label">Finance together</div>
        <div style="background:linear-gradient(135deg,#ec489912,#f43f5e0a);border:0.5px solid #ec489933;border-radius:14px;padding:16px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:${linked?'12px':'0'}">
            <i class="ti ti-users" style="font-size:20px;color:#ec4899;flex-shrink:0"></i>
            <div style="flex:1"><div style="font-size:14px;font-weight:600">${linked?p.p1+' & '+p.p2:'Partner sync'}</div>
            <div style="font-size:12px;color:${linked?'var(--green)':'var(--muted)'}">
              ${linked?'<i class="ti ti-circle-check" style="font-size:12px;vertical-align:-1px"></i> Live sync active':'Not linked yet — connect in Settings'}
            </div></div>
            ${!linked?'<button onclick="openPartnerSetup();closeModal&&closeModal()" style="font-size:12px;font-weight:600;color:#ec4899;background:none;border:0.5px solid #ec489944;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit">Link partner</button>':''}
          </div>
          ${linked?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="background:#ec489910;border-radius:10px;padding:10px;text-align:center">
              ${partnerAvatar('p1',24)}<div style="font-size:12px;font-weight:600;margin-top:6px">${p.p1||'You'}</div>
              <div style="font-size:11px;color:var(--muted)">${fmt((C.income||[]).filter(l=>l.owner==='p1'||!l.owner).reduce((a,l)=>a+(l.amount||0),0))} income</div>
            </div>
            <div style="background:#ec489910;border-radius:10px;padding:10px;text-align:center">
              ${partnerAvatar('p2',24)}<div style="font-size:12px;font-weight:600;margin-top:6px">${p.p2||'Partner'}</div>
              <div style="font-size:11px;color:var(--muted)">${fmt((C.income||[]).filter(l=>l.owner==='p2').reduce((a,l)=>a+(l.amount||0),0))} income</div>
            </div>
          </div>`:''}
        </div>`;
    } else {
      cs.style.display='none';
    }
  }

  // ── Hub nav cards ──
  const hubCards=document.getElementById('members-hub-cards');
  if(hubCards){
    const wl=getWatchlist();
    const topStock=MKT_STOCKS.find(s=>wl.stocks.includes(s.sym));
    const latestNews=MKT_NEWS[0];
    const readLessonsHub=getReadLessons();
    const unreadCount=MKT_LEARN.length-readLessonsHub.length;
    const liveNewsHeadline=(()=>{const c=getNewsCache();return c&&c[0]?c[0].headline:latestNews?latestNews.title:'Curated headlines';})();
    const mktAge=isMktCacheFresh()?Math.floor((Date.now()-(JSON.parse(sessionStorage.getItem('distrofi_mkt_cache')||'{}').ts||Date.now()))/60000)||'<1':null;
    const tiles=[
      {id:'markets',icon:'ti-chart-candle',color:'#3b82f6',bg:'#3b82f618',label:'Markets',sub:topStock?topStock.sym+' '+topStock.chg:'Stocks & crypto',subCol:topStock?(topStock.up?'var(--green)':'var(--red)'):'var(--muted)',badge:mktAge?mktAge+'m':null,badgeCol:'var(--muted)'},
      {id:'news',icon:'ti-news',color:'var(--accent)',bg:'#6366f118',label:'News',sub:liveNewsHeadline,subCol:'var(--muted)',badge:null},
      {id:'learn',icon:'ti-school',color:'var(--green)',bg:'#22c55e18',label:'Learn',sub:unreadCount>0?unreadCount+' unread':'All read',subCol:unreadCount>0?'var(--accent)':'var(--muted)',badge:unreadCount>0?String(unreadCount):null,badgeCol:'var(--accent)'},
      {id:'shop',icon:'ti-shopping-bag',color:'var(--amber)',bg:'#f59e0b18',label:'Shop',sub:'Templates & tools',subCol:'var(--muted)',badge:'NEW',badgeCol:'var(--amber)'},
      {id:'deals',icon:'ti-tag',color:'#ec4899',bg:'#ec489918',label:'Deals',sub:'4 partner offers',subCol:'var(--muted)',badge:'4',badgeCol:'#ec4899'},
    ];
    hubCards.innerHTML=`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:10px">
      ${tiles.map(t=>`<div onclick="showMembersView('${t.id}')" style="background:var(--card);border:0.5px solid var(--border);border-radius:16px;padding:16px;cursor:pointer;position:relative;min-height:110px;display:flex;flex-direction:column;justify-content:space-between">
        ${t.badge?`<span style="position:absolute;top:10px;right:10px;background:${t.badgeCol}22;color:${t.badgeCol};font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px">${t.badge}</span>`:''}
        <div style="width:40px;height:40px;border-radius:11px;background:${t.bg};display:flex;align-items:center;justify-content:center;margin-bottom:10px">
          <i class="ti ${t.icon}" style="font-size:22px;color:${t.color}"></i>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;margin-bottom:3px">${t.label}</div>
          <div style="font-size:11px;color:${t.subCol};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3">${t.sub}</div>
        </div>
      </div>`).join('')}
    </div>`;
    if(tiles.length%2!==0){const g=hubCards.querySelector('div>div:last-child');if(g)g.style.gridColumn='span 2';}
  }


  // ── Markets — rendered live via fetchLiveMarketData() on tab open
  renderMarketsWithData(isMktCacheFresh()?getMktCache().data:null);


  // ── News — rendered live via fetchLiveNews() on tab open
  renderNewsWithData(isNewsCacheFresh()?getNewsCache():null);

  // ── Deals ──
  const dl=document.getElementById('mkt-deals');
  if(dl){dl.innerHTML=`<div style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.5;display:flex;gap:4px;align-items:flex-start"><i class="ti ti-info-circle" style="font-size:12px;flex-shrink:0;margin-top:1px"></i> These are curated partner offers. DistroFi may earn a referral fee if you sign up. We only feature products we\'d recommend.</div>`+DEALS_PRODUCTS.map((p,i)=>`<div style="background:var(--card);border:0.5px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px">
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
      <div style="width:48px;height:48px;border-radius:13px;background:${p.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ${p.icon}" style="font-size:24px;color:${p.color}"></i></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
          <div style="font-size:15px;font-weight:700">${p.title}</div>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${p.color}18;color:${p.color}">${p.badge}</span>
        </div>
        <div style="font-size:12px;color:var(--muted)">${p.sub}</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px">${p.desc}</div>
    <button onclick="openDeal(${i})" style="width:100%;padding:12px;background:${p.color};border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
      <i class="ti ti-external-link" style="font-size:15px"></i>${p.cta}
    </button>
  </div>`).join('');}

  // ── Shop ──
  const sh=document.getElementById('mkt-shop');
  if(sh){sh.innerHTML=`<div style="font-size:11px;color:var(--muted);margin-bottom:16px;display:flex;align-items:center;gap:4px"><i class="ti ti-info-circle" style="font-size:12px"></i> Digital products — one-time purchase, instant access. Links open in browser.</div>`+SHOP_PRODUCTS.map((p,i)=>`<div style="background:var(--card);border:0.5px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px">
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      <div style="width:48px;height:48px;border-radius:13px;background:${p.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ${p.icon}" style="font-size:24px;color:${p.color}"></i></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:700">${p.title}</div>
          ${p.badge?`<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;background:${p.badge==='Bundle'?'#6366f118':'#f59e0b18'};color:${p.badge==='Bundle'?'var(--accent)':'var(--amber)'}">${p.badge}</span>`:''}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${p.sub}</div>
      </div>
      <div style="font-size:18px;font-weight:800;color:${p.color};flex-shrink:0">${p.price}</div>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px">${p.desc}</div>
    <button onclick="openShopProduct(${i})" style="width:100%;padding:12px;background:${p.url?p.color:'var(--card2)'};border:${p.url?'none':'0.5px solid var(--border)'};border-radius:12px;color:${p.url?'#fff':'var(--muted)'};font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
      <i class="ti ${p.url?'ti-external-link':'ti-clock'}" style="font-size:15px"></i>${p.url?'Get it — '+p.price:'Coming soon'}
    </button>
  </div>`).join('');}

  // ── Learn ──
  const ln=document.getElementById('mkt-learn');
  const readLessons=getReadLessons();
  if(ln)ln.innerHTML=MKT_LEARN.map((l,i)=>{const isRead=readLessons.includes(i);return`<div onclick="openMktLesson(${i})" style="background:var(--card);border-radius:14px;border:0.5px solid ${isRead?'var(--border)':'var(--border)'};padding:14px;margin-bottom:8px;cursor:pointer;opacity:${isRead?'0.8':'1'}">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:40px;height:40px;border-radius:10px;background:${isRead?'var(--card2)':'#6366f118'};display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ${isRead?'ti-check':l.icon}" style="font-size:20px;color:${isRead?'var(--muted)':'var(--accent)'}"></i></div>
      <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:${isRead?'var(--muted)':'var(--text)'}">${l.title}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${isRead?'Read':'<i class="ti ti-clock" style="font-size:11px;vertical-align:-1px"></i> '+l.mins+' read'}</div></div>
      <i class="ti ti-chevron-right" style="font-size:16px;color:var(--muted);flex-shrink:0"></i>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.5">${l.body.substring(0,100)}…</div>
  </div>`;}).join('');
}

function bigChartSVG(data,up){
  const w=300,h=120,max=Math.max(...data),min=Math.min(...data),range=(max-min)||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1)*w).toFixed(1)},${(h-((v-min)/range)*h*0.85-8).toFixed(1)}`);
  const line=pts.join(' ');
  const col=up?'#22c55e':'#ef4444';
  const area=`0,${h} ${line} ${w},${h}`;
  return`<svg width="100%" viewBox="0 0 ${w} ${h}" style="display:block"><polygon points="${area}" fill="${col}" opacity="0.08"/><polyline points="${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

const MKT_RANGES=[{label:'1D',days:1,finRes:'60'},{label:'1W',days:7,finRes:'D'},{label:'1M',days:30,finRes:'D'},{label:'3M',days:90,finRes:'D'},{label:'1Y',days:365,finRes:'W'}];
async function loadMktChart(type,i,rangeIdx){
  const s=type==='stock'?MKT_STOCKS[i]:MKT_CRYPTO[i];
  const r=MKT_RANGES[rangeIdx];
  const chartArea=document.getElementById('mkt-chart-area');
  if(!chartArea)return;
  chartArea.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:120px"><i class="ti ti-loader-2" style="font-size:24px;color:var(--muted);animation:spin 1s linear infinite"></i></div>';
  let sparkData=null;
  try{
    if(type==='stock'){
      const to=Math.floor(Date.now()/1000),from=to-r.days*24*3600;
      const res=await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${s.sym}&resolution=${r.finRes}&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
      if(res.ok){const d=await res.json();if(d.c&&d.c.length>1)sparkData=d.c;}
    }else{
      const cgId=COINGECKO_IDS[s.sym];
      if(cgId){const res=await fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${r.days}`);if(res.ok){const d=await res.json();if(d.prices&&d.prices.length>1)sparkData=d.prices.map(p=>p[1]);}}
    }
  }catch(e){sparkData=null;}
  const ca2=document.getElementById('mkt-chart-area');if(!ca2)return;
  if(sparkData&&sparkData.length>1){
    if(sparkData.length>40){const step=Math.floor(sparkData.length/40);sparkData=sparkData.filter((_,j)=>j%step===0||j===sparkData.length-1);}
    const up=sparkData[sparkData.length-1]>=sparkData[0];
    ca2.innerHTML=bigChartSVG(sparkData,up);
  }else{ca2.innerHTML=bigChartSVG(s.spark||[20,22,21,24,23,26,28,27,30],s.up);}
}
async function switchMktRange(type,i,rangeIdx){
  MKT_RANGES.forEach((_,ri)=>{const btn=document.getElementById('mkt-range-'+ri);if(btn){btn.style.background=ri===rangeIdx?'var(--accent)':'var(--card2)';btn.style.color=ri===rangeIdx?'#fff':'var(--muted)';}});
  await loadMktChart(type,i,rangeIdx);
}
async function openMktChart(type,i){
  const s=type==='stock'?MKT_STOCKS[i]:MKT_CRYPTO[i];
  const defR=1;
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div>
        <h3 style="margin:0">${s.name}</h3>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${s.sym}</div>
      </div>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:14px">
      <div style="font-size:26px;font-weight:700;font-variant-numeric:tabular-nums">${s.price}</div>
      <div style="font-size:15px;font-weight:600;color:${s.up?'var(--green)':'var(--red)'}">${s.chg}</div>
    </div>
    <div id="mkt-chart-area" style="min-height:120px"></div>
    <div style="display:flex;gap:6px;margin:14px 0 6px">
      ${MKT_RANGES.map((r,ri)=>`<div id="mkt-range-${ri}" onclick="switchMktRange('${type}',${i},${ri})" style="flex:1;text-align:center;padding:7px 0;font-size:12px;font-weight:600;border-radius:8px;cursor:pointer;background:${ri===defR?'var(--accent)':'var(--card2)'};color:${ri===defR?'#fff':'var(--muted)'}">${r.label}</div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-top:12px;line-height:1.5">Live data · refreshes every 60s</div>
  </div></div>`;
  await loadMktChart(type,i,defR);
}

function openMktNews(i){
  const n=MKT_NEWS[i];
  if(n.url){window.open(n.url,'_blank');return;}
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <span style="font-size:10px;font-weight:600;color:var(--accent);background:#6366f118;padding:3px 10px;border-radius:99px">${n.cat}</span>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <h3 style="margin-bottom:8px;line-height:1.35">${n.title}</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${n.src} · ${n.time}</div>
    <p style="font-size:14px;color:var(--text);line-height:1.7;margin-bottom:16px">${n.summary}</p>
    <button class="btn btn-ghost" style="width:100%" onclick="closeModal()">Close</button>
  </div></div>`;
}

function openMktLesson(i){markLessonRead(i);renderMarketplace();
  const l=MKT_LEARN[i];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div style="width:48px;height:48px;border-radius:12px;background:#6366f118;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ${l.icon}" style="font-size:24px;color:var(--accent)"></i></div>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <h3 style="margin-bottom:6px;line-height:1.35">${l.title}</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px"><i class="ti ti-clock" style="font-size:11px;vertical-align:-1px"></i> ${l.mins} read</div>
    <p style="font-size:14px;color:var(--text);line-height:1.7;margin-bottom:12px">${l.body}</p>
    ${l.tip?`<div style="background:#6366f110;border:0.5px solid #6366f133;border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start"><i class="ti ti-bulb" style="font-size:16px;color:var(--accent);flex-shrink:0;margin-top:1px"></i><span style="font-size:13px;line-height:1.5;color:var(--text)">${l.tip}</span></div>`:''}
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      ${l.url?`<button class="btn btn-primary" onclick="window.open('${l.url}','_blank')"><i class="ti ti-external-link" style="font-size:14px;vertical-align:-2px;margin-right:4px"></i> Read more</button>`:''}
    </div>
  </div></div>`;
}




