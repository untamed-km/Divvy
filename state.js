const DEFAULT_401K_CYCLE={me:0,emp:0};
const ICON_OPTIONS=[
  {icon:'ti-shopping-cart',label:'Shop'},{icon:'ti-gas-station',label:'Gas'},
  {icon:'ti-user',label:'Personal'},{icon:'ti-heart',label:'Health'},
  {icon:'ti-device-gamepad-2',label:'Fun'},{icon:'ti-school',label:'School'},
  {icon:'ti-paw',label:'Pet'},{icon:'ti-shirt',label:'Clothes'},
  {icon:'ti-tools',label:'Home'},{icon:'ti-plane',label:'Travel'},
  {icon:'ti-coffee',label:'Dining'},{icon:'ti-gift',label:'Gifts'},
  {icon:'ti-device-mobile',label:'Tech'},{icon:'ti-baby-carriage',label:'Kids'},
  {icon:'ti-star',label:'Other'}
];
const DEFAULT_BILLS=[];
const DEFAULT_BUCKETS={
  food:{label:'Food',icon:'ti-shopping-cart',budget:0,transactions:[]},
  gas:{label:'Gas',icon:'ti-gas-station',budget:0,transactions:[]},
  personal:{label:'Personal',icon:'ti-user',budget:0,transactions:[]}
};
const DEFAULT_INCOME=[];
const DEFAULT_SAVINGS={perPaycheck:0};
const DEFAULT_K401={me:0,emp:0,recurring:true};
const DEFAULT_INVESTMENTS=[];

function newCycleData(){
  const now=new Date(),day=now.getDate();
  let freq;try{freq=getFreq();}catch(e){freq='semimonthly';}
  let start,end;
  if(freq==='weekly'){
    const dow=now.getDay();start=new Date(now);start.setDate(now.getDate()-dow);
    end=new Date(start);end.setDate(start.getDate()+6);
  } else if(freq==='biweekly'){
    const anchor=new Date('2025-01-05');
    const daysSince=Math.floor((now-anchor)/(864e5));
    const periodsElapsed=Math.floor(daysSince/14);
    start=new Date(anchor);start.setDate(anchor.getDate()+periodsElapsed*14);
    end=new Date(start);end.setDate(start.getDate()+13);
  } else if(freq==='monthly'){
    start=new Date(now.getFullYear(),now.getMonth(),1);
    end=new Date(now.getFullYear(),now.getMonth()+1,0);
  } else {
    start=day<=15?new Date(now.getFullYear(),now.getMonth(),1):new Date(now.getFullYear(),now.getMonth(),16);
    end=day<=15?new Date(now.getFullYear(),now.getMonth(),15):new Date(now.getFullYear(),now.getMonth()+1,0);
  }
  return{id:Date.now(),startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),
    income:JSON.parse(JSON.stringify(DEFAULT_INCOME)),bills:JSON.parse(JSON.stringify(DEFAULT_BILLS)),
    buckets:JSON.parse(JSON.stringify(DEFAULT_BUCKETS)),savings:{...DEFAULT_SAVINGS,extra:[]},
    savingsBuckets:[],k401:{...DEFAULT_K401},investments:JSON.parse(JSON.stringify(DEFAULT_INVESTMENTS))};
}
function loadState(){try{const r=localStorage.getItem('distrofi_app');if(r){const s=JSON.parse(r);if(!s.savingsBuckets)s.savingsBuckets=[];if(!s.invGoals)s.invGoals=[];if(!s.partners)s.partners={p1:'You',p2:''};return s;}}catch(e){}return{current:newCycleData(),history:[],savingsBuckets:[],invGoals:[],partners:{p1:'You',p2:''}};}

