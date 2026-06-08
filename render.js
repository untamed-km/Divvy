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