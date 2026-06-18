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
        const {data:profile}=await sb.from('profiles').select('display_name,username,pro_tier,payment_past_due').eq('id',data.user.id).maybeSingle();
        // Stamp last_seen_at for admin active-user tracking
        sb.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',data.user.id).then(()=>{});
        setAuth({loggedIn:true,name:profile?.display_name||usernameVal,username:usernameVal,user_id:data.user.id,pro_tier:profile?.pro_tier||null,payment_past_due:!!profile?.payment_past_due,method:'supabase',since:new Date().toISOString()});
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