function getPartners(){return STATE.partners||(STATE.partners={p1:'You',p2:''});}
function p1Name(){return getPartners().p1||'You';}
function p2Name(){return getPartners().p2||'Partner';}
function partnerColor(id){return id==='p1'?'#6366f1':'#ec4899';}
function partnerInitial(id){const n=id==='p1'?p1Name():p2Name();return n.charAt(0).toUpperCase();}
function partnerAvatar(id,size){const s=size||22;return `<span class="partner-avatar" style="background:${partnerColor(id)};width:${s}px;height:${s}px">${partnerInitial(id)}</span>`;}
const FREQ_OPTIONS=[
  {id:'weekly',label:'Weekly',days:7},
  {id:'biweekly',label:'Every 2 weeks',days:14},
  {id:'semimonthly',label:'Twice a month',days:null},
  {id:'monthly',label:'Monthly',days:null},
];
function getFreq(){return STATE.payFrequency||'semimonthly';}
function setFreq(f){STATE.payFrequency=f;saveState();}
function freqLabel(){return FREQ_OPTIONS.find(o=>o.id===getFreq())?.label||'Twice a month';}
function savingsFreqLabel(){const m={weekly:'per week',biweekly:'per paycheck',semimonthly:'per paycheck',monthly:'per month'};return m[getFreq()]||'per paycheck';}

// ── Supabase ─────────────────────────────────────────────────────────
const SUPA_URL='https://lvpslwmodbhenxcnaifk.supabase.co';
const SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cHNsd21vZGJoZW54Y25haWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk2OTIsImV4cCI6MjA5NjE1NTY5Mn0.Ne-NWRI5Y0ZuLJJAP08cUvitfS3-XYv_g4uyc_PWj0Y';
let _sb=null;
function getSB(){if(!_sb&&window.supabase){_sb=window.supabase.createClient(SUPA_URL,SUPA_KEY);}return _sb;}

// ── Household / partner sync ──────────────────────────────────────────
let _householdId=null;
let _realtimeChannel=null;
function getHouseholdId(){return _householdId||localStorage.getItem('distrofi_household')||null;}
function setHouseholdId(id){_householdId=id;if(id)localStorage.setItem('distrofi_household',id);else localStorage.removeItem('distrofi_household');}

async function resolveHousehold(userId){
  const sb=getSB();if(!sb||!userId)return null;
  const{data,error}=await sb.from('households').select('id,status,user1_id,user2_id').or(`user1_id.eq.${userId},user2_id.eq.${userId}`).eq('status','active').maybeSingle();
  if(error||!data)return null;
  setHouseholdId(data.id);
  return data.id;
}

function generateCode(){return Math.random().toString(36).substring(2,8).toUpperCase();}

async function createInviteCode(){
  const sb=getSB();if(!sb)return null;
  const{data:{user}}=await sb.auth.getUser();if(!user)return null;
  // Remove any existing pending household for this user
  await sb.from('households').delete().eq('user1_id',user.id).eq('status','pending');
  const code=generateCode();
  const{data,error}=await sb.from('households').insert({user1_id:user.id,invite_code:code,status:'pending'}).select('id,invite_code').single();
  if(error){console.warn('Invite error:',error.message);return null;}
  return data;
}

