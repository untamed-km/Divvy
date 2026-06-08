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
