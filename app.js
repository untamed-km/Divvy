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
  // Update local cache — Supabase is the source of truth after payment
  const a=getAuth();if(a){setAuth({...a,pro_tier:tier||'solo'});}
  localStorage.setItem(PRO_KEY,JSON.stringify({active:true,tier:tier||'solo',since:new Date().toISOString()}));
  render();
}
function deactivatePro(){
  const a=getAuth();if(a){setAuth({...a,pro_tier:null});}
  localStorage.removeItem(PRO_KEY);render();
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

function showScreen(name,btn){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');render();
  const fab=document.getElementById('fab-btn');
  if(fab){if(['home','spend'].includes(name)){fab.classList.remove('hidden');}else{fab.classList.add('hidden');}}
  // Close spend search when leaving
  if(name!=='spend'&&_spendSearchOpen){_spendSearchOpen=false;const bar=document.getElementById('spend-search-bar');const res=document.getElementById('spend-search-results');const don=document.getElementById('spend-donut');const bkts=document.getElementById('spend-buckets');const btn=document.getElementById('spend-search-btn');if(bar)bar.style.display='none';if(res)res.style.display='none';if(don)don.style.display='block';if(bkts)bkts.style.display='block';if(btn)btn.querySelector('i').className='ti ti-search';}
}

function openQuickAdd(){
  const bucketKeys=Object.keys(C.buckets);
  if(!bucketKeys.length){showToast('Add a spending bucket first');return;}
  const opts=bucketKeys.map(k=>`<option value="${k}">${C.buckets[k].label}</option>`).join('');
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Log expense</h3>
    <label class="modal-label">Category</label>
    <select id="qa-bucket" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:16px;font-family:inherit;margin-bottom:12px;outline:none;appearance:none">${opts}</select>
    <input type="text" id="qa-label" placeholder="Label (e.g. Publix)" autocomplete="off"/>
    <input type="number" id="qa-amount" placeholder="Amount" inputmode="decimal" step="0.01" min="0"/>
    <input type="text" id="qa-notes" placeholder="Notes (optional)" autocomplete="off"/>
    <div class="modal-btns"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitQuickAdd()">Add</button></div>
  </div></div>`;
  setTimeout(()=>document.getElementById('qa-amount').focus(),100);
}
function submitQuickAdd(){
  const key=document.getElementById('qa-bucket').value;
  const amt=parseFloat(document.getElementById('qa-amount').value);
  const lbl=document.getElementById('qa-label').value.trim();
  const notes=document.getElementById('qa-notes')?document.getElementById('qa-notes').value.trim():null;
  if(!amt||amt<=0)return;
  C.buckets[key].transactions.push({amount:amt,label:lbl||null,notes:notes||null,date:new Date().toISOString().slice(0,10)});
  saveState();closeModal();render();
}
function closeModal(){document.getElementById('modal-root').innerHTML='';}
let _toastTimer=null;
function showToast(msg,duration){
  const t=document.getElementById('df-toast');if(!t)return;
  t.textContent=msg;t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>t.classList.remove('show'),duration||2400);
}

function renderIconGrid(gid){
  const g=document.getElementById(gid);if(!g)return;
  g.innerHTML=ICON_OPTIONS.map(o=>`<div class="icon-opt ${selectedIcon===o.icon?'selected':''}" onclick="selectIcon('${o.icon}','${gid}')"><i class="ti ${o.icon}"></i><span>${o.label}</span></div>`).join('');
}
function selectIcon(icon,gid){selectedIcon=icon;renderIconGrid(gid);}

function open401KModal(){
  const k=C.k401||DEFAULT_K401;
  let _rec401k=k.recurring!==false;
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Edit 401(k)</h3>
    <span class="modal-label">Your contribution</span>
    <input type="number" id="k401-me" value="${k.me||''}" inputmode="decimal" step="0.01" min="0" placeholder="0.00"/>
    <span class="modal-label">Employer match</span>
    <input type="number" id="k401-emp" value="${k.emp||''}" inputmode="decimal" step="0.01" min="0" placeholder="0.00"/>
    <div onclick="toggle401KRecurring()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 4px;margin-top:4px;cursor:pointer">
      <div>
        <div style="font-size:15px;font-weight:500">Recurring</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">Carries forward each pay period</div>
      </div>
      <div id="k401-rec-bar" style="width:44px;height:26px;border-radius:99px;background:${_rec401k?'var(--accent)':'var(--border)'};position:relative;transition:background .2s;flex-shrink:0">
        <div id="k401-rec-knob" style="position:absolute;top:3px;left:${_rec401k?'21px':'3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s"></div>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="save401K()">Save</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('k401-me').focus(),100);
}
function toggle401KRecurring(){
  const bar=document.getElementById('k401-rec-bar');
  const knob=document.getElementById('k401-rec-knob');
  const on=knob.style.left==='3px';
  knob.style.left=on?'21px':'3px';
  bar.style.background=on?'var(--accent)':'var(--border)';
}
function save401K(){
  if(!C.k401)C.k401={...DEFAULT_K401};
  C.k401.me=parseFloat(document.getElementById('k401-me').value)||0;
  C.k401.emp=parseFloat(document.getElementById('k401-emp').value)||0;
  const knob=document.getElementById('k401-rec-knob');
  C.k401.recurring=knob?knob.style.left==='21px':true;
  saveState();closeModal();render();
}

function openNewBucketModal(){
  selectedIcon='ti-star';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Add budget</h3>
    <span class="modal-label">Category name</span>
    <input type="text" id="new-bucket-name" placeholder="e.g. Dining, Kids, Travel" autocomplete="off"/>
    <span class="modal-label">Budget amount</span>
    <input type="number" id="new-bucket-amt" placeholder="0.00" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Icon</span>
    <div class="icon-grid" id="igrid-new"></div>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewBucket()">Add</button>
    </div>
  </div></div>`;
  renderIconGrid('igrid-new');
  setTimeout(()=>document.getElementById('new-bucket-name').focus(),100);
}
function saveNewBucket(){
  const name=document.getElementById('new-bucket-name').value.trim();
  const budget=parseFloat(document.getElementById('new-bucket-amt').value)||0;
  if(!name){showToast('Please enter a category name.');return;}
  if(!checkLimit('buckets',Object.keys(C.buckets).length)){closeModal();return;}
  C.buckets['b'+Date.now()]={label:name,icon:selectedIcon,budget,transactions:[]};
  saveState();closeModal();render();
}

function openBucketModal(key){
  const b=C.buckets[key];selectedIcon=b.icon||'ti-star';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Edit ${b.label}</h3>
    <span class="modal-label">Category name</span>
    <input type="text" id="bucket-label-input" value="${b.label}" autocomplete="off"/>
    <span class="modal-label">Budget amount</span>
    <input type="number" id="bucket-budget-input" value="${b.budget||''}" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Icon</span>
    <div class="icon-grid" id="igrid-edit"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:0.5px solid var(--border);margin-top:2px">
      <div>
        <div style="font-size:14px;font-weight:500">Roll over unused budget</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Adds leftover to next period's budget</div>
      </div>
      <div id="rollover-toggle" onclick="toggleRollover()" style="width:44px;height:26px;border-radius:99px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">
        <div id="rollover-knob" style="position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s"></div>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-danger" onclick="deleteBucket('${key}')"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBucket('${key}')">Save</button>
    </div>
  </div></div>`;
  renderIconGrid('igrid-edit');
  setTimeout(()=>{initRollover(b.rollover===true);document.getElementById('bucket-label-input').focus();},100);
}
let _rolloverEnabled=false;
function initRollover(val){
  _rolloverEnabled=!!val;
  const tog=document.getElementById('rollover-toggle');
  const knob=document.getElementById('rollover-knob');
  if(tog)tog.style.background=_rolloverEnabled?'var(--accent)':'var(--border)';
  if(knob)knob.style.transform=_rolloverEnabled?'translateX(18px)':'translateX(0)';
}
function toggleRollover(){initRollover(!_rolloverEnabled);}
function saveBucket(key){
  const label=document.getElementById('bucket-label-input').value.trim();
  const budget=parseFloat(document.getElementById('bucket-budget-input').value)||0;
  if(!label)return;
  if(_rolloverEnabled&&!C.buckets[key].baseBudget) C.buckets[key].baseBudget=budget;
  if(!_rolloverEnabled) C.buckets[key].baseBudget=null;
  C.buckets[key].label=label;C.buckets[key].budget=budget;C.buckets[key].icon=selectedIcon;C.buckets[key].rollover=_rolloverEnabled;
  saveState();closeModal();render();
}
function deleteBucket(key){delete C.buckets[key];saveState();closeModal();render();}

function openIncomeModal(){
  renderIncomeModal();
}
function renderIncomeModal(){
  const lines=C.income||[];
  const INCOME_CHIPS=['Primary job','Side hustle','Partner income','Freelance','Rental income','Bonus','Other'];
  const usedLabels=new Set(lines.map(l=>l.label));
  const availableChips=INCOME_CHIPS.filter(ch=>!usedLabels.has(ch));
  const rows=lines.map((l,i)=>`
    <div style="margin-bottom:16px;background:var(--card2);border-radius:12px;padding:12px;border:0.5px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em">Source ${i+1}</div>
        <button onclick="removeIncomeLine(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px"><i class="ti ti-trash" style="font-size:16px"></i></button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input type="text" value="${l.label}" placeholder="e.g. Primary job" autocomplete="off"
          oninput="updateIncomeLabel(${i},this.value)"
          style="flex:1;padding:12px;background:var(--app-bg);border:0.5px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none"/>
        <input type="number" value="${l.amount||''}" placeholder="0.00" inputmode="decimal" step="0.01" min="0"
          oninput="updateIncomeAmount(${i},this.value)"
          style="width:100px;padding:12px;background:var(--app-bg);border:0.5px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;font-variant-numeric:tabular-nums"/>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <i class="ti ti-calendar-event" style="font-size:15px;color:var(--muted);flex-shrink:0"></i>
        <div style="font-size:12px;color:var(--muted);flex-shrink:0">Deposit date:</div>
        <input type="date" value="${l.depositDate||''}"
          oninput="updateIncomeDate(${i},this.value)"
          style="flex:1;padding:8px 10px;background:var(--app-bg);border:0.5px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none"/>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;color:var(--muted)">Carry to next period</span>
        <div onclick="updateIncomeRecurring(${i},!${l.recurring!==false})" style="width:44px;height:26px;border-radius:99px;background:${l.recurring!==false?'var(--accent)':'var(--border)'};position:relative;transition:background .2s;cursor:pointer;flex-shrink:0">
          <div style="position:absolute;top:3px;left:${l.recurring!==false?'21px':'3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s"></div>
        </div>
      </div>
    </div>`).join('');
  const chips=availableChips.length?`<div style="margin-bottom:14px">
    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Quick add</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${availableChips.map(ch=>`<button onclick="quickAddIncome('${ch}')" style="padding:6px 12px;background:var(--card2);border:0.5px solid var(--border);border-radius:99px;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit">${ch}</button>`).join('')}
    </div>
  </div>`:'';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Income sources</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.5">Enter your take-home pay for this period (after tax).</p>
    <div id="income-lines">${rows}</div>
    ${chips}
    <button onclick="addIncomeLine()" style="width:100%;padding:11px;background:var(--card2);border:0.5px dashed var(--border);border-radius:12px;color:var(--muted);font-size:14px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:14px">
      <i class="ti ti-plus" style="font-size:15px"></i> Add custom source
    </button>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveIncome()">Save</button>
    </div>
  </div></div>`;
}
function quickAddIncome(label){
  C.income.push({label,amount:0});renderIncomeModal();
  setTimeout(()=>{const inputs=document.querySelectorAll('#income-lines input[type="number"]');if(inputs.length)inputs[inputs.length-1].focus();},80);
}
function updateIncomeOwner(i,owner){if(C.income[i])C.income[i].owner=owner;renderIncomeModal();}
function updateIncomeLabel(i,val){if(C.income[i])C.income[i].label=val;}
function updateIncomeAmount(i,val){if(C.income[i])C.income[i].amount=parseFloat(val)||0;}
function updateIncomeDate(i,val){if(C.income[i])C.income[i].depositDate=val;}
function updateIncomeRecurring(i,val){if(C.income[i]){C.income[i].recurring=val;saveState();renderIncomeModal();}}
function addIncomeLine(){
  const sug=['Primary job','Side hustle','Partner income','Freelance','Rental income','Other'];
  C.income.push({label:sug[C.income.length]||'Income '+(C.income.length+1),amount:0});
  renderIncomeModal();
}
function removeIncomeLine(i){
  C.income.splice(i,1);
  renderIncomeModal();
}
function saveIncome(){
  saveState();closeModal();render();
}

function openSavingsModal(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Edit savings</h3>
    <span class="modal-label">Amount saved ${savingsFreqLabel()}</span>
    <input type="number" id="sav-input" value="${C.savings.perPaycheck||''}" inputmode="decimal" step="0.01" min="0" placeholder="0.00"/>
    <div class="modal-btns"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveSavings()">Save</button></div>
  </div></div>`;
  setTimeout(()=>document.getElementById('sav-input').focus(),100);
}
function saveSavings(){C.savings.perPaycheck=parseFloat(document.getElementById('sav-input').value)||0;saveState();closeModal();render();}


function openBillHistory(billName){
  // Gather this bill across all cycles
  const allCycles=[...STATE.history, C];
  const entries=allCycles.map(cyc=>{
    const bill=(cyc.bills||[]).find(b=>b.name===billName);
    if(!bill)return null;
    const label=cyc.startDate?new Date(cyc.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',year:'2-digit'}):'—';
    const isCurrent=cyc===C;
    return{label,paid:bill.paid,amount:bill.amount||0,dueDay:bill.dueDay,paidBy:bill.paidBy,isCurrent};
  }).filter(Boolean);

  if(!entries.length){
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal"><h3>${billName}</h3><p style="color:var(--muted);font-size:14px">No history found.</p><button class="btn btn-ghost" style="width:100%;margin-top:12px" onclick="closeModal()">Close</button></div></div>`;
    return;
  }

  const totalPaid=entries.filter(e=>e.paid).length;
  const paidPct=Math.round((totalPaid/entries.length)*100);
  const totalSpent=entries.filter(e=>e.paid).reduce((a,e)=>a+e.amount,0);
  const latestAmount=entries[entries.length-1].amount;

  const rows=entries.slice().reverse().map(e=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:0.5px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;border-radius:50%;background:${e.paid?'#22c55e22':'#ef444422'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="ti ${e.paid?'ti-check':'ti-x'}" style="font-size:13px;color:${e.paid?'var(--green)':'var(--red)'}"></i>
        </div>
        <div>
          <div style="font-size:13px;font-weight:500">${e.label}${e.isCurrent?'<span style="font-size:10px;background:#6366f118;color:var(--accent);padding:1px 6px;border-radius:99px;margin-left:6px;font-weight:600">Now</span>':''}</div>
          ${e.paidBy&&getPartners().p2?`<div style="font-size:10px;color:var(--muted);margin-top:1px">Paid by ${e.paidBy==='p1'?p1Name():p2Name()}</div>`:''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:500;font-variant-numeric:tabular-nums">${e.amount?fmt(e.amount):'—'}</div>
        <div style="font-size:10px;color:${e.paid?'var(--green)':'var(--red)'}">${e.paid?'Paid':'Unpaid'}</div>
      </div>
    </div>`).join('');

  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <h3 style="margin:0">${billName}</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="stat-card" style="text-align:center">
        <div class="label">On-time</div>
        <div class="value" style="font-size:18px;color:${paidPct>=80?'var(--green)':paidPct>=50?'var(--amber)':'var(--red)'}">${paidPct}%</div>
      </div>
      <div class="stat-card" style="text-align:center">
        <div class="label">Periods</div>
        <div class="value" style="font-size:18px">${entries.length}</div>
      </div>
      <div class="stat-card" style="text-align:center">
        <div class="label">Total paid</div>
        <div class="value" style="font-size:18px;color:var(--green)">${fmt(totalSpent)}</div>
      </div>
    </div>
    <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:16px">
      <div style="height:100%;width:${paidPct}%;background:${paidPct>=80?'var(--green)':paidPct>=50?'var(--amber)':'var(--red)'};border-radius:99px;transition:width .4s"></div>
    </div>
    ${rows}
    <button class="btn btn-ghost" style="width:100%;margin-top:16px" onclick="closeModal()">Close</button>
  </div></div>`;
}
function openBillModal(idx,defaultCategory){
  const isEdit=idx!==undefined,bill=isEdit?C.bills[idx]:{name:'',amount:0,paid:false,dueDay:null};
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'><h3 style='margin:0'>${isEdit?(bill.category==='subscription'?'Edit subscription':'Edit bill'):(defaultCategory==='subscription'?'Add subscription':'Add bill')}</h3><button onclick='closeModal()' style='background:none;border:none;color:var(--muted);cursor:pointer;padding:4px'><i class='ti ti-x' style='font-size:20px'></i></button></div><div style='display:flex;gap:8px;margin-bottom:14px'><button id='cat-bill-btn' onclick="setBillCategory('bill')" style='flex:1;padding:8px 0;border-radius:10px;border:1px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit'>Bill</button><button id='cat-sub-btn' onclick="setBillCategory('subscription')" style='flex:1;padding:8px 0;border-radius:10px;border:1px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit'>Subscription</button></div><div id='freq-row' style='display:none;margin-bottom:14px'><div style='font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px'>Billing frequency</div><div style='display:flex;gap:8px'><button id='freq-monthly-btn' onclick="setBillFreq('monthly')" style='flex:1;padding:8px 0;border-radius:10px;border:1px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit'>Monthly</button><button id='freq-annual-btn' onclick="setBillFreq('annual')" style='flex:1;padding:8px 0;border-radius:10px;border:1px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit'>Annual</button></div><div id='freq-hint' style='font-size:11px;color:var(--muted);margin-top:6px;display:none'></div></div><span class="modal-label">Bill name</span>
    <input type="text" id="bill-name-input" placeholder="e.g. Rent, Netflix" value="${bill.name}" autocomplete="off"/>
    <span class="modal-label">Amount</span>
    <input type="number" id="bill-amount-input" placeholder="0.00 (leave blank if unknown)" value="${bill.amount||''}" inputmode="decimal" step="0.01" min="0" oninput="if(_billFreq==='annual'){const h=document.getElementById('freq-hint');if(h&&this.value){h.textContent='≈ $'+(parseFloat(this.value)/12).toFixed(2)+'/mo toward your budget';h.style.display='block';}else if(h)h.style.display='none';}"/>
    <span class="modal-label">Due date (day of month)</span>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:14px" id="day-picker"></div>
    <div id="recurring-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:0.5px solid var(--border);margin-bottom:14px">
      <div>
        <div style="font-size:14px;font-weight:500">Recurring each cycle</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Carries forward when you start a new pay period</div>
      </div>
      <div id="recurring-toggle" onclick="toggleRecurring()" style="width:44px;height:26px;border-radius:99px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">
        <div id="recurring-knob" style="position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s"></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 0 14px">
      <div>
        <div style="font-size:14px;font-weight:500">High priority</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">Sorts to top · shown with amber indicator</div>
      </div>
      <div id="priority-toggle" onclick="togglePriority()" style="width:44px;height:26px;border-radius:99px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">
        <div id="priority-knob" style="position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s"></div>
      </div>
    </div>
    <div class="modal-btns">
      ${isEdit?`<button class="btn btn-danger" onclick="deleteBill(${idx})"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBill(${isEdit?idx:'null'})">${isEdit?'Save':'Add'}</button>
    </div>
  </div></div>`;
  renderDayPicker(bill.dueDay);
  setTimeout(()=>{
    initRecurring(bill.recurring!==false);
    initPriority(bill.priority==='high');
    document.getElementById('bill-name-input').focus();
    const initCat=isEdit?(bill.category||'bill'):(defaultCategory||'bill');
    const initFreq=isEdit?(bill.frequency||'monthly'):'monthly';
    _billCategory=initCat;_billFreq=initFreq;
    setBillCategory(initCat);
    setBillFreq(initFreq);
  },100);
}
let _selectedDay=null;
function renderDayPicker(current){
  _selectedDay=current||null;
  const grid=document.getElementById('day-picker');
  if(!grid)return;
  let html='';
  for(let d=1;d<=31;d++){
    const sel=_selectedDay===d;
    html+=`<div onclick="selectDay(${d})" style="padding:8px 0;text-align:center;border-radius:8px;font-size:13px;cursor:pointer;border:1.5px solid ${sel?'var(--accent)':'var(--border)'};background:${sel?'#6366f118':'var(--card2)'};color:${sel?'var(--accent)':'var(--muted)'};font-weight:${sel?'600':'400'}">${d}</div>`;
  }
  // "None" option
  html+=`<div onclick="selectDay(null)" style="padding:8px 0;text-align:center;border-radius:8px;font-size:11px;cursor:pointer;border:1.5px solid ${_selectedDay===null?'var(--accent)':'var(--border)'};background:${_selectedDay===null?'#6366f118':'var(--card2)'};color:${_selectedDay===null?'var(--accent)':'var(--muted)'};grid-column:span 2">None</div>`;
  grid.innerHTML=html;
}
function selectDay(d){_selectedDay=d;renderDayPicker(d);}
let _priorityHigh=false;
function initPriority(val){
  _priorityHigh=!!val;
  const tog=document.getElementById('priority-toggle');
  const knob=document.getElementById('priority-knob');
  if(tog)tog.style.background=_priorityHigh?'var(--amber)':'var(--border)';
  if(knob)knob.style.transform=_priorityHigh?'translateX(18px)':'translateX(0)';
}
function togglePriority(){initPriority(!_priorityHigh);}
let _recurringBill=true;
function initRecurring(val){
  _recurringBill=val!==false;
  const tog=document.getElementById('recurring-toggle');
  const knob=document.getElementById('recurring-knob');
  if(tog)tog.style.background=_recurringBill?'var(--accent)':'var(--border)';
  if(knob)knob.style.transform=_recurringBill?'translateX(18px)':'translateX(0)';
}
function toggleRecurring(){initRecurring(!_recurringBill);}
let _billCategory='bill',_billFreq='monthly';
function setBillCategory(cat){
  _billCategory=cat;
  const bb=document.getElementById('cat-bill-btn'),sb=document.getElementById('cat-sub-btn');
  const on='#6366f115',onBorder='#6366f150',onColor='#a5b4fc';
  const off='transparent',offBorder='var(--border)',offColor='var(--muted)';
  if(bb){bb.style.background=cat==='bill'?on:off;bb.style.borderColor=cat==='bill'?onBorder:offBorder;bb.style.color=cat==='bill'?onColor:offColor;}
  if(sb){sb.style.background=cat==='subscription'?on:off;sb.style.borderColor=cat==='subscription'?onBorder:offBorder;sb.style.color=cat==='subscription'?onColor:offColor;}
  const freqRow=document.getElementById('freq-row');
  if(freqRow)freqRow.style.display=cat==='subscription'?'block':'none';
  const recRow=document.getElementById('recurring-row');
  if(recRow)recRow.style.display=cat==='subscription'?'none':'flex';
}
function setBillFreq(freq){
  _billFreq=freq;
  const mb=document.getElementById('freq-monthly-btn'),ab=document.getElementById('freq-annual-btn');
  const on='#6366f115',onBorder='#6366f150',onColor='#a5b4fc';
  const off='transparent',offBorder='var(--border)',offColor='var(--muted)';
  if(mb){mb.style.background=freq==='monthly'?on:off;mb.style.borderColor=freq==='monthly'?onBorder:offBorder;mb.style.color=freq==='monthly'?onColor:offColor;}
  if(ab){ab.style.background=freq==='annual'?on:off;ab.style.borderColor=freq==='annual'?onBorder:offBorder;ab.style.color=freq==='annual'?onColor:offColor;}
  const hint=document.getElementById('freq-hint');
  const amtEl=document.getElementById('bill-amount-input');
  const amt=amtEl?parseFloat(amtEl.value)||0:0;
  if(hint&&freq==='annual'&&amt>0){hint.textContent='≈ $'+(amt/12).toFixed(2)+'/mo toward your budget';hint.style.display='block';}
  else if(hint){hint.style.display='none';}
}
function saveBill(idx){
  const name=document.getElementById('bill-name-input').value.trim();
  const amount=parseFloat(document.getElementById('bill-amount-input').value)||0;
  if(!name)return;
  const cat=_billCategory||'bill';
  const freq=_billFreq||'monthly';
  if(idx===null||idx==='null')C.bills.push({name,amount,paid:false,dueDay:_selectedDay,recurring:cat==='subscription'?true:_recurringBill,priority:_priorityHigh?'high':null,sortOrder:Date.now(),category:cat,frequency:freq});
  else{
    const cat=_billCategory||'bill';
    const freq=_billFreq||'monthly';
    C.bills[idx].name=name;C.bills[idx].amount=amount;C.bills[idx].dueDay=_selectedDay;
    C.bills[idx].recurring=cat==='subscription'?true:_recurringBill;
    C.bills[idx].priority=_priorityHigh?'high':null;
    C.bills[idx].category=cat;C.bills[idx].frequency=freq;
  }
  saveState();closeModal();render();
}
function deleteBill(idx){C.bills.splice(idx,1);saveState();closeModal();render();}
let _justPaidBill=null;
function toggleBill(i){
  const bill=C.bills[i];
  if(!bill.paid&&getPartners().p2){
    // Ask who paid when marking as paid
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this){C.bills[${i}].paid=true;saveState();closeModal();render();}"><div class="modal" style="padding-bottom:20px">
      <h3 style="margin-bottom:6px">Who paid ${bill.name}?</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Tap to record who covered this bill.</p>
      <div style="display:flex;gap:12px;margin-bottom:14px">
        <button onclick="markBillPaid(${i},'p1')" style="flex:1;padding:20px 16px;border-radius:16px;border:none;background:#6366f118;border:1.5px solid #6366f144;cursor:pointer;font-family:inherit;transition:background .15s" onmouseenter="this.style.background='#6366f130'" onmouseleave="this.style.background='#6366f118'">
          <div style="width:44px;height:44px;border-radius:50%;background:#6366f133;display:flex;align-items:center;justify-content:center;margin:0 auto 10px"><span style="font-size:20px;font-weight:800;color:#6366f1">${p1Name().charAt(0).toUpperCase()}</span></div>
          <div style="font-size:15px;font-weight:600;color:var(--text)">${p1Name()}</div>
        </button>
        <button onclick="markBillPaid(${i},'p2')" style="flex:1;padding:20px 16px;border-radius:16px;border:none;background:#ec489918;border:1.5px solid #ec489944;cursor:pointer;font-family:inherit;transition:background .15s" onmouseenter="this.style.background='#ec489930'" onmouseleave="this.style.background='#ec489918'">
          <div style="width:44px;height:44px;border-radius:50%;background:#ec489933;display:flex;align-items:center;justify-content:center;margin:0 auto 10px"><span style="font-size:20px;font-weight:800;color:#ec4899">${p2Name().charAt(0).toUpperCase()}</span></div>
          <div style="font-size:15px;font-weight:600;color:var(--text)">${p2Name()}</div>
        </button>
      </div>
      <button onclick="markBillPaid(${i},null)" style="width:100%;padding:10px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit">
        Mark paid without assigning
      </button>
    </div></div>`;
  } else {
    const goingPaid=!bill.paid;
    bill.paid=!bill.paid;
    if(!bill.paid) bill.paidBy=null;
    if(goingPaid) _justPaidBill=i;
    saveState();render();
  }
}
function markBillPaid(i,who){
  C.bills[i].paid=true;
  C.bills[i].paidBy=who;
  _justPaidBill=i;
  saveState();closeModal();render();
}

function openInvModal(idx){
  const isEdit=idx!==undefined,inv=isEdit?C.investments[idx]:{name:'',ticker:'',amount:0,recurring:true,goalIdx:null};
  const goals=STATE.invGoals||[];
  const goalOpts=goals.length?`
    <span class="modal-label">Allocate to goal (optional)</span>
    <select id="inv-goal-select" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-family:inherit;margin-bottom:12px;outline:none;appearance:none">
      <option value="">— No goal —</option>
      ${goals.map((g,gi)=>`<option value="${gi}" ${inv.goalIdx===gi?'selected':''}>${g.name}${g.goal?' ('+fmt(g.saved||0)+' / '+fmt(g.goal)+')':''}</option>`).join('')}
    </select>`:'';
  let _recurringInv=inv.recurring!==false;
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>${isEdit?'Edit investment':'Add investment'}</h3>
    <input type="text" id="inv-name-input" placeholder="Name (e.g. Robinhood, Fidelity)" value="${inv.name}" autocomplete="off"/>
    <input type="text" id="inv-ticker-input" placeholder="Ticker symbol (e.g. AAPL, BTC — optional)" value="${inv.ticker||''}" autocomplete="off" style="text-transform:uppercase"/>
    <input type="number" id="inv-amount-input" placeholder="Amount this period" value="${inv.amount||''}" inputmode="decimal" step="0.01" min="0"/>
    ${goalOpts}
    <div onclick="toggleRecurringInv()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 4px;margin-bottom:8px;cursor:pointer">
      <div>
        <div style="font-size:15px;font-weight:500">Recurring</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">Carries forward each pay period</div>
      </div>
      <div id="recurring-inv-toggle" style="width:44px;height:26px;border-radius:99px;background:${_recurringInv?'var(--accent)':'var(--border)'};position:relative;transition:background .2s;flex-shrink:0">
        <div id="recurring-inv-knob" style="position:absolute;top:3px;left:${_recurringInv?'21px':'3px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s"></div>
      </div>
    </div>
    <div class="modal-btns">
      ${isEdit?`<button class="btn btn-danger" onclick="deleteInv(${idx})"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveInv(${isEdit?idx:'null'})">${isEdit?'Save':'Add'}</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('inv-name-input').focus(),100);
}
function toggleRecurringInv(){
  const t=document.getElementById('recurring-inv-toggle');
  const k=document.getElementById('recurring-inv-knob');
  const on=k.style.left==='3px';
  k.style.left=on?'21px':'3px';
  t.style.background=on?'var(--accent)':'var(--border)';
}
function saveInv(idx){
  const name=document.getElementById('inv-name-input').value.trim();
  const ticker=document.getElementById('inv-ticker-input').value.trim().toUpperCase();
  const amount=parseFloat(document.getElementById('inv-amount-input').value)||0;
  const knob=document.getElementById('recurring-inv-knob');
  const recurring=knob?knob.style.left==='21px':true;
  const goalSel=document.getElementById('inv-goal-select');
  const goalIdx=goalSel&&goalSel.value!==''?parseInt(goalSel.value):null;
  if(!name)return;
  if(idx===null||idx==='null'){
    C.investments.push({name,ticker,amount,recurring,goalIdx});
  } else {
    C.investments[idx].name=name;
    C.investments[idx].ticker=ticker;
    C.investments[idx].amount=amount;
    C.investments[idx].recurring=recurring;
    if(goalIdx!==null)C.investments[idx].goalIdx=goalIdx;
  }
  saveState();closeModal();render();
}
function deleteInv(idx){
  const inv=C.investments[idx];
  if(inv&&inv.goalIdx!=null&&STATE.invGoals&&STATE.invGoals[inv.goalIdx]){
    STATE.invGoals[inv.goalIdx].saved=Math.max(0,(STATE.invGoals[inv.goalIdx].saved||0)-(inv.amount||0));
  }
  C.investments.splice(idx,1);saveState();closeModal();render();
}


function openEditTxnModal(bk, idx){
  const t=C.buckets[bk].transactions[idx];
  if(!t)return;
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Edit expense</h3>
    <input type="text" id="etxn-label" placeholder="Label (e.g. Publix)" value="${t.label||''}" autocomplete="off"/>
    <input type="number" id="etxn-amount" placeholder="Amount" value="${t.amount||''}" inputmode="decimal" step="0.01" min="0"/>
    <input type="text" id="etxn-notes" placeholder="Notes (optional)" value="${t.notes||''}" autocomplete="off"/>
    <div class="modal-btns">
      <button class="btn btn-danger" onclick="deleteTransaction('${bk}',${idx})"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="updateTransaction('${bk}',${idx})">Save</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('etxn-amount').focus(),100);
}
function updateTransaction(bk, idx){
  const amt=parseFloat(document.getElementById('etxn-amount').value);
  const lbl=document.getElementById('etxn-label').value.trim();
  const notes=document.getElementById('etxn-notes').value.trim();
  if(!amt||amt<=0)return;
  C.buckets[bk].transactions[idx].amount=amt;
  C.buckets[bk].transactions[idx].label=lbl||null;
  C.buckets[bk].transactions[idx].notes=notes||null;
  saveState();closeModal();render();
}
function deleteTransaction(bk, idx){
  C.buckets[bk].transactions.splice(idx,1);
  saveState();closeModal();render();
}

function openAllTransactions(bk){
  const b=C.buckets[bk];
  if(!b)return;
  const allTxns=[...b.transactions].reverse(); // newest first
  const total=allTxns.reduce((a,t)=>a+(t.amount||0),0);

  const rows=allTxns.length
    ? allTxns.map((t,ri)=>{
        const actualIdx=b.transactions.length-1-ri;
        return `<div onclick="openEditTxnModal('${bk}',${actualIdx});setTimeout(()=>openAllTransactions('${bk}'),50)" style="display:flex;flex-direction:column;gap:2px;padding:10px 14px;border-bottom:0.5px solid var(--border);cursor:pointer;transition:background .15s" onmouseenter="this.style.background='var(--card2)'" onmouseleave="this.style.background=''">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label||'Purchase'}</span>
            <span style="font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;padding-left:12px;flex-shrink:0;display:flex;align-items:center;gap:6px">${fmt(t.amount)}<i class="ti ti-pencil" style="font-size:11px;color:var(--muted);opacity:.6"></i></span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;color:var(--muted)">${t.date||''}${t.notes?` · ${t.notes}`:''}</span>
          </div>
        </div>`;
      }).join('')
    : '<div style="text-align:center;color:var(--muted);font-size:14px;padding:32px 0">No transactions yet</div>';

  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="padding:0;max-height:88vh;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 18px 14px;border-bottom:0.5px solid var(--border);flex-shrink:0">
      <div>
        <h3 style="margin:0;font-size:17px"><i class="ti ${b.icon}" style="font-size:17px;vertical-align:-2px;margin-right:8px;color:var(--accent)"></i>${b.label}</h3>
        <div style="font-size:12px;color:var(--muted);margin-top:3px">${allTxns.length} transaction${allTxns.length!==1?'s':''} · ${fmt(total)} total</div>
      </div>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="overflow-y:auto;flex:1">${rows}</div>
    <div style="padding:14px;border-top:0.5px solid var(--border);flex-shrink:0;display:flex;gap:8px">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal();openAddModal('${bk}')"><i class="ti ti-plus" style="font-size:15px;vertical-align:-2px"></i> Log expense</button>
    </div>
  </div></div>`;
}
function openAddModal(bk){
  const b=C.buckets[bk];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Log ${b.label} expense</h3>
    <input type="text" id="modal-label" placeholder="Label (e.g. Publix)" autocomplete="off"/>
    <input type="number" id="modal-amount" placeholder="Amount" inputmode="decimal" step="0.01" min="0"/>
    <input type="text" id="modal-notes" placeholder="Notes (optional)" autocomplete="off"/>
    <div class="modal-btns"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="addTransaction('${bk}')">Add</button></div>
  </div></div>`;
  setTimeout(()=>document.getElementById('modal-amount').focus(),100);
}
function addTransaction(key){
  const amt=parseFloat(document.getElementById('modal-amount').value);
  const lbl=document.getElementById('modal-label').value.trim();
  const notes=document.getElementById('modal-notes')?document.getElementById('modal-notes').value.trim():null;
  if(!amt||amt<=0)return;
  C.buckets[key].transactions.push({amount:amt,label:lbl||null,notes:notes||null,date:new Date().toISOString().slice(0,10)});
  saveState();closeModal();render();
}


function openSavingsBucketModal(idx){
  const isEdit=idx!==undefined;
  const bkt=isEdit?(STATE.savingsBuckets||[])[idx]:{name:'',goal:0,saved:0,color:'green'};
  const colors=[
    {id:'green',label:'Green',bg:'#16a34a22',fg:'var(--green)'},
    {id:'blue',label:'Blue',bg:'#3b82f622',fg:'var(--blue)'},
    {id:'purple',label:'Purple',bg:'#a855f722',fg:'var(--purple)'},
    {id:'amber',label:'Amber',bg:'#f59e0b22',fg:'var(--amber)'},
    {id:'red',label:'Red',bg:'#ef444422',fg:'var(--red)'},
  ];
  const colorMap={green:'var(--green)',blue:'var(--blue)',purple:'var(--purple)',amber:'var(--amber)',red:'var(--red)'};
  let selColor=bkt.color||'green';
  const colorPicker=colors.map(c=>`<div id="cpick-${c.id}" onclick="selectSavColor('${c.id}')" style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:2px solid ${selColor===c.id?colorMap[c.id]:'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center"><div style="width:14px;height:14px;border-radius:50%;background:${colorMap[c.id]}"></div></div>`).join('');
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>${isEdit?'Edit goal':'New savings goal'}</h3>
    <span class="modal-label">Goal name</span>
    <input type="text" id="sbkt-name" placeholder="e.g. Emergency fund, Vacation" value="${bkt.name}" autocomplete="off"/>
    <span class="modal-label">Goal amount</span>
    <input type="number" id="sbkt-goal" placeholder="0.00" value="${bkt.goal||''}" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Amount saved so far</span>
    <input type="number" id="sbkt-saved" placeholder="0.00" value="${bkt.saved||''}" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Target date (optional)</span>
    <input type="date" id="sbkt-date" value="${bkt.targetDate||''}" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:16px;font-family:inherit;margin-bottom:12px;outline:none;-webkit-appearance:none" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
    <span class="modal-label">Color</span>
    <div style="display:flex;gap:10px;margin-bottom:16px" id="color-picker-row">${colorPicker}</div>
    <div class="modal-btns">
      ${isEdit?`<button class="btn btn-danger" onclick="deleteSavingsBucket(${idx})"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveSavingsBucket(${isEdit?idx:'null'})">${isEdit?'Save':'Add'}</button>
    </div>
  </div></div>`;
  window._savColor=selColor;
  setTimeout(()=>document.getElementById('sbkt-name').focus(),100);
}
function selectSavColor(id){
  window._savColor=id;
  const colorMap={green:'var(--green)',blue:'var(--blue)',purple:'var(--purple)',amber:'var(--amber)',red:'var(--red)'};
  document.querySelectorAll('[id^="cpick-"]').forEach(el=>{
    const cid=el.id.replace('cpick-','');
    el.style.borderColor=cid===id?colorMap[cid]:'transparent';
  });
}
function saveSavingsBucket(idx){
  const name=document.getElementById('sbkt-name').value.trim();
  const goal=parseFloat(document.getElementById('sbkt-goal').value)||0;
  const saved=parseFloat(document.getElementById('sbkt-saved').value)||0;
  if(!name)return;
  if(!STATE.savingsBuckets)STATE.savingsBuckets=[];
  if((idx===null||idx==='null')&&!checkLimit('savingsgoals',STATE.savingsBuckets.length)){closeModal();return;}
  const targetDate=document.getElementById('sbkt-date')?.value||null;
  const entry={name,goal,saved,color:window._savColor||'green',targetDate:targetDate||null};
  if(idx===null||idx==='null'){entry.createdAt=new Date().toISOString();STATE.savingsBuckets.push(entry);}
  else STATE.savingsBuckets[idx]=entry;
  saveState();closeModal();renderSavingsScreen();
}
function deleteSavingsBucket(idx){
  STATE.savingsBuckets.splice(idx,1);
  saveState();closeModal();renderSavingsScreen();
}
function addToSavingsBucket(idx){
  const bkt=STATE.savingsBuckets[idx];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Add to ${bkt.name}</h3>
    <span class="modal-label">Amount to add</span>
    <input type="number" id="sadd-amt" placeholder="0.00" inputmode="decimal" step="0.01" min="0"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmAddToSavings(${idx})">Add</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('sadd-amt').focus(),100);
}
function confirmAddToSavings(idx){
  const amt=parseFloat(document.getElementById('sadd-amt').value)||0;
  if(!amt)return;
  STATE.savingsBuckets[idx].saved=(STATE.savingsBuckets[idx].saved||0)+amt;
  saveState();closeModal();renderSavingsScreen();
}

function openWaterfallDetail(){
  const bkts=STATE.savingsBuckets||[];
  const totalAllTime=allTimeSavings();
  const exampleGoals=bkts.length?bkts.slice(0,3):
    [{name:'Emergency Fund',goal:1000,saved:0},{name:'Vacation',goal:500,saved:0},{name:'New Car',goal:5000,saved:0}];
  let remaining=totalAllTime>0?totalAllTime:1250;
  const rows=exampleGoals.map((g,i)=>{
    const cap=g.goal||0;
    const manual=g.saved||0;
    const fill=cap>0?Math.min(Math.max(0,remaining),Math.max(0,cap-manual)):0;
    const effective=Math.min(manual+fill,cap||manual+fill);
    const pct=cap>0?Math.min(effective/cap,1):0;
    remaining=Math.max(0,remaining-(cap>0?fill:0));
    return{name:g.name,cap,effective,pct,fill,manual};
  });
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <h3 style="margin:0">How the waterfall works</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:16px">
      Think of your savings as water filling buckets from top to bottom. Each goal fills completely before the next one starts.
    </div>
    <div style="font-size:11px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Total savings pool: ${fmt(totalAllTime||1250)}</div>
    ${rows.map((r,i)=>`
      <div style="margin-bottom:12px;padding:12px;background:var(--card2);border-radius:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:14px;font-weight:500">${i+1}. ${r.name}</span>
          <span style="font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums">${fmt(r.effective)} / ${r.cap?fmt(r.cap):'∞'}</span>
        </div>
        ${r.cap?`<div style="height:7px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:6px">
          <div style="height:100%;width:${(r.pct*100).toFixed(0)}%;background:var(--green);border-radius:99px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--muted)">
          ${r.manual>0?`${fmt(r.manual)} manually added · `:''}${r.fill>0?`${fmt(r.fill)} auto-filled from pool`:'No pool funds needed'}
        </div>`:''}
      </div>`).join('')}
    <div style="font-size:12px;color:var(--muted);padding:10px;background:var(--card2);border-radius:10px;margin-top:4px;line-height:1.6">
      <strong style="color:var(--text)">Tip:</strong> Drag goals to reorder them and control which fills first. Manually add funds to a goal to reserve them there regardless of order.
    </div>
    <button class="btn btn-ghost" style="width:100%;margin-top:14px" onclick="closeModal()">Close</button>
  </div></div>`;
}
function renderSavingsScreen(){
  const bkts=STATE.savingsBuckets||[];
  const totalAllTime=allTimeSavings();
  // Waterfall explanation card
  const wfEl=document.getElementById('savings-waterfall-info');
  if(wfEl&&bkts.length>0){
    const dismissed=localStorage.getItem('distrofi_wf_dismissed');
    if(!dismissed){
      wfEl.innerHTML=`<div style="background:linear-gradient(135deg,#22c55e0e,#3b82f60a);border:0.5px solid #22c55e33;border-radius:14px;padding:14px;margin-bottom:4px;display:flex;gap:12px;align-items:flex-start">
        <i class="ti ti-info-circle" style="font-size:20px;color:var(--green);flex-shrink:0;margin-top:1px"></i>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">How savings goals work</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.6">Your total savings fill goals <strong style="color:var(--text)">top to bottom</strong> — the first goal fills completely before the next one starts. Goals show both manually added funds and auto-filled amounts from your total savings pool.</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button onclick="localStorage.setItem('distrofi_wf_dismissed','1');document.getElementById('savings-waterfall-info').innerHTML=''" style="padding:5px 12px;background:var(--card2);border:0.5px solid var(--border);border-radius:99px;color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">Got it</button>
            <button onclick="openWaterfallDetail()" style="padding:5px 12px;background:#22c55e18;border:0.5px solid #22c55e44;border-radius:99px;color:var(--green);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">See example</button>
          </div>
        </div>
      </div>`;
    } else {
      wfEl.innerHTML='';
    }
  } else if(wfEl){ wfEl.innerHTML=''; }

  // Waterfall: pour savings into goals in order until each is full
  let remaining=totalAllTime;
  const waterfall=bkts.map(b=>{
    const cap=b.goal||0;
    // manually added funds always count; waterfall adds on top up to goal
    const manual=b.saved||0;
    const fromWaterfall=cap>0?Math.min(Math.max(0,remaining),Math.max(0,cap-manual)):0;
    const effective=cap>0?Math.min(manual+fromWaterfall,cap):manual;
    remaining=Math.max(0,remaining-(cap>0?Math.min(remaining,Math.max(0,cap-manual)):0));
    return{...b,effective,fromWaterfall,cap};
  });
  const totalAllocated=waterfall.reduce((s,b)=>s+(b.cap>0?Math.min(b.effective,b.cap):0),0);
  const unallocated=Math.max(0,totalAllTime-totalAllocated);

  const elAt=document.getElementById('sav-alltime-total');
  const el=document.getElementById('sav-unallocated');
  const te=document.getElementById('sav-buckets-total');
  if(elAt)elAt.textContent=fmt(totalAllTime);
  if(el)el.textContent=fmt(unallocated);
  if(te)te.textContent=fmt(totalAllocated);

  const list=document.getElementById('savings-buckets-list');
  const empty=document.getElementById('savings-empty');
  if(!list)return;
  if(!bkts.length){list.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  const colorMap={
    green:{bg:'#16a34a18',fg:'var(--green)',track:'#16a34a33'},
    blue:{bg:'#3b82f618',fg:'var(--blue)',track:'#3b82f633'},
    purple:{bg:'#a855f718',fg:'var(--purple)',track:'#a855f733'},
    amber:{bg:'#f59e0b18',fg:'var(--amber)',track:'#f59e0b33'},
    red:{bg:'#ef444418',fg:'var(--red)',track:'#ef444433'},
  };
  list.innerHTML='';
  waterfall.forEach((b,i)=>{
    const c=colorMap[b.color||'green'];
    const pct=b.cap>0?Math.min(b.effective/b.cap,1):0;
    const isComplete=b.cap>0&&b.effective>=b.cap;
    const isCurrent=!isComplete&&waterfall.slice(0,i).every(prev=>prev.cap>0&&prev.effective>=prev.cap);
    const d=document.createElement('div');
    d.style.cssText=`background:var(--card);border-radius:14px;border:0.5px solid ${isCurrent?c.fg+'66':'var(--border)'};padding:16px;margin-bottom:12px`;
    d.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="ti ti-pig-money" style="font-size:17px;color:${c.fg}"></i>
          </div>
          <div>
            <div style="font-size:15px;font-weight:500;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              ${b.name}
              ${isComplete?`<span style="font-size:10px;background:${c.bg};color:${c.fg};padding:2px 8px;border-radius:99px;font-weight:600">FULL</span>`:''}
              ${isCurrent&&!isComplete?`<span style="font-size:10px;background:${c.bg};color:${c.fg};padding:2px 8px;border-radius:99px;font-weight:600">ACTIVE</span>`:''}
              ${(()=>{
                if(!b.targetDate||isComplete)return '';
                const now=new Date();
                const target=new Date(b.targetDate+'T00:00:00');
                const daysLeft=Math.ceil((target-now)/(864e5));
                const elapsed=Math.max(0,(now-new Date(b.createdAt||STATE.current.startDate+'T00:00:00'))/(864e5));
                const totalDays=Math.max(1,(target-new Date(b.createdAt||STATE.current.startDate+'T00:00:00'))/(864e5));
                const expectedPct=Math.min(elapsed/totalDays,1);
                const actualPct=b.cap>0?Math.min(b.effective/b.cap,1):0;
                const status=daysLeft<0?['Overdue','var(--red)']:actualPct>=expectedPct?['On track','var(--green)']:['Behind','var(--amber)'];
                const dateStr=target.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
                return `<span style="font-size:10px;background:${status[1]}22;color:${status[1]};padding:2px 8px;border-radius:99px;font-weight:600">${status[0]}</span>`;
              })()}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:6px">
              ${b.cap?fmt(b.effective)+' of '+fmt(b.cap):'No goal set'}
              ${b.targetDate&&!isComplete?`<span style="color:var(--muted)">·</span><i class="ti ti-calendar" style="font-size:11px"></i><span>${(()=>{const t=new Date(b.targetDate+'T00:00:00');const d=Math.ceil((t-new Date())/(864e5));return d<0?'Overdue':d===0?'Due today':d+' days left';})()}</span>`:''}
            </div>
          </div>
        </div>
        <button class="icon-btn" onclick="openSavingsBucketModal(${i})"><i class="ti ti-edit"></i></button>
      </div>
      ${b.cap?`
      <div style="height:8px;background:${c.track};border-radius:99px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${(pct*100).toFixed(1)}%;background:${c.fg};border-radius:99px;transition:width .4s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:12px">
        <span>${(pct*100).toFixed(0)}% complete</span>
        <span>${isComplete?'Goal reached!':fmt(b.cap-b.effective)+' to go'}</span>
      </div>`:'<div style="margin-bottom:10px"></div>'}
      <button onclick="addToSavingsBucket(${i})" style="width:100%;padding:9px;background:${c.bg};border:0.5px solid ${c.fg}44;border-radius:10px;color:${c.fg};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
        <i class="ti ti-plus" style="font-size:14px"></i> Add funds
      </button>`;
    list.appendChild(d);
  });
  // Update snapshot sub
  const sub=document.getElementById('snap-savings-sub');
  if(sub)sub.textContent=bkts.length?`${bkts.length} goal${bkts.length!==1?'s':''} · ${fmt(totalAllocated)} allocated`:'Tap to manage goals';
}


function openInvGoalModal(idx){
  const isEdit=idx!==undefined;
  const g=isEdit?(STATE.invGoals||[])[idx]:{name:'',goal:0,saved:0,color:'purple'};
  const colors=[
    {id:'purple',label:'Purple',bg:'#a855f722',fg:'var(--purple)'},
    {id:'blue',label:'Blue',bg:'#3b82f622',fg:'var(--blue)'},
    {id:'green',label:'Green',bg:'#16a34a22',fg:'var(--green)'},
    {id:'amber',label:'Amber',bg:'#f59e0b22',fg:'var(--amber)'},
    {id:'red',label:'Red',bg:'#ef444422',fg:'var(--red)'},
  ];
  const colorMap={purple:'var(--purple)',blue:'var(--blue)',green:'var(--green)',amber:'var(--amber)',red:'var(--red)'};
  let selColor=g.color||'purple';
  const colorPicker=colors.map(c=>`<div id="igpick-${c.id}" onclick="selectInvGoalColor('${c.id}')" style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:2px solid ${selColor===c.id?colorMap[c.id]:'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center"><div style="width:14px;height:14px;border-radius:50%;background:${colorMap[c.id]}"></div></div>`).join('');
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>${isEdit?'Edit goal':'New investment goal'}</h3>
    <span class="modal-label">Goal name</span>
    <input type="text" id="ig-name" placeholder="e.g. Retirement, House down payment" value="${g.name}" autocomplete="off"/>
    <span class="modal-label">Target amount</span>
    <input type="number" id="ig-goal" placeholder="0.00" value="${g.goal||''}" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Amount invested so far</span>
    <input type="number" id="ig-saved" placeholder="0.00" value="${g.saved||''}" inputmode="decimal" step="0.01" min="0"/>
    <span class="modal-label">Target date (optional)</span>
    <input type="date" id="ig-date" value="${g.targetDate||''}" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:16px;font-family:inherit;margin-bottom:12px;outline:none;-webkit-appearance:none" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"/>
    <span class="modal-label">Color</span>
    <div style="display:flex;gap:10px;margin-bottom:16px" id="ig-color-row">${colorPicker}</div>
    <div class="modal-btns">
      ${isEdit?`<button class="btn btn-danger" onclick="deleteInvGoal(${idx})"><i class="ti ti-trash" style="font-size:16px;vertical-align:-2px"></i> Delete</button>`:''}
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveInvGoal(${isEdit?idx:'null'})">${isEdit?'Save':'Add'}</button>
    </div>
  </div></div>`;
  window._igColor=selColor;
  setTimeout(()=>document.getElementById('ig-name').focus(),100);
}
function selectInvGoalColor(id){
  window._igColor=id;
  const colorMap={purple:'var(--purple)',blue:'var(--blue)',green:'var(--green)',amber:'var(--amber)',red:'var(--red)'};
  document.querySelectorAll('[id^="igpick-"]').forEach(el=>{
    const cid=el.id.replace('igpick-','');
    el.style.borderColor=cid===id?colorMap[cid]:'transparent';
  });
}
function saveInvGoal(idx){
  const name=document.getElementById('ig-name').value.trim();
  const goal=parseFloat(document.getElementById('ig-goal').value)||0;
  const saved=parseFloat(document.getElementById('ig-saved').value)||0;
  if(!name)return;
  if(!STATE.invGoals)STATE.invGoals=[];
  if((idx===null||idx==='null')&&!gateFeature('invgoals')){closeModal();return;}
  const targetDate=document.getElementById('ig-date')?.value||null;
  const entry={name,goal,saved,color:window._igColor||'purple',targetDate:targetDate||null};
  if(idx===null||idx==='null'){entry.createdAt=new Date().toISOString();STATE.invGoals.push(entry);}
  else{const prev=STATE.invGoals[idx];entry.createdAt=prev.createdAt||new Date().toISOString();STATE.invGoals[idx]=entry;}
  saveState();closeModal();renderInvGoalsScreen();
}
function deleteInvGoal(idx){
  STATE.invGoals.splice(idx,1);
  saveState();closeModal();renderInvGoalsScreen();
}
function addToInvGoal(idx){
  const g=STATE.invGoals[idx];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Add to ${g.name}</h3>
    <span class="modal-label">Amount to add</span>
    <input type="number" id="igadd-amt" placeholder="0.00" inputmode="decimal" step="0.01" min="0"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmAddToInvGoal(${idx})">Add</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('igadd-amt').focus(),100);
}
function confirmAddToInvGoal(idx){
  const amt=parseFloat(document.getElementById('igadd-amt').value)||0;
  if(!amt)return;
  STATE.invGoals[idx].saved=(STATE.invGoals[idx].saved||0)+amt;
  saveState();closeModal();renderInvGoalsScreen();
}
function renderInvGoalsScreen(){
  const goals=STATE.invGoals||[];
  const inv=allTimeInvestments();
  const totalAllTime=inv.grand;
  const totalTarget=goals.reduce((s,g)=>s+(g.goal||0),0);

  // Waterfall: pour all-time investments into goals in order
  let remaining=totalAllTime;
  const waterfall=goals.map(g=>{
    const cap=g.goal||0;
    const manual=g.saved||0;
    const fromWaterfall=cap>0?Math.min(Math.max(0,remaining),Math.max(0,cap-manual)):0;
    const effective=cap>0?Math.min(manual+fromWaterfall,cap):manual;
    remaining=Math.max(0,remaining-(cap>0?Math.min(remaining,Math.max(0,cap-manual)):0));
    return{...g,effective,cap};
  });
  const totalAllocated=waterfall.reduce((s,g)=>s+(g.cap>0?Math.min(g.effective,g.cap):0),0);
  const unallocated=Math.max(0,totalAllTime-totalAllocated);

  const te=document.getElementById('invgoal-total');
  const tt=document.getElementById('invgoal-target');
  const ta=document.getElementById('invgoal-alltime');
  const tu=document.getElementById('invgoal-unallocated');
  if(ta)ta.textContent=fmt(totalAllTime);
  if(te)te.textContent=fmt(totalAllocated);
  if(tu)tu.textContent=fmt(unallocated);
  if(tt)tt.textContent=fmt(totalTarget);

  // ── Investment growth chart ──
  const chartEl=document.getElementById('invgoal-chart');
  if(chartEl){
    const allCycles=[...STATE.history,C];
    const periodsWithData=allCycles.filter(cyc=>(cyc.investments||[]).some(i=>i.amount>0));
    if(periodsWithData.length<2){
      chartEl.innerHTML='';
    } else {
      // Per-period totals + running cumulative
      let running=0;
      const periods=allCycles.map(cyc=>{
        const periodTotal=(cyc.investments||[]).reduce((a,i)=>a+(i.amount||0),0);
        running+=periodTotal;
        const label=cyc.startDate?new Date(cyc.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short'}):'-';
        return{periodTotal,cumulative:running,label};
      }).filter(p=>p.cumulative>0||p.periodTotal>0);
      if(periods.length<2){chartEl.innerHTML='';} else {
        const maxCum=Math.max(...periods.map(p=>p.cumulative),1);
        const maxBar=Math.max(...periods.map(p=>p.periodTotal),1);
        const W=340,H=120,pad=28;
        const slotW=(W-pad*2)/periods.length;
        const barW=Math.max(6,Math.floor(slotW*0.6));
        let bars='',labels='',linePoints='';
        const COLS=['#6366f1','#3b82f6','#a855f7','#ec4899','#14b8a6','#f59e0b'];
        // Build per-account stacked bars
        periods.forEach((p,i)=>{
          const x=pad+i*slotW+slotW/2;
          const barH=Math.max(2,(p.periodTotal/maxBar)*(H-20));
          bars+=`<rect x="${(x-barW/2).toFixed(1)}" y="${(H-4-barH).toFixed(1)}" width="${barW}" height="${barH.toFixed(1)}" fill="var(--purple)" opacity=".85" rx="2"/>`;
          const ly=(H-4)-((p.cumulative/maxCum)*(H-20));
          linePoints+=`${i===0?'M':'L'}${x.toFixed(1)},${ly.toFixed(1)} `;
          if(i===0||i===periods.length-1){
            labels+=`<text x="${x.toFixed(1)}" y="${H+12}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="-apple-system,sans-serif">${p.label}</text>`;
          }
          if(i===periods.length-1){
            labels+=`<text x="${(x+6).toFixed(1)}" y="${(ly-4).toFixed(1)}" font-size="9" fill="var(--purple)" font-weight="600" font-family="-apple-system,sans-serif">${fmt(p.cumulative)}</text>`;
          }
        });
        chartEl.innerHTML=`<div style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px 14px 6px;margin-bottom:4px">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
            <span>Investment growth</span>
            <div style="display:flex;gap:10px;font-size:10px">
              <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:var(--purple);display:inline-block"></span>Per period</span>
              <span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:2px;background:var(--purple);opacity:.6;display:inline-block;border-radius:1px"></span>Cumulative</span>
            </div>
          </div>
          <svg width="100%" viewBox="0 0 ${W} ${H+16}" style="overflow:visible">
            ${bars}
            <path d="${linePoints}" fill="none" stroke="var(--purple)" stroke-width="2" stroke-opacity=".7" stroke-linejoin="round"/>
            ${labels}
          </svg>
        </div>`;
      }
    }
  }

  // Per-account breakdown
  const bd=document.getElementById('invgoal-breakdown');
  if(bd){
    const names=Object.keys(inv.totals);
    if(!names.length){bd.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0">No investments logged yet</div>';}
    else{
      bd.innerHTML=names.map(n=>{
        const pct=inv.grand>0?(inv.totals[n]/inv.grand)*100:0;
        return`<div style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:#a855f718;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-trending-up" style="font-size:15px;color:var(--purple)"></i></div>
              <span style="font-size:14px;font-weight:500">${n}</span>
            </div>
            <span style="font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;color:var(--purple)">${fmt(inv.totals[n])}</span>
          </div>
          <div style="height:6px;background:#a855f722;border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${pct.toFixed(1)}%;background:var(--purple);border-radius:99px;transition:width .4s ease"></div>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:6px">${pct.toFixed(0)}% of total</div>
        </div>`;
      }).join('');
    }
  }

  const list=document.getElementById('invgoals-list');
  const empty=document.getElementById('invgoals-empty');
  if(!list)return;
  if(!goals.length){list.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  const colorMap={
    purple:{bg:'#a855f718',fg:'var(--purple)',track:'#a855f733'},
    blue:{bg:'#3b82f618',fg:'var(--blue)',track:'#3b82f633'},
    green:{bg:'#16a34a18',fg:'var(--green)',track:'#16a34a33'},
    amber:{bg:'#f59e0b18',fg:'var(--amber)',track:'#f59e0b33'},
    red:{bg:'#ef444418',fg:'var(--red)',track:'#ef444433'},
  };
  list.innerHTML='';
  waterfall.forEach((g,i)=>{
    const c=colorMap[g.color||'purple'];
    const pct=g.cap>0?Math.min(g.effective/g.cap,1):0;
    const isComplete=g.cap>0&&g.effective>=g.cap;
    const isCurrent=!isComplete&&waterfall.slice(0,i).every(prev=>prev.cap>0&&prev.effective>=prev.cap);
    const d=document.createElement('div');
    d.style.cssText=`background:var(--card);border-radius:14px;border:0.5px solid ${isCurrent?c.fg+'66':'var(--border)'};padding:16px;margin-bottom:12px`;
    d.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="ti ti-trending-up" style="font-size:17px;color:${c.fg}"></i>
          </div>
          <div>
            <div style="font-size:15px;font-weight:500;display:flex;align-items:center;gap:6px">
              ${g.name}
              ${isComplete?`<span style="font-size:10px;background:${c.bg};color:${c.fg};padding:2px 8px;border-radius:99px;font-weight:600">FULL</span>`:''}
              ${isCurrent?`<span style="font-size:10px;background:${c.bg};color:${c.fg};padding:2px 8px;border-radius:99px;font-weight:600">ACTIVE</span>`:''}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">${g.cap?fmt(g.effective)+' of '+fmt(g.cap):'No target set'}</div>
          </div>
        </div>
        <button class="icon-btn" onclick="openInvGoalModal(${i})"><i class="ti ti-edit"></i></button>
      </div>
      ${g.cap?`
      <div style="height:8px;background:${c.track};border-radius:99px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${(pct*100).toFixed(1)}%;background:${c.fg};border-radius:99px;transition:width .4s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:12px">
        <span>${(pct*100).toFixed(0)}% complete</span>
        <span>${isComplete?'Goal reached!':fmt(g.cap-g.effective)+' to go'}</span>
      </div>`:'<div style="margin-bottom:10px"></div>'}
      <button onclick="addToInvGoal(${i})" style="width:100%;padding:9px;background:${c.bg};border:0.5px solid ${c.fg}44;border-radius:10px;color:${c.fg};font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
        <i class="ti ti-plus" style="font-size:14px"></i> Add funds
      </button>`;
    list.appendChild(d);
  });
}


function openAddExtraSavingsModal(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Add extra savings</h3>
    <span class="modal-label">Label (optional)</span>
    <input type="text" id="exsav-label" placeholder="e.g. Tax refund, bonus" autocomplete="off"/>
    <span class="modal-label">Amount</span>
    <input type="number" id="exsav-amt" placeholder="0.00" inputmode="decimal" step="0.01" min="0"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveExtraSavings()">Add</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('exsav-amt').focus(),100);
}
function saveExtraSavings(){
  const amt=parseFloat(document.getElementById('exsav-amt').value)||0;
  const label=document.getElementById('exsav-label').value.trim();
  if(!amt)return;
  if(!C.savings.extra)C.savings.extra=[];
  C.savings.extra.push({amount:amt,label:label||null,date:new Date().toISOString().slice(0,10)});
  saveState();closeModal();render();
}
function deleteExtraSaving(i){
  C.savings.extra.splice(i,1);
  saveState();render();
}


const AI_SUGGESTIONS=[
  "Analyze my investments",
  "How should I allocate my money?",
  "Am I saving enough?",
  "What should I invest in next?",
  "Review my financial picture",
];

function buildFinancialContext(){
  const income=totalIncome();
  const bills=totalBills();
  const savings=(C.savings.perPaycheck||0);
  const extraSav=currentExtraSavings();
  const invested=totalInvested();
  const spent=totalSpent();
  const rem=remaining();
  const invList=(C.investments||[]).map(i=>`${i.name}: $${i.amount||0}`).join(', ')||'None logged';
  const savGoals=(STATE.savingsBuckets||[]).map(g=>`${g.name} (saved $${g.saved||0} of $${g.goal||0})`).join(', ')||'None set';
  const invGoals=(STATE.invGoals||[]).map(g=>`${g.name} (saved $${g.saved||0} of $${g.goal||0})`).join(', ')||'None set';
  const buckets=Object.values(C.buckets).map(b=>`${b.label}: $${bucketSpent(b.label.toLowerCase().replace(' ',''))||0} of $${b.budget||0}`);
  return `FINANCIAL SNAPSHOT (current pay period):
- Gross income: $${income.toFixed(2)}
- Fixed bills: $${bills.toFixed(2)}
- Savings this period: $${(savings+extraSav).toFixed(2)} ($${(C.savings.perPaycheck||0).toFixed(2)}/period + $${extraSav.toFixed(2)} extra)
- Total invested this period: $${invested.toFixed(2)} (${invList})
- Variable spending: $${spent.toFixed(2)} (${Object.values(C.buckets).map(b=>`${b.label} $${bucketSpent(Object.keys(C.buckets).find(k=>C.buckets[k]===b)||'')}`).join(', ')})
- Remaining after all deductions: $${rem.toFixed(2)}
- Savings goals: ${savGoals}
- Investment goals: ${invGoals}
- Pay periods tracked: ${[...STATE.history,C].length}
- All-time savings: $${allTimeSavings().toFixed(2)}
- All-time invested: $${allTimeInvestments().grand.toFixed(2)}`;
}

let aiHistory=[];

function renderAISuggestions(){
  const el=document.getElementById('ai-suggestions');
  if(!el)return;
  if(aiHistory.length>0){el.innerHTML='';return;}
  el.innerHTML=AI_SUGGESTIONS.map(s=>`<button class="ai-chip" onclick="askAdvisor('${s}')">${s}</button>`).join('');
}

function addBubble(role,text){
  const log=document.getElementById('ai-chat-messages');
  if(!log)return;
  const div=document.createElement('div');
  div.className=`ai-bubble ${role}`;
  div.style.alignSelf=role==='user'?'flex-end':'flex-start';
  div.textContent=text;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
  return div;
}

function askAdvisor(msg){
  document.getElementById('ai-input').value=msg;
  sendToAdvisor();
}

async function sendToAdvisor(){
  if(!gateFeature('advisor'))return;
  const input=document.getElementById('ai-input');
  const btn=document.getElementById('ai-send-btn');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  addBubble('user',msg);
  renderAISuggestions();

  // Disable send while waiting
  btn.disabled=true;btn.style.opacity='0.5';
  const thinking=addBubble('assistant','Thinking...');
  thinking.classList.add('thinking');

  aiHistory.push({role:'user',content:msg});

  const systemPrompt=`You are a personal financial advisor built into a paycheck budgeting app. You have access to the user's complete financial picture for this pay period and historically. Give detailed, educational advice — explain the WHY behind every recommendation. Be specific to their numbers, not generic. Use plain conversational language. When suggesting changes, be concrete (e.g. "move $50 from gas to investments" not "consider investing more"). Always note you are not a licensed financial advisor and major decisions should be verified with a professional.

${buildFinancialContext()}`;

  try{
    const res=await fetch('/api/advisor',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-5',
        max_tokens:1000,
        system:systemPrompt,
        messages:aiHistory
      })
    });
    const data=await res.json();
    const reply=data?.content?.[0]?.text||'Sorry, I could not get a response. Please try again.';
    thinking.remove();
    addBubble('assistant',reply);
    aiHistory.push({role:'assistant',content:reply});
  }catch(e){
    thinking.remove();
    addBubble('assistant','Connection error. Please check your internet and try again.');
    aiHistory.pop();
  }
  btn.disabled=false;btn.style.opacity='1';
}


function isLight(){const cl=document.documentElement.classList;return cl.contains('light')||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches&&!cl.contains('dark')&&!cl.contains('light'));}
function toggleTheme(){
  const cl=document.documentElement.classList;
  const light=!isLight();
  cl.toggle('light',light);cl.toggle('dark',!light);
  localStorage.setItem('distrofi_theme',light?'light':'dark');
  // Update toggle knob in settings modal if open
  const tog=document.getElementById('theme-toggle-knob');
  const bar=document.getElementById('theme-toggle-bar');
  if(tog){tog.style.left=light?'21px':'3px';}
  if(bar){bar.style.background=light?'var(--accent)':'var(--border)';}
  const lbl=document.getElementById('theme-toggle-label');
  if(lbl)lbl.textContent=light?'Dark':'Light';
  const sub=document.getElementById('theme-toggle-sub');
  if(sub)sub.textContent='Currently '+(light?'light':'dark');
}


function openPartnerSetup(){
  const hid=getHouseholdId();
  const coupled=!!(hid&&getPartners().p2);
  if(!isCouplePro()&&!coupled){
    // Upsell to Couples
    openPaywall('partner');return;
  }
  if(coupled){
    // Already linked — show status + leave option
    const p=getPartners();
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
      <h3>Finance together</h3>
      <div style="background:linear-gradient(135deg,#ec489912,#6366f112);border:0.5px solid #ec489944;border-radius:14px;padding:16px;margin-bottom:18px;display:flex;align-items:center;gap:12px">
        <i class="ti ti-users" style="font-size:24px;color:#ec4899;flex-shrink:0"></i>
        <div><div style="font-size:15px;font-weight:600">${p.p1||'You'} & ${p.p2||'Partner'}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Budgeting together · Live sync active</div></div>
      </div>
      <label class="modal-label">Your display name</label>
      <input type="text" id="p1-name" value="${p.p1||'You'}" placeholder="Your name" autocomplete="off" style="margin-bottom:12px"/>
      <label class="modal-label">Partner's display name</label>
      <input type="text" id="p2-name" value="${p.p2||''}" placeholder="Partner's name" autocomplete="off"/>
      <div class="modal-btns" style="margin-top:16px">
        <button class="btn btn-danger" onclick="confirmLeaveHousehold()"><i class="ti ti-unlink" style="font-size:15px;vertical-align:-2px"></i> Unlink</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="savePartners()">Save names</button>
      </div>
    </div></div>`;
    setTimeout(()=>document.getElementById('p1-name').focus(),100);
    return;
  }
  // Not linked yet — show invite / enter code UI
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Finance together</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5">Connect with your partner so you both see and update the same budget in real time.</p>
    <button onclick="openInviteFlow()" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px">
      <i class="ti ti-send" style="font-size:18px"></i> Invite my partner
    </button>
    <button onclick="openJoinFlow()" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">
      <i class="ti ti-key" style="font-size:18px"></i> Enter invite code
    </button>
    <button class="btn btn-ghost" style="width:100%;margin-top:10px" onclick="closeModal()">Cancel</button>
  </div></div>`;
}

function openInviteFlow(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>Invite your partner</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5">Generating your invite code…</p>
  </div></div>`;
  createInviteCode().then(result=>{
    if(!result){
      document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
        <h3>Invite your partner</h3>
        <p style="font-size:14px;color:var(--red)">Could not generate code. Make sure you\'re logged in and try again.</p>
        <button class="btn btn-ghost" style="width:100%;margin-top:12px" onclick="closeModal()">Close</button>
      </div></div>`;return;
    }
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
      <h3>Share this code</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.5">Have your partner open DistroFi, go to Settings → Finance together, and enter this code.</p>
      <div onclick="navigator.clipboard?.writeText('${result.invite_code}').then(()=>showToast('Code copied!'))" style="background:linear-gradient(135deg,#7c3aed18,#6366f118);border:1.5px dashed #6366f166;border-radius:16px;padding:24px;text-align:center;cursor:pointer;margin-bottom:20px">
        <div style="font-size:40px;font-weight:900;letter-spacing:8px;color:var(--accent);font-variant-numeric:tabular-nums">${result.invite_code}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px;text-transform:uppercase;letter-spacing:.06em">Tap to copy</div>
      </div>
      <p style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:16px">Code expires after use. Once your partner joins, the budget syncs automatically.</p>
      <button class="btn btn-ghost" style="width:100%" onclick="closeModal()">Done</button>
    </div></div>`;
  });
}

function openJoinFlow(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Enter invite code</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.5">Ask your partner for their 6-character code and enter it below.</p>
    <input type="text" id="invite-code-input" maxlength="6" placeholder="ABC123" autocomplete="off"
      style="width:100%;padding:18px;background:var(--card2);border:1.5px solid var(--border);border-radius:12px;color:var(--text);font-size:28px;font-weight:700;text-align:center;letter-spacing:6px;font-family:inherit;outline:none;text-transform:uppercase;margin-bottom:6px"
      oninput="this.value=this.value.toUpperCase()"/>
    <div id="join-error" style="font-size:12px;color:var(--red);min-height:16px;margin-bottom:12px;text-align:center"></div>
    <button onclick="submitJoinCode()" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">Join budget</button>
    <button class="btn btn-ghost" style="width:100%" onclick="closeModal()">Cancel</button>
  </div></div>`;
  setTimeout(()=>document.getElementById('invite-code-input')?.focus(),100);
}

async function submitJoinCode(){
  const code=(document.getElementById('invite-code-input')?.value||'').trim();
  if(code.length!==6){document.getElementById('join-error').textContent='Please enter the full 6-character code.';return;}
  const btn=document.querySelector('#modal-root button');
  const errEl=document.getElementById('join-error');
  errEl.textContent='Linking accounts…';
  const result=await acceptInviteCode(code);
  if(!result.ok){errEl.textContent=result.msg;return;}
  // Success — ask for partner names
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>You're connected!</h3>
    <div style="text-align:center;margin-bottom:20px"><i class="ti ti-users" style="font-size:48px;color:var(--accent)"></i></div>
    <p style="font-size:14px;color:var(--muted);margin-bottom:20px;line-height:1.5;text-align:center">Your budget is now shared. Add display names so you know who's who.</p>
    <label class="modal-label">Your name</label>
    <input type="text" id="p1-name" value="${getPartners().p1||'You'}" autocomplete="off"/>
    <label class="modal-label">Partner's name</label>
    <input type="text" id="p2-name" value="" placeholder="Partner's name" autocomplete="off"/>
    <button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="savePartners()">Let's go</button>
  </div></div>`;
  setTimeout(()=>document.getElementById('p2-name')?.focus(),100);
}

function confirmLeaveHousehold(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>Unlink partner?</h3>
    <p style="font-size:14px;color:var(--muted);margin-bottom:20px;line-height:1.6">You'll keep your budget history, but changes will no longer sync to your partner's account.</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="openPartnerSetup()">Cancel</button>
      <button class="btn btn-danger" onclick="leaveHousehold().then(()=>closeModal())">Unlink</button>
    </div>
  </div></div>`;
}

function savePartners(){
  const p1=document.getElementById('p1-name')?.value.trim()||'You';
  const p2=document.getElementById('p2-name')?.value.trim()||'';
  STATE.partners={p1,p2};
  saveState();closeModal();render();
}
function removePartner(){
  STATE.partners={p1:STATE.partners.p1||'You',p2:''};
  saveState();closeModal();render();
}
function openFreqPicker(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Pay frequency</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.5">How often do you get paid? This sets how long each budget period lasts.</p>
    ${FREQ_OPTIONS.map(o=>`<div onclick="selectFreq('${o.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:${getFreq()===o.id?'#6366f114':'var(--card2)'};border:1.5px solid ${getFreq()===o.id?'var(--accent)':'var(--border)'};border-radius:12px;margin-bottom:8px;cursor:pointer"><span style="font-size:15px;font-weight:${getFreq()===o.id?'600':'400'};color:${getFreq()===o.id?'var(--accent)':'var(--text)'}">${o.label}</span>${getFreq()===o.id?'<i class="ti ti-check" style="font-size:18px;color:var(--accent)"></i>':''}</div>`).join('')}
    <button class="btn btn-ghost" style="width:100%;margin-top:6px" onclick="closeModal()">Cancel</button>
  </div></div>`;
}
function selectFreq(f){
  setFreq(f);closeModal();
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>Apply new frequency?</h3>
    <p style="font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.5">Pay frequency set to <strong>${freqLabel()}</strong>. Start a new period to apply it.</p>
    <div class="modal-btns"><button class="btn btn-ghost" onclick="closeModal();render()">Keep current</button><button class="btn btn-primary" onclick="confirmNewCycle()">Start new period</button></div>
  </div></div>`;
}

// ── Onboarding ──
const FORMSPREE_ID='xgobwbye';
const ONBOARD_KEY='distrofi_onboarded';
let _onboardSelected=new Set();
const ONBOARD_OPTIONS=[
  {icon:'ti-checklist',label:'Track my bills & due dates'},
  {icon:'ti-wallet',label:'Manage my spending by category'},
  {icon:'ti-pig-money',label:'Plan & grow my savings'},
  {icon:'ti-trending-up',label:'Monitor my investments'},
  {icon:'ti-chart-pie',label:'See my full financial picture'},
  {icon:'ti-users',label:'Manage finances with a partner'},
  {icon:'ti-home',label:'Save for a big goal (house, car, trip)'},
  {icon:'ti-telescope',label:'Just exploring'},
];
function showOnboarding(){
  const ov=document.getElementById('onboard-overlay');if(!ov)return;
  _onboardSelected=new Set();
  ov.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;margin-bottom:28px;padding-top:env(safe-area-inset-top)"><div style="width:52px;height:52px;border-radius:14px;background:#6366f118;border:1px solid #6366f133;display:flex;align-items:center;justify-content:center;margin-bottom:16px"><i class="ti ti-sparkles" style="font-size:26px;color:var(--accent)"></i></div><h1 style="font-size:22px;font-weight:700;letter-spacing:-.3px;margin-bottom:8px;text-align:center">Welcome to DistroFi</h1><p style="font-size:14px;color:var(--muted);text-align:center;line-height:1.6;max-width:300px">What brings you here? Pick all that apply — this helps us improve the app.</p></div>
    <div id="onboard-options">${ONBOARD_OPTIONS.map((o,i)=>`<button class="onboard-option" onclick="toggleOnboardOption(${i})" data-idx="${i}"><i class="ti ${o.icon}"></i><span>${o.label}</span></button>`).join('')}</div>
    <button onclick="submitOnboarding()" style="width:100%;padding:15px;background:var(--accent);border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;margin-top:8px">Get started</button>
    <button onclick="skipOnboarding()" style="width:100%;padding:10px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;margin-top:4px">Skip</button>`;
  ov.style.display='flex';
}
function toggleOnboardOption(idx){
  const btn=document.querySelector('[data-idx="'+idx+'"]');if(!btn)return;
  if(_onboardSelected.has(idx)){_onboardSelected.delete(idx);btn.classList.remove('selected');}
  else{_onboardSelected.add(idx);btn.classList.add('selected');}
}
function submitOnboarding(){
  const choices=[..._onboardSelected].map(i=>ONBOARD_OPTIONS[i].label);
  const payload={choices,timestamp:new Date().toISOString(),version:'v8'};
  localStorage.setItem(ONBOARD_KEY,JSON.stringify(payload));
  if(FORMSPREE_ID&&FORMSPREE_ID!=='YOUR_FORM_ID'){
    fetch('https://formspree.io/f/'+FORMSPREE_ID,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({choices:choices.join(', '),timestamp:payload.timestamp})}).catch(()=>{});
  }
  closeOnboarding();
}
function skipOnboarding(){localStorage.setItem(ONBOARD_KEY,JSON.stringify({choices:[],skipped:true,timestamp:new Date().toISOString()}));closeOnboarding();}
function closeOnboarding(){const ov=document.getElementById('onboard-overlay');if(ov)ov.style.display='none';showTutorial();}

// ── Quick Setup ──────────────────────────────────────────────────────
const SETUP_KEY='distrofi_setup_done';
let _setupStep=1;
const QUICK_BILL_CHIPS=['Rent / Mortgage','Car payment','Internet','Phone','Netflix','Spotify','Gym','Electricity','Insurance'];

function showSetup(){
  const done=localStorage.getItem(SETUP_KEY);
  if(done){render();return;}
  _setupStep=1;
  renderSetupStep();
  document.getElementById('setup-overlay').style.display='flex';
}

function renderSetupStep(){
  const ov=document.getElementById('setup-overlay');if(!ov)return;
  if(_setupStep===1){
    const freq=getFreq();
    ov.innerHTML=`
      <div style="padding:env(safe-area-inset-top) 20px 0;display:flex;justify-content:flex-end">
        <button onclick="closeSetup()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;padding:12px 4px">Skip setup</button>
      </div>
      <div class="tutorial-slide" style="justify-content:flex-start;padding-top:24px">
        <div style="width:64px;height:64px;border-radius:20px;background:#22c55e18;border:1.5px solid #22c55e44;display:flex;align-items:center;justify-content:center;margin-bottom:24px;flex-shrink:0">
          <i class="ti ti-cash" style="font-size:32px;color:var(--green)"></i>
        </div>
        <h2 style="font-size:22px;font-weight:700;letter-spacing:-.3px;margin-bottom:8px">What's your take-home pay?</h2>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:28px">After tax, per paycheck. You can always update this later.</p>
        <div style="width:100%;margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">Amount per paycheck</div>
          <div style="display:flex;align-items:center;background:var(--card2);border:1.5px solid var(--accent);border-radius:14px;padding:0 16px;margin-bottom:16px">
            <span style="font-size:24px;font-weight:700;color:var(--muted);margin-right:4px">${getCurrencyDef().symbol}</span>
            <input type="number" id="setup-income" inputmode="decimal" step="0.01" min="0" placeholder="0.00"
              style="flex:1;background:none;border:none;color:var(--text);font-size:28px;font-weight:700;font-family:inherit;outline:none;padding:16px 0;font-variant-numeric:tabular-nums"/>
          </div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">How often do you get paid?</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${FREQ_OPTIONS.map(o=>`<button onclick="selectSetupFreq('${o.id}')" id="sfreq-${o.id}"
              style="padding:12px 8px;background:${freq===o.id?'#6366f114':'var(--card2)'};border:1.5px solid ${freq===o.id?'var(--accent)':'var(--border)'};border-radius:12px;color:${freq===o.id?'var(--accent)':'var(--text)'};font-size:13px;font-weight:${freq===o.id?'600':'400'};cursor:pointer;font-family:inherit;transition:all .15s">
              ${o.label}
            </button>`).join('')}
          </div>
        </div>
      </div>
      <div style="padding:0 24px calc(28px + env(safe-area-inset-bottom))">
        <button onclick="submitSetupStep1()" style="width:100%;padding:16px;background:var(--accent);border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer">
          Next — Add bills
        </button>
      </div>`;
    setTimeout(()=>document.getElementById('setup-income')?.focus(),100);
  } else {
    // Step 2 — bills
    ov.innerHTML=`
      <div style="padding:env(safe-area-inset-top) 20px 0;display:flex;justify-content:space-between;align-items:center">
        <button onclick="_setupStep=1;renderSetupStep()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;padding:12px 4px"><i class="ti ti-arrow-left" style="font-size:16px;vertical-align:-2px"></i> Back</button>
        <button onclick="closeSetup()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;padding:12px 4px">Skip</button>
      </div>
      <div class="tutorial-slide" style="justify-content:flex-start;padding-top:24px">
        <div style="width:64px;height:64px;border-radius:20px;background:#f59e0b18;border:1.5px solid #f59e0b44;display:flex;align-items:center;justify-content:center;margin-bottom:24px;flex-shrink:0">
          <i class="ti ti-receipt-2" style="font-size:32px;color:var(--amber)"></i>
        </div>
        <h2 style="font-size:22px;font-weight:700;letter-spacing:-.3px;margin-bottom:8px">Any regular bills?</h2>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:20px">Tap to add — or type your own. You can add more later from the Bills tab.</p>
        <div style="width:100%">
          <div id="setup-bills-list" style="margin-bottom:12px"></div>
          <input type="text" id="setup-bill-name" placeholder="Bill name (e.g. Rent)" autocomplete="off"
            style="width:100%;padding:12px 14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-family:inherit;outline:none;margin-bottom:8px;box-sizing:border-box"/>
          <div style="display:flex;gap:8px;margin-bottom:14px">
            <div style="display:flex;align-items:center;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;padding:0 12px;flex:1">
              <span style="color:var(--muted);font-size:15px;margin-right:4px">${getCurrencyDef().symbol}</span>
              <input type="number" id="setup-bill-amt" inputmode="decimal" step="0.01" min="0" placeholder="0.00"
                style="flex:1;background:none;border:none;color:var(--text);font-size:15px;font-family:inherit;outline:none;padding:12px 0;font-variant-numeric:tabular-nums"/>
            </div>
            <button onclick="addSetupBill()" style="padding:12px 18px;background:var(--accent);border:none;border-radius:12px;color:#fff;font-size:15px;cursor:pointer;font-family:inherit;font-weight:600;flex-shrink:0">Add</button>
          </div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:10px">Common bills</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${QUICK_BILL_CHIPS.map(c=>`<button onclick="quickSetupBill('${c}')" style="padding:7px 13px;background:var(--card2);border:0.5px solid var(--border);border-radius:99px;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit">${c}</button>`).join('')}
          </div>
        </div>
      </div>
      <div style="padding:0 24px calc(28px + env(safe-area-inset-bottom))">
        <button onclick="closeSetup()" style="width:100%;padding:16px;background:var(--accent);border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer">
          Done — Take me to my budget
        </button>
      </div>`;
    renderSetupBillsList();
  }
}

let _setupBills=[];

function renderSetupBillsList(){
  const el=document.getElementById('setup-bills-list');if(!el)return;
  if(!_setupBills.length){el.innerHTML='';return;}
  el.innerHTML=_setupBills.map((b,i)=>`
    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border:0.5px solid var(--border);border-radius:12px;padding:10px 14px;margin-bottom:8px">
      <span style="font-size:14px;font-weight:500">${b.name}</span>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:14px;font-variant-numeric:tabular-nums;color:var(--muted)">${fmt(b.amount)}</span>
        <button onclick="_setupBills.splice(${i},1);renderSetupBillsList()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px"><i class="ti ti-x" style="font-size:15px"></i></button>
      </div>
    </div>`).join('');
}

function addSetupBill(){
  const name=(document.getElementById('setup-bill-name')?.value||'').trim();
  const amt=parseFloat(document.getElementById('setup-bill-amt')?.value)||0;
  if(!name){showToast('Enter a bill name');return;}
  _setupBills.push({name,amount:amt,recurring:true,paid:false,sortOrder:_setupBills.length*1000});
  document.getElementById('setup-bill-name').value='';
  document.getElementById('setup-bill-amt').value='';
  renderSetupBillsList();
  document.getElementById('setup-bill-name')?.focus();
}

function quickSetupBill(name){
  _setupBills.push({name,amount:0,recurring:true,paid:false,sortOrder:_setupBills.length*1000});
  renderSetupBillsList();
}

function selectSetupFreq(id){
  setFreq(id);
  FREQ_OPTIONS.forEach(o=>{
    const btn=document.getElementById('sfreq-'+o.id);if(!btn)return;
    btn.style.background=o.id===id?'#6366f114':'var(--card2)';
    btn.style.borderColor=o.id===id?'var(--accent)':'var(--border)';
    btn.style.color=o.id===id?'var(--accent)':'var(--text)';
    btn.style.fontWeight=o.id===id?'600':'400';
  });
}

function submitSetupStep1(){
  const amt=parseFloat(document.getElementById('setup-income')?.value)||0;
  if(amt>0){
    if(!C.income)C.income=[];
    if(!C.income.length)C.income.push({label:'Primary job',amount:amt,recurring:true});
    else{C.income[0].amount=amt;}
    saveState();
  }
  _setupStep=2;
  _setupBills=[];
  renderSetupStep();
}

function closeSetup(){
  // Apply any bills from step 2
  if(_setupBills.length){
    C.bills=[...C.bills,..._setupBills];
    saveState();
  }
  localStorage.setItem(SETUP_KEY,'done');
  document.getElementById('setup-overlay').style.display='none';
  render();
  if(_setupBills.length||C.income?.length){
    showToast("Budget set up — you\'re ready to go! 🎉",3000);
  }
}

// ── Tutorial ─────────────────────────────────────────────────────────
const TUTORIAL_KEY='distrofi_tutorial_done';
let _tutSlide=0;
const TUTORIAL_SLIDES=[
  {icon:'ti-refresh',color:'var(--accent)',title:'Know where you stand after every paycheck',body:'Most budgeting apps reset at the end of the month. DistroFi resets when you get paid — so you always know exactly what\'s left before your next paycheck arrives.'},
  {icon:'ti-cash',color:'var(--green)',title:'Start with your income',body:'Head to the Home tab and tap Income to enter your take-home pay. Add multiple sources — salary, side hustle, partner income — and tag who earns what.'},
  {icon:'ti-receipt-2',color:'var(--amber)',title:'Set up your bills',body:'Go to the Bills tab and add your recurring expenses — rent, subscriptions, utilities. Mark them paid as you go. DistroFi carries unpaid bills into the next cycle automatically.'},
  {icon:'ti-wallet',color:'var(--blue)',title:'Create spending buckets',body:'The Spend tab lets you set a budget for each category — Groceries, Dining, Entertainment. Log expenses as you spend and watch your buckets fill up in real time.'},
  {icon:'ti-pig-money',color:'#2dd4bf',title:'Track savings & investments',body:'The Invest tab tracks your savings goals, brokerage investments, and 401k contributions across every pay period. Watch your net worth grow over time in the Summary tab.'},
  {icon:'ti-rocket',color:'var(--accent)',title:"You're all set!",body:"That's everything you need to know. Start by adding your income for this pay period. You can always revisit any screen by tapping the nav bar at the bottom."},
];

function showTutorial(){
  const done=localStorage.getItem(TUTORIAL_KEY);
  if(done)return; // already seen
  _tutSlide=0;
  renderTutorialSlide();
  document.getElementById('tutorial-overlay').style.display='flex';
}

function renderTutorialSlide(){
  const ov=document.getElementById('tutorial-overlay');if(!ov)return;
  const s=TUTORIAL_SLIDES[_tutSlide];
  const isLast=_tutSlide===TUTORIAL_SLIDES.length-1;
  const dots=TUTORIAL_SLIDES.map((_,i)=>`<div class="tutorial-dot${i===_tutSlide?' active':''}"></div>`).join('');
  ov.innerHTML=`
    <div style="padding:env(safe-area-inset-top) 20px 0;display:flex;justify-content:flex-end">
      <button onclick="closeTutorial()" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;padding:12px 4px">Skip</button>
    </div>
    <div class="tutorial-slide">
      <div style="width:80px;height:80px;border-radius:24px;background:${s.color}18;border:1.5px solid ${s.color}44;display:flex;align-items:center;justify-content:center;margin-bottom:28px">
        <i class="ti ${s.icon}" style="font-size:38px;color:${s.color}"></i>
      </div>
      <h2 style="font-size:22px;font-weight:700;letter-spacing:-.3px;margin-bottom:14px;line-height:1.2">${s.title}</h2>
      <p style="font-size:15px;color:var(--muted);line-height:1.7;max-width:300px">${s.body}</p>
    </div>
    <div style="padding:0 24px calc(32px + env(safe-area-inset-bottom))">
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px">${dots}</div>
      <button onclick="${isLast?'closeTutorial()':'nextTutorialSlide()'}" style="width:100%;padding:16px;background:var(--accent);border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;margin-bottom:10px">
        ${isLast?"Let's go →":'Next'}
      </button>
      ${_tutSlide>0?`<button onclick="prevTutorialSlide()" style="width:100%;padding:12px;background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;font-family:inherit">Back</button>`:''}
    </div>`;
}

function nextTutorialSlide(){if(_tutSlide<TUTORIAL_SLIDES.length-1){_tutSlide++;renderTutorialSlide();}}
function prevTutorialSlide(){if(_tutSlide>0){_tutSlide--;renderTutorialSlide();}}
function closeTutorial(){
  localStorage.setItem(TUTORIAL_KEY,'done');
  const ov=document.getElementById('tutorial-overlay');
  if(ov)ov.style.display='none';
  showSetup();
}
function openSettingsModal(){
  const light=isLight();
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Settings</h3>
    ${isPro()?`<div style="background:linear-gradient(135deg,${isCouplePro()?'#ec489918,#f43f5e18':'#7c3aed18,#6366f118'});border:0.5px solid ${isCouplePro()?'#ec489944':'#6366f144'};border-radius:12px;padding:12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <i class="ti ti-${isCouplePro()?'users':'crown'}" style="font-size:18px;color:${isCouplePro()?'#ec4899':'var(--accent)'}"></i>
      <div style="font-size:13px;font-weight:600">${isCouplePro()?'Couples':'Pro Solo'} — Active</div>
      <span style="margin-left:auto;font-size:11px;background:linear-gradient(135deg,${isCouplePro()?'#ec4899,#f43f5e':'#7c3aed,#6366f1'});color:#fff;padding:3px 10px;border-radius:99px;font-weight:700">${isCouplePro()?'COUPLES':'PRO'}</span>
    </div>`:`<div style="background:var(--card2);border-radius:12px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Free forever</div>
        <div style="font-size:12px;color:var(--muted)">Unlimited tracking · Upgrade for AI &amp; more</div>
      </div>
      <button onclick="closeModal();openProSettings()" style="padding:6px 12px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:99px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Upgrade</button>
    </div>`}
    <div style="display:flex;flex-direction:column;gap:2px">
      <div onclick="toggleTheme()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <div style="display:flex;align-items:center;gap:14px">
          <i class="ti ti-${light?'moon':'sun'}" style="font-size:20px;color:var(--amber)"></i>
          <div><div id="theme-toggle-label" style="font-size:15px;font-weight:500">${light?'Dark':'Light'} mode</div><div id="theme-toggle-sub" style="font-size:12px;color:var(--muted);margin-top:2px">Currently ${light?'light':'dark'}</div></div>
        </div>
        <div id="theme-toggle-bar" style="width:44px;height:26px;border-radius:99px;background:${light?'var(--accent)':'var(--border)'};position:relative;transition:background .2s;flex-shrink:0">
          <div id="theme-toggle-knob" style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;left:${light?'21px':'3px'};transition:left .2s"></div>
        </div>
      </div>
      <div onclick="openPartnerSetup()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <div style="display:flex;align-items:center;gap:14px"><i class="ti ti-users" style="font-size:20px;color:var(--accent)"></i><div><div style="font-size:15px;font-weight:500">Finance together</div><div style="font-size:12px;color:var(--muted);margin-top:2px" id="partner-setting-sub">${getHouseholdId()&&getPartners().p2?'<span style="color:var(--green)">⬤</span> '+p1Name()+' & '+p2Name()+' · Live sync':getPartners().p2?p1Name()+' & '+p2Name():'Tap to connect with partner'}</div></div></div>
        <i class="ti ti-chevron-right" style="font-size:18px;color:var(--muted)"></i>
      </div>
      <div onclick="openCurrencyPicker();" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <div style="display:flex;align-items:center;gap:14px"><i class="ti ti-currency-dollar" style="font-size:20px;color:var(--accent)"></i><div><div style="font-size:15px;font-weight:500">Currency</div><div style="font-size:12px;color:var(--muted);margin-top:2px" id="currency-setting-sub">${getCurrencyDef().label}</div></div></div>
        <i class="ti ti-chevron-right" style="font-size:18px;color:var(--muted)"></i>
      </div>
      <div onclick="openFreqPicker();closeModal();" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <div style="display:flex;align-items:center;gap:14px"><i class="ti ti-calendar-repeat" style="font-size:20px;color:var(--accent)"></i><div><div style="font-size:15px;font-weight:500">Pay frequency</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${freqLabel()}</div></div></div>
        <i class="ti ti-chevron-right" style="font-size:18px;color:var(--muted)"></i>
      </div>
      <div onclick="closeModal();startNewCycle();" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-refresh" style="font-size:20px;color:var(--accent)"></i>
        <div><div style="font-size:15px;font-weight:500">New pay period</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Archive current cycle and start fresh</div></div>
      </div>
      <div onclick="showScreen('history',null);closeModal();" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-clock" style="font-size:20px;color:var(--blue)"></i>
        <div><div style="font-size:15px;font-weight:500">Pay period history</div><div style="font-size:12px;color:var(--muted);margin-top:2px">View all past cycles</div></div>
      </div>
      <div onclick="exportData();closeModal();" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-download" style="font-size:20px;color:var(--green)"></i>
        <div><div style="font-size:15px;font-weight:500">Export data</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Download your data as JSON</div></div>
      </div>
      <div onclick="confirmClearData();" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-trash" style="font-size:20px;color:var(--red)"></i>
        <div><div style="font-size:15px;font-weight:500;color:var(--red)">Clear all data</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Reset the app — cannot be undone</div></div>
      </div>
      <div onclick="closeModal();openProSettings();" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:14px">
          <i class="ti ti-crown" style="font-size:20px;color:#f59e0b"></i>
          <div><div style="font-size:15px;font-weight:500">${isPro()?(isCouplePro()?'Couples — Active':'Pro Solo — Active'):'Upgrade to Pro'}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${isPro()?(isCouplePro()?'Shared features unlocked · $4.99/mo':'AI, trends & more unlocked · $2.99/mo'):'Solo $2.99 · Couples $4.99 · Free trial'}</div></div>
        </div>
        ${isPro()?`<span style="font-size:11px;background:linear-gradient(135deg,${isCouplePro()?'#ec4899,#f43f5e':'#7c3aed,#6366f1'});color:#fff;padding:3px 10px;border-radius:99px;font-weight:700">${isCouplePro()?'COUPLES':'PRO'}</span>`:'<i class="ti ti-chevron-right" style="font-size:18px;color:var(--muted)"></i>'}
      </div>
      <div onclick="openFeedbackModal()" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-top:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-message-circle" style="font-size:20px;color:var(--accent)"></i>
        <div><div style="font-size:15px;font-weight:500">Send feedback</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Bugs, ideas, or anything on your mind</div></div>
      </div>
      <div onclick="confirmLogout();" style="display:flex;align-items:center;gap:14px;padding:14px 4px;border-top:0.5px solid var(--border);cursor:pointer">
        <i class="ti ti-logout" style="font-size:20px;color:var(--muted)"></i>
        <div><div style="font-size:15px;font-weight:500">Log out</div><div style="font-size:12px;color:var(--muted);margin-top:2px" id="settings-auth-sub">Signed in</div></div>
      </div>
    </div>
    <div class="modal-btns" style="margin-top:16px">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    </div>
  </div></div>`;
  const a=getAuth();
  const sub=document.getElementById('settings-auth-sub');
  if(sub&&a){sub.textContent=a.method==='guest'?'Browsing as guest':a.username?'@'+a.username:(a.name||'Signed in');}
}

function openFeedbackModal(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Send feedback</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.5">Help us improve DistroFi — bugs, ideas, or anything on your mind.</p>
    <span class="modal-label">Type</span>
    <select id="fb-type" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-family:inherit;margin-bottom:12px;outline:none;appearance:none">
      <option value="Suggestion">💡 Suggestion</option>
      <option value="Bug report">🐛 Bug report</option>
      <option value="General">💬 General feedback</option>
    </select>
    <span class="modal-label">Message</span>
    <textarea id="fb-msg" placeholder="Tell us what's on your mind..." rows="4"
      style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:14px;font-family:inherit;margin-bottom:12px;outline:none;resize:none;line-height:1.5"></textarea>
    <span class="modal-label">Email (optional — for follow-up)</span>
    <input type="email" id="fb-email" placeholder="your@email.com" style="width:100%;padding:14px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:15px;font-family:inherit;margin-bottom:12px;outline:none"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitFeedback()">Send</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('fb-msg').focus(),100);
}
async function submitFeedback(){
  const type=document.getElementById('fb-type').value;
  const msg=document.getElementById('fb-msg').value.trim();
  const email=document.getElementById('fb-email').value.trim();
  if(!msg){document.getElementById('fb-msg').style.borderColor='var(--red)';return;}
  const btn=document.querySelector('#modal-root .btn-primary');
  btn.disabled=true;btn.textContent='Sending...';
  try{
    await fetch('https://formspree.io/f/'+FORMSPREE_ID,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({type,message:msg,email:email||'not provided',source:'in-app feedback'})
    });
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="text-align:center;padding:32px 24px">
      <i class="ti ti-circle-check" style="font-size:48px;color:var(--green);display:block;margin-bottom:16px"></i>
      <div style="font-size:18px;font-weight:600;margin-bottom:8px">Thanks for the feedback!</div>
      <div style="font-size:14px;color:var(--muted);margin-bottom:24px;line-height:1.5">We read every message and use it to make DistroFi better.</div>
      <button class="btn btn-primary" style="width:100%" onclick="closeModal()">Done</button>
    </div></div>`;
  }catch(e){btn.disabled=false;btn.textContent='Send';}
}
function confirmLogout(){
  const a=getAuth();
  const isGuest=a&&a.method==='guest';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Log out?</h3>
    <p style="font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.6">${isGuest?'You are browsing as a guest. Your data stays on this device, but you will see the login screen again.':'You will need to log in again to access your budget.'}</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="logOut()">Log out</button>
    </div>
  </div></div>`;
}

function openCurrencyPicker(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Currency</h3>
    ${CURRENCIES.map(c=>`<div onclick="selectCurrency('${c.code}')" style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:${getCurrencyCode()===c.code?'#6366f114':'var(--card2)'};border:1.5px solid ${getCurrencyCode()===c.code?'var(--accent)':'var(--border)'};border-radius:12px;margin-bottom:8px;cursor:pointer">
      <span style="font-size:15px;font-weight:${getCurrencyCode()===c.code?'600':'400'};color:${getCurrencyCode()===c.code?'var(--accent)':'var(--text)'}">${c.label}</span>
      ${getCurrencyCode()===c.code?'<i class="ti ti-check" style="font-size:18px;color:var(--accent)"></i>':''}
    </div>`).join('')}
    <div class="modal-btns" style="margin-top:8px"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button></div>
  </div></div>`;
}
function selectCurrency(code){STATE.currency=code;saveState();closeModal();render();}

function confirmCancelPlan(tierLabel){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>Cancel ${tierLabel}?</h3>
    <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:20px">You'll lose access to all Pro features immediately. Your budget data is safe and stays on your account.</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="openProSettings()">Keep plan</button>
      <button class="btn btn-danger" onclick="deactivatePro();closeModal();">Yes, cancel</button>
    </div>
  </div></div>`;
}
function openAccountModal(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Account</h3>
    <div style="display:flex;flex-direction:column;align-items:center;padding:16px 0 24px">
      <div style="display:flex;align-items:center;justify-content:center;margin-bottom:12px"><img src="/assets/account.png" alt="Divvy — finance together" style="width:96px;height:auto;object-fit:contain"/></div>
      <div style="font-size:18px;font-weight:600">My Account</div>
      <div style="font-size:13px;color:var(--muted);margin-top:4px">Local data · No sign-in required</div>
    </div>
    <div style="background:var(--card2);border-radius:12px;padding:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid var(--border)">
        <span style="font-size:13px;color:var(--muted)">Pay periods tracked</span>
        <span style="font-size:13px;font-weight:500">${[...STATE.history,C].length}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid var(--border)">
        <span style="font-size:13px;color:var(--muted)">All-time savings</span>
        <span style="font-size:13px;font-weight:500;color:var(--green)">${fmt(allTimeSavings())}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="font-size:13px;color:var(--muted)">All-time invested</span>
        <span style="font-size:13px;font-weight:500;color:var(--purple)">${fmt(allTimeInvestments().grand)}</span>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    </div>
  </div></div>`;
}

function exportData(){
  if(!gateFeature('export'))return;
  const data=JSON.stringify(STATE,null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='distrofi_backup.json';
  document.body.appendChild(a);a.click();
  document.body.removeChild(a);URL.revokeObjectURL(url);
}

function confirmClearData(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <h3>Clear all data?</h3>
    <p style="font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.6">This will permanently delete all pay periods, goals, investments, and settings. This cannot be undone.</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="clearAllData()">Clear everything</button>
    </div>
  </div></div>`;
}

function clearAllData(){
  localStorage.clear();
  location.reload();
}


function openSpendingChart(){
  // spending chart is free
  const income = totalIncome();
  const bills = totalBills();
  const savings = (C.savings.perPaycheck||0) + currentExtraSavings();
  const invested = totalInvested();
  const rem = Math.max(0, remaining());

  const bucketData = Object.values(C.buckets).map(b=>({
    label: b.label,
    value: bucketSpent(Object.keys(C.buckets).find(k=>C.buckets[k]===b)||''),
    color: null
  })).filter(b=>b.value>0);

  const segments = [
    {label:'Bills', value:bills, color:'#ef4444'},
    {label:'Savings', value:savings, color:'#22c55e'},
    {label:'Invested', value:invested, color:'#a855f7'},
    ...bucketData.map((b,i)=>{
      const cols=['#f59e0b','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6'];
      return{...b, color:cols[i%cols.length]};
    }),
    {label:'Remaining', value:rem, color:'#6366f1'},
  ].filter(s=>s.value>0);

  const total = segments.reduce((a,s)=>a+s.value,0);
  const legendItems = segments.map(s=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid #2a2e42">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:2px;background:${s.color};flex-shrink:0"></div>
        <span style="font-size:13px;color:#e2e8f0">${s.label}</span>
      </div>
      <div style="text-align:right">
        <span style="font-size:13px;font-weight:500;color:#e2e8f0;font-variant-numeric:tabular-nums">${fmt(s.value)}</span>
        <span style="font-size:11px;color:#8892a4;margin-left:6px">${total>0?((s.value/total)*100).toFixed(0):'0'}%</span>
      </div>
    </div>`).join('');

  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal" style="padding-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0">This period</h3>
        <button onclick="closeModal()" style="background:none;border:none;color:#8892a4;cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
      </div>
      <div style="position:relative;width:200px;height:200px;margin:0 auto 20px">
        <canvas id="spend-pie" width="200" height="200" role="img" aria-label="Spending breakdown pie chart">Breakdown of income allocation this pay period.</canvas>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:16px" id="pie-legend">
        ${segments.map(s=>`<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#8892a4"><span style="width:8px;height:8px;border-radius:2px;background:${s.color}"></span>${s.label}</span>`).join('')}
      </div>
      <div>${legendItems}</div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;border-top:0.5px solid #2a2e42;margin-top:4px">
        <span style="font-size:14px;font-weight:500;color:#e2e8f0">Total income</span>
        <span style="font-size:14px;font-weight:500;color:#e2e8f0;font-variant-numeric:tabular-nums">${fmt(income)}</span>
      </div>
    </div>
  </div>`;

  setTimeout(()=>{
    const canvas = document.getElementById('spend-pie');
    if(!canvas)return;
    const ctx = canvas.getContext('2d');
    const cx=100,cy=100,r=90,ir=50;
    let start = -Math.PI/2;
    segments.forEach(s=>{
      const slice = (s.value/total)*2*Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,start+slice);
      ctx.closePath();
      ctx.fillStyle=s.color;
      ctx.fill();
      ctx.strokeStyle='#0f1117';
      ctx.lineWidth=2;
      ctx.stroke();
      start+=slice;
    });
    ctx.beginPath();
    ctx.arc(cx,cy,ir,0,2*Math.PI);
    ctx.fillStyle='#1a1d27';
    ctx.fill();
    ctx.fillStyle='#e2e8f0';
    ctx.font='500 13px -apple-system,sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('Income',cx,cy-8);
    ctx.font='500 15px -apple-system,sans-serif';
    ctx.fillText(fmt(income).replace('.00',''),cx,cy+10);
  },50);
}


function openPaywall(feature){
  const featureInfo={
    advisor:{name:'AI Financial Advisor',tier:'solo',why:'Ask anything about your budget, goals, or spending and get answers grounded in your actual numbers — not generic advice.'},
    export:{name:'Data export',tier:'solo',why:'Download your full budget history as JSON to back it up, import into a spreadsheet, or migrate to another tool.'},
    trends:{name:'Full spending trends',tier:'solo',why:'Unlock your complete multi-period trend history with category breakdowns going back as far as you have tracked.'},
    invgoals:{name:'Investment goals',tier:'solo',why:'Track exactly how close you are to retirement, a down payment, or any long-term target with your real investment numbers.'},
    watchlist:{name:'Custom watchlist',tier:'solo',why:'Pin the stocks and crypto you actually care about to your Marketplace screen.'},
    partner:{name:'Shared finances',tier:'couples',why:'Sync budgets in real time with your partner, see who paid what, and track your combined net worth together.'},
    partnersync:{name:'Partner sync',tier:'couples',why:'Keep both of your views in sync automatically — no manual sharing or exports needed.'},
  };
  const info=featureInfo[feature]||{name:'This Pro feature',tier:'solo',why:'Upgrade to DistroFi Pro to unlock this feature and everything else.'};
  const isCouplesFeature=info.tier==='couples';
  const freeItems=['Unlimited buckets, bills & savings goals','Full pay period history','Partner expense tracking (single device)','Recurring bills & budget rollover','Bill priority & reorder','All core tracking — forever free'];
  const soloItems=['AI Financial Advisor','Full spending trends & insights','Investment goal tracking','Data export (JSON)','Custom market watchlist'];
  const couplesItems=['Real-time partner sync','Shared savings goals','Combined net worth view','Per-person spending reports','Everything in Pro Solo'];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="text-align:center;padding-bottom:14px;border-bottom:0.5px solid var(--border);margin-bottom:14px">
      <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,${isCouplesFeature?'#ec4899,#f43f5e':'#7c3aed,#6366f1'});display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
        <i class="ti ti-${isCouplesFeature?'users':'crown'}" style="font-size:24px;color:#fff"></i>
      </div>
      <h3 style="margin-bottom:6px">${isCouplesFeature?'DistroFi Couples':'DistroFi Pro'}</h3>
      <p style="font-size:13px;color:var(--muted);line-height:1.5;max-width:280px;margin:0 auto"><strong style="color:var(--text)">${info.name}</strong> — ${info.why}</p>
    </div>
    <div style="background:var(--card2);border-radius:12px;padding:12px;margin-bottom:10px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--green);margin-bottom:8px">Free forever includes</div>
      ${freeItems.map(f=>`<div style="display:flex;align-items:flex-start;gap:8px;padding:3px 0"><i class="ti ti-check" style="font-size:13px;color:var(--green);flex-shrink:0;margin-top:1px"></i><span style="font-size:12px;color:var(--muted);line-height:1.4">${f}</span></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:linear-gradient(135deg,#7c3aed12,#6366f112);border:1.5px solid ${!isCouplesFeature?'var(--accent)':'var(--border)'};border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)">Pro Solo</div>
          <div style="font-size:13px;font-weight:700;color:var(--accent)">$2.99<span style="font-size:10px;font-weight:400;color:var(--muted)">/mo</span></div>
        </div>
        ${soloItems.map(f=>`<div style="display:flex;align-items:flex-start;gap:6px;padding:2px 0"><i class="ti ti-sparkles" style="font-size:12px;color:var(--accent);flex-shrink:0;margin-top:2px"></i><span style="font-size:11px;line-height:1.4">${f}</span></div>`).join('')}
      </div>
      <div style="background:linear-gradient(135deg,#ec489912,#f43f5e12);border:1.5px solid ${isCouplesFeature?'#ec4899':'var(--border)'};border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#ec4899">Couples</div>
          <div style="font-size:13px;font-weight:700;color:#ec4899">$4.99<span style="font-size:10px;font-weight:400;color:var(--muted)">/mo</span></div>
        </div>
        ${couplesItems.map(f=>`<div style="display:flex;align-items:flex-start;gap:6px;padding:2px 0"><i class="ti ti-heart" style="font-size:12px;color:#ec4899;flex-shrink:0;margin-top:2px"></i><span style="font-size:11px;line-height:1.4">${f}</span></div>`).join('')}
      </div>
    </div>
    ${isCouplesFeature?`
    <button onclick="startTrial('couples')" style="width:100%;padding:14px;background:linear-gradient(135deg,#ec4899,#f43f5e);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">
      Start free trial — Couples
    </button>
    <button onclick="startTrial('solo')" style="width:100%;padding:12px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px">
      Start free trial — Pro Solo ($2.99/mo)
    </button>`:`
    <button onclick="startTrial('solo')" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">
      Start free trial — Pro Solo
    </button>
    <button onclick="startTrial('couples')" style="width:100%;padding:12px;background:var(--card2);border:0.5px solid var(--border);border-radius:12px;color:var(--text);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px">
      Couples plan — $4.99/mo
    </button>`}
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:8px">7-day free trial · Cancel anytime</div>
    <button onclick="closeModal()" style="width:100%;padding:10px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit">Maybe later</button>
  </div></div>`;
}

function startTrial(tier){
  // UI demo — in production this would initiate Stripe checkout
  const t=tier||'solo';
  closeModal();
  activatePro(t);
  const isCouple=t==='couples';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="text-align:center;padding:32px 24px">
    <div style="font-size:48px;margin-bottom:12px">🎉</div>
    <h3 style="margin-bottom:8px">Welcome to ${isCouple?'DistroFi Couples':'DistroFi Pro'}!</h3>
    <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:20px">Your 7-day free trial has started.<br>${isCouple?'Partner sync and all shared features are now unlocked.':'All Pro features are now unlocked.'}</p>
    <button onclick="closeModal();render();" style="width:100%;padding:14px;background:linear-gradient(135deg,${isCouple?'#ec4899,#f43f5e':'#7c3aed,#6366f1'});border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">Let's go</button>
  </div></div>`;
}

function openProSettings(){
  const pro=isPro();
  const couples=isCouplePro();
  const tier=couples?'couples':'solo';
  const tierLabel=couples?'DistroFi Couples':'Pro Solo';
  const tierPrice=couples?'$4.99/mo':'$2.99/mo';
  const tierColor=couples?'#ec4899,#f43f5e':'#7c3aed,#6366f1';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3 style="margin-bottom:16px">${pro?tierLabel+' — Active':'Upgrade'}</h3>
    ${pro?`
    <div style="background:linear-gradient(135deg,${tierColor}22);border:0.5px solid ${couples?'#ec489944':'#6366f144'};border-radius:14px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <i class="ti ti-${couples?'users':'crown'}" style="font-size:24px;color:${couples?'#ec4899':'var(--accent)'};flex-shrink:0"></i>
      <div>
        <div style="font-size:14px;font-weight:600">${tierLabel} is active</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">All ${couples?'shared &':''} Pro features unlocked · ${tierPrice}</div>
      </div>
    </div>
    ${!couples?`<button onclick="closeModal();startTrial('couples')" style="width:100%;padding:12px;background:linear-gradient(135deg,#ec4899,#f43f5e);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:12px">
      Upgrade to Couples — $4.99/mo
    </button>`:''}
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-danger" onclick="confirmCancelPlan('${tierLabel}')">Cancel plan</button>
    </div>`:`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:linear-gradient(135deg,#7c3aed12,#6366f112);border:1.5px solid var(--accent);border-radius:12px;padding:12px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:6px">Pro Solo</div>
        <div style="font-size:16px;font-weight:700;color:var(--accent);margin-bottom:8px">$2.99<span style="font-size:11px;font-weight:400;color:var(--muted)">/mo</span></div>
        ${['AI Advisor','Spending trends','Inv. goals','Data export','Watchlist'].map(f=>`<div style="font-size:11px;color:var(--muted);padding:1px 0">✦ ${f}</div>`).join('')}
      </div>
      <div style="background:linear-gradient(135deg,#ec489912,#f43f5e12);border:1.5px solid #ec4899;border-radius:12px;padding:12px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#ec4899;margin-bottom:6px">Couples</div>
        <div style="font-size:16px;font-weight:700;color:#ec4899;margin-bottom:8px">$4.99<span style="font-size:11px;font-weight:400;color:var(--muted)">/mo</span></div>
        ${['Everything in Solo','Partner sync','Shared goals','Combined NW','Per-person reports'].map(f=>`<div style="font-size:11px;color:var(--muted);padding:1px 0">♥ ${f}</div>`).join('')}
      </div>
    </div>
    <button onclick="startTrial('solo')" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">
      Start free trial — Pro Solo
    </button>
    <button onclick="startTrial('couples')" style="width:100%;padding:12px;background:linear-gradient(135deg,#ec4899,#f43f5e);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:10px">
      Start free trial — Couples
    </button>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:8px">7-day free trial · Cancel anytime</div>
    <button class="btn btn-ghost" onclick="closeModal()">Maybe later</button>`}
  </div></div>`;
}



// ── What-if scenario planner ──
let _wiDeltas={income:0,savings:0,bills:0,spend:0};
function resetWhatIf(){
  _wiDeltas={income:0,savings:0,bills:0,spend:0};
  renderWhatIf();
}
function renderWhatIf(){
  const sl=document.getElementById('whatif-sliders');
  const res=document.getElementById('whatif-result');
  if(!sl||!res)return;
  const base={
    income:totalIncome(),
    savings:C.savings.perPaycheck+currentExtraSavings(),
    bills:totalBills(),
    spend:totalSpent(),
  };
  const scenarios=[
    {key:'income',label:'Income',icon:'ti-cash',col:'var(--green)',step:50,min:-500,max:1000},
    {key:'savings',label:'Savings',icon:'ti-pig-money',col:'var(--blue)',step:25,min:-200,max:500},
    {key:'bills',label:'Bills',icon:'ti-checklist',col:'var(--amber)',step:25,min:-300,max:300},
    {key:'spend',label:'Spending',icon:'ti-wallet',col:'var(--red)',step:25,min:-300,max:300},
  ];
  sl.innerHTML=scenarios.map(s=>{
    const delta=_wiDeltas[s.key]||0;
    const sign=delta>0?'+':'';
    const pct=Math.round(((delta-(s.min))/(s.max-s.min))*100);
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:6px"><i class="ti ${s.icon}" style="font-size:14px;color:${s.col}"></i><span style="font-size:13px;font-weight:500">${s.label}</span></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums">${fmt(base[s.key])}</span>
          ${delta!==0?`<span style="font-size:12px;font-weight:600;color:${s.col};font-variant-numeric:tabular-nums">${sign}${fmt(Math.abs(delta))}</span>`:''}
        </div>
      </div>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${delta}"
        style="width:100%;accent-color:${s.col};cursor:pointer"
        oninput="_wiDeltas['${s.key}']=parseInt(this.value);renderWhatIf()"/>
    </div>`;
  }).join('');
  // Calculate projected remaining
  const projected=(base.income+(_wiDeltas.income||0))
    -(base.bills+(_wiDeltas.bills||0))
    -(base.savings+(_wiDeltas.savings||0))
    -(totalInvested())
    -(base.spend+(_wiDeltas.spend||0));
  res.textContent=fmt(projected);
  res.style.color=projected<0?'var(--red)':projected<200?'var(--amber)':'var(--green)';
}
function openSpendingTrends(){
  // Free for first 3 periods — only gate once user has more history than a trial would show
  const allCycles=[...STATE.history, C];
  if(allCycles.length>3&&!isPro()&&!hasUsedTrial('trends')){
    markTrialUsed('trends');
  } else if(allCycles.length>3&&!isPro()&&hasUsedTrial('trends')){
    openPaywall('trends');return;
  }

  // Build per-cycle stats
  const data=allCycles.map(cyc=>{
    const inc=Array.isArray(cyc.income)?cyc.income.reduce((s,l)=>s+(l.amount||0),0):((cyc.income?.week1||0)+(cyc.income?.week2||0)+(cyc.income?.extra||0));
    const bills=(cyc.bills||[]).reduce((s,b)=>s+(b.amount||0),0);
    const sav=((cyc.savings?.perPaycheck||0))+((cyc.savings?.extra||[]).reduce((a,e)=>a+(e.amount||0),0));
    const spent=Object.keys(cyc.buckets||{}).reduce((a,k)=>a+(cyc.buckets[k].transactions||[]).reduce((b,t)=>b+(t.amount||0),0),0);
    const invested=(cyc.investments||[]).reduce((s,i)=>s+(i.amount||0),0);
    const label=cyc.startDate?new Date(cyc.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';
    return{label,inc,bills,sav,spent,invested};
  });

  // Category breakdown across all cycles
  const catTotals={};
  allCycles.forEach(cyc=>{
    Object.keys(cyc.buckets||{}).forEach(k=>{
      const b=cyc.buckets[k];
      const v=(b.transactions||[]).reduce((a,t)=>a+(t.amount||0),0);
      catTotals[b.label]=(catTotals[b.label]||0)+v;
    });
  });

  const avgSpent=data.length?data.reduce((a,d)=>a+d.spent,0)/data.length:0;
  const maxSpent=Math.max(...data.map(d=>d.spent),1);
  const avgSaved=data.length?data.reduce((a,d)=>a+d.sav,0)/data.length:0;
  const trend=data.length>=2?(data[data.length-1].spent-data[0].spent):0;

  // Build the spending-over-time bar chart bars
  const chartBars=data.length<=1?'<div style="flex:1;text-align:center;color:var(--muted);font-size:13px;padding:20px 0">Start a new pay period to see your spending trend over time.</div>':data.map((d,i)=>{
    const h=Math.max(4,(d.spent/maxSpent)*100);
    return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">
      <div style="font-size:9px;color:var(--muted);font-variant-numeric:tabular-nums">${d.spent>0?'$'+Math.round(d.spent):''}</div>
      <div style="width:60%;max-width:28px;height:${h}px;background:linear-gradient(180deg,var(--blue),#60a5fa);border-radius:4px 4px 0 0;transition:height .4s ease"></div>
      <div style="font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40px">${d.label}</div>
    </div>`;
  }).join('');

  // Category breakdown bars
  const catEntries=Object.entries(catTotals).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const catMax=Math.max(...catEntries.map(([,v])=>v),1);
  const cols=['#3b82f6','#f59e0b','#ec4899','#14b8a6','#a855f7','#f97316'];
  const catBars=catEntries.map(([name,val],i)=>`
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;color:var(--text)">${name}</span>
        <span style="font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums">${fmt(val)}</span>
      </div>
      <div style="height:7px;background:var(--card2);border-radius:99px;overflow:hidden">
        <div style="height:100%;width:${(val/catMax*100).toFixed(0)}%;background:${cols[i%cols.length]};border-radius:99px"></div>
      </div>
    </div>`).join('') || '<div style="font-size:13px;color:var(--muted);padding:8px 0">No spending logged yet</div>';

  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <h3 style="margin:0">Spending habits</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">
      <div style="background:var(--card2);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Avg / period</div>
        <div style="font-size:18px;font-weight:700;font-variant-numeric:tabular-nums">${fmt(avgSpent)}</div>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:12px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Avg saved</div>
        <div style="font-size:18px;font-weight:700;color:var(--green);font-variant-numeric:tabular-nums">${fmt(avgSaved)}</div>
      </div>
    </div>

    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Spending over time</div>
    <div style="display:flex;align-items:flex-end;gap:4px;height:130px;padding:8px 0 0;margin-bottom:6px;border-bottom:0.5px solid var(--border)">
      ${chartBars}
    </div>
    <div style="font-size:12px;color:${trend>0?'var(--red)':'var(--green)'};margin-bottom:18px;display:flex;align-items:center;gap:6px">
      <i class="ti ti-${trend>0?'trending-up':'trending-down'}" style="font-size:15px"></i>
      ${trend>0?'Spending up ':trend<0?'Spending down ':'Flat '}${trend!==0?fmt(Math.abs(trend))+' since first cycle':'vs first cycle'}
    </div>

    <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">By category — all time</div>
    ${catBars}
  </div></div>`;
}


// ── MARKETPLACE DATA (sample/demo — replace with live feeds in Phase 2) ──
const MKT_STOCKS=[
  {sym:'SPY',name:'S&P 500 ETF',price:'$548.20',chg:'+0.82%',up:true,spark:[20,22,21,24,23,26,28,27,30]},
  {sym:'AAPL',name:'Apple Inc.',price:'$229.15',chg:'+1.14%',up:true,spark:[18,17,19,20,19,22,21,24,25]},
  {sym:'TSLA',name:'Tesla Inc.',price:'$248.50',chg:'-1.92%',up:false,spark:[30,28,29,26,27,24,22,23,20]},
  {sym:'NVDA',name:'NVIDIA Corp.',price:'$132.65',chg:'+2.41%',up:true,spark:[15,18,17,20,22,24,23,27,30]},
  {sym:'MSFT',name:'Microsoft',price:'$424.80',chg:'+0.55%',up:true,spark:[22,23,22,24,25,24,26,27,28]},
  {sym:'AMZN',name:'Amazon',price:'$186.40',chg:'+1.62%',up:true,spark:[18,19,21,20,22,24,23,25,27]},
  {sym:'GOOGL',name:'Alphabet',price:'$178.30',chg:'-0.41%',up:false,spark:[26,25,27,24,25,23,24,22,23]},
  {sym:'META',name:'Meta Platforms',price:'$512.20',chg:'+2.08%',up:true,spark:[20,22,24,23,26,28,27,30,32]},
  {sym:'QQQ',name:'Nasdaq 100 ETF',price:'$478.90',chg:'+1.05%',up:true,spark:[21,22,24,23,25,27,26,28,30]},
  {sym:'AMD',name:'AMD',price:'$162.40',chg:'-1.20%',up:false,spark:[28,27,29,26,25,24,26,23,22]},
  {sym:'DIS',name:'Disney',price:'$98.75',chg:'+0.34%',up:true,spark:[19,20,19,21,20,22,21,23,24]},
  {sym:'JPM',name:'JPMorgan Chase',price:'$204.10',chg:'+0.92%',up:true,spark:[22,23,24,23,25,26,25,27,28]},
];
const MKT_CRYPTO=[
  {sym:'BTC',name:'Bitcoin',price:'$67,420',chg:'+3.10%',up:true,spark:[20,22,25,24,28,30,29,33,36]},
  {sym:'ETH',name:'Ethereum',price:'$3,285',chg:'+1.85%',up:true,spark:[18,19,18,21,22,21,24,25,27]},
  {sym:'SOL',name:'Solana',price:'$168.40',chg:'-0.74%',up:false,spark:[28,27,29,26,25,27,24,23,22]},
  {sym:'XRP',name:'XRP',price:'$0.62',chg:'+1.40%',up:true,spark:[18,19,20,19,21,22,21,23,24]},
  {sym:'ADA',name:'Cardano',price:'$0.45',chg:'-0.95%',up:false,spark:[26,25,24,26,23,24,22,23,21]},
  {sym:'DOGE',name:'Dogecoin',price:'$0.16',chg:'+5.20%',up:true,spark:[15,17,16,20,22,21,26,28,31]},
  {sym:'AVAX',name:'Avalanche',price:'$38.20',chg:'+2.30%',up:true,spark:[19,20,22,21,24,23,26,27,29]},
  {sym:'LINK',name:'Chainlink',price:'$14.85',chg:'-1.10%',up:false,spark:[27,26,28,25,24,26,23,24,22]},
  {sym:'MATIC',name:'Polygon',price:'$0.72',chg:'+0.85%',up:true,spark:[20,21,20,22,21,23,22,24,25]},
  {sym:'DOT',name:'Polkadot',price:'$7.15',chg:'+1.55%',up:true,spark:[19,20,21,20,22,24,23,25,26]},
];

// ── Live market data ─────────────────────────────────────────────
const FINNHUB_KEY='d8i8tqhr01qm63bamvqgd8i8tqhr01qm63bamvr0';
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




// ── AUTH — Supabase ───────────────────────────────────────────────
const AUTH_KEY='distrofi_auth';
let authMode='login';

// Local session cache (fast access without async)
function getAuth(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null');}catch(e){return null;}}
function setAuth(a){localStorage.setItem(AUTH_KEY,JSON.stringify(a));}
function clearAuth(){localStorage.removeItem(AUTH_KEY);}
function isLoggedIn(){const a=getAuth();return a&&a.loggedIn===true;}

function showAuthError(msg){
  const e=document.getElementById('auth-error');
  if(e){e.textContent=msg;e.style.display='block';}
}
function clearAuthError(){const e=document.getElementById('auth-error');if(e)e.style.display='none';}
function setAuthLoading(loading){
  const btn=document.getElementById('auth-submit-btn');
  if(btn){btn.disabled=loading;btn.textContent=loading?'Please wait…':(authMode==='signup'?'Create account':'Log in');}
}

function toggleAuthMode(){
  authMode=authMode==='login'?'signup':'login';
  clearAuthError();
  const nameWrap=document.getElementById('auth-name-wrap');
  const trustStatement=document.getElementById('auth-trust-statement');
  const submitBtn=document.getElementById('auth-submit-btn');
  const toggleText=document.getElementById('auth-toggle-text');
  const toggleLink=document.getElementById('auth-toggle-link');
  const pin=document.getElementById('auth-pin');
  const loginUsernameWrap=document.getElementById('auth-username-login-wrap');
  const tosWrap=document.getElementById('auth-tos-wrap');
  const forgotWrap=document.getElementById('auth-forgot-wrap');
  const pwdEl=document.getElementById('auth-password');
  if(pwdEl)pwdEl.value='';
  const pwdHint=document.getElementById('auth-pwd-hint');
  const pwdLabel=document.getElementById('auth-pwd-label');
  if(authMode==='signup'){
    nameWrap.style.display='block';
    if(loginUsernameWrap)loginUsernameWrap.style.display='none';
    if(trustStatement)trustStatement.style.display='flex';
    if(tosWrap)tosWrap.style.display='block';
    if(forgotWrap)forgotWrap.style.display='none';
    submitBtn.textContent='Create account';
    toggleText.textContent='Already have an account? ';
    toggleLink.textContent='Log in';
    if(pwdEl)pwdEl.placeholder='Create a password';
    if(pwdHint)pwdHint.style.display='block';
    if(pwdLabel)pwdLabel.textContent='Password';
    setTimeout(()=>document.getElementById('auth-username')?.focus(),100);
  }else{
    nameWrap.style.display='none';
    if(loginUsernameWrap)loginUsernameWrap.style.display='block';
    if(trustStatement)trustStatement.style.display='none';
    if(tosWrap)tosWrap.style.display='none';
    if(forgotWrap)forgotWrap.style.display='block';
    submitBtn.textContent='Log in';
    toggleText.textContent="Don't have an account? ";
    toggleLink.textContent='Sign up';
    if(pwdEl)pwdEl.placeholder='Password';
    if(pwdHint)pwdHint.style.display='none';
    if(pwdLabel)pwdLabel.textContent='Password';
    setTimeout(()=>document.getElementById('auth-username-login')?.focus(),100);
  }
}

// Derive a secure password from username + pin (never sent raw)
function derivePassword(username,pin){return'df_'+username.toLowerCase()+'_'+pin+'_2024';}
function syntheticEmail(username){return username.toLowerCase().replace(/[^a-z0-9]/g,'')+'@distrofi.app';}

// ── PIN boxes ────────────────────────────────────────────────────
function pinBoxInput(el,idx){
  el.value=el.value.replace(/\D/g,'').slice(0,1);
  updateHiddenPin();
  if(el.value&&idx<3)document.getElementById('pin-'+(idx+1))?.focus();
}
function pinBoxKeydown(e,idx){
  if(e.key==='Backspace'&&!e.target.value&&idx>0){
    document.getElementById('pin-'+(idx-1))?.focus();
  }
  if(e.key==='Enter')submitAuth();
}
function updateHiddenPin(){
  const vals=[0,1,2,3].map(i=>document.getElementById('pin-'+i)?.value||'').join('');
  const h=document.getElementById('auth-pin');if(h)h.value=vals;
}
function clearPinBoxes(){
  [0,1,2,3].forEach(i=>{const b=document.getElementById('pin-'+i);if(b)b.value='';});
  const h=document.getElementById('auth-pin');if(h)h.value='';
}

// ── ToS / Privacy placeholders ───────────────────────────────────
function openForgotUsername(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Forgot your username?</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6">Enter the recovery email you provided at signup and we'll look up your username.</p>
    <div id="forgot-error" style="display:none;background:#ef444418;border:0.5px solid #ef444444;color:var(--red);font-size:12px;padding:10px 12px;border-radius:10px;margin-bottom:12px;text-align:center"></div>
    <div id="forgot-success" style="display:none;background:#22c55e18;border:0.5px solid #22c55e44;color:var(--green);font-size:14px;padding:14px;border-radius:12px;margin-bottom:12px;text-align:center;font-weight:600"></div>
    <input type="email" id="forgot-email" placeholder="your@email.com" inputmode="email" autocomplete="email" style="margin-bottom:12px"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitForgotUsername()">Look up</button>
    </div>
  </div></div>`;
}

async function submitForgotUsername(){
  const email=(document.getElementById('forgot-email')?.value||'').trim();
  const errEl=document.getElementById('forgot-error');
  const okEl=document.getElementById('forgot-success');
  if(!email){if(errEl){errEl.textContent='Please enter your email.';errEl.style.display='block';}return;}
  const btn=document.querySelector('#modal-root .btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Looking up…';}
  if(errEl)errEl.style.display='none';
  const sb=getSB();
  if(sb){
    const {data,error}=await sb.rpc('get_username_by_recovery_email',{lookup_email:email});
    if(error||!data){
      if(errEl){errEl.textContent='No account found with that email. Try another address or sign up.';errEl.style.display='block';}
    }else{
      if(okEl){okEl.innerHTML=`Your username is <span style="color:var(--accent)">@${data}</span>`;okEl.style.display='block';}
      const inp=document.getElementById('forgot-email');if(inp)inp.style.display='none';
      if(btn)btn.style.display='none';
    }
  }else{
    if(errEl){errEl.textContent='You appear to be offline. Please try again when connected.';errEl.style.display='block';}
  }
  if(btn){btn.disabled=false;btn.textContent='Look up';}
}

function openForgotPin(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <h3>Reset your password</h3>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6">Enter your username and email. We'll send a password reset link to that address.</p>
    <div id="fpin-error" style="display:none;background:#ef444418;border:0.5px solid #ef444444;color:var(--red);font-size:12px;padding:10px 12px;border-radius:10px;margin-bottom:12px;text-align:center"></div>
    <div id="fpin-success" style="display:none;background:#22c55e18;border:0.5px solid #22c55e44;color:var(--green);font-size:14px;padding:14px;border-radius:12px;margin-bottom:12px;text-align:center;line-height:1.6"></div>
    <input type="text" id="fpin-username" placeholder="Your username" autocomplete="username" inputmode="text" style="margin-bottom:12px"/>
    <input type="email" id="fpin-email" placeholder="Your email address" autocomplete="email" inputmode="email" style="margin-bottom:12px"/>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="fpin-btn" onclick="submitForgotPin()">Send reset link</button>
    </div>
  </div></div>`;
}

async function submitForgotPin(){
  const username=(document.getElementById('fpin-username')?.value||'').trim().toLowerCase();
  const email=(document.getElementById('fpin-email')?.value||'').trim().toLowerCase();
  const errEl=document.getElementById('fpin-error');
  const okEl=document.getElementById('fpin-success');
  const btn=document.getElementById('fpin-btn');
  if(!username){if(errEl){errEl.textContent='Please enter your username.';errEl.style.display='block';}return;}
  if(!email||!email.includes('@')){if(errEl){errEl.textContent='Please enter your email address.';errEl.style.display='block';}return;}
  if(errEl)errEl.style.display='none';
  if(btn){btn.disabled=true;btn.textContent='Sending…';}
  const sb=getSB();
  if(sb){
    const resetEmail=email;
    const {error:resetErr}=await sb.auth.resetPasswordForEmail(resetEmail,{redirectTo:'https://distrofi.org'});
    if(resetErr){
      if(errEl){errEl.textContent='Something went wrong. Please try again.';errEl.style.display='block';}
      if(btn){btn.disabled=false;btn.textContent='Send reset link';}
    }else{
      if(okEl){okEl.textContent='Reset link sent to your email. Click the link to set a new password.';okEl.style.display='block';}
      const ui=document.getElementById('fpin-username');if(ui)ui.style.display='none';
      const ei=document.getElementById('fpin-email');if(ei)ei.style.display='none';
      if(btn)btn.style.display='none';
    }
  }else{
    if(errEl){errEl.textContent='You appear to be offline. Please try again when connected.';errEl.style.display='block';}
    if(btn){btn.disabled=false;btn.textContent='Send reset link';}
  }
}

function openPinReset(username){
  const un=username||'';
  const ov=document.getElementById('auth-overlay');if(ov)ov.style.display='flex';
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
    <div style="text-align:center;margin-bottom:16px">
      <div style="width:44px;height:44px;border-radius:14px;background:#2dd4bf18;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
        <i class="ti ti-lock-open" style="font-size:22px;color:#2dd4bf"></i>
      </div>
      <h3 style="margin:0 0 4px">Set new password</h3>
      ${un?`<div style="font-size:12px;color:var(--muted)">@${un}</div>`:''}
    </div>
    <div id="pres-error" style="display:none;background:#ef444418;border:0.5px solid #ef444444;color:var(--red);font-size:12px;padding:10px 12px;border-radius:10px;margin-bottom:12px;text-align:center"></div>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">New password</div>
    <input type="password" id="pres-new-pwd" placeholder="Min 8 characters" autocomplete="new-password" style="margin-bottom:12px"/>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Confirm password</div>
    <input type="password" id="pres-conf-pwd" placeholder="Re-enter password" autocomplete="new-password" style="margin-bottom:20px"/>
    <button class="btn btn-primary" style="width:100%;padding:14px" id="pres-btn" onclick="submitPinReset('${un}')">Update password</button>
  </div></div>`;
  setTimeout(()=>document.getElementById('pres-new-pwd')?.focus(),100);
}

function presBoxNav(group,idx){
  if(idx<3){document.getElementById('pres-'+group+'-'+(idx+1)).focus();}
  else if(group==='new'){document.getElementById('pres-conf-0').focus();}
}

async function submitPinReset(usernameArg){
  const errEl=document.getElementById('pres-error');
  const btn=document.getElementById('pres-btn');
  const newPwd=(document.getElementById('pres-new-pwd')?.value||'').trim();
  const confPwd=(document.getElementById('pres-conf-pwd')?.value||'').trim();
  if(newPwd.length<8){if(errEl){errEl.textContent='Password must be at least 8 characters.';errEl.style.display='block';}return;}
  if(newPwd!==confPwd){if(errEl){errEl.textContent='Passwords don\'t match — try again.';errEl.style.display='block';}return;}
  if(errEl)errEl.style.display='none';
  if(btn){btn.disabled=true;btn.textContent='Updating…';}
  const sb=getSB();
  if(sb){
    const {error}=await sb.auth.updateUser({password:newPwd});
    if(error){
      if(errEl){errEl.textContent='Could not update password. Please try again.';errEl.style.display='block';}
      if(btn){btn.disabled=false;btn.textContent='Update password';}
    }else{
      await sb.auth.signOut();
      document.getElementById('modal-root').innerHTML='';
      const errBox=document.getElementById('auth-error');
      if(errBox){errBox.style.background='#22c55e18';errBox.style.borderColor='#22c55e44';errBox.style.color='var(--green)';errBox.textContent='Password updated! Log in with your new password.';errBox.style.display='block';}
    }
  }else{
    if(errEl){errEl.textContent='You appear to be offline.';errEl.style.display='block';}
    if(btn){btn.disabled=false;btn.textContent='Update password';}
  }
}

function openToS(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0">Terms of Service</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px">Application: DistroFi &nbsp;·&nbsp; Mayer Ventures LLC &nbsp;·&nbsp; Version 1.1</div>
    <div style="font-size:13px;color:var(--text);line-height:1.8">
      <p style="margin-bottom:12px">Welcome to DistroFi. This Terms of Service agreement ("Agreement") constitutes a legally binding contract between you ("User") and Mayer Ventures LLC ("Company"), the parent legal entity owning and operating DistroFi. By signing up, you acknowledge you have read and agreed to be bound by this Agreement.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">1. Scope of Service</p>
      <p style="margin-bottom:12px">DistroFi is a structured capital scheduling, visual budgeting, and personal resource-allocation tool. It facilitates a manual or semi-automated approach to dividing user-inputted income into designated containers to help organize expenses, overhead, and savings goals.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">2. Financial Disclaimers</p>
      <p style="margin-bottom:6px;color:var(--red);font-weight:600;font-size:12px">DISTROFI AND MAYER VENTURES LLC ARE NOT LICENSED FINANCIAL ADVISORS, INVESTMENT ADVISORY SERVICES, OR REGISTERED LEGAL COUNSEL. THE APPLICATION IS A MATHEMATICAL VISUALIZATION UTILITY ONLY.</p>
      <p style="margin-bottom:12px">All calculations and projections are purely computational and provided for educational purposes only. Nothing in the Application constitutes personal financial planning, tax structuring, or investment advice. You assume complete legal responsibility for any financial decisions made in reliance on the Application. Mayer Ventures LLC shall not be liable for any negative financial outcomes arising from your use of the software.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">3. Account Security</p>
      <p style="margin-bottom:12px">You bear full responsibility for maintaining confidentiality of your access credentials. You agree to notify the Company immediately of any unauthorized breach of your account. Mayer Ventures LLC disclaims all liability for financial exposure resulting from an unlocked device, shared browser, or negligent handling of credentials.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">4. Third-Party Integrations</p>
      <p style="margin-bottom:12px">The Application may use encrypted third-party data networks to pull informational balances. These are read-only protocols. Mayer Ventures LLC does not store your banking passwords directly. The Company is not liable for data delivery lag, sync failures, or security events originating within external banking APIs.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">5. Acceptable Use & Intellectual Property</p>
      <p style="margin-bottom:6px">The architectural flow, visual assets, container configuration system, and source code of DistroFi are protected intellectual property of Mayer Ventures LLC. Users are strictly prohibited from:</p>
      <ul style="margin-left:16px;margin-bottom:12px;font-size:13px">
        <li style="margin-bottom:4px">Reverse engineering, decompiling, or extracting source code</li>
        <li style="margin-bottom:4px">Scraping, crawling, or extracting data via automated tools</li>
        <li style="margin-bottom:4px">Circumventing or abusing the Application's APIs</li>
      </ul>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">6. Account Termination</p>
      <p style="margin-bottom:12px">Mayer Ventures LLC reserves the right to suspend or permanently terminate access to the Application for violations of this Agreement, API abuse, or platform compromise, without prior notification.</p>
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">7. Governing Law</p>
      <p style="margin-bottom:16px">This Agreement is governed by the laws of the State of Florida, United States. Any legal proceedings shall be filed exclusively within state or federal courts in Florida.</p>
      <p style="font-size:11px;color:var(--muted)">Mayer Ventures LLC &nbsp;·&nbsp; DistroFi Terms of Service v1.1 &nbsp;·&nbsp; State of Florida, United States</p>
    </div>
    <div class="modal-btns" style="margin-top:20px"><button class="btn btn-ghost" onclick="closeModal()">Close</button></div>
  </div></div>`;
}
function openPrivacy(){
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0">Privacy Policy</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.8;max-height:60vh;overflow-y:auto">
      <p style="margin-bottom:12px"><strong style="color:var(--text)">Last updated: June 2026</strong></p>
      <p style="margin-bottom:12px">DistroFi ("we", "our", or "us") is operated by Mayer Ventures LLC. This Privacy Policy explains how we collect, use, and protect your information when you use the DistroFi app.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Information we collect</strong></p>
      <p style="margin-bottom:12px">We collect information you provide directly: username, display name, email address, and financial data you enter (income, bills, spending, savings, debts). We do not collect Social Security numbers, bank credentials, or government IDs.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">How we use your information</strong></p>
      <p style="margin-bottom:12px">Your financial data is used solely to power your budget. We use your email for account recovery and important service notifications. We never sell your personal data to third parties.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Data storage & security</strong></p>
      <p style="margin-bottom:12px">Your data is stored securely using Supabase with row-level security. Data is encrypted in transit and at rest. Only you can access your account data.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Local storage & cookies</strong></p>
      <p style="margin-bottom:12px">The app uses your browser's localStorage to cache your budget data for offline use. No tracking cookies are used. We do not use advertising cookies or share browsing data with advertisers.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Third-party services</strong></p>
      <p style="margin-bottom:12px">We use the following services to operate DistroFi: Supabase (authentication and data storage), Vercel (hosting and delivery), Finnhub (stock market data), and CoinGecko (cryptocurrency prices). Each service has its own privacy policy. We do not share your personal or financial data with these providers beyond what is required to operate the app.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Your rights (GDPR / CCPA)</strong></p>
      <p style="margin-bottom:12px">You have the right to access, correct, or delete your personal data at any time. To export your data, use the Export option in Settings. To delete your account and all associated data, use the Delete Account option in Settings. Requests are processed within 30 days. Residents of the EU and California may also contact us directly to exercise additional rights under GDPR or CCPA.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Children's privacy</strong></p>
      <p style="margin-bottom:12px">DistroFi is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Data retention</strong></p>
      <p style="margin-bottom:12px">You may delete your account at any time via Settings. Upon deletion, all personal data is permanently removed within 30 days.</p>
      <p style="margin-bottom:8px"><strong style="color:var(--text)">Contact</strong></p>
      <p>For privacy questions, contact us through the feedback form in the app or email support@distrofi.org.</p>
    </div>
    <div class="modal-btns" style="margin-top:20px"><button class="btn btn-ghost" onclick="closeModal()">Close</button></div>
  </div></div>`;
}

async function submitAuth(){
  clearAuthError();
  const pwd=(document.getElementById('auth-password')?.value||'').trim();
  if(!pwd){showAuthError('Please enter your password.');return;}
  const sb=getSB();
  setAuthLoading(true);

  if(authMode==='signup'){
    const username=(document.getElementById('auth-username')?.value||'').trim().toLowerCase().replace(/\s+/g,'');
    const displayName=username;
    if(!username){showAuthError('Please choose a username.');setAuthLoading(false);return;}
    if(username.length<3){showAuthError('Username must be at least 3 characters.');setAuthLoading(false);return;}
    if(!/^[a-z0-9_]+$/.test(username)){showAuthError('Username can only contain letters, numbers, and underscores.');setAuthLoading(false);return;}
    if(pwd.length<8){showAuthError('Password must be at least 8 characters.');setAuthLoading(false);return;}
    const emailVal=(document.getElementById('auth-email')?.value||'').trim().toLowerCase();
    if(!emailVal||!emailVal.includes('@')){showAuthError('Please enter a valid email address.');setAuthLoading(false);return;}
    const tosCheck=document.getElementById('auth-tos-check');
    if(tosCheck&&!tosCheck.checked){showAuthError('Please agree to the Terms of Service to continue.');setAuthLoading(false);return;}

    const email=emailVal; // use real email as Supabase auth email directly
    const password=pwd; // raw password — no derivation

    // Validate invite code
    const inviteCodeRaw=(document.getElementById('auth-invite-code')?.value||'').trim().toUpperCase();
    if(!inviteCodeRaw){showAuthError('Please enter your invite code.');setAuthLoading(false);return;}
    if(sb){
      const {data:codeRow,error:codeErr}=await sb.from('beta_codes').select('code,used').eq('code',inviteCodeRaw).maybeSingle();
      if(codeErr||!codeRow||codeRow.used){showAuthError('Invalid invite code.');setAuthLoading(false);return;}
    }
    // Check username availability
    if(sb){
      const {data:existing}=await sb.from('profiles').select('id').eq('username',username).maybeSingle();
      if(existing){showAuthError('Username taken — try another.');setAuthLoading(false);return;}
      // Create Supabase account
      const {data,error}=await sb.auth.signUp({email,password,options:{data:{username,display_name:displayName}}});
      if(error){showAuthError(error.message);setAuthLoading(false);return;}
      // Save profile
      if(data.user){
        await sb.from('profiles').insert({id:data.user.id,username,display_name:displayName,email:emailVal});
        // Mark invite code as used
        await sb.from('beta_codes').update({used:true,used_by:data.user.id,used_at:new Date().toISOString()}).eq('code',inviteCodeRaw);
        setAuth({loggedIn:true,name:displayName,username,user_id:data.user.id,pro_tier:null,method:'supabase',since:new Date().toISOString()});
      }
    } else {
      // Offline fallback
      setAuth({loggedIn:true,name:displayName,username,pwd,method:'local',since:new Date().toISOString()});
    }
    if(!STATE.partners||!STATE.partners.p1||STATE.partners.p1==='You'){if(!STATE.partners)STATE.partners={};STATE.partners.p1=displayName;saveState();}

  }else{
    // Login
    const username=(document.getElementById('auth-username-login')?.value||'').trim().toLowerCase();
    const usernameVal=username||getAuth()?.username||'';
    if(!usernameVal){showAuthError('Please enter your username.');setAuthLoading(false);return;}

    if(sb){
      // Look up real email by username (v98+ accounts use real email in auth)
      const {data:prof}=await sb.from('profiles').select('email').eq('username',usernameVal).maybeSingle();
      const realEmail=prof?.email&&prof.email.includes('@')?prof.email:null;
      const synthEmail=syntheticEmail(usernameVal);
      // 1. Try real email + raw password
      let {data,error}=await sb.auth.signInWithPassword({email:realEmail||synthEmail,password:pwd});
      // 2. If failed and we used real email, try synthetic (unconfirmed v97 or old account)
      if(error&&realEmail){
        ({data,error}=await sb.auth.signInWithPassword({email:synthEmail,password:pwd}));
      }
      // 3. If still failed, try legacy derived password and migrate
      if(error){
        const derived=derivePassword(usernameVal,pwd);
        const {data:data2,error:error2}=await sb.auth.signInWithPassword({email:synthEmail,password:derived});
        if(error2){showAuthError('Incorrect username or password.');setAuthLoading(false);return;}
        data=data2;
        getSB()?.auth.updateUser({password:pwd}); // migrate to raw password
      }
      // Pull cloud state
      if(data.user){
        const {data:cloudState}=await sb.from('app_state').select('state_json').eq('user_id',data.user.id).maybeSingle();
        if(cloudState?.state_json){
          STATE=cloudState.state_json;C=STATE.current;
          try{localStorage.setItem('distrofi_app',JSON.stringify(STATE));}catch(e){}
        }
        const {data:profile}=await sb.from('profiles').select('display_name,username,pro_tier').eq('id',data.user.id).maybeSingle();
        setAuth({loggedIn:true,name:profile?.display_name||usernameVal,username:usernameVal,user_id:data.user.id,pro_tier:profile?.pro_tier||null,method:'supabase',since:new Date().toISOString()});
        if(profile?.pro_tier){localStorage.setItem(PRO_KEY,JSON.stringify({active:true,tier:profile.pro_tier,since:new Date().toISOString()}));}
        else{localStorage.removeItem(PRO_KEY);}
        await initHousehold(data.user.id);
      }
    } else {
      // Offline: validate against cached PIN
      const saved=getAuth();
      if(!saved?.pin&&!saved?.pwd){showAuthError('No account found. Please sign up first.');setAuthLoading(false);return;}
      // Accept raw password match (v93+) or raw PIN match (legacy)
      const storedPwd=saved.pwd||saved.pin||null;
      if(!storedPwd||pwd!==storedPwd){showAuthError('Incorrect password. Try again.');setAuthLoading(false);return;}
      setAuth({...saved,loggedIn:true});
    }
  }
  setAuthLoading(false);
  enterApp();
}

function guestAuth(){
  setAuth({loggedIn:true,name:'Guest',username:null,pin:null,method:'guest',since:new Date().toISOString()});
  enterApp();
}

async function enterApp(){
  const ov=document.getElementById('auth-overlay');
  if(ov)ov.style.display='none';
  render();
  setSyncStatus('synced');
  if(!localStorage.getItem(ONBOARD_KEY)){setTimeout(showOnboarding,400);}
}

async function logOut(){
  const sb=getSB();
  if(sb)await sb.auth.signOut();
  clearAuth();
  closeModal();
  const dot=document.getElementById('sync-dot');
  if(dot)dot.style.display='none';
  // Reset auth UI back to login mode
  authMode='login';
  const forgotWrap=document.getElementById('auth-forgot-wrap');
  if(forgotWrap)forgotWrap.style.display='block';
  const nameWrap=document.getElementById('auth-name-wrap');
  if(nameWrap)nameWrap.style.display='none';
  const tosWrap=document.getElementById('auth-tos-wrap');
  if(tosWrap)tosWrap.style.display='none';
  const trustEl=document.getElementById('auth-trust-statement');
  if(trustEl)trustEl.style.display='none';
  const submitBtn=document.getElementById('auth-submit-btn');
  if(submitBtn)submitBtn.textContent='Log in';
  const toggleLink=document.getElementById('auth-toggle-link');
  if(toggleLink)toggleLink.textContent='Sign up';
  const toggleText=document.getElementById('auth-toggle-text');
  if(toggleText)toggleText.textContent="Don't have an account? ";
  const ov=document.getElementById('auth-overlay');
  if(ov)ov.style.display='flex';
}


// ══════════════════════════════════════════
//  DEBT & DEBT PLANNING
// ══════════════════════════════════════════
let _debtTab='list';

function switchDebtTab(tab){
  _debtTab=tab;
  const lv=document.getElementById('debt-list-view');
  const pv=document.getElementById('debt-plan-view');
  const tl=document.getElementById('debt-tab-list');
  const tp=document.getElementById('debt-tab-plan');
  if(lv)lv.style.display=tab==='list'?'block':'none';
  if(pv)pv.style.display=tab==='plan'?'block':'none';
  if(tl){tl.style.background=tab==='list'?'var(--accent)':' transparent';tl.style.color=tab==='list'?'#fff':'var(--muted)';}
  if(tp){tp.style.background=tab==='plan'?'var(--accent)':' transparent';tp.style.color=tab==='plan'?'#fff':'var(--muted)';}
  if(tab==='plan')renderDebtPlanner();
}

function initDebts(){
  if(!C.debts)C.debts=[];
  if(!C.debtStrategy)C.debtStrategy='avalanche';
  if(C.debtExtra===undefined)C.debtExtra=0;
}

function debtAprBadge(apr){
  if(apr>=15)return{label:'High',bg:'#ef444418',color:'#f87171'};
  if(apr>=8)return{label:'Med',bg:'#f59e0b18',color:'#fbbf24'};
  return{label:'Low',bg:'#22c55e18',color:'#4ade80'};
}

function debtTypeIcon(type){
  const map={credit_card:'ti-credit-card',student:'ti-school',auto:'ti-car',personal:'ti-cash',mortgage:'ti-building'};
  return map[type]||'ti-coin';
}

function debtTypeLabel(type){
  const map={credit_card:'Credit card',student:'Student loan',auto:'Auto loan',personal:'Personal loan',mortgage:'Mortgage'};
  return map[type]||type;
}

function calcDebtPayoff(debts,extra,strategy){
  const active=debts.filter(d=>d.balance>0);
  if(!active.length)return{months:0,interest:0,order:[]};
  let d=active.map(x=>({id:x.id,name:x.name,apr:x.apr||0,bal:x.balance,min:x.minPayment||0}));
  const order=[...d].sort((a,b)=>strategy==='avalanche'?b.apr-a.apr:a.bal-b.bal).map(x=>x.id);
  if(strategy==='avalanche')d.sort((a,b)=>b.apr-a.apr);
  else d.sort((a,b)=>a.bal-b.bal);
  let months=0,totalInterest=0;
  const MAX=600;
  while(d.some(x=>x.bal>0.01)&&months<MAX){
    months++;
    const firstIdx=d.findIndex(x=>x.bal>0.01);
    let freed=extra;
    for(let i=0;i<d.length;i++){
      if(d[i].bal<=0.01)continue;
      const rate=d[i].apr/100/12;
      const interest=d[i].bal*rate;
      totalInterest+=interest;
      let payment=d[i].min+(i===firstIdx?freed:0);
      payment=Math.min(payment,d[i].bal+interest);
      const principal=payment-interest;
      d[i].bal=Math.max(0,d[i].bal-principal);
      if(d[i].bal<0.01){freed+=d[i].min;d[i].bal=0;}
    }
  }
  return{months,interest:Math.round(totalInterest),order};
}

function payoffDateStr(months){
  if(months<=0)return'Paid off!';
  if(months>=600)return'50+ yrs';
  const dt=new Date();dt.setMonth(dt.getMonth()+months);
  return dt.toLocaleDateString('en-US',{month:'short',year:'numeric'});
}

function renderDebt(){
  initDebts();
  if(!document.getElementById('screen-debt'))return;
  renderDebtList();
  if(_debtTab==='plan')renderDebtPlanner();
}

function singleDebtPayoffMonths(balance,apr,minPayment){
  if(!balance||balance<=0)return 0;
  const rate=(apr||0)/1200;
  if(rate===0)return minPayment>0?Math.ceil(balance/minPayment):null;
  if(minPayment<=balance*rate)return null;
  return Math.ceil(-Math.log(1-(balance*rate/minPayment))/Math.log(1+rate));
}

function renderDebtList(){
  initDebts();
  const debts=C.debts||[];
  const summEl=document.getElementById('debt-summary-row');
  const cardsEl=document.getElementById('debt-cards');
  if(!summEl||!cardsEl)return;

  const activeDebts=debts.filter(d=>d.balance>0);
  const paidDebts=debts.filter(d=>d.balance<=0);
  const totalOwed=activeDebts.reduce((a,d)=>a+(d.balance||0),0);
  const result=calcDebtPayoff(activeDebts,C.debtExtra||0,C.debtStrategy||'avalanche');
  const totalMinPmts=activeDebts.reduce((a,d)=>a+(d.minPayment||0),0);
  const income=totalIncome()||0;
  const dtiPct=income>0?Math.round((totalMinPmts/income)*100):null;
  const dtiColor=dtiPct===null?'var(--muted)':dtiPct<20?'#22c55e':dtiPct<=35?'#f59e0b':'#ef4444';
  const dtiLabel=dtiPct===null?'—':dtiPct+'%';

  if(summEl){
    summEl.innerHTML=`
      <div style="background:var(--card2);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Total owed</div>
        <div style="font-size:20px;font-weight:700;color:var(--text)">$${totalOwed.toLocaleString()}</div>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Debt-free est.</div>
        <div style="font-size:16px;font-weight:700;color:#a5b4fc">${activeDebts.length?payoffDateStr(result.months):paidDebts.length?'All paid off!':'—'}</div>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">DTI ratio</div>
        <div style="font-size:18px;font-weight:700;color:${dtiColor}">${dtiLabel}</div>
        <div style="font-size:10px;color:var(--muted)">${dtiPct===null?'—':dtiPct<20?'Healthy':dtiPct<=35?'Moderate':'High'}</div>
      </div>`;
  }

  if(!debts.length){
    cardsEl.innerHTML=`<div style="text-align:center;padding:40px 0">
      <i class="ti ti-mood-happy" style="font-size:36px;color:var(--muted);display:block;margin-bottom:10px"></i>
      <div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px">No debts tracked</div>
      <div style="font-size:13px;color:var(--muted)">Tap Add debt to get started.</div>
    </div>`;
    return;
  }

  function debtCard(d,i,isPaid){
    const badge=debtAprBadge(d.apr||0);
    const orig=d.originalBalance||d.balance||1;
    const pct=isPaid?100:Math.min(99,Math.max(0,Math.round((1-(d.balance/orig))*100)));
    const barColor=isPaid?'#22c55e':d.apr>=15?'#ef4444':d.apr>=8?'#f59e0b':'#22c55e';
    const utilPct=(d.type==='credit_card'&&d.creditLimit>0)?Math.round((d.balance/d.creditLimit)*100):null;
    const utilColor=utilPct===null?null:utilPct>=50?'#ef4444':utilPct>=30?'#f59e0b':'#22c55e';
    const utilBg=utilPct===null?null:utilPct>=50?'#ef444418':utilPct>=30?'#f59e0b18':'#22c55e18';
    const payoffMonths=isPaid?null:singleDebtPayoffMonths(d.balance,d.apr,d.minPayment);
    const payoffStr=isPaid?null:payoffMonths===null?'Increase min payment':payoffMonths===0?'Almost done!':payoffDateStr(payoffMonths);
    const nudgeAmt=(utilPct!==null&&utilPct>=30&&!isPaid)?Math.ceil(d.balance-(d.creditLimit*0.30)):null;
    const nudgeStr=nudgeAmt>0?'Pay $'+nudgeAmt.toLocaleString()+' more to drop below 30% utilization':null;
    const hasCyclePayment=(d.payments||[]).some(p=>!p.isInterest&&p.date>=(C.startDate||''));
    const dueBadge=!isPaid&&(d.minPayment||0)>0&&!hasCyclePayment;
    const _pmts=d.payments||[];
    const totalInterestCharged=_pmts.filter(p=>p.isInterest).reduce((a,p)=>a+p.amount,0);
    const totalPrincipalPaid=_pmts.filter(p=>!p.isInterest).reduce((a,p)=>a+p.amount,0);
    const lastPmt=d.payments&&d.payments.length?d.payments[d.payments.length-1]:null;
    const lastPmtStr=lastPmt?'Last: $'+lastPmt.amount.toLocaleString()+' · '+new Date(lastPmt.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
    const histHtml=_pmts.length?`<div id="debt-hist-${i}" style="display:none;border-top:0.5px solid var(--border);margin-top:10px;padding-top:10px">
      <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Payment history</div>
      ${totalInterestCharged>0?`<div style="display:flex;justify-content:space-between;align-items:center;background:#ef444410;border-radius:8px;padding:6px 10px;margin-bottom:8px">
        <div style="font-size:11px;color:#f87171">Interest: <strong>$${totalInterestCharged.toFixed(2)}</strong></div>
        <div style="font-size:11px;color:#4ade80">Principal: <strong>$${totalPrincipalPaid.toLocaleString()}</strong></div>
      </div>`:''}
      ${[..._pmts].reverse().map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div>
          <div style="font-size:13px;color:${p.isInterest?'#f87171':'var(--text)'}">${p.isInterest?'':'+'}$${p.amount.toLocaleString()}</div>
          ${p.note?`<div style="font-size:11px;color:var(--muted)">${p.note}</div>`:''}
        </div>
        <div style="font-size:11px;color:var(--muted)">${new Date(p.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
      </div>`).join('')}
    </div>`:'';
    return `<div style="background:${isPaid?'var(--card2)':'var(--card)'};border:1px solid ${isPaid?'#22c55e30':'var(--border)'};border-radius:14px;padding:14px;margin-bottom:10px;opacity:${isPaid?0.85:1}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:32px;height:32px;border-radius:9px;background:${isPaid?'#22c55e18':'#6366f115'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="ti ${isPaid?'ti-circle-check':debtTypeIcon(d.type)}" style="font-size:16px;color:${isPaid?'#4ade80':'#a5b4fc'}"></i>
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">${d.name}${isPaid?' <span style="font-size:10px;font-weight:700;background:#22c55e18;color:#4ade80;padding:2px 6px;border-radius:5px;vertical-align:middle">Paid off</span>':''}${dueBadge?' <span style="font-size:10px;font-weight:700;background:#f59e0b18;color:#fbbf24;padding:2px 6px;border-radius:5px;vertical-align:middle">Due</span>':''}</div>
            <div style="font-size:11px;color:var(--muted)">${debtTypeLabel(d.type)}${isPaid?'':' · '+d.apr+'% APR · Min $'+(d.minPayment||0).toLocaleString()+'/mo'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:5px">
          ${!isPaid?`<div style="font-size:10px;font-weight:700;background:${badge.bg};color:${badge.color};padding:3px 7px;border-radius:6px">${badge.label}</div>`:''}
          <button onclick="openDebtModal(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:2px;font-size:16px"><i class="ti ti-edit"></i></button>
        </div>
      </div>
      <div style="background:var(--card2);border-radius:6px;height:6px;width:100%;margin-bottom:6px">
        <div style="height:6px;border-radius:6px;width:${pct}%;background:${barColor}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${!isPaid&&utilPct!==null?4:isPaid||!d.payments||!d.payments.length?0:6}px">
        <div style="font-size:13px;font-weight:600;color:var(--text)">${isPaid?'Paid off!':'$'+(d.balance||0).toLocaleString()+' left'}</div>
        <div style="font-size:11px;color:var(--muted)">${pct}% paid</div>
      </div>
      ${!isPaid&&payoffStr?`<div style="display:flex;align-items:center;gap:5px;margin-bottom:${utilPct!==null?4:!d.payments||!d.payments.length?0:6}px">
        <i class="ti ti-calendar-due" style="font-size:12px;color:var(--muted)"></i>
        <span style="font-size:12px;color:var(--muted)">Payoff est. <strong style="color:var(--text)">${payoffStr}</strong></span>
      </div>`:''}
      ${!isPaid&&utilPct!==null?`<div style="display:flex;align-items:center;justify-content:space-between;background:${utilBg};border-radius:7px;padding:5px 8px;margin-bottom:${nudgeStr?4:!d.payments||!d.payments.length?0:6}px">
        <div style="display:flex;align-items:center;gap:5px">
          <i class="ti ti-chart-pie" style="font-size:12px;color:${utilColor}"></i>
          <span style="font-size:12px;font-weight:600;color:${utilColor}">${utilPct}% utilized</span>
          <span style="font-size:11px;color:var(--muted)">of $${(d.creditLimit||0).toLocaleString()} limit</span>
        </div>
        <span style="font-size:10px;font-weight:700;color:${utilColor}">${utilPct<30?'Good':utilPct<50?'Fair':'High'}</span>
      </div>`:''}
      ${nudgeStr?`<div style="display:flex;align-items:center;gap:6px;background:#f59e0b12;border:1px solid #f59e0b30;border-radius:8px;padding:6px 8px;margin-bottom:${!d.payments||!d.payments.length?0:6}px">
        <i class="ti ti-bulb" style="font-size:13px;color:#f59e0b;flex-shrink:0"></i>
        <span style="font-size:11px;color:#fbbf24">${nudgeStr}</span>
      </div>`:''}
      ${lastPmtStr&&!isPaid?`<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${lastPmtStr}</div>`:''}
      ${!isPaid?`<div style="display:flex;gap:8px;margin-top:8px">
        <button onclick="openPaymentModal(${i})" style="flex:1;padding:8px 0;border-radius:9px;border:1px solid #6366f140;background:#6366f110;color:#a5b4fc;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"><i class="ti ti-cash" style="font-size:13px;vertical-align:-2px;margin-right:4px"></i>Make payment</button>
        ${d.payments&&d.payments.length?`<button onclick="toggleDebtHistory(${i})" style="padding:8px 12px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit" id="debt-hist-btn-${i}"><i class="ti ti-history" style="font-size:13px;vertical-align:-2px"></i></button>`:''}
      </div>`:''}
      ${histHtml}
    </div>`;
  }

  let html=activeDebts.map((d,i)=>debtCard(d,debts.indexOf(d),false)).join('');
  if(paidDebts.length){
    html+=`<div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:14px 0 8px">Paid off</div>`;
    html+=paidDebts.map(d=>debtCard(d,debts.indexOf(d),true)).join('');
  }
  cardsEl.innerHTML=html;
}

function toggleDebtHistory(i){
  const el=document.getElementById('debt-hist-'+i);
  const btn=document.getElementById('debt-hist-btn-'+i);
  if(!el)return;
  const open=el.style.display==='block';
  el.style.display=open?'none':'block';
  if(btn)btn.querySelector('i').style.color=open?'var(--muted)':'#a5b4fc';
}

function openPaymentModal(idx){
  initDebts();
  const d=C.debts[idx];
  if(!d)return;
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <h3 style="margin:0">Make a payment</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${d.name} · $${(d.balance||0).toLocaleString()} remaining</div>
    <div id="pmt-error" style="display:none;background:#ef444418;border:0.5px solid #ef444444;color:var(--red);font-size:12px;padding:10px 12px;border-radius:10px;margin-bottom:12px;text-align:center"></div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Amount paid</div>
    <input type="number" id="pmt-amount" placeholder="${d.minPayment||0}" inputmode="decimal" style="margin-bottom:12px;font-size:22px;font-weight:600"/>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Date</div>
        <input type="date" id="pmt-date" value="${today}"/>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Note (optional)</div>
        <input type="text" id="pmt-note" placeholder="e.g. Extra payment"/>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px">Min payment: <strong style="color:var(--text)">$${(d.minPayment||0).toLocaleString()}/mo</strong></div>
    <div class="modal-btns">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="savePayment(${idx})">Log payment</button>
    </div>
  </div></div>`;
  setTimeout(()=>document.getElementById('pmt-amount')?.focus(),100);
}

function savePayment(idx){
  initDebts();
  const d=C.debts[idx];
  if(!d)return;
  const amount=parseFloat(document.getElementById('pmt-amount')?.value||0);
  const date=document.getElementById('pmt-date')?.value||new Date().toISOString().split('T')[0];
  const note=(document.getElementById('pmt-note')?.value||'').trim();
  const errEl=document.getElementById('pmt-error');
  if(!amount||amount<=0){if(errEl){errEl.textContent='Please enter a valid payment amount.';errEl.style.display='block';}return;}
  if(amount>d.balance){if(errEl){errEl.textContent='Payment exceeds remaining balance of $'+d.balance.toLocaleString()+'.';errEl.style.display='block';}return;}
  if(!d.payments)d.payments=[];
  d.payments.push({amount,date,note:note||null});
  const newBalance=Math.max(0,d.balance-amount);
  const paidOff=newBalance===0;
  d.balance=newBalance;
  C.debtPayments=(C.debtPayments||0)+amount;
  saveState();
  closeModal();
  renderDebt();
  if(paidOff){
    setTimeout(()=>showToast('🎉 '+d.name+' is paid off!'),300);
  }
}

function renderDebtPlanner(){
  initDebts();
  const el=document.getElementById('debt-planner-content');
  if(!el)return;
  const debts=C.debts||[];
  const strategy=C.debtStrategy||'avalanche';
  const extra=C.debtExtra||0;
  const base=calcDebtPayoff(debts,0,strategy);
  const withExtra=calcDebtPayoff(debts,extra,strategy);
  const savedMonths=Math.max(0,base.months-withExtra.months);
  const savedInterest=Math.max(0,base.interest-withExtra.interest);

  const orderDebts=[...debts].sort((a,b)=>strategy==='avalanche'?b.apr-a.apr:a.balance-b.balance);

  el.innerHTML=`
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Strategy</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button onclick="setDebtStrategy('avalanche')" style="flex:1;padding:8px 0;border-radius:10px;border:1px solid ${strategy==='avalanche'?'#6366f140':'var(--border)'};background:${strategy==='avalanche'?'#6366f115':'transparent'};font-size:12px;font-weight:700;color:${strategy==='avalanche'?'#a5b4fc':'var(--muted)'};cursor:pointer;font-family:inherit">Avalanche</button>
      <button onclick="setDebtStrategy('snowball')" style="flex:1;padding:8px 0;border-radius:10px;border:1px solid ${strategy==='snowball'?'#6366f140':'var(--border)'};background:${strategy==='snowball'?'#6366f115':'transparent'};font-size:12px;font-weight:700;color:${strategy==='snowball'?'#a5b4fc':'var(--muted)'};cursor:pointer;font-family:inherit">Snowball</button>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px">${strategy==='avalanche'?'Highest APR first — minimizes total interest paid.':'Smallest balance first — quick wins build momentum.'}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--card2);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Debt-free</div>
        <div style="font-size:16px;font-weight:700;color:#a5b4fc" id="debt-payoff-date">${debts.length?payoffDateStr(withExtra.months):'—'}</div>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:10px 12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Total interest</div>
        <div style="font-size:16px;font-weight:700;color:#f87171" id="debt-total-interest">${debts.length?'$'+withExtra.interest.toLocaleString():'—'}</div>
      </div>
    </div>

    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Extra payment / month</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="font-size:13px;color:var(--muted)">+$</span>
      <input type="range" min="0" max="500" step="25" value="${extra}" oninput="updateDebtExtra(this.value)" style="flex:1"/>
      <span style="font-size:14px;font-weight:700;color:var(--text);min-width:44px" id="debt-extra-val">$${extra}</span>
    </div>
    <div style="background:#6366f115;border:1px solid #6366f130;border-radius:12px;padding:10px 12px;margin-bottom:14px;min-height:44px" id="debt-sim-result">
      ${extra>0&&savedMonths>0?`<div style="font-size:12px;color:#a5b4fc;margin-bottom:3px">Debt-free <strong>${savedMonths} month${savedMonths!==1?'s':''} sooner</strong></div><div style="font-size:15px;font-weight:700;color:#818cf8">Save $${savedInterest.toLocaleString()} in interest</div>`
      :`<div style="font-size:12px;color:var(--muted)">Drag the slider to see how extra payments help.</div>`}
    </div>

    ${debts.filter(d=>d.balance>0).length?`
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Lump sum what-if</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Debt</div>
        <select id="lump-debt-sel" onchange="updateLumpSim()" style="width:100%;padding:8px 10px;border-radius:9px;border:1px solid var(--border);background:var(--card2);color:var(--text);font-size:13px;font-family:inherit">
          ${debts.filter(d=>d.balance>0).map(d=>`<option value="${debts.indexOf(d)}">${d.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:4px">One-time payment</div>
        <input type="number" id="lump-amount" placeholder="500" inputmode="decimal" oninput="updateLumpSim()" style="margin-bottom:0;font-size:16px;font-weight:600"/>
      </div>
    </div>
    <div style="background:#818cf815;border:1px solid #818cf830;border-radius:12px;padding:10px 12px;margin-bottom:14px;min-height:40px" id="debt-lump-result">
      <div style="font-size:12px;color:var(--muted)">Enter a debt and amount to see impact.</div>
    </div>
    `:''}

    ${orderDebts.length?`
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Payoff order</div>
    ${orderDebts.map((d,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:22px;height:22px;border-radius:50%;background:${i===0?'#6366f1':'var(--card2)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${i===0?'#fff':'var(--muted)'};flex-shrink:0">${i+1}</div>
      <div style="flex:1;font-size:13px;color:var(--text)">${d.name}</div>
      <div style="font-size:11px;color:var(--muted)">${strategy==='avalanche'?d.apr+'% APR':'$'+d.balance.toLocaleString()}</div>
    </div>`).join('')}`:'<div style="text-align:center;padding:20px 0;font-size:13px;color:var(--muted)">Add debts to see your payoff order.</div>'}
  `;
}

function setDebtStrategy(s){
  initDebts();
  C.debtStrategy=s;
  saveState();
  renderDebtPlanner();
}

function updateLumpSim(){
  const selEl=document.getElementById('lump-debt-sel');
  const debtIdx=selEl?parseInt(selEl.value):-1;
  const lump=parseFloat(document.getElementById('lump-amount')?.value||0);
  const resEl=document.getElementById('debt-lump-result');
  if(!resEl)return;
  if(!lump||lump<=0||debtIdx<0){
    resEl.innerHTML='<div style="font-size:12px;color:var(--muted)">Enter a debt and amount to see impact.</div>';
    return;
  }
  initDebts();
  const debts=C.debts||[];
  const strategy=C.debtStrategy||'avalanche';
  const extra=C.debtExtra||0;
  const current=calcDebtPayoff(debts,extra,strategy);
  const modified=JSON.parse(JSON.stringify(debts));
  if(modified[debtIdx])modified[debtIdx].balance=Math.max(0,modified[debtIdx].balance-lump);
  const sim=calcDebtPayoff(modified,extra,strategy);
  const savedMonths=Math.max(0,current.months-sim.months);
  const savedInterest=Math.max(0,Math.round(current.interest-sim.interest));
  if(savedMonths>0||savedInterest>0){
    resEl.innerHTML=`<div style="font-size:12px;color:#a5b4fc;margin-bottom:3px">Debt-free <strong>${savedMonths} month${savedMonths!==1?'s':''} sooner</strong></div><div style="font-size:15px;font-weight:700;color:#818cf8">Save $${savedInterest.toLocaleString()} in interest</div>`;
  }else{
    resEl.innerHTML='<div style="font-size:12px;color:var(--muted)">No significant change — try a larger amount.</div>';
  }
}

function updateDebtExtra(val){
  initDebts();
  C.debtExtra=parseInt(val)||0;
  saveState();
  const valEl=document.getElementById('debt-extra-val');
  if(valEl)valEl.textContent='$'+C.debtExtra;
  const strategy=C.debtStrategy||'avalanche';
  const debts=C.debts||[];
  const base=calcDebtPayoff(debts,0,strategy);
  const withExtra=calcDebtPayoff(debts,C.debtExtra,strategy);
  const savedMonths=Math.max(0,base.months-withExtra.months);
  const savedInterest=Math.max(0,base.interest-withExtra.interest);
  const simEl=document.getElementById('debt-sim-result');
  if(!simEl)return;
  if(C.debtExtra>0&&savedMonths>0){
    simEl.innerHTML=`<div style="font-size:12px;color:#a5b4fc;margin-bottom:3px">Debt-free <strong>${savedMonths} month${savedMonths!==1?'s':''} sooner</strong></div><div style="font-size:15px;font-weight:700;color:#818cf8">Save $${savedInterest.toLocaleString()} in interest</div>`;
  }else{
    simEl.innerHTML='<div style="font-size:12px;color:var(--muted)">Drag the slider to see how extra payments help.</div>';
  }
  const dateEl=document.getElementById('debt-payoff-date');
  const intEl=document.getElementById('debt-total-interest');
  if(dateEl)dateEl.textContent=debts.length?payoffDateStr(withExtra.months):'—';
  if(intEl)intEl.textContent=debts.length?'$'+withExtra.interest.toLocaleString():'—';
}

function openDebtModal(idx){
  initDebts();
  const isEdit=idx!==null&&idx!==undefined;
  const d=isEdit?C.debts[idx]:{name:'',type:'credit_card',balance:'',originalBalance:'',apr:'',minPayment:'',creditLimit:''};
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0">${isEdit?'Edit debt':'Add a debt'}</h3>
      <button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Type</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px" id="debt-type-grid">
      ${[{v:'credit_card',icon:'ti-credit-card',label:'Credit card'},{v:'student',icon:'ti-school',label:'Student loan'},{v:'auto',icon:'ti-car',label:'Auto loan'},{v:'personal',icon:'ti-cash',label:'Personal loan'},{v:'mortgage',icon:'ti-building',label:'Mortgage'},{v:'other',icon:'ti-coin',label:'Other'}].map(t=>`<div onclick="selectDebtType(this,'${t.v}')" data-type="${t.v}" style="background:${d.type===t.v?'#6366f115':'var(--card2)'};border:1px solid ${d.type===t.v?'#6366f150':'var(--border)'};border-radius:9px;padding:8px;font-size:12px;font-weight:600;color:${d.type===t.v?'#a5b4fc':'var(--muted)'};text-align:center;cursor:pointer"><i class="ti ${t.icon}" style="font-size:14px;display:block;margin:0 auto 3px"></i>${t.label}</div>`).join('')}
    </div>
    <input type="hidden" id="debt-selected-type" value="${d.type||'credit_card'}"/>
    <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Nickname</div>
    <input type="text" id="debt-name" placeholder="e.g. Chase Sapphire" value="${d.name||''}" style="margin-bottom:12px"/>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Balance</div>
        <input type="number" id="debt-balance" placeholder="4820" value="${d.balance||''}" inputmode="decimal"/>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">APR %</div>
        <input type="number" id="debt-apr" placeholder="22.4" value="${d.apr||''}" inputmode="decimal"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Min payment</div>
        <input type="number" id="debt-min" placeholder="85" value="${d.minPayment||''}" inputmode="decimal"/>
      </div>
      <div id="debt-limit-wrap">
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Credit limit</div>
        <input type="number" id="debt-limit" placeholder="8000" value="${d.creditLimit||''}" inputmode="decimal"/>
      </div>
    </div>
    <div id="debt-modal-error" style="display:none;background:#ef444418;border:0.5px solid #ef444444;color:var(--red);font-size:12px;padding:10px 12px;border-radius:10px;margin-bottom:12px;text-align:center"></div>
    <div class="modal-btns">
      ${isEdit?`<button class="btn btn-ghost" style="color:var(--red)" onclick="deleteDebt(${idx})"><i class="ti ti-trash" style="font-size:15px;vertical-align:-2px;margin-right:4px"></i>Delete</button>`:`<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>`}
      <button class="btn btn-primary" onclick="saveDebt(${isEdit?idx:'null'})">Save</button>
    </div>
  </div></div>`;
  // Hide credit limit for non-card types
  const limitWrap=document.getElementById('debt-limit-wrap');
  if(limitWrap&&d.type!=='credit_card')limitWrap.style.display='none';
}

function selectDebtType(el,type){
  document.querySelectorAll('#debt-type-grid [data-type]').forEach(c=>{
    const sel=c.dataset.type===type;
    c.style.background=sel?'#6366f115':'var(--card2)';
    c.style.borderColor=sel?'#6366f150':'var(--border)';
    c.style.color=sel?'#a5b4fc':'var(--muted)';
  });
  const hiddenType=document.getElementById('debt-selected-type');
  if(hiddenType)hiddenType.value=type;
  const limitWrap=document.getElementById('debt-limit-wrap');
  if(limitWrap)limitWrap.style.display=type==='credit_card'?'block':'none';
}

function saveDebt(idx){
  initDebts();
  const name=(document.getElementById('debt-name')?.value||'').trim();
  const balance=parseFloat(document.getElementById('debt-balance')?.value||0);
  const apr=parseFloat(document.getElementById('debt-apr')?.value||0);
  const min=parseFloat(document.getElementById('debt-min')?.value||0);
  const limit=parseFloat(document.getElementById('debt-limit')?.value||0)||null;
  const selectedType=document.getElementById('debt-selected-type')?.value||'credit_card';
  const errEl=document.getElementById('debt-modal-error');
  if(!name){if(errEl){errEl.textContent='Please enter a name.';errEl.style.display='block';}return;}
  if(!balance||balance<=0){if(errEl){errEl.textContent='Please enter a valid balance.';errEl.style.display='block';}return;}
  const isEdit=idx!==null&&idx!==undefined&&idx!=='null';
  const existing=isEdit?C.debts[idx]:{};
  const debt={
    id:existing.id||'debt_'+Date.now(),
    name,type:selectedType,
    balance,
    originalBalance:isEdit?(existing.originalBalance||existing.balance||balance):balance,
    apr,minPayment:min,creditLimit:limit
  };
  if(isEdit)C.debts[idx]=debt;
  else C.debts.push(debt);
  saveState();
  closeModal();
  renderDebt();
}

function deleteDebt(idx){
  initDebts();
  if(!confirm('Delete this debt?'))return;
  C.debts.splice(idx,1);
  saveState();
  closeModal();
  renderDebt();
}

async function checkAuthGate(){
  const ov=document.getElementById('auth-overlay');
  if(!ov)return;
  // Check Supabase session first
  const sb=getSB();
  if(sb){
    const {data:{session}}=await sb.auth.getSession();
    if(session){
      // If this is a password-recovery redirect, show PIN reset instead of logging in
      if(window.location.hash.includes('type=recovery')){
        const un=session.user?.user_metadata?.username||'';
        window.location.hash='';
        openPinReset(un);
        return;
      }
      if(!isLoggedIn()){
        // Restore from Supabase session
        const {data:cloudState}=await sb.from('app_state').select('state_json').eq('user_id',session.user.id).maybeSingle();
        if(cloudState?.state_json){STATE=cloudState.state_json;C=STATE.current;try{localStorage.setItem('distrofi_app',JSON.stringify(STATE));}catch(e){}}
        const {data:profile}=await sb.from('profiles').select('display_name,username,pro_tier').eq('id',session.user.id).maybeSingle();
        setAuth({loggedIn:true,name:profile?.display_name||'User',username:profile?.username||'',pro_tier:profile?.pro_tier||null,method:'supabase',since:new Date().toISOString()});
        await initHousehold(session.user.id);
        render();
      }
      ov.style.display='none';
      setSyncStatus('synced');
      return;
    }
  }
  if(isLoggedIn()){ov.style.display='none';}
  else{ov.style.display='flex';}
}


function render401K(){
  const totals=document.getElementById('k401-totals');
  const histEl=document.getElementById('k401-history');
  if(!totals||!histEl)return;
  const all=[...STATE.history,C];
  const grand=allTime401K();

  // Summary cards
  const matchRate=grand.me>0?((grand.emp/grand.me)*100).toFixed(0):0;
  totals.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px">
      <div class="stat-card"><div class="label">Your contributions</div><div class="value" style="font-size:20px;color:var(--blue)">${fmt(grand.me)}</div></div>
      <div class="stat-card"><div class="label">Employer match</div><div class="value" style="font-size:20px;color:var(--green)">${fmt(grand.emp)}</div></div>
    </div>
    <div style="background:linear-gradient(135deg,#3b82f614,#22c55e10);border:1px solid #3b82f630;border-radius:14px;padding:16px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--blue);margin-bottom:6px">All-time total</div>
        <div style="font-size:30px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--text)">${fmt(grand.total)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${grand.periods} period${grand.periods!==1?'s':''} · ${matchRate}% employer match rate</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Match</div>
        <div style="font-size:24px;font-weight:700;color:var(--green)">${matchRate}%</div>
      </div>
    </div>`;

  // ── Growth chart ──
  const chartEl=document.getElementById('k401-chart');
  if(chartEl){
    if(all.length<2){
      chartEl.innerHTML='';
    } else {
      // Build cumulative running totals
      let running=0;
      const periods=all.map(cyc=>{
        const me=cyc.k401?.me||0,emp=cyc.k401?.emp||0;
        running+=me+emp;
        const label=cyc.startDate?new Date(cyc.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short'}):'-';
        return{me,emp,total:me+emp,cumulative:running,label};
      });
      const maxCum=Math.max(...periods.map(p=>p.cumulative),1);
      const maxBar=Math.max(...periods.map(p=>p.total),1);
      const W=340,H=120,pad=28,barW=Math.max(6,Math.floor((W-pad*2)/periods.length*0.6));
      const slotW=(W-pad*2)/periods.length;

      // Bars (stacked me+emp) + cumulative line
      let bars='',labels='',linePoints='';
      periods.forEach((p,i)=>{
        const x=pad+i*slotW+slotW/2;
        const meH=Math.max(2,(p.me/maxBar)*(H-20));
        const empH=Math.max(0,(p.emp/maxBar)*(H-20));
        const totalBarH=meH+empH;
        const barX=x-barW/2;
        const barY=H-4-totalBarH;
        bars+=`<rect x="${barX.toFixed(1)}" y="${(H-4-empH-meH).toFixed(1)}" width="${barW}" height="${meH.toFixed(1)}" fill="var(--blue)" rx="2"/>`;
        bars+=`<rect x="${barX.toFixed(1)}" y="${(H-4-empH).toFixed(1)}" width="${barW}" height="${empH.toFixed(1)}" fill="var(--green)" rx="2"/>`;
        // Cumulative line point
        const ly=(H-4)-((p.cumulative/maxCum)*(H-20));
        linePoints+=`${i===0?'M':'L'}${x.toFixed(1)},${ly.toFixed(1)} `;
        if(i===periods.length-1){
          labels+=`<text x="${x.toFixed(1)}" y="${H+12}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="-apple-system,sans-serif">${p.label}</text>`;
          // Value at end of line
          labels+=`<text x="${(x+6).toFixed(1)}" y="${(ly-4).toFixed(1)}" font-size="9" fill="var(--blue)" font-family="-apple-system,sans-serif" font-weight="600">${fmt(p.cumulative)}</text>`;
        } else if(i===0){
          labels+=`<text x="${x.toFixed(1)}" y="${H+12}" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="-apple-system,sans-serif">${p.label}</text>`;
        }
      });

      chartEl.innerHTML=`<div style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px 14px 6px;margin-bottom:4px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <span>Growth over time</span>
          <div style="display:flex;gap:10px;font-size:10px">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:var(--blue);display:inline-block"></span>You</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:var(--green);display:inline-block"></span>Employer</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:2px;background:var(--blue);opacity:.6;display:inline-block;border-radius:1px"></span>Cumulative</span>
          </div>
        </div>
        <svg width="100%" viewBox="0 0 ${W} ${H+16}" style="overflow:visible">
          ${bars}
          <path d="${linePoints}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-opacity=".6" stroke-linejoin="round"/>
          ${linePoints?`<path d="${linePoints}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-opacity=".6" stroke-dasharray="none"/>`:'' }
          ${labels}
        </svg>
      </div>`;
    }
  }

  // Per-period history
  if(all.length===0){histEl.innerHTML='<div style="text-align:center;color:var(--muted);font-size:14px;padding:32px 0">No data yet</div>';return;}
  const maxVal=Math.max(...all.map(cyc=>(cyc.k401?.me||0)+(cyc.k401?.emp||0)),1);
  histEl.innerHTML=all.slice().reverse().map(cyc=>{
    const me=cyc.k401?.me||0,emp=cyc.k401?.emp||0,total=me+emp;
    const isCurrent=cyc===C;
    const label=cyc.startDate?new Date(cyc.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+new Date(cyc.endDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'—';
    const meW=total>0?(me/total*100).toFixed(0):50;
    const empW=total>0?(emp/total*100).toFixed(0):50;
    return `<div style="background:var(--card);border-radius:14px;border:0.5px solid ${isCurrent?'var(--blue)':'var(--border)'};padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;color:var(--muted)">${label}${isCurrent?'<span style="font-size:10px;background:#3b82f622;color:var(--blue);padding:2px 8px;border-radius:99px;font-weight:600;margin-left:8px">Current</span>':''}</div>
        <div style="font-size:15px;font-weight:700;font-variant-numeric:tabular-nums">${fmt(total)}</div>
      </div>
      <div style="display:flex;height:8px;border-radius:99px;overflow:hidden;margin-bottom:8px;gap:2px">
        <div style="flex:${meW};background:var(--blue);border-radius:99px;transition:flex .4s"></div>
        <div style="flex:${empW};background:var(--green);border-radius:99px;transition:flex .4s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px">
        <span style="color:var(--blue)">You: ${fmt(me)}</span>
        <span style="color:var(--green)">Employer: ${fmt(emp)}</span>
      </div>
    </div>`;
  }).join('');
}
function accrueMonthlyInterest(){
  initDebts();
  const today=new Date().toISOString().split('T')[0];
  const accrued=[];
  (C.debts||[]).forEach(d=>{
    if(d.balance<=0||!d.apr||d.apr<=0)return;
    if(!d.lastAccrualDate){d.lastAccrualDate=today;return;}
    const daysDiff=(new Date(today)-new Date(d.lastAccrualDate))/(864e5);
    if(daysDiff<28)return;
    const interest=Math.round((d.balance*(d.apr/1200))*100)/100;
    d.balance=Math.round((d.balance+interest)*100)/100;
    d.lastAccrualDate=today;
    if(!d.payments)d.payments=[];
    d.payments.push({amount:interest,date:today,note:'Interest charged',isInterest:true});
    accrued.push({name:d.name,amount:interest});
  });
  if(accrued.length){
    saveState();
    const msg='Interest added: '+accrued.map(a=>a.name+' +$'+a.amount.toFixed(2)).join(', ');
    setTimeout(()=>showToast('📈 '+msg),600);
  }
}

function render(){accrueMonthlyInterest();renderHome();renderBills();renderSpend();renderInvest();renderSnapshot();renderHistory();renderSavingsScreen();renderInvGoalsScreen();renderMarketplace();render401K();renderDebt();}

function renderHome(){
  const badge=document.getElementById('pro-badge');
  if(badge)badge.style.display=isPro()?'inline-block':'none';
  const ft=document.getElementById('home-finance-together');
  if(ft)ft.style.display=getPartners().p2?'block':'none';
  const income=totalIncome(),bills=totalBills()-paidBillsAmt(),spent=totalSpent(),rem=remaining();
  document.getElementById('home-income').textContent=fmt(income);
  const bl=document.getElementById('home-bills-left');bl.textContent=fmt(bills);bl.className='value '+(bills<=0?'green':'amber');
  document.getElementById('home-spent').textContent=fmt(spent);
  const re=document.getElementById('home-remaining');
  re.textContent=fmt(rem);
  re.style.color=rem<0?'var(--red)':rem<200?'var(--amber)':'var(--green)';
  // Hero card border color tracks the balance state
  const heroCard=re.closest('[onclick="openSpendingChart()"]');
  if(heroCard) heroCard.style.borderColor=rem<0?'var(--red)':rem<200?'var(--amber)':'var(--accent)';
  const heroSub=document.getElementById('home-remaining-sub');
  if(heroSub){
    const pct=income>0?Math.round((rem/income)*100):0;
    heroSub.style.cursor='default';heroSub.onclick=null;heroSub.textContent=income<=0?`Add income to get started · ${fmtD(C.startDate)} – ${fmtD(C.endDate)}`:(rem>=0?`${pct}% of income · ${fmtD(C.startDate)} – ${fmtD(C.endDate)}`:`over budget · ${fmtD(C.startDate)} – ${fmtD(C.endDate)}`);;
  }
  // Saved stat
  const hs=document.getElementById('home-saved');
  if(hs) hs.textContent=fmt((C.savings?.perPaycheck||0)+currentExtraSavings());

  // vs. last period deltas
  const prev=STATE.history.length?STATE.history[STATE.history.length-1]:null;
  if(prev){
    const prevIncome=Array.isArray(prev.income)?prev.income.reduce((a,l)=>a+(l.amount||0),0):((prev.income?.week1||0)+(prev.income?.week2||0)+(prev.income?.extra||0));
    const prevBills=(prev.bills||[]).reduce((a,b)=>a+(b.amount||0),0)-((prev.bills||[]).filter(b=>b.paid).reduce((a,b)=>a+(b.amount||0),0));
    const prevSpent=Object.keys(prev.buckets||{}).reduce((a,k)=>a+(prev.buckets[k].transactions||[]).reduce((b,t)=>b+(t.amount||0),0),0);
    const fmtDelta=(cur,prev,lowerIsBetter)=>{
      const d=cur-prev;if(Math.abs(d)<0.01)return'<span style="color:var(--muted)">= same</span>';
      const better=(lowerIsBetter?d<0:d>0);
      const col=better?'var(--green)':'var(--red)';
      const arrow=d>0?'▲':'▼';
      return`<span style="color:${col}">${arrow} ${fmt(Math.abs(d))} vs last</span>`;
    };
    const di=document.getElementById('delta-income');
    const db=document.getElementById('delta-bills');
    const ds=document.getElementById('delta-spent');
    if(di)di.innerHTML=fmtDelta(income,prevIncome,false);
    if(db)db.innerHTML=fmtDelta(bills,prevBills,true);
    if(ds)ds.innerHTML=fmtDelta(spent,prevSpent,true);
  } else {
    ['delta-income','delta-bills','delta-spent'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='';});
  }

  // Balance warning banner
  const bw=document.getElementById('balance-warning');
  if(bw){
    const totalInc=totalIncome();
    const warnThreshold=Math.max(200, totalInc*0.1); // 10% of income or $200, whichever is higher
    if(rem<0){
      bw.innerHTML=`<div style="background:#ef444418;border:0.5px solid #ef444444;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <i class="ti ti-alert-circle" style="font-size:22px;color:var(--red);flex-shrink:0"></i>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--red)">Over budget by ${fmt(Math.abs(rem))}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Your spending exceeds your income this period</div>
        </div>
      </div>`;
    } else if(rem<warnThreshold&&rem>=0&&totalInc>0){
      const pct=Math.round((rem/totalInc)*100);
      bw.innerHTML=`<div style="background:#f59e0b12;border:0.5px solid #f59e0b44;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <i class="ti ti-alert-triangle" style="font-size:22px;color:var(--amber);flex-shrink:0"></i>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--amber)">Running low — ${fmt(rem)} left</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Only ${pct}% of income remains this period</div>
        </div>
      </div>`;
    } else {
      bw.innerHTML='';
    }
  }
  document.getElementById('cycle-title').textContent=fmtD(C.startDate)+' – '+fmtD(C.endDate);
  const diff=Math.ceil((new Date(C.endDate+'T00:00:00')-new Date())/(864e5));
  document.getElementById('cycle-days').textContent=diff>0?diff+' days left':'Cycle ended';
  // Cycle-end banner
  const cb=document.getElementById('cycle-banner');
  if(cb){
    if(diff<=3&&diff>=0){
      const urgency=diff===0?'Cycle ends today':diff===1?'Last day tomorrow':`${diff} days left in this period`;
      const col=diff<=1?'var(--amber)':'var(--accent)';const bg=diff<=1?'#f59e0b12':'#6366f112';const border=diff<=1?'#f59e0b44':'#6366f133';
      cb.innerHTML=`<div onclick="startNewCycle()" style="background:${bg};border:0.5px solid ${border};border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;margin-bottom:4px"><i class="ti ti-clock" style="font-size:22px;color:${col};flex-shrink:0"></i><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:${col}">${urgency}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Tap to start a new pay period</div></div><i class="ti ti-chevron-right" style="font-size:16px;color:var(--muted);flex-shrink:0"></i></div>`;
    } else if(diff<0){
      cb.innerHTML=`<div onclick="startNewCycle()" style="background:#ef444418;border:0.5px solid #ef444444;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;margin-bottom:4px"><i class="ti ti-alert-circle" style="font-size:22px;color:var(--red);flex-shrink:0"></i><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--red)">Pay period has ended</div><div style="font-size:11px;color:var(--muted);margin-top:2px">Tap to start a new pay period</div></div><i class="ti ti-chevron-right" style="font-size:16px;color:var(--muted);flex-shrink:0"></i></div>`;
    } else { cb.innerHTML=''; }
  }
  // Partner split summary
  const ps=document.getElementById('partner-split');
  if(ps){
    const p=getPartners();
    if(p.p2){
      const p1Income=(C.income||[]).filter(l=>l.owner==='p1'||!l.owner).reduce((a,l)=>a+(l.amount||0),0);
      const p2Income=(C.income||[]).filter(l=>l.owner==='p2').reduce((a,l)=>a+(l.amount||0),0);
      const p1Bills=C.bills.filter(b=>b.paid&&b.paidBy==='p1').reduce((a,b)=>a+(b.amount||0),0);
      const p2Bills=C.bills.filter(b=>b.paid&&b.paidBy==='p2').reduce((a,b)=>a+(b.amount||0),0);
      const unpaidBills=totalBills()-paidBillsAmt();
      ps.innerHTML=`<div class="split-card" style="margin-bottom:4px">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="ti ti-users" style="font-size:13px"></i> Finance together</div>
        <div class="split-row">
          <div style="display:flex;align-items:center;gap:8px">${partnerAvatar('p1',20)}<span style="font-size:14px;font-weight:500">${p.p1}</span></div>
          <div style="text-align:right"><div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#6366f1">${fmt(p1Income)}</div><div style="font-size:11px;color:var(--muted)">income · ${fmt(p1Bills)} bills paid</div></div>
        </div>
        <div class="split-row">
          <div style="display:flex;align-items:center;gap:8px">${partnerAvatar('p2',20)}<span style="font-size:14px;font-weight:500">${p.p2}</span></div>
          <div style="text-align:right"><div style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:#ec4899">${fmt(p2Income)}</div><div style="font-size:11px;color:var(--muted)">income · ${fmt(p2Bills)} bills paid</div></div>
        </div>
        ${unpaidBills>0?`<div style="font-size:12px;color:var(--muted);padding-top:8px;text-align:center">${fmt(unpaidBills)} in unpaid bills remaining</div>`:''}
      </div>`;
    } else { ps.innerHTML=''; }
  }
  const hb=document.getElementById('home-buckets');hb.innerHTML='';
  Object.keys(C.buckets).forEach(k=>{
    const b=C.buckets[k],sp=bucketSpent(k),pct=b.budget>0?Math.min(sp/b.budget,1):0,col=b.budget>0?bucketColor(sp/b.budget):bucketColor(0);
    const rem=Math.max(0,b.budget-sp);
    const over=sp>b.budget;
    const pctDisplay=Math.round(pct*100);
    // Last transaction for context
    const lastTxn=b.transactions.length?b.transactions[b.transactions.length-1]:null;
    const d=document.createElement('div');
    d.style.cssText=`background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px;margin-bottom:8px;cursor:pointer`;
    d.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px">
          <i class="ti ${b.icon}" style="font-size:18px;color:${col}"></i>${b.label}
        </span>
        <div style="text-align:right">
          <div style="font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;color:${col}">${fmt(sp)}<span style="font-size:12px;font-weight:400;color:var(--muted)"> / ${fmt(b.budget)}</span></div>
        </div>
      </div>
      <div style="height:8px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:8px">
        <div style="height:100%;width:${(pct*100).toFixed(1)}%;background:${col};border-radius:99px;transition:width .4s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;color:${col};font-weight:600">${pctDisplay}% used</span>
        <span style="font-size:11px;color:${over?'var(--red)':'var(--muted)'};font-variant-numeric:tabular-nums">${over?'Over by '+fmt(sp-b.budget):fmt(rem)+' left'}</span>
      </div>
      ${lastTxn?`<div style="margin-top:8px;padding-top:8px;border-top:0.5px solid var(--border);display:flex;justify-content:space-between;font-size:11px;color:var(--muted)"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">Last: ${lastTxn.label||'Purchase'}</span><span style="font-variant-numeric:tabular-nums;padding-left:8px;flex-shrink:0">${fmt(lastTxn.amount)}</span></div>`:''}`;
    d.onclick=()=>showScreen('spend',document.querySelectorAll('.nav-btn')[2]);
    hb.appendChild(d);
  });
  // Home next-bill card
  renderNextBillBanner();
}

function dueBadge(b){
  if(!b.dueDay)return'';
  // Show 'next period' tag if bill is outside current period and unpaid
  if(!b.paid&&!billInPeriod(b))return`<span style="font-size:10px;background:#3b82f618;color:var(--blue);padding:1px 6px;border-radius:99px;font-weight:600;margin-left:4px">next period</span>`;
  const now=new Date();
  const due=new Date(now.getFullYear(),now.getMonth(),b.dueDay);
  const diff=Math.ceil((due-now)/(864e5));
  if(b.paid)return`<span style="font-size:11px;color:var(--green);background:#16a34a22;padding:2px 8px;border-radius:99px;margin-left:6px">Paid</span>`;
  if(diff<0)return`<span style="font-size:11px;color:var(--red);background:#ef444422;padding:2px 8px;border-radius:99px;margin-left:6px">Overdue</span>`;
  if(diff===0)return`<span style="font-size:11px;color:var(--amber);background:#f59e0b22;padding:2px 8px;border-radius:99px;margin-left:6px">Due today</span>`;
  if(diff<=3)return`<span style="font-size:11px;color:var(--amber);background:#f59e0b22;padding:2px 8px;border-radius:99px;margin-left:6px">Due in ${diff}d</span>`;
  return`<span style="font-size:11px;color:var(--muted);padding:2px 0px;margin-left:6px">Due ${b.dueDay}${ordinal(b.dueDay)}</span>`;
}

function renderNextBillBanner(){
  const banner=document.getElementById('home-next-bill');
  if(!banner)return;
  const now=new Date();

  // Bills with due dates — sorted by soonest
  const withDates=C.bills
    .map((b,i)=>({...b,i}))
    .filter(b=>b.dueDay&&!b.paid)
    .map(b=>{
      const due=new Date(now.getFullYear(),now.getMonth(),b.dueDay);
      if(due<now)due.setMonth(due.getMonth()+1);
      const diff=Math.ceil((due-now)/(864e5));
      return{...b,due,diff};
    })
    .sort((a,b)=>a.diff-b.diff);

  // Bills without due dates — unpaid
  const noDates=C.bills
    .map((b,i)=>({...b,i}))
    .filter(b=>!b.dueDay&&!b.paid);

  const allUnpaid=C.bills.filter(b=>!b.paid).length;

  // Nothing unpaid at all
  if(allUnpaid===0){
    banner.innerHTML=`<div style="background:#16a34a18;border:0.5px solid #22c55e44;border-radius:14px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:#22c55e22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="ti ti-circle-check" style="font-size:22px;color:var(--green)"></i>
      </div>
      <div>
        <div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:3px">All clear</div>
        <div style="font-size:15px;font-weight:600">All bills paid</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">Nice work this period</div>
      </div>
    </div>`;
    return;
  }

  let next,diff,bg,border,icon,label,textCol,sub='';

  if(withDates.length){
    next=withDates[0];
    diff=next.diff;
    const othersClose=withDates.filter((_,i)=>i>0&&withDates[i].diff<=diff+3).length;
    if(othersClose>0)sub=`+${othersClose} more bill${othersClose!==1?'s':''} due soon`;
    if(diff<0){
      bg='#ef444418';border='#ef444444';icon='ti-alert-circle';label='Overdue';textCol='var(--red)';
    } else if(diff===0){
      bg='#f59e0b18';border='#f59e0b44';icon='ti-alert-triangle';label='Due today';textCol='var(--amber)';
    } else if(diff<=3){
      bg='#f59e0b12';border='#f59e0b33';icon='ti-clock';label=`Due in ${diff} day${diff!==1?'s':''}`;textCol='var(--amber)';
    } else {
      bg='#6366f112';border='#6366f133';icon='ti-calendar';label=`Due ${next.dueDay}${ordinal(next.dueDay)}`;textCol='var(--accent)';
    }
  } else {
    // No due dates set — show first unpaid bill with a nudge
    next=noDates[0];
    diff=null;
    bg='#6366f112';border='#6366f133';icon='ti-calendar-event';label='Up next';textCol='var(--accent)';
    const remaining=noDates.length-1;
    if(remaining>0)sub=`${remaining} more unpaid bill${remaining!==1?'s':''}`;
    else sub='Tap to set a due date';
  }

  banner.innerHTML=`<div onclick="showScreen('bills',document.querySelectorAll('.nav-btn')[1])" style="background:${bg};border:0.5px solid ${border};border-radius:14px;padding:14px 16px;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:12px">
    <div style="width:40px;height:40px;border-radius:50%;background:${border};display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <i class="ti ${icon}" style="font-size:20px;color:${textCol}"></i>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;color:${textCol};text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:3px">${label}</div>
      <div style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${next.name}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${next.amount?fmt(next.amount):'Amount TBD'}${sub?` · ${sub}`:''}</div>
    </div>
    <i class="ti ti-chevron-right" style="font-size:18px;color:var(--muted);flex-shrink:0"></i>
  </div>`;
}

function addBillSwipe(card,billIdx){
  let startX=0,currentX=0,dragging=false;
  const THRESHOLD=80;
  card.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;dragging=true;card.classList.add('swiping');},{passive:true});
  card.addEventListener('touchmove',e=>{if(!dragging)return;currentX=e.touches[0].clientX-startX;if(currentX<0)currentX=0;card.style.transform=`translateX(${Math.min(currentX,THRESHOLD*1.5)}px)`;card.style.boxShadow=currentX>THRESHOLD?'4px 0 12px rgba(34,197,94,.3)':'';},{passive:true});
  card.addEventListener('touchend',()=>{dragging=false;card.classList.remove('swiping');if(currentX>THRESHOLD){card.style.transform='translateX(100%)';card.style.opacity='0';setTimeout(()=>{toggleBill(billIdx);},200);}else{card.style.transform='';card.style.boxShadow='';}currentX=0;});
}
function ordinal(n){const s=['th','st','nd','rd'];const v=n%100;return s[(v-20)%10]||s[v]||s[0];}
function renderBills(){
  // Migrate: ensure all bills have a category
  C.bills.forEach(b=>{if(!b.category)b.category='bill';});

  renderNextBillBanner();
  const list=document.getElementById('bills-list');list.innerHTML='';
  // Ensure all bills have a sortOrder
  C.bills.forEach((b,i)=>{if(!b.sortOrder)b.sortOrder=i*1000+1000;});
  function sortGroup(arr){
    return arr.sort((a,b)=>{
      if(a.paid!==b.paid) return a.paid?1:-1;
      const ap=a.priority==='high'?0:1, bp=b.priority==='high'?0:1;
      if(ap!==bp) return ap-bp;
      return (a.sortOrder||0)-(b.sortOrder||0);
    });
  }
  function makeBillCard(b,sortedIdx,sectionList,allSorted){
    const i=b._i;
    const wrap=document.createElement('div');wrap.className='bill-card-wrap';wrap.dataset.sortedIdx=sortedIdx;wrap.dataset.billIdx=i;
    const bg=document.createElement('div');bg.className='bill-swipe-bg '+(b.paid?'unpay':'pay');
    bg.innerHTML=b.paid?'<i class="ti ti-rotate-clockwise" style="font-size:20px;color:#fff"></i>':'<i class="ti ti-check" style="font-size:20px;color:#fff"></i>';
    const d=document.createElement('div');d.className='bill-card';
    const dragHandle=b.paid?'':' <span class="bill-drag-handle" style="cursor:grab;padding:6px 4px 6px 8px;color:var(--border);touch-action:none" title="Drag to reorder"><i class="ti ti-grip-vertical" style="font-size:16px"></i></span>';
    const freqBadge=b.category==='subscription'?`<span style="font-size:10px;font-weight:700;background:#6366f115;color:#a5b4fc;padding:2px 5px;border-radius:5px;margin-left:4px">${b.frequency==='annual'?'Annual':'Monthly'}</span>`:'';
    const annualHint=b.category==='subscription'&&b.frequency==='annual'&&b.amount?`<span style="font-size:11px;color:var(--muted)"> ≈ $${(b.amount/12).toFixed(2)}/mo</span>`:'';
    d.innerHTML=`${b.priority==='high'&&!b.paid?'<div class="bill-priority-bar"></div>':''}<div class="bill-toggle ${b.paid?'paid':''}" onclick="toggleBill(${i})"><i class="ti ti-check"></i></div>
      <div class="bill-info" onclick="openBillHistory('${b.name.replace(/'/g,"'")}')" style="cursor:pointer">
        <div class="bill-name ${b.paid?'paid':''}" style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">${b.priority==='high'&&!b.paid?'<i class="ti ti-bolt" style="font-size:12px;color:var(--amber);margin-right:2px"></i>':''}${b.name}${dueBadge(b)}${b.category==='subscription'?'':''}${b.recurring!==false&&b.category!=='subscription'?'<i class="ti ti-repeat" style="font-size:11px;color:var(--muted);opacity:.6;margin-left:4px"></i>':''}${freqBadge}${b.paidBy&&getPartners().p2?partnerAvatar(b.paidBy,18):''}</div>
        <div class="bill-amount" style="display:flex;align-items:center;gap:6px">${b.amount?fmt(b.amount):'Amount TBD'}${annualHint}${STATE.history.length?'<i class="ti ti-history" style="font-size:11px;color:var(--muted);opacity:.5"></i>':''}</div>
      </div>
      ${dragHandle}<button class="icon-btn" onclick="openBillModal(${i})"><i class="ti ti-edit"></i></button>`;
    addBillSwipe(d,i);
    if(!b.paid){
      const handle=d.querySelector('.bill-drag-handle');
      if(handle){handle.addEventListener('touchstart',e=>startBillDrag(e,sortedIdx,wrap),{passive:true});}
    }
    wrap.appendChild(bg);wrap.appendChild(d);sectionList.appendChild(wrap);
  }
  function renderSection(header,items,emptyMsg,addCat){
    const sec=document.createElement('div');
    const total=items.filter(b=>!b.paid).reduce((a,b)=>b.category==='subscription'&&b.frequency==='annual'?(a+(b.amount||0)/12):(a+(b.amount||0)),0);
    sec.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px">`
      +`<div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">${header}</div>`
      +`<div style="font-size:12px;font-weight:600;color:var(--text)">${total>0?'$'+total.toFixed(2)+'/mo':''}</div>`
      +'</div>';
    const subList=document.createElement('div');
    if(!items.length){subList.innerHTML=`<div style="text-align:center;padding:20px 0 8px;color:var(--muted);font-size:13px">${emptyMsg}</div>`;}
    else{items.forEach((b,si)=>makeBillCard(b,si,subList,items));}
    sec.appendChild(subList);
    list.appendChild(sec);
  }
  const billItems=sortGroup([...C.bills.map((b,i)=>({...b,_i:i})).filter(b=>b.category!=='subscription')]);
  const subItems=sortGroup([...C.bills.map((b,i)=>({...b,_i:i})).filter(b=>b.category==='subscription')]);
  _billDragList=[...billItems,...subItems];
  renderSection('Bills',billItems,'No bills yet','bill');
  renderSection('Subscriptions',subItems,'No subscriptions yet','subscription');
}

function startBillDrag(e,sortedIdx,el){
  _billDragIdx=sortedIdx;_billDragEl=el;
  _billDragStartY=e.touches[0].clientY;_billDragCurY=_billDragStartY;
  el.style.opacity='0.7';el.style.zIndex='10';el.style.position='relative';
  const onMove=ev=>{
    _billDragCurY=ev.touches[0].clientY;
    el.style.transform=`translateY(${_billDragCurY-_billDragStartY}px)`;
    // Highlight drop target
    const list=document.getElementById('bills-list');
    const cards=[...list.querySelectorAll('.bill-card-wrap')];
    cards.forEach(c=>c.style.borderTop='');
    const deltaIdx=Math.round((_billDragCurY-_billDragStartY)/60);
    const targetIdx=Math.max(0,Math.min(cards.length-1,sortedIdx+deltaIdx));
    if(targetIdx!==sortedIdx&&cards[targetIdx]){
      cards[targetIdx].style.borderTop=deltaIdx<0?'2px solid var(--accent)':'';
      cards[targetIdx].style.borderBottom=deltaIdx>0?'2px solid var(--accent)':'';
    }
  };
  const onEnd=()=>{
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onEnd);
    el.style.opacity='';el.style.zIndex='';el.style.position='';el.style.transform='';
    // Clear highlights
    const list=document.getElementById('bills-list');
    [...list.querySelectorAll('.bill-card-wrap')].forEach(c=>{c.style.borderTop='';c.style.borderBottom='';});
    // Compute target
    const deltaIdx=Math.round((_billDragCurY-_billDragStartY)/60);
    const targetSortedIdx=Math.max(0,Math.min(_billDragList.length-1,sortedIdx+deltaIdx));
    if(targetSortedIdx!==sortedIdx){
      // Only reorder within same priority group
      const dragged=_billDragList[sortedIdx];
      const target=_billDragList[targetSortedIdx];
      if(dragged.priority===target.priority&&!target.paid){
        // Reassign sortOrder: swap sortOrders
        const tmp=C.bills[dragged._i].sortOrder;
        C.bills[dragged._i].sortOrder=C.bills[target._i].sortOrder||targetSortedIdx*1000;
        C.bills[target._i].sortOrder=tmp||sortedIdx*1000;
        saveState();renderBills();
      }
    }
    _billDragIdx=null;_billDragEl=null;
  };
  document.addEventListener('touchmove',onMove,{passive:true});
  document.addEventListener('touchend',onEnd);
}


let _spendSearchOpen=false;
function toggleSpendSearch(){
  _spendSearchOpen=!_spendSearchOpen;
  const bar=document.getElementById('spend-search-bar');
  const results=document.getElementById('spend-search-results');
  const donut=document.getElementById('spend-donut');
  const buckets=document.getElementById('spend-buckets');
  const btn=document.getElementById('spend-search-btn');
  if(_spendSearchOpen){
    bar.style.display='block';
    results.style.display='block';
    donut.style.display='none';
    buckets.style.display='none';
    if(btn)btn.querySelector('i').className='ti ti-x';
    setTimeout(()=>{const inp=document.getElementById('spend-search-input');if(inp){inp.value='';inp.focus();}renderSpendSearch('');},50);
  } else {
    bar.style.display='none';
    results.style.display='none';
    donut.style.display='block';
    buckets.style.display='block';
    if(btn)btn.querySelector('i').className='ti ti-search';
  }
}
function renderSpendSearch(query){
  const results=document.getElementById('spend-search-results');
  if(!results)return;
  const q=query.trim().toLowerCase();
  // Gather all transactions across all buckets
  let matches=[];
  Object.keys(C.buckets).forEach(bk=>{
    const b=C.buckets[bk];
    b.transactions.forEach((t,ti)=>{
      const haystack=((t.label||'')+(t.notes||'')+(t.date||'')).toLowerCase();
      if(!q||haystack.includes(q)){
        matches.push({bk,ti,t,bucketLabel:b.label,bucketIcon:b.icon,bucketColor:bucketColor(bucketSpent(bk)/(b.budget||1))});
      }
    });
  });
  // Sort newest first
  matches.sort((a,b)=>(b.t.date||'').localeCompare(a.t.date||''));
  if(!matches.length){
    results.innerHTML=`<div style="text-align:center;color:var(--muted);font-size:14px;padding:40px 0"><i class="ti ti-search" style="font-size:32px;display:block;margin-bottom:10px;opacity:.3"></i>${q?'No transactions match "'+query+'"':'No transactions logged yet'}</div>`;
    return;
  }
  const total=matches.reduce((a,m)=>a+(m.t.amount||0),0);
  const rows=matches.map(m=>`
    <div onclick="openEditTxnModal('${m.bk}',${m.ti})" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:0.5px solid var(--border);cursor:pointer;transition:background .15s" onmouseenter="this.style.background='var(--card2)'" onmouseleave="this.style.background=''">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="ti ${m.bucketIcon}" style="font-size:15px;color:${m.bucketColor}"></i>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.t.label||'Purchase'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px">${m.bucketLabel}${m.t.date?' · '+m.t.date:''}${m.t.notes?' · '+m.t.notes:''}</div>
      </div>
      <span style="font-size:14px;font-weight:500;font-variant-numeric:tabular-nums;flex-shrink:0">${fmt(m.t.amount)}</span>
    </div>`).join('');
  results.innerHTML=`<div style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);overflow:hidden;margin-bottom:4px">
    <div style="padding:10px 14px;border-bottom:0.5px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;color:var(--muted)">${matches.length} result${matches.length!==1?'s':''}</span>
      <span style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${fmt(total)}</span>
    </div>
    ${rows}
  </div>`;
}

// Track which spend buckets are expanded (default: all collapsed)
const _bucketExpanded={};
function toggleBucketExpand(k){
  _bucketExpanded[k]=!_bucketExpanded[k];
  renderSpend();
  // Scroll to the just-expanded card
  if(_bucketExpanded[k]){
    setTimeout(()=>{
      const cards=document.querySelectorAll('#spend-buckets .bucket-card');
      const keys=Object.keys(C.buckets);
      const idx=keys.indexOf(k);
      if(cards[idx])cards[idx].scrollIntoView({behavior:'smooth',block:'nearest'});
    },50);
  }
}
function renderSpend(){
  // Donut chart
  const donutEl=document.getElementById('spend-donut');
  if(donutEl){
    const keys=Object.keys(C.buckets);
    const totalBudget=keys.reduce((a,k)=>a+(C.buckets[k].budget||0),0);
    const totalSpentAmt=totalSpent();
    const r=54,cx=80,cy=80,stroke=14,circ=2*Math.PI*r;
    const COLORS=['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6'];
    let offset=0,segments='',legendItems='';
    if(totalBudget>0){
      keys.forEach((k,i)=>{
        const b=C.buckets[k],spent=bucketSpent(k),budgetFrac=(b.budget||0)/totalBudget,spentFrac=Math.min(spent/(b.budget||1),1),segLen=budgetFrac*circ,fillLen=spentFrac*segLen,col=COLORS[i%COLORS.length];
        segments+=`<circle r="${r}" cx="${cx}" cy="${cy}" fill="none" stroke="var(--border)" stroke-width="${stroke}" stroke-dasharray="${segLen-2} ${circ-(segLen-2)}" stroke-dashoffset="${-(offset-circ/4)}" />`;
        if(fillLen>0)segments+=`<circle r="${r}" cx="${cx}" cy="${cy}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${fillLen-1} ${circ-(fillLen-1)}" stroke-dashoffset="${-(offset-circ/4)}" />`;
        legendItems+=`<div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:3px 0;gap:4px"><div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden"><div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></div><span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.label}</span></div><span style="font-variant-numeric:tabular-nums;color:${bucketColor(spent/(b.budget||1))};flex-shrink:0;padding-left:4px">${fmt(spent)}<span style="color:var(--muted)"> / ${fmt(b.budget)}</span></span></div>`;
        offset+=segLen;
      });
    } else {segments=`<circle r="${r}" cx="${cx}" cy="${cy}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>`;}
    const rem_=Math.max(0,totalBudget-totalSpentAmt),over=totalSpentAmt>totalBudget&&totalBudget>0;
    donutEl.innerHTML=`<div style="background:var(--card);border-radius:14px;border:0.5px solid var(--border);padding:14px;margin-bottom:4px;display:flex;align-items:center;gap:10px"><div style="flex-shrink:0"><svg width="130" height="130" viewBox="0 0 160 160">${segments}<text x="${cx}" y="${cy-8}" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text)" font-family="-apple-system,sans-serif">${fmt(totalSpentAmt)}</text><text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="-apple-system,sans-serif">spent of ${fmt(totalBudget)}</text><text x="${cx}" y="${cy+26}" text-anchor="middle" font-size="11" font-weight="600" fill="${over?'var(--red)':rem_<50?'var(--amber)':'var(--green)'}" font-family="-apple-system,sans-serif">${over?'Over budget':fmt(rem_)+' left'}</text></svg></div><div style="flex:1;min-width:0">${legendItems||'<span style="font-size:13px;color:var(--muted)">Add a budget to get started</span>'}</div></div>`;
  }
  const c=document.getElementById('spend-buckets');c.innerHTML='';
  if(!Object.keys(C.buckets).length){c.innerHTML='<div style="text-align:center;padding:48px 16px"><i class="ti ti-wallet-off" style="font-size:48px;color:var(--muted);opacity:.4"></i><div style="font-size:15px;font-weight:500;color:var(--text);margin-top:14px">No spending categories yet</div><div style="font-size:13px;color:var(--muted);margin-top:6px;line-height:1.5">Add a budget to start tracking where your money goes.</div><button onclick="openNewBucketModal()" class="btn btn-primary" style="margin-top:20px;display:inline-flex;gap:6px;align-items:center"><i class="ti ti-plus"></i> Add budget</button></div>';return;}
  Object.keys(C.buckets).forEach(k=>{
    const b=C.buckets[k],spent=bucketSpent(k),pct=spent/b.budget,col=bucketColor(pct);
    const isExpanded=!!_bucketExpanded[k];
    const lastTxn=b.transactions.length?b.transactions[b.transactions.length-1]:null;
    const card=document.createElement('div');card.className='bucket-card';card.style.paddingBottom=isExpanded?'16px':'12px';

    // Build txn rows only when expanded
    let txnSection='';
    if(isExpanded){
      let txns='';
      b.transactions.slice(-5).reverse().forEach((t,ri)=>{
        const actualIdx=b.transactions.length-1-(b.transactions.slice(-5).length-1-ri);
        txns+=`<div class="txn-row" onclick="openEditTxnModal('${k}',${actualIdx})" style="cursor:pointer;transition:background .15s;flex-direction:column;align-items:stretch;gap:2px" onmouseenter="this.style.background='var(--border)'" onmouseleave="this.style.background='var(--card2)'">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="txn-label">${t.label||'Purchase'}<span style="font-size:10px;color:var(--muted);margin-left:6px">${t.date||''}</span></span>
            <span class="txn-amt" style="display:flex;align-items:center;gap:6px">${fmt(t.amount)}<i class="ti ti-pencil" style="font-size:12px;color:var(--muted);opacity:.6"></i></span>
          </div>
          ${t.notes?`<span style="font-size:11px;color:var(--muted);padding-left:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.notes}</span>`:''}
        </div>`;
      });
      txnSection=`
        ${txns?`<div class="txn-list">${txns}</div>`:`<div style="text-align:center;padding:12px 0 4px;font-size:13px;color:var(--muted)">No expenses yet — tap + to log one</div>`}
        ${b.transactions.length>5?`<button onclick="openAllTransactions('${k}')" style="width:100%;padding:8px;background:none;border:none;color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:4px"><i class="ti ti-list" style="font-size:13px"></i> See all ${b.transactions.length} transactions</button>`:''}
        <button class="add-btn" style="margin-top:8px" onclick="openAddModal('${k}')"><i class="ti ti-plus" style="font-size:15px"></i> Log expense</button>`;
    }

    card.innerHTML=`
      <div onclick="toggleBucketExpand('${k}')" style="cursor:pointer">
        <div class="bucket-header" style="margin-bottom:10px">
          <span class="bucket-name"><i class="ti ${b.icon}" style="font-size:19px;vertical-align:-3px;margin-right:8px;color:${col}"></i>${b.label}${b.rollover?'<i class="ti ti-arrow-forward-up" style="font-size:12px;color:var(--accent);margin-left:6px;opacity:.7"></i>':''}${b.rolloverAdded?' <span style="font-size:10px;color:var(--accent);background:#6366f118;border-radius:99px;padding:1px 7px">+'+fmt(b.rolloverAdded)+' rolled</span>':''}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:13px;color:${col};font-variant-numeric:tabular-nums">${fmt(spent)}<span style="color:var(--muted);font-size:12px"> / ${fmt(b.budget)}</span></span>
            <button class="icon-btn" onclick="event.stopPropagation();openBucketModal('${k}')"><i class="ti ti-edit"></i></button>
            <i class="ti ti-chevron-${isExpanded?'up':'down'}" style="font-size:16px;color:var(--muted);transition:transform .2s"></i>
          </div>
        </div>
        <div class="bucket-bar"><div class="bucket-fill" style="width:${Math.min(pct,1)*100}%;background:${col}"></div></div>
        ${!isExpanded&&lastTxn?`<div style="margin-top:8px;display:flex;justify-content:space-between;font-size:11px;color:var(--muted)"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">Last: ${lastTxn.label||'Purchase'}</span><span style="flex-shrink:0;padding-left:8px;font-variant-numeric:tabular-nums">${fmt(lastTxn.amount)}</span></div>`:''}
        ${!isExpanded?`<button class="add-btn" style="margin-top:8px" onclick="event.stopPropagation();openAddModal('${k}')"><i class="ti ti-plus" style="font-size:15px"></i> Log expense</button>`:''}
      </div>
      ${txnSection}`;
    c.appendChild(card);
  });
}

function renderInvest(){
  const chip=document.getElementById('ai-context-chip');
  if(chip){
    const income=totalIncome(),bills=totalBills(),spent=totalSpent(),savings=(C.savings?.perPaycheck||0)+currentExtraSavings(),invested=totalInvested(),rem=remaining();
    const items=[
      {label:'Income',val:fmt(income),col:'var(--green)'},
      {label:'Bills',val:fmt(bills),col:'var(--amber)'},
      {label:'Spent',val:fmt(spent),col:'var(--blue)'},
      {label:'Saved',val:fmt(savings),col:'var(--green)'},
      {label:'Invested',val:fmt(invested),col:'var(--purple)'},
      {label:'Remaining',val:fmt(rem),col:rem<0?'var(--red)':rem<200?'var(--amber)':'var(--green)'},
    ];
    chip.innerHTML=`<div style="background:var(--card2);border:0.5px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:8px"><div style="font-size:10px;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:5px"><i class="ti ti-eye" style="font-size:12px"></i> Advisor can see</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">${items.map(it=>`<div style="background:var(--card);border-radius:8px;padding:7px 8px"><div style="font-size:10px;color:var(--muted);margin-bottom:2px">${it.label}</div><div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${it.col}">${it.val}</div></div>`).join('')}</div></div>`;
  }
  renderAISuggestions();
  // Update banner subtitles
  const investTotal=allTimeInvestments().grand;
  const savingsTotal=allTimeSavings();
  const k401Total=allTime401K().total;
  const ib=document.getElementById('banner-invest-sub');
  const sb=document.getElementById('banner-savings-sub');
  const kb=document.getElementById('banner-401k-sub');
  if(ib)ib.textContent=investTotal>0?fmt(investTotal)+' invested all time':'No investments yet';
  if(sb)sb.textContent=savingsTotal>0?fmt(savingsTotal)+' saved all time':'No savings yet';
  if(kb)kb.textContent=k401Total>0?fmt(k401Total)+' contributed all time':'No contributions yet';
  // Render period data for sub-screens (if currently visible)
  const per=C.savings.perPaycheck||0;
  const extraList=C.savings.extra||[];
  const extraTotal=extraList.reduce((s,e)=>s+(e.amount||0),0);
  const savPer=document.getElementById('sav-per');
  const savExtraTotal=document.getElementById('sav-extra-total');
  const savTotal=document.getElementById('sav-total');
  const savPerLabel=document.getElementById('sav-per-label');
  if(savPer)savPer.textContent=fmt(per);
  if(savPerLabel)savPerLabel.textContent=savingsFreqLabel().charAt(0).toUpperCase()+savingsFreqLabel().slice(1);
  if(savExtraTotal)savExtraTotal.textContent=fmt(extraTotal);
  if(savTotal)savTotal.textContent=fmt(per+extraTotal);
  const el=document.getElementById('sav-extra-list');
  if(el){
    el.innerHTML='';
    extraList.slice().reverse().forEach((e,ri)=>{
      const i=extraList.length-1-ri;
      const d=document.createElement('div');
      d.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--card2);border-radius:10px;margin-bottom:6px';
      d.innerHTML=`<div><div style="font-size:13px;font-weight:500">${e.label||'Extra savings'}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${e.date||''}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:500;color:var(--green);font-variant-numeric:tabular-nums">${fmt(e.amount)}</span><button onclick="deleteExtraSaving(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex;align-items:center"><i class="ti ti-x" style="font-size:15px"></i></button></div>`;
      el.appendChild(d);
    });
  }
  const k401=C.k401||DEFAULT_K401;
  const k401me=document.getElementById('invest-401k-me');
  const k401emp=document.getElementById('invest-401k-emp');
  if(k401me)k401me.textContent=fmt(k401.me);
  if(k401emp)k401emp.textContent=fmt(k401.emp);
  const list=document.getElementById('invest-list');
  if(list){
    list.innerHTML='';
    C.investments.forEach((item,i)=>{
      const d=document.createElement('div');d.className='inv-card';
      const linkedGoal=item.goalIdx!=null&&STATE.invGoals?.[item.goalIdx];
      d.innerHTML=`<div style="width:44px;height:44px;border-radius:12px;background:var(--card2);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;gap:1px">
          <i class="ti ti-trending-up" style="font-size:16px;color:var(--blue)"></i>
          ${item.ticker?`<div style="font-size:8px;font-weight:700;color:var(--blue);letter-spacing:.03em">${item.ticker}</div>`:''}
        </div>
        <div class="inv-info">
          <div class="inv-name" style="display:flex;align-items:center;gap:6px">${item.name}${item.recurring!==false?'<span style="font-size:9px;background:var(--card2);color:var(--muted);padding:1px 6px;border-radius:99px;font-weight:600">recurring</span>':''}</div>
          <div class="inv-amount" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${item.amount?fmt(item.amount):'No amount set'}${linkedGoal?`<span style="font-size:10px;background:#a855f718;color:var(--purple);padding:2px 7px;border-radius:99px;font-weight:600">→ ${linkedGoal.name}</span>`:''}</div>
        </div>
        <button class="icon-btn" onclick="openInvModal(${i})"><i class="ti ti-edit"></i></button>`;
      list.appendChild(d);
    });
  }
}

function renderSnapshot(){
  const income=totalIncome(),bills=totalBills()-paidBillsAmt(),savings=C.savings.perPaycheck+currentExtraSavings(),spent=totalSpent(),invested=totalInvested(),rem=remaining();
  const ic=document.getElementById('income-card');
  const incLines=C.income||[];
  ic.innerHTML=incLines.map((r,i)=>`<div class="income-row" style="${i===incLines.length-1?'border-bottom:none':''}"><span class="income-label" style="display:flex;flex-direction:column;gap:2px">${r.label}${r.owner&&getPartners().p2?partnerAvatar(r.owner,16):''}${r.depositDate?`<span style="font-size:11px;color:var(--muted)">${new Date(r.depositDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>`:''}</span><span class="income-value">${r.amount?fmt(r.amount):'—'}</span></div>`).join('');
  document.getElementById('income-total-display').textContent=fmt(income);
  const tbl=document.getElementById('snapshot-table');
  const rows=[['Income',income,''],['Bills',bills,'sub'],['Savings',savings,'sub'],['Investments',invested,'sub'],
    ...Object.keys(C.buckets).map(k=>[C.buckets[k].label,bucketSpent(k),'sub'])];
  tbl.innerHTML=rows.map(([l,v,t])=>`<div class="snapshot-row"><span style="color:${t?'var(--muted)':'var(--text)'}">${t?'─ ':''} ${l}</span><span style="font-variant-numeric:tabular-nums;color:${t?'var(--muted)':'var(--text)'}">${t?'– ':''} ${fmt(v)}</span></div>`).join('')+
  `<div class="snapshot-row total" style="border-top:0.5px solid var(--border)"><span>Remaining</span><span style="color:${rem<0?'var(--red)':rem<Math.max(200,income*0.1)?'var(--amber)':'var(--green)'};font-variant-numeric:tabular-nums">${fmt(rem)}</span></div>`;
  const allCycles=[...STATE.history,C];
  document.getElementById('alltime-savings').textContent=fmt(allTimeSavings());
  document.getElementById('alltime-savings-sub').textContent=`across ${allCycles.length} pay period${allCycles.length!==1?'s':''}`;
  const k401=allTime401K();
  document.getElementById('alltime-401k').textContent=fmt(k401.total);
  document.getElementById('alltime-401k-sub').textContent=`${fmt(k401.me)} you · ${fmt(k401.emp)} employer · ${k401.periods} period${k401.periods!==1?'s':''}`;
  const inv=allTimeInvestments();
  document.getElementById('alltime-invest').textContent=fmt(inv.grand);
  const names=Object.keys(inv.totals).filter(k=>inv.totals[k]>0);
  document.getElementById('alltime-invest-sub').textContent=names.length?names.map(n=>`${n} ${fmt(inv.totals[n])}`).join(' · '):'No investments logged yet';
  const ts=document.getElementById('trends-sub');
  if(ts){
    const n=[...STATE.history,C].length;
    const locked=n>3&&!isPro()&&hasUsedTrial('trends');
    ts.textContent=`${n} pay period${n!==1?'s':''} tracked · ${locked?'Pro required after 3 periods':'tap for insights'}`;
    const tIcon=document.getElementById('trends-card-icon');
    const tCard=document.getElementById('trends-card');
    if(tIcon){tIcon.className=locked?'ti ti-lock':'ti ti-chevron-right';tIcon.style.color=locked?'var(--accent)':'var(--muted)';}
    if(tCard){tCard.style.opacity=locked?'0.7':'1';tCard.style.border=locked?'0.5px solid #6366f144':'0.5px solid var(--border)';}
  }
  renderWhatIf();
  // Net worth banner
  const nwEl=document.getElementById('net-worth-banner');
  if(nwEl){
    const savingsTotal=allTimeSavings(),k401Total=allTime401K().total,investTotal=allTimeInvestments().grand,netWorth=savingsTotal+k401Total+investTotal;
    const breakdown=[{label:'Savings',val:savingsTotal,col:'var(--green)'},{label:'401K',val:k401Total,col:'var(--blue)'},{label:'Invested',val:investTotal,col:'var(--purple)'}];
    nwEl.innerHTML=`<div style="background:linear-gradient(135deg,#6366f114,#a855f710);border:1px solid #6366f130;border-radius:16px;padding:18px;margin-bottom:4px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--accent);margin-bottom:6px">Net Worth</div><div style="font-size:32px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.5px;color:var(--text);margin-bottom:14px">${fmt(netWorth)}</div><div style="display:flex;gap:0;border-radius:8px;overflow:hidden;height:8px;margin-bottom:12px">${netWorth>0?breakdown.filter(b=>b.val>0).map(b=>`<div style="flex:${b.val};background:${b.col};opacity:.8"></div>`).join(''):'<div style="flex:1;background:var(--border)"></div>'}</div><div style="display:flex;justify-content:space-between">${breakdown.map(b=>`<div style="text-align:center"><div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${b.col}">${fmt(b.val)}</div><div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:.04em">${b.label}</div></div>`).join('')}</div></div>`;
  }
}


function openCycleDetail(idx){
  const cycle=STATE.history[idx];if(!cycle)return;
  let incAmt=0;
  if(Array.isArray(cycle.income)) incAmt=cycle.income.reduce((a,l)=>a+(l.amount||0),0);
  else incAmt=(cycle.income.week1||0)+(cycle.income.week2||0)+(cycle.income.extra||0);
  const billsAmt=cycle.bills.reduce((a,b)=>a+(b.amount||0),0);
  const paidBillsCount=cycle.bills.filter(b=>b.paid).length;
  const savings=(cycle.savings?.perPaycheck||0)+(cycle.savings?.extra||[]).reduce((a,e)=>a+(e.amount||0),0);
  const k401me=cycle.k401?.me||0,k401emp=cycle.k401?.emp||0;
  const bucketKeys=Object.keys(cycle.buckets||{});
  const spent=bucketKeys.reduce((a,k)=>a+(cycle.buckets[k].transactions||[]).reduce((b,t)=>b+(t.amount||0),0),0);
  const rem=incAmt-billsAmt-savings-spent;
  const bucketRows=bucketKeys.map(k=>{
    const b=cycle.buckets[k],s=(b.transactions||[]).reduce((a,t)=>a+(t.amount||0),0),pct=b.budget>0?Math.min(s/b.budget,1):0,col=bucketColor(pct);
    return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:var(--muted)"><i class="ti ${b.icon}" style="vertical-align:-2px;margin-right:4px"></i>${b.label}</span><span style="font-variant-numeric:tabular-nums;color:${col}">${fmt(s)} <span style="color:var(--muted)">/ ${fmt(b.budget)}</span></span></div><div style="height:5px;background:var(--border);border-radius:99px;overflow:hidden"><div style="height:100%;width:${Math.round(pct*100)}%;background:${col};border-radius:99px"></div></div></div>`;
  }).join('');
  const billRows=cycle.bills.map(b=>`<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:0.5px solid var(--border)"><span style="${b.paid?'text-decoration:line-through;color:var(--muted)':'color:var(--text)'}">${b.name}</span><span style="font-variant-numeric:tabular-nums;color:${b.paid?'var(--green)':'var(--muted)'}">${b.paid?'<i class="ti ti-check" style="font-size:12px"></i> ':''}${fmt(b.amount)}</span></div>`).join('');
  document.getElementById('modal-root').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" style="max-height:88vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0">${fmtD(cycle.startDate)} – ${fmtD(cycle.endDate)}</h3><button onclick="closeModal()" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px"><i class="ti ti-x" style="font-size:20px"></i></button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="stat-card"><div class="label">Income</div><div class="value" style="font-size:18px">${fmt(incAmt)}</div></div>
      <div class="stat-card"><div class="label">Remaining</div><div class="value ${rem>=0?'green':'red'}" style="font-size:18px">${fmt(rem)}</div></div>
      <div class="stat-card"><div class="label">Bills</div><div class="value" style="font-size:18px">${fmt(billsAmt)}</div></div>
      <div class="stat-card"><div class="label">Spent</div><div class="value" style="font-size:18px">${fmt(spent)}</div></div>
      ${(k401me||k401emp)?`<div class="stat-card" style="grid-column:span 2"><div class="label">401k this period</div><div style="display:flex;justify-content:space-between;margin-top:4px"><span style="font-size:14px;font-variant-numeric:tabular-nums">${fmt(k401me)} <span style="font-size:11px;color:var(--muted)">you</span></span><span style="font-size:14px;font-variant-numeric:tabular-nums">${fmt(k401emp)} <span style="font-size:11px;color:var(--muted)">employer</span></span><span style="font-size:14px;font-weight:600;color:var(--blue);font-variant-numeric:tabular-nums">${fmt(k401me+k401emp)} <span style="font-size:11px;color:var(--muted)">total</span></span></div></div>`:''}
    </div>
    ${bucketKeys.length?`<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Spending</div>${bucketRows}`:''}
    ${cycle.bills.length?`<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 8px">Bills (${paidBillsCount}/${cycle.bills.length} paid)</div>${billRows}`:''}
    <button class="btn btn-ghost" style="width:100%;margin-top:16px" onclick="closeModal()">Close</button>
  </div></div>`;
}
function renderHistory(){
  const list=document.getElementById('history-list');list.innerHTML='';
  if(!STATE.history.length){list.innerHTML='<div class="history-empty"><i class="ti ti-clock" style="font-size:40px;display:block;margin-bottom:12px;opacity:.3"></i>Past cycles will appear here once you start a new period.</div>';return;}
  const histToShow=isPro()?STATE.history:STATE.history.slice(-2);
  if(!isPro()&&STATE.history.length>2){
    list.innerHTML=`<div onclick="openPaywall('history')" style="background:linear-gradient(135deg,#7c3aed18,#6366f118);border:0.5px solid #6366f133;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer">
      <i class="ti ti-lock" style="font-size:20px;color:var(--accent);flex-shrink:0"></i>
      <div><div style="font-size:14px;font-weight:500">+${STATE.history.length-2} older cycles locked</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Upgrade to Pro to view full history</div></div>
      <i class="ti ti-chevron-right" style="font-size:16px;color:var(--muted);margin-left:auto;flex-shrink:0"></i>
    </div>`;
  }
  histToShow.slice().reverse().forEach(cycle=>{
    const inc=Array.isArray(cycle.income)?cycle.income.reduce((s,l)=>s+(l.amount||0),0):((cycle.income.week1||0)+(cycle.income.week2||0)+(cycle.income.extra||0));
    const bills=cycle.bills.reduce((a,b)=>a+(b.amount||0),0);
    const savings=(cycle.savings?.perPaycheck||0)+(cycle.savings?.extra||[]).reduce((a,e)=>a+(e.amount||0),0);
    const spent=Object.keys(cycle.buckets).reduce((a,k)=>a+cycle.buckets[k].transactions.reduce((b,t)=>b+(t.amount||0),0),0);
    const rem=inc-bills-savings-spent;
    const d=document.createElement('div');d.className='cycle-card';
    const cycleIdx=STATE.history.indexOf(cycle);
    d.style.cursor='pointer';d.onclick=()=>openCycleDetail(cycleIdx);
    d.innerHTML=`<div><div style="font-size:15px;font-weight:600">${fmtD(cycle.startDate)} – ${fmtD(cycle.endDate)}</div><div class="cycle-meta">Income ${fmt(inc)} · Spent ${fmt(spent)}</div></div><div style="display:flex;align-items:center;gap:8px"><span class="cycle-badge ${rem>=0?'badge-green':'badge-red'}">${rem>=0?'+':'-'}${fmt(Math.abs(rem))}</span><i class="ti ti-chevron-right" style="font-size:16px;color:var(--muted)"></i></div>`;
    list.appendChild(d);
  });
}

function startNewCycle(){
  const rem=remaining();
  if(rem>0.01){
    // Show leftover prompt
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
      <div style="text-align:center;margin-bottom:20px">
        <div style="width:64px;height:64px;border-radius:20px;background:#22c55e18;border:1.5px solid #22c55e44;display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
          <i class="ti ti-cash" style="font-size:32px;color:var(--green)"></i>
        </div>
        <h3 style="margin:0 0 6px">You have ${fmt(rem)} left over</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.5;margin:0">What would you like to do with it before starting a new period?</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        <button onclick="confirmNewCycle('savings')" style="width:100%;padding:14px 16px;background:var(--card2);border:1.5px solid var(--border);border-radius:14px;color:var(--text);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:12px;text-align:left;transition:border-color .15s" onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:38px;height:38px;border-radius:10px;background:#22c55e18;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-pig-money" style="font-size:20px;color:var(--green)"></i></div>
          <div><div style="font-weight:600;margin-bottom:2px">Move to savings</div><div style="font-size:12px;color:var(--muted)">Add ${fmt(rem)} as an extra savings entry</div></div>
        </button>
        <button onclick="confirmNewCycle('buffer')" style="width:100%;padding:14px 16px;background:var(--card2);border:1.5px solid var(--border);border-radius:14px;color:var(--text);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:12px;text-align:left;transition:border-color .15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:38px;height:38px;border-radius:10px;background:#6366f118;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-arrows-right" style="font-size:20px;color:var(--accent)"></i></div>
          <div><div style="font-weight:600;margin-bottom:2px">Roll into next period</div><div style="font-size:12px;color:var(--muted)">Add ${fmt(rem)} as bonus income next cycle</div></div>
        </button>
        <button onclick="confirmNewCycle('leave')" style="width:100%;padding:14px 16px;background:var(--card2);border:1.5px solid var(--border);border-radius:14px;color:var(--text);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:12px;text-align:left;transition:border-color .15s" onmouseover="this.style.borderColor='var(--muted)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--card2);border:0.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-x" style="font-size:20px;color:var(--muted)"></i></div>
          <div><div style="font-weight:600;margin-bottom:2px">Leave it</div><div style="font-size:12px;color:var(--muted)">Archive with this period, start fresh</div></div>
        </button>
      </div>
      <button class="btn btn-ghost" style="width:100%" onclick="closeModal()">Cancel</button>
    </div></div>`;
  } else {
    // No leftover — simple confirmation
    document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal">
      <h3>Start new pay period?</h3>
      <p style="font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.6">Recurring bills carry forward (unpaid). One-time bills are removed. This period will be saved to history.</p>
      <div class="modal-btns"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="confirmNewCycle('leave')">Start new period</button></div>
    </div></div>`;
  }
}
function confirmNewCycle(leftoverAction){
  const rolloverMap={};
  Object.keys(C.buckets).forEach(k=>{
    const b=C.buckets[k];
    if(b.rollover){
      const unused=Math.max(0,(b.budget||0)-bucketSpent(k));
      if(unused>0) rolloverMap[k]={unused,baseBudget:b.baseBudget||b.budget,rollover:true};
    }
  });
  STATE.history.push(JSON.parse(JSON.stringify(C)));
  const recurringIncome=C.income.filter(l=>l.recurring!==false).map(l=>({...l,depositDate:''}));
  const recurringBills=C.bills.filter(b=>b.recurring!==false).map(b=>({...b,paid:false}));
  const recurringInvs=C.investments.filter(inv=>inv.recurring!==false).map(inv=>({...inv}));
  const recurring401k=C.k401&&C.k401.recurring!==false?{...C.k401}:null;
  const carryDebts=JSON.parse(JSON.stringify(C.debts||[]));
  const leftoverAmt=remaining(); // capture before resetting
  STATE.current=newCycleData();C=STATE.current;
  if(carryDebts.length)C.debts=carryDebts;
  if(recurringIncome.length) C.income=recurringIncome;
  // Apply leftover action
  if(leftoverAmt>0.01){
    if(leftoverAction==='savings'){
      if(!C.savings.extra)C.savings.extra=[];
      C.savings.extra.push({amount:leftoverAmt,label:'Carried over from last period',date:new Date().toISOString().slice(0,10)});
    } else if(leftoverAction==='buffer'){
      C.income.push({label:'Carried over from last period',amount:leftoverAmt,recurring:false});
    }
    // 'leave' — do nothing
  }
  if(recurringBills.length) C.bills=recurringBills;
  if(recurringInvs.length) C.investments=recurringInvs;
  if(recurring401k) C.k401=recurring401k;
  Object.keys(rolloverMap).forEach(k=>{
    if(C.buckets[k]){
      const r=rolloverMap[k];
      C.buckets[k].budget=r.baseBudget+r.unused;
      C.buckets[k].baseBudget=r.baseBudget;
      C.buckets[k].rollover=true;
      C.buckets[k].rolloverAdded=r.unused;
    }
  });
  saveState();closeModal();render();
}
// Handle Supabase password recovery callback (link from email)
let _recoveryMode=false;
function initAuthListener(){
  const sb=getSB();
  if(!sb)return;
  sb.auth.onAuthStateChange(async (event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      _recoveryMode=true;
      const un=session?.user?.user_metadata?.username||'';
      setTimeout(()=>openPinReset(un),300);
    }
  });
}
initAuthListener();
checkAuthGate().then(()=>{
  if(!_recoveryMode&&isLoggedIn())render();
});