async function acceptInviteCode(code){
  const sb=getSB();if(!sb)return{ok:false,msg:'Not connected'};
  const{data:{user}}=await sb.auth.getUser();if(!user)return{ok:false,msg:'Not logged in'};
  // Find the household by code
  const{data:hh,error:fe}=await sb.from('households').select('id,user1_id,status').eq('invite_code',code.toUpperCase()).maybeSingle();
  if(fe||!hh)return{ok:false,msg:'Code not found. Check and try again.'};
  if(hh.status==='active')return{ok:false,msg:'This code has already been used.'};
  if(hh.user1_id===user.id)return{ok:false,msg:"That's your own invite code."};
  // Link user2 and activate
  const{error:ue}=await sb.from('households').update({user2_id:user.id,status:'active'}).eq('id',hh.id);
  if(ue)return{ok:false,msg:'Could not link accounts. Try again.'};
  setHouseholdId(hh.id);
  // Push current state as shared state
  await sb.from('app_state').upsert({user_id:user.id,household_id:hh.id,state_json:STATE,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  subscribeRealtime(hh.id);
  return{ok:true};
}

async function leaveHousehold(){
  const sb=getSB();if(!sb)return;
  const hid=getHouseholdId();if(!hid)return;
  const{data:{user}}=await sb.auth.getUser();if(!user)return;
  await sb.from('households').update({status:'left'}).eq('id',hid);
  setHouseholdId(null);
  if(_realtimeChannel){sb.removeChannel(_realtimeChannel);_realtimeChannel=null;}
  STATE.partners={p1:STATE.partners?.p1||'You',p2:''};
  saveState();render();
}

function subscribeRealtime(householdId){
  const sb=getSB();if(!sb||!householdId)return;
  if(_realtimeChannel)sb.removeChannel(_realtimeChannel);
  _realtimeChannel=sb.channel('household:'+householdId)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_state',filter:`household_id=eq.${householdId}`},payload=>{
      const incoming=payload.new?.state_json;
      if(!incoming)return;
      // Only update if newer
      const cur=JSON.parse(localStorage.getItem('distrofi_app')||'{}');
      if(!cur.lastUpdated||incoming.lastUpdated>cur.lastUpdated){
        Object.assign(STATE,incoming);
        try{localStorage.setItem('distrofi_app',JSON.stringify(STATE));}catch(e){}
        render();showToast("Partner updated the budget",2500);
      }
    })
    .subscribe();
}

// Sync status dot
function setSyncStatus(status){
  const dot=document.getElementById('sync-dot');
  if(!dot)return;
  const colors={synced:'#22c55e',syncing:'#f59e0b',offline:'#6b7280',error:'#ef4444'};
  dot.style.display='block';
  dot.style.background=colors[status]||colors.offline;
  dot.title=status==='synced'?'Synced':status==='syncing'?'Syncing…':status==='error'?'Sync error':'Offline';
}

// Debounced cloud push
let _syncTimer=null;
function scheduleSyncPush(){
  clearTimeout(_syncTimer);
  setSyncStatus('syncing');
  _syncTimer=setTimeout(async()=>{
    const sb=getSB();if(!sb)return;
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(!user){setSyncStatus('offline');return;}
      const hid=getHouseholdId();
      const stateWithTs={...STATE,lastUpdated:new Date().toISOString()};
      const row={user_id:user.id,state_json:stateWithTs,updated_at:new Date().toISOString()};
      if(hid)row.household_id=hid;
      const {error}=await sb.from('app_state').upsert(row,{onConflict:'user_id'});
      if(error){console.warn('Sync error:',error.message);setSyncStatus('error');}
      else setSyncStatus('synced');
    }catch(e){setSyncStatus('offline');}
  },800);
}

function saveState(){
  try{localStorage.setItem('distrofi_app',JSON.stringify(STATE));}catch(e){}
  scheduleSyncPush();
}

async function initHousehold(userId){
  const hid=await resolveHousehold(userId);
  if(hid){
    // Pull shared state
    const sb=getSB();
    const{data}=await sb.from('app_state').select('state_json').eq('household_id',hid).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(data?.state_json){
      Object.assign(STATE,data.state_json);
      try{localStorage.setItem('distrofi_app',JSON.stringify(STATE));}catch(e){}
    }
    subscribeRealtime(hid);
  }
}

// ── Pro state ──
const PRO_KEY='distrofi_pro';
const USAGE_KEY='distrofi_usage';
// tier: null | 'solo' | 'couples'
function getProData(){try{return JSON.parse(localStorage.getItem(PRO_KEY)||'{}');}catch(e){return{};}}
// Pro status now driven by Supabase profiles.pro_tier — cached in auth object
function isPro(){const a=getAuth();return !!(a?.pro_tier)||(getProData().active===true);}
function isCouplePro(){const a=getAuth();const tier=a?.pro_tier||(getProData().active?getProData().tier:null);return tier==='couples';}
function activatePro(tier){
  const t=tier||'solo';
  const now=new Date().toISOString();
  // Update local cache
  const a=getAuth();if(a){setAuth({...a,pro_tier:t});}
  localStorage.setItem(PRO_KEY,JSON.stringify({active:true,tier:t,since:now}));
  // Persist to Supabase — write pro_tier + pro_since (only set pro_since once)
  const sb=getSB();
  if(sb){
    sb.auth.getUser().then(({data})=>{
      if(!data?.user)return;
      // Check if pro_since already set so we don't overwrite original upgrade date
      sb.from('profiles').select('pro_since').eq('id',data.user.id).maybeSingle().then(({data:prof})=>{
        const update={pro_tier:t};
        if(!prof?.pro_since)update.pro_since=now;
        sb.from('profiles').update(update).eq('id',data.user.id).then(()=>{});
      });
    });
  }
  render();
}
function deactivatePro(){
  const a=getAuth();if(a){setAuth({...a,pro_tier:null});}
  localStorage.removeItem(PRO_KEY);
  // Clear pro_tier in Supabase (keep pro_since for history)
  const sb=getSB();
  if(sb){
    sb.auth.getUser().then(({data})=>{
      if(!data?.user)return;
      sb.from('profiles').update({pro_tier:null}).eq('id',data.user.id).then(()=>{});
    });
  }
  render();
}
function getUsage(){try{return JSON.parse(localStorage.getItem(USAGE_KEY)||'{}')}catch(e){return{}}}
function setUsage(u){localStorage.setItem(USAGE_KEY,JSON.stringify(u));}
function hasUsedTrial(feature){return getUsage()[feature]===true;}
function markTrialUsed(feature){const u=getUsage();u[feature]=true;setUsage(u);}

// Pro Solo features: advisor, trends, invgoals, export, watchlist
// Pro Couples features: partner sync (future) — partner UI is free for now
// Free: everything core, unlimited quantities
function gateFeature(feature){
  const FEATURE_LABELS={advisor:'AI Advisor',invgoals:'Investment Goals',export:'Data Export',trends:'Spending Trends',partner:'Partner features',partnersync:'Partner sync'};
  const label=FEATURE_LABELS[feature]||'this feature';
  if(feature==='partner'||feature==='partnersync'){
    if(isCouplePro())return true;
    if(!hasUsedTrial(feature)){markTrialUsed(feature);showToast('Free preview: '+label+' — upgrade to keep access',3500);return true;}
    openPaywall(feature);return false;
  }
  if(isPro())return true;
  if(!hasUsedTrial(feature)){markTrialUsed(feature);showToast('Free preview: '+label+' — upgrade to keep access',3500);return true;}
  openPaywall(feature);return false;
}

// All core quantities are unlimited on free tier
function checkLimit(feature,currentCount){
  return true; // No quantity limits — free tier is unlimited core
}

let STATE=loadState(),C=STATE.current,selectedIcon='ti-star';
// Pre-paint: set cycle title from state immediately so "Loading..." never shows
(function(){const el=document.getElementById('cycle-title');if(el&&C&&C.startDate&&C.endDate){const fd=s=>new Date(s+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});el.textContent=fd(C.startDate)+' – '+fd(C.endDate);}})();

// Apply saved theme immediately
(function(){
  const t=localStorage.getItem('distrofi_theme');
  if(t==='light')document.documentElement.classList.add('light');
  else if(t==='dark')document.documentElement.classList.add('dark');
})();

const CURRENCIES=[
  {code:'USD',symbol:'$',locale:'en-US',label:'USD — US Dollar ($)'},
  {code:'EUR',symbol:'€',locale:'de-DE',label:'EUR — Euro (€)'},
  {code:'GBP',symbol:'£',locale:'en-GB',label:'GBP — British Pound (£)'},
  {code:'CAD',symbol:'CA$',locale:'en-CA',label:'CAD — Canadian Dollar (CA$)'},
  {code:'AUD',symbol:'A$',locale:'en-AU',label:'AUD — Australian Dollar (A$)'},
  {code:'MXN',symbol:'MX$',locale:'es-MX',label:'MXN — Mexican Peso (MX$)'},
  {code:'JPY',symbol:'¥',locale:'ja-JP',label:'JPY — Japanese Yen (¥)',noDecimals:true},
  {code:'INR',symbol:'₹',locale:'en-IN',label:'INR — Indian Rupee (₹)'},
  {code:'BRL',symbol:'R$',locale:'pt-BR',label:'BRL — Brazilian Real (R$)'},
  {code:'CHF',symbol:'CHF',locale:'de-CH',label:'CHF — Swiss Franc (CHF)'},
];
function getCurrencyCode(){return STATE.currency||'USD';}
function getCurrencyDef(){return CURRENCIES.find(c=>c.code===getCurrencyCode())||CURRENCIES[0];}
function fmt(n){
  const c=getCurrencyDef();
  const opts={minimumFractionDigits:c.noDecimals?0:2,maximumFractionDigits:c.noDecimals?0:2};
  const num=Number(n||0).toLocaleString(c.locale,opts);
  return c.code==='EUR'||c.code==='CHF'?num+' '+c.symbol:c.symbol+num;
}
function fmtD(s){return new Date(s+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function bucketColor(p){return p>=1?'var(--red)':p>=.75?'var(--amber)':'var(--green)';}
function totalIncome(){return(C.income||[]).reduce((s,l)=>s+(l.amount||0),0);}
function billInPeriod(b){
  if(b.paid) return true;
  if(!b.dueDay) return true;
  if(!C.startDate||!C.endDate) return true;
  const start=new Date(C.startDate+'T00:00:00');
  const end=new Date(C.endDate+'T00:00:00');
  const d=b.dueDay;
  const dueInStartMonth=new Date(start.getFullYear(),start.getMonth(),d);
  if(dueInStartMonth>=start&&dueInStartMonth<=end) return true;
  const dueInEndMonth=new Date(end.getFullYear(),end.getMonth(),d);
  if(dueInEndMonth>=start&&dueInEndMonth<=end) return true;
  return false;
}
function totalBills(){
  return C.bills.reduce((a,b)=>{
    if(b.category==='subscription'){
      return a+(b.frequency==='annual'?(b.amount||0)/12:(b.amount||0));
    }
    return a+(billInPeriod(b)?b.amount||0:0);
  },0);
}
function paidBillsAmt(){
  return C.bills.filter(b=>b.paid).reduce((a,b)=>{
    if(b.category==='subscription'&&b.frequency==='annual') return a+(b.amount||0)/12;
    return a+(b.amount||0);
  },0);
}
function bucketSpent(k){return C.buckets[k]?(C.buckets[k].transactions||[]).reduce((a,t)=>a+(t.amount||0),0):0;}
function totalSpent(){return Object.keys(C.buckets).reduce((a,k)=>a+bucketSpent(k),0);}
function totalInvested(){return(C.investments||[]).reduce((s,i)=>s+(i.amount||0),0);}
function remaining(){return totalIncome()-totalBills()-(C.savings.perPaycheck)-totalSpent()-totalInvested()-currentExtraSavings()-(C.debtPayments||0);}
function allTimeSavings(){return[...STATE.history,C].reduce((s,cyc)=>s+((cyc.savings?.perPaycheck||0))+((cyc.savings?.extra||[]).reduce((a,e)=>a+(e.amount||0),0)),0);}
function currentExtraSavings(){return(C.savings.extra||[]).reduce((s,e)=>s+(e.amount||0),0);}
function allTime401K(){const all=[...STATE.history,C];const me=all.reduce((s,cyc)=>s+(cyc.k401?.me||0),0);const emp=all.reduce((s,cyc)=>s+(cyc.k401?.emp||0),0);return{me,emp,total:me+emp,periods:all.length};}
function allTimeInvestments(){const t={};[...STATE.history,C].forEach(cyc=>{(cyc.investments||[]).forEach(i=>{t[i.name]=(t[i.name]||0)+(i.amount||0);});});return{totals:t,grand:Object.values(t).reduce((a,v)=>a+v,0)};}

