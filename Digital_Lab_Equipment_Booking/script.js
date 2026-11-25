/* LabReserve demo app — storage, auth, routing, booking, notifications and UI. */
(() => {
  "use strict";

  const STORE_KEY = "labreserve_saas_v1";
  const SESSION_KEY = "labreserve_demo_session";
  const slots = [
    "09:00 AM – 10:00 AM", "10:00 AM – 11:00 AM", "11:00 AM – 12:00 PM",
    "12:00 PM – 01:00 PM", "01:00 PM – 02:00 PM", "02:00 PM – 03:00 PM",
    "03:00 PM – 04:00 PM", "04:00 PM – 05:00 PM"
  ];
  const demoUsers = [
    {name:"Lab Administrator",email:"admin@lab.edu",password:"admin123",role:"admin",department:"Laboratory Services",roll:""},
    {name:"Aarav Mehta",email:"student@lab.edu",password:"student123",role:"student",department:"Physics",roll:"24PHY103"},
    {name:"Maya Iyer",email:"maya@lab.edu",password:"maya123",role:"student",department:"Chemistry",roll:"24CHE218"},
    {name:"Kabir Das",email:"kabir@lab.edu",password:"kabir123",role:"student",department:"Biology",roll:"23BIO076"},
    {name:"Ishita Rao",email:"ishita@lab.edu",password:"ishita123",role:"student",department:"Electronics",roll:"24ECE032"}
  ];
  const equipmentSeed = [
    ["EQ01","Digital Oscilloscope","Electronics","〰","Electronics Lab · A-204","2-channel · 100 MHz","Waveform and signal analysis"],
    ["EQ02","Optical Microscope","Biology","⌕","Life Sciences Lab · B-106","40×–1000× · LED","Bright-field sample imaging"],
    ["EQ03","UV-Vis Spectrophotometer","Chemistry","◩","Analytical Lab · C-211","190–1100 nm · 1 nm","Absorbance and concentration"],
    ["EQ04","FDM 3D Printer","Fabrication","▧","Innovation Lab · D-108","220 × 220 × 250 mm","Rapid prototyping · PLA/PETG"],
    ["EQ05","Benchtop Centrifuge","Biology","◉","Life Sciences Lab · B-108","Up to 15,000 rpm · 24-place","Sample separation and preparation"],
    ["EQ06","PCR Thermal Cycler","Biology","⌬","Molecular Biology Lab · B-212","96-well · gradient mode","DNA amplification workflows"],
    ["EQ07","Arduino Starter Kit","Electronics","⌘","IoT Lab · A-118","Uno R4 · 30+ components","Embedded systems and prototyping"],
    ["EQ08","Digital Multimeter","Electronics","◫","Electronics Lab · A-204","True RMS · 6000 counts","Voltage, current and resistance"],
    ["EQ09","Analytical Balance","Chemistry","⚖","Analytical Lab · C-201","220 g · 0.1 mg readability","Precision mass measurement"],
    ["EQ10","Steam Autoclave","Biology","♨","Microbiology Lab · B-103","18 L · 121 °C cycle","Sterilisation of lab materials"],
    ["EQ11","Function Generator","Electronics","∿","Electronics Lab · A-207","25 MHz · arbitrary waveform","Signal generation and testing"],
    ["EQ12","Hotplate Magnetic Stirrer","Chemistry","♨","Synthesis Lab · C-109","Up to 550 °C · 5 L","Heated mixing and solution prep"],
    ["EQ13","Gel Electrophoresis Unit","Biology","▤","Molecular Biology Lab · B-214","Mini horizontal · 7 × 7 cm","DNA and protein separation"],
    ["EQ14","Laptop Workstation","Computing","▣","Computer Lab · E-301","16 GB RAM · Linux / Windows","Simulation and analysis software"],
    ["EQ15","Logic Analyzer","Electronics","▥","IoT Lab · A-118","16 channels · 100 MHz","Digital bus and protocol analysis"],
    ["EQ16","Digital pH Meter","Chemistry","◉","Analytical Lab · C-201","0–14 pH · ±0.01 accuracy","Aqueous solution measurement"],
    ["EQ17","Laser Cutter","Fabrication","⌗","Innovation Lab · D-112","600 × 400 mm · enclosed","Precision cutting and engraving"],
    ["EQ18","Fluorescence Microscope","Biology","✧","Life Sciences Lab · B-106","LED illumination · 4 channels","Fluorescent sample imaging"]
  ].map(([id,name,category,icon,location,spec,description]) => ({id,name,category,icon,location,spec,description}));

  const dateISO = (offset=0) => {
    const date=new Date();
    date.setHours(12,0,0,0);
    date.setDate(date.getDate()+offset);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  };
  const timeNow = () => new Date().toISOString();
  const bookingSeed = () => [
    {id:"BK-1041",equipmentId:"EQ01",date:dateISO(1),slot:slots[1],student:"Aarav Mehta",userId:"student@lab.edu",purpose:"Compare amplifier response under different loads",groupSize:2,status:"approved",createdAt:timeNow()},
    {id:"BK-1042",equipmentId:"EQ03",date:dateISO(2),slot:slots[3],student:"Maya Iyer",userId:"maya@lab.edu",purpose:"Calibration curve for the term project",groupSize:3,status:"pending",createdAt:timeNow()},
    {id:"BK-1043",equipmentId:"EQ05",date:dateISO(3),slot:slots[2],student:"Kabir Das",userId:"kabir@lab.edu",purpose:"Prepare cell culture samples",groupSize:2,status:"approved",createdAt:timeNow()},
    {id:"BK-1044",equipmentId:"EQ07",date:dateISO(4),slot:slots[4],student:"Ishita Rao",userId:"ishita@lab.edu",purpose:"Prototype a sensor interface",groupSize:1,status:"pending",createdAt:timeNow()},
    {id:"BK-1036",equipmentId:"EQ02",date:dateISO(-3),slot:slots[0],student:"Aarav Mehta",userId:"student@lab.edu",purpose:"Inspect prepared tissue slides",groupSize:2,status:"completed",createdAt:timeNow(),completedAt:timeNow()}
  ];
  const freshData = () => ({
    equipment:structuredClone(equipmentSeed),
    bookings:bookingSeed(),
    maintenance:[],
    history:[],
    users:structuredClone(demoUsers),
    notifications:[
      {id:"NT-WELCOME",userId:"student@lab.edu",message:"Welcome to LabReserve. Your next lab session starts here.",createdAt:timeNow(),read:false},
      {id:"NT-ADMIN",userId:"admin@lab.edu",message:"Admin workspace is ready. Review the pending queue to get started.",createdAt:timeNow(),read:false}
    ],
    reminderIds:[],
    activity:[{id:"AC-START",message:"LabReserve demo workspace initialized.",createdAt:timeNow()}],
    settings:{theme:"light"}
  });

  // Storage keeps the demo self-contained and migrates data from the earlier project version.
  function loadStore(){
    const seeded=freshData();
    let raw=localStorage.getItem(STORE_KEY);
    if(!raw) raw=localStorage.getItem("labreserve_v1");
    if(!raw) return seeded;
    try{
      const saved=JSON.parse(raw);
      if(!saved||typeof saved!=="object") return seeded;
      const storedUsers=Array.isArray(saved.users)?saved.users:[];
      return {
        ...seeded,...saved,
        equipment:Array.isArray(saved.equipment)?saved.equipment.map(item=>({...item,spec:item.spec||item.description||"Shared laboratory resource"})):seeded.equipment,
        bookings:Array.isArray(saved.bookings)?saved.bookings:seeded.bookings,
        maintenance:Array.isArray(saved.maintenance)?saved.maintenance:seeded.maintenance,
        history:Array.isArray(saved.history)?saved.history:seeded.history,
        users:[...demoUsers,...storedUsers.filter(user=>!demoUsers.some(demo=>demo.email===user.email))],
        notifications:Array.isArray(saved.notifications)?saved.notifications:seeded.notifications,
        reminderIds:Array.isArray(saved.reminderIds)?saved.reminderIds:[],
        activity:Array.isArray(saved.activity)?saved.activity:seeded.activity,
        settings:{...seeded.settings,...saved.settings}
      };
    }catch(error){
      console.warn("LabReserve saved data could not be read; starting with demo data.",error);
      return seeded;
    }
  }
  let store=loadStore();
  let session=null;
  let currentRoute="";
  let authRole="student";
  let authMode="login";
  let selectedSlot="";
  let submittingBooking=false;
  let commandItems=[];
  let commandIndex=0;
  let catalogState={query:"",category:"all",status:"all",sort:"name",layout:"grid"};
  let bookingState={date:dateISO(),equipmentId:"",weekOffset:0};
  let bookingFilter="all";
  let historyState={from:"",to:"",status:"all"};
  let globalMatches=[];
  let searchFocusReturn=null;
  let isMobileViewport=window.innerWidth<=820;

  const byId=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const today=()=>dateISO(0);
  const userByEmail=email=>store.users.find(user=>user.email.toLowerCase()===String(email||"").toLowerCase());
  const currentUser=()=>session?userByEmail(session.email)||{name:session.name,email:session.email,role:session.role,department:""}:null;
  const equipmentById=id=>store.equipment.find(item=>item.id===id);
  const makeId=prefix=>`${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const fmtDate=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—";
  const shortDate=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}):"—";
  const roleHome=role=>role==="admin"?"admin/overview":"student/dashboard";
  const visibleBookings=()=>store.bookings.filter(booking=>session?.role==="admin"||booking.userId===session?.email);
  const activeBookings=()=>store.bookings.filter(booking=>booking.status==="pending"||booking.status==="approved");
  function persist(){localStorage.setItem(STORE_KEY,JSON.stringify(store));}
  function recordActivity(message){
    store.activity.unshift({id:makeId("AC"),message,createdAt:timeNow()});
    store.activity=store.activity.slice(0,80);
  }
  function addNotification(message,userId=session?.email){
    store.notifications.unshift({id:makeId("NT"),userId,message,createdAt:timeNow(),read:false});
    store.notifications=store.notifications.slice(0,100);
    persist();
    renderUnreadCount();
  }
  function toast(message,type="success"){
    const node=document.createElement("div");
    node.className=`toast ${type}`;
    node.setAttribute("role",type==="error"?"alert":"status");
    node.textContent=message;
    byId("toastRegion").append(node);
    window.setTimeout(()=>node.remove(),3900);
  }
  function launchConfetti(){
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors=["#69d9c8","#7b96ff","#ffd083","#ba9bff"];
    for(let i=0;i<24;i++){
      const bit=document.createElement("i");
      bit.className="confetti";
      bit.style.setProperty("--dx",`${Math.round(Math.random()*250-125)}px`);
      bit.style.setProperty("--dy",`${Math.round(Math.random()*-200-30)}px`);
      bit.style.setProperty("--confetti",colors[i%colors.length]);
      byId("toastRegion").append(bit);
      window.setTimeout(()=>bit.remove(),900);
    }
  }

  // Authentication is intentionally a local demo; credentials are not secure.
  function readSession(){
    let raw=sessionStorage.getItem(SESSION_KEY);
    if(!raw) raw=localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    try{return JSON.parse(raw);}catch(error){console.warn("Invalid LabReserve demo session was cleared.",error);sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_KEY);return null;}
  }
  function saveSession(user,remember){
    session={email:user.email,name:user.name,role:user.role};
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
    if(remember) localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    location.hash=`#/${roleHome(session.role)}`;
    byId("authDialog").close();
  }
  function openAuth(mode="login",role="student"){
    authMode=mode;authRole=role;
    updateAuthInterface();
    if(!byId("authDialog").open) byId("authDialog").showModal();
  }
  function updateAuthInterface(){
    const switcher=document.querySelector(".auth-role-switch");
    switcher.classList.toggle("admin-selected",authRole==="admin");
    document.querySelectorAll(".auth-role-tab").forEach(tab=>{
      const active=tab.dataset.authRole===authRole;
      tab.classList.toggle("active",active);
      tab.setAttribute("aria-selected",String(active));
    });
    const signingUp=authMode==="signup";
    byId("signupToggle").classList.toggle("hidden",authRole==="admin");
    byId("signupFields").classList.toggle("hidden",!signingUp);
    byId("authTitle").textContent=signingUp?"Create your student account":"Good to have you here.";
    byId("authSubmit").innerHTML=signingUp?'Create account <span aria-hidden="true">→</span>':'Sign in <span aria-hidden="true">→</span>';
    byId("signupToggle").textContent=signingUp?"Already have an account? Sign in":"Create student account";
    byId("authDemoHint").innerHTML=authRole==="admin"?'Demo: admin@lab.edu <span>·</span> admin123':`Demo: student@lab.edu <span>·</span> student123`;
    byId("authFormError").classList.add("hidden");
    document.querySelectorAll(".field-error").forEach(error=>error.textContent="");
    if(authRole==="admin"&&signingUp) authMode="login";
  }
  function handleAuthSubmit(event){
    event.preventDefault();
    const email=byId("authEmail").value.trim().toLowerCase();
    const password=byId("authPassword").value;
    const errorBox=byId("authFormError");
    const emailError=document.querySelector('[data-error="email"]');
    const passError=document.querySelector('[data-error="password"]');
    emailError.textContent="";passError.textContent="";errorBox.classList.add("hidden");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      emailError.textContent="Enter a valid university email.";
      byId("authEmail").focus();
      return;
    }
    if(authMode==="signup"){
      const name=byId("signupName").value.trim();
      if(authRole!=="student"){errorBox.textContent="Administrator sign-up is disabled in this demo.";errorBox.classList.remove("hidden");return;}
      if(name.length<2){document.querySelector('[data-error="name"]').textContent="Enter your full name.";byId("signupName").focus();return;}
      if(password.length<6){passError.textContent="Use at least 6 characters.";byId("authPassword").focus();return;}
      if(userByEmail(email)){emailError.textContent="An account already uses this email.";byId("authEmail").focus();return;}
      const user={name,email,password,role:"student",department:byId("signupDepartment").value||"General",roll:byId("signupRoll").value.trim(),active:true,createdAt:timeNow()};
      store.users.push(user);persist();
      byId("authForm").reset();
      authMode="login";
      toast("Student account created. Welcome to LabReserve.");
      saveSession(user,byId("rememberMe").checked);
      return;
    }
    const user=userByEmail(email);
    if(!user||user.password!==password||user.role!==authRole||user.active===false){
      errorBox.textContent=user?.active===false?"This demo account is inactive. Contact a lab administrator.":"Email or password is incorrect for the selected workspace.";
      errorBox.classList.remove("hidden");
      byId("authForm").classList.remove("shake");
      void byId("authForm").offsetWidth;
      byId("authForm").classList.add("shake");
      return;
    }
    saveSession(user,byId("rememberMe").checked);
  }
  function logout(){
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    session=null;currentRoute="";
    location.hash="#home";
    showLanding();
    toast("You have signed out.");
  }
  function showLanding(){
    byId("landingView").classList.remove("hidden");
    byId("appShell").classList.add("hidden");
    document.title="LabReserve — Your lab, in sync";
  }
  function showWorkspace(){
    byId("landingView").classList.add("hidden");
    byId("appShell").classList.remove("hidden");
    document.title=`${session.role==="admin"?"Admin":"Student"} workspace · LabReserve`;
  }

  // Hash router keeps the demo on one static HTML file and enforces role routes.
  const pageNames={
    "student/dashboard":"My Dashboard","student/catalogue":"Equipment Catalogue","student/book":"Book Equipment","student/bookings":"My Bookings","student/history":"Usage History","student/notifications":"Notifications","student/profile":"My Profile",
    "admin/overview":"Admin Overview","admin/approvals":"Approvals","admin/equipment":"Equipment Management","admin/maintenance":"Maintenance","admin/bookings":"All Bookings","admin/reports":"Reports","admin/users":"Users"
  };
  const studentNav=[
    ["dashboard","Dashboard","▦"],["catalogue","Catalogue","▣"],["book","Book equipment","＋"],["bookings","My bookings","▤"],["history","History","◷"],["notifications","Notifications","♧"],["profile","Profile","◎"]
  ];
  const adminNav=[
    ["overview","Overview","▦"],["approvals","Approvals","✓"],["equipment","Equipment","▣"],["maintenance","Maintenance","⚙"],["bookings","All bookings","▤"],["reports","Reports","▥"],["users","Users","◎"]
  ];
  function parseRoute(){
    const hash=location.hash.replace(/^#\/?/,"");
    const [path="",query=""]=hash.split("?");
    const params=new URLSearchParams(query);
    return {path,params};
  }
  function routeTo(path,replace=false){
    if(!session){openAuth("login","student");return;}
    const requestedRole=path.split("/")[0];
    if(requestedRole!==session.role){toast("That workspace is not available for this demo account.","error");path=roleHome(session.role);}
    const hash=`#/${path}`;
    if(replace) history.replaceState(null,"",hash); else location.hash=hash;
    if(location.hash===hash) renderRoute();
  }
  function navMarkup(){
    const items=session.role==="admin"?adminNav:studentNav;
    return items.map(([route,label,icon])=>`<a href="#/${session.role}/${route}" class="nav-link" data-route="${session.role}/${route}" aria-current="false"><span class="nav-icon" aria-hidden="true">${esc(icon)}</span><span>${esc(label)}</span>${route==="approvals"&&session.role==="admin"&&pendingBookings().length?`<span class="nav-count">${pendingBookings().length}</span>`:""}</a>`).join("");
  }
  function updateIdentity(){
    const user=currentUser();
    const initials=(user?.name||"LR").split(/\s+/).filter(Boolean).map(part=>part[0]).join("").slice(0,2).toUpperCase();
    byId("workspaceLabel").textContent=`${session.role.toUpperCase()} WORKSPACE`;
    byId("mainNav").innerHTML=navMarkup();
    byId("sidebarAvatar").textContent=initials;
    byId("topAvatar").textContent=initials;
    byId("sidebarName").textContent=user?.name||"Lab user";
    byId("sidebarRole").textContent=session.role==="admin"?"Laboratory administrator":user?.department||"Student";
    byId("topAccountName").textContent=user?.name||"Lab user";
    byId("popoverName").textContent=user?.name||"Lab user";
    byId("popoverEmail").textContent=user?.email||"";
    byId("themeToggle").textContent=store.settings.theme==="dark"?"Switch to light mode":"Switch to dark mode";
    document.body.classList.toggle("dark-mode",store.settings.theme==="dark");
    renderUnreadCount();
  }
  function renderRoute(){
    if(!session){showLanding();return;}
    const {path,params}=parseRoute();
    const allowedPrefix=`${session.role}/`;
    let route=path;
    if(!route||!route.startsWith(allowedPrefix)||!pageNames[route]){
      route=roleHome(session.role);
      history.replaceState(null,"",`#/${route}`);
    }
    currentRoute=route;
    const host=byId("pageHost");
    host.classList.remove("route-enter");
    void host.offsetWidth;
    host.classList.add("route-enter");
    byId("pageTitle").textContent=pageNames[route];
    document.querySelectorAll(".nav-link").forEach(link=>{
      const active=link.dataset.route===route;
      link.classList.toggle("active",active);
      link.setAttribute("aria-current",active?"page":"false");
    });
    if(window.innerWidth<=820)setNavigationOpen(false);
    else setNavigationOpen(!byId("appShell").classList.contains("sidebar-collapsed"));
    updateIdentity();
    const view=renderView(route,params);
    host.innerHTML=view;
    renderNotificationsPopover();
    maybeCreateReminders();
    observeReveals();
    if(route.endsWith("/book")) refreshSlotGrid();
  }
  function renderView(route,params){
    if(route==="student/dashboard") return renderStudentDashboard();
    if(route==="student/catalogue") return renderCatalogue(false);
    if(route==="student/book") return renderBookingPage(params.get("equipment")||"");
    if(route==="student/bookings") return renderBookingsPage(false);
    if(route==="student/history") return renderHistoryPage();
    if(route==="student/notifications") return renderNotificationsPage();
    if(route==="student/profile") return renderProfilePage();
    if(route==="admin/overview") return renderAdminOverview();
    if(route==="admin/approvals") return renderBookingsPage(true);
    if(route==="admin/equipment") return renderCatalogue(true);
    if(route==="admin/maintenance") return renderMaintenancePage();
    if(route==="admin/bookings") return renderBookingsPage(true,true);
    if(route==="admin/reports") return renderReportsPage();
    if(route==="admin/users") return renderUsersPage();
    return emptyState("Page unavailable","Choose a section from the navigation menu.");
  }
  function viewHeader(title,description,actions=""){
    return `<div class="view-header"><div><span class="section-label">${session.role==="admin"?"LAB OPERATIONS":"YOUR WORKSPACE"}</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div><div class="view-actions">${actions}</div></div>`;
  }
  function kpi(label,value,icon,caption,tone="blue"){
    return `<article class="kpi-card"><div class="kpi-top"><span>${esc(label)}</span><span class="kpi-icon ${tone}">${esc(icon)}</span></div><strong>${esc(value)}</strong><small>${esc(caption)}</small></article>`;
  }
  function panel(title,subtitle,body,action=""){
    return `<section class="panel"><div class="panel-heading"><div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>${action}</div>${body}</section>`;
  }
  function emptyState(title,description,icon="⌕"){
    return `<div class="empty-state"><span class="empty-illustration" aria-hidden="true">${esc(icon)}</span><strong>${esc(title)}</strong><p>${esc(description)}</p></div>`;
  }
  function statusPill(status){
    const safe=String(status||"pending").toLowerCase();
    return `<span class="status-pill status-${esc(safe)}">${esc(safe)}</span>`;
  }
  function bookingEquipmentName(booking){return equipmentById(booking.equipmentId)?.name||booking.equipmentName||"Removed equipment";}
  function isDatePast(date){return date<today();}
  function isPastSlot(date,slot){
    if(date<today())return true;
    if(date>today())return false;
    const match=slot.match(/^(\d{1,2}):(\d{2})\s(AM|PM)/);
    if(!match)return false;
    let hour=Number(match[1])%12;if(match[3]==="PM")hour+=12;
    return hour*60+Number(match[2])<=new Date().getHours()*60+new Date().getMinutes();
  }
  function isMaintenanceSlot(equipmentId,date,slot){
    return store.maintenance.some(item=>item.equipmentId===equipmentId&&item.startDate<=date&&item.endDate>=date&&(!item.slot||item.slot===slot));
  }
  function slotBooking(equipmentId,date,slot,ignoreId=""){
    return store.bookings.find(item=>item.id!==ignoreId&&item.equipmentId===equipmentId&&item.date===date&&item.slot===slot&&(item.status==="pending"||item.status==="approved"));
  }
  function slotUnavailable(equipmentId,date,slot,ignoreId=""){
    return isPastSlot(date,slot)||isMaintenanceSlot(equipmentId,date,slot)||!!slotBooking(equipmentId,date,slot,ignoreId);
  }
  function equipmentStatus(item){
    const available=slots.some(slot=>!slotUnavailable(item.id,today(),slot));
    if(available)return "available";
    if(store.maintenance.some(block=>block.equipmentId===item.id&&block.startDate<=today()&&block.endDate>=today()))return "maintenance";
    return "booked";
  }
  function pendingBookings(){return store.bookings.filter(booking=>booking.status==="pending");}
  function ownBookings(){return store.bookings.filter(booking=>session?.role==="admin"||booking.userId===session?.email);}
  function upcomingBookings(list=ownBookings()){
    return list.filter(booking=>(booking.status==="approved"||booking.status==="pending")&&booking.date>=today()).sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));
  }
  function bookingTableRows(bookings,admin){
    if(!bookings.length)return `<tr><td colspan="${admin?6:5}">${emptyState("Nothing here yet","When there is booking activity, it will appear here.","◷")}</td></tr>`;
    return bookings.map(booking=>{
      const equipment=bookingEquipmentName(booking);
      const canCancel=!admin&&booking.userId===session.email&&(booking.status==="pending"||booking.status==="approved");
      const maintenanceConflict=store.maintenance.some(block=>block.equipmentId===booking.equipmentId&&booking.date>=block.startDate&&booking.date<=block.endDate&&(!block.slot||block.slot===booking.slot));
      const actions=admin?booking.status==="pending"?`<div class="table-actions"><button class="table-action action-approve" data-action="approve" data-id="${esc(booking.id)}">Approve</button><button class="table-action action-reject" data-action="reject" data-id="${esc(booking.id)}">Reject</button></div>`:"—":canCancel?`<button class="table-action action-reject" data-action="cancel-booking" data-id="${esc(booking.id)}">Cancel</button>`:"—";
      return `<tr><td data-label="Equipment"><strong>${esc(equipment)}</strong><small>${esc(booking.purpose||"")}</small></td>${admin?`<td data-label="Requested by">${esc(booking.student)}</td>`:""}<td data-label="Date & time">${fmtDate(booking.date)}<small>${esc(booking.slot)}</small></td><td data-label="Group">${esc(booking.groupSize||1)} ${Number(booking.groupSize)===1?"person":"people"}</td><td data-label="Status">${statusPill(maintenanceConflict?"conflict":booking.status)}</td><td data-label="Actions">${maintenanceConflict&&booking.status==="approved"?`<small class="conflict-label">Maintenance conflict</small>`:""}${actions}</td></tr>`;
    }).join("");
  }
  function tableMarkup(bookings,admin){
    return `<div class="table-wrap mobile-cards"><table class="data-table"><thead><tr><th>Equipment</th>${admin?"<th>Requested by</th>":""}<th>Date & time</th><th>Group</th><th>Status</th><th>Actions</th></tr></thead><tbody>${bookingTableRows(bookings,admin)}</tbody></table></div>`;
  }

  // Student dashboard and equipment catalogue.
  function renderStudentDashboard(){
    const mine=ownBookings();
    const waiting=mine.filter(booking=>booking.status==="pending").length;
    const upcoming=upcomingBookings(mine).slice(0,3);
    const available=store.equipment.filter(item=>equipmentStatus(item)==="available").length;
    const greeting=new Date().getHours()<12?"Good morning":new Date().getHours()<18?"Good afternoon":"Good evening";
    const user=currentUser();
    const popular=store.equipment.slice(0,4).map((item,index)=>resourceRow(item,index)).join("");
    const activity=store.activity.slice(0,4).map(entry=>activityItem(entry)).join("")||emptyState("No recent updates","New requests and approvals will show up here.","✳");
    return `<section class="dashboard-welcome"><div class="welcome-copy"><span class="eyebrow-pill"><span class="pulse-dot"></span> YOUR CAMPUS LAB, IN SYNC</span><h2>${greeting}, ${esc((user?.name||"Student").split(" ")[0])}.</h2><p>Make your next lab session a little easier. Find a tool, reserve a slot and get straight to the work.</p><div class="welcome-actions"><a class="button button-light" href="#/student/catalogue">Browse equipment <span>→</span></a><a href="#/student/book" class="welcome-text-link">Request a booking</a></div></div><div class="welcome-art" aria-hidden="true"><div class="welcome-art-orbit"></div><div class="welcome-flask"><i></i><b></b></div><span class="welcome-float">✦</span><span class="welcome-art-label">IDEAS IN THE MAKING</span></div></section>
      <div class="kpi-grid">${kpi("Available this week",available,"▣","Resources with open slots","blue")}${kpi("Active bookings",mine.filter(booking=>booking.status==="pending"||booking.status==="approved").length,"▤","Approved or awaiting review","violet")}${kpi("Pending requests",waiting,"◷","Your requests in review","amber")}${kpi("Upcoming sessions",upcomingBookings(mine).length,"↗","Your next lab sessions","teal")}</div>
      <div class="dashboard-grid"><div>${panel("Popular equipment","A few good places to start",`<div class="resource-list">${popular}</div}`,`<a class="panel-link" href="#/student/catalogue">Full catalogue →</a>`)}<div class="notice-card"><span class="notice-icon">ⓘ</span><div><strong>Your request, your time slot</strong><p>Pending requests temporarily hold their slot. Your booking is confirmed after an administrator approves it.</p></div></div></div><div>${panel("Coming up","Your next reserved lab time",upcoming.length?`<div class="upcoming-list">${upcoming.map(booking=>`<article class="upcoming-item"><div class="date-tile"><strong>${new Date(`${booking.date}T12:00:00`).getDate()}</strong><small>${new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-IN",{month:"short"})}</small></div><div class="upcoming-copy"><strong>${esc(bookingEquipmentName(booking))}</strong><small>${shortDate(booking.date)} · ${esc(booking.slot)}</small></div>${statusPill(booking.status)}</article>`).join("")}</div>`:emptyState("No upcoming sessions","Browse equipment to request your next lab slot.","◷"),`<a class="panel-link" href="#/student/bookings">My bookings →</a>`)}${panel("Recent updates","Latest activity from the lab",`<div class="activity-feed">${activity}</div>`)}</div></div>`;
  }
  function resourceRow(item,index=0){
    const status=equipmentStatus(item);
    return `<div class="resource-row" style="--i:${index}"><span class="resource-thumb">${esc(item.icon)}</span><span class="resource-copy"><strong>${esc(item.name)}</strong><small>${esc(item.location)}</small></span>${statusPill(status)}</div>`;
  }
  function activityItem(entry){
    const date=new Date(entry.createdAt||timeNow());
    return `<div class="activity-entry"><span class="activity-symbol">✳</span><div><strong>${esc(entry.message)}</strong><time>${esc(date.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}))}</time></div></div>`;
  }
  function renderCatalogue(admin=false){
    const actions=admin?`<button class="button button-primary btn-small" data-action="add-equipment">＋ Add equipment</button>`:"";
    const filtered=filterEquipment();
    return `${viewHeader(admin?"Equipment management":"Equipment catalogue",admin?"Keep shared equipment details and availability up to date.":"Explore shared resources across your campus labs.",actions)}
      <div class="catalog-toolbar"><div class="catalog-filters"><input class="input-control catalog-search" id="catalogSearch" type="search" value="${esc(catalogState.query)}" placeholder="Search name, lab or spec..." aria-label="Search equipment" /><select id="categoryFilter" class="select-control" aria-label="Filter by category"><option value="all">All departments</option>${[...new Set(store.equipment.map(item=>item.category))].sort().map(category=>`<option value="${esc(category)}" ${catalogState.category===category?"selected":""}>${esc(category)}</option>`).join("")}</select><select id="statusFilter" class="select-control" aria-label="Filter by availability"><option value="all" ${catalogState.status==="all"?"selected":""}>Any status</option><option value="available" ${catalogState.status==="available"?"selected":""}>Available</option><option value="booked" ${catalogState.status==="booked"?"selected":""}>Booked</option><option value="maintenance" ${catalogState.status==="maintenance"?"selected":""}>Maintenance</option></select><select id="sortFilter" class="select-control" aria-label="Sort equipment"><option value="name" ${catalogState.sort==="name"?"selected":""}>Sort: name</option><option value="category" ${catalogState.sort==="category"?"selected":""}>Sort: department</option><option value="availability" ${catalogState.sort==="availability"?"selected":""}>Sort: availability</option></select></div><div class="view-switch" role="group" aria-label="Catalogue layout"><button class="${catalogState.layout==="grid"?"active":""}" data-action="layout" data-layout="grid" aria-label="Grid view">▦</button><button class="${catalogState.layout==="list"?"active":""}" data-action="layout" data-layout="list" aria-label="List view">☷</button></div></div>
      <div class="catalog-result-line"><span id="catalogCount">${filtered.length} resources</span><span>Availability shown for today · <span class="availability-state">Open slots</span></span></div><div id="catalogGrid" class="catalog-grid ${catalogState.layout==="list"?"list-mode":""}">${catalogMarkup(filtered,admin)}</div>`;
  }
  function filterEquipment(){
    let list=store.equipment.filter(item=>{
      const query=catalogState.query.toLowerCase();
      const text=[item.name,item.category,item.location,item.spec,item.description].join(" ").toLowerCase();
      return (!query||text.includes(query))&&(catalogState.category==="all"||item.category===catalogState.category)&&(catalogState.status==="all"||equipmentStatus(item)===catalogState.status);
    });
    if(catalogState.sort==="category")list.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
    else if(catalogState.sort==="availability")list.sort((a,b)=>equipmentStatus(a).localeCompare(equipmentStatus(b)));
    else list.sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  }
  function catalogMarkup(items,admin=false){
    if(!items.length)return emptyState("No matching equipment","Try another search or clear a filter.","⌕");
    return items.map((item,index)=>{
      const status=equipmentStatus(item);
      return `<article class="equipment-card" style="--i:${Math.min(index,12)}"><div class="equipment-card-top"><span class="equipment-icon">${esc(item.icon)}</span><span class="category-chip">${esc(item.category)}</span></div><span class="resource-id">${esc(item.id)}</span><h3>${esc(item.name)}</h3><p>${esc(item.location)} · ${esc(item.description)}</p><div class="equipment-specs"><span>${esc(item.spec||"Shared equipment")}</span></div><div class="equipment-card-bottom"><span class="availability-state ${status==="available"?"":"unavailable"}">${status==="available"?"Available today":status==="maintenance"?"Maintenance":"Booked today"}</span>${admin?`<span class="table-actions"><button class="table-action" data-action="edit-equipment" data-id="${esc(item.id)}">Edit</button><button class="table-action action-delete" data-action="delete-equipment" data-id="${esc(item.id)}">Delete</button></span>`:`<button class="button button-primary" data-action="book-equipment" data-id="${esc(item.id)}">Book <span>→</span></button>`}</div></article>`;
    }).join("");
  }
  function refreshCatalogCards(){
    const grid=byId("catalogGrid");
    if(!grid)return;
    const items=filterEquipment();
    grid.classList.toggle("list-mode",catalogState.layout==="list");
    grid.innerHTML=catalogMarkup(items,session.role==="admin");
    byId("catalogCount").textContent=`${items.length} ${items.length===1?"resource":"resources"}`;
  }

  // Booking flow: week strip, live slot conflict checks and single-submit protection.
  function weekDates(){
    const start=new Date(`${bookingState.date}T12:00:00`);
    const day=start.getDay();
    start.setDate(start.getDate()-day+bookingState.weekOffset*7);
    return Array.from({length:7},(_,index)=>{
      const date=new Date(start);date.setDate(start.getDate()+index);
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    });
  }
  function bookingWeekMarkup(){
    return `<div class="week-strip" role="group" aria-label="Choose a date">${weekDates().map(date=>`<button class="week-day ${bookingState.date===date?"active":""}" data-action="choose-date" data-date="${date}" ${date<today()?"disabled":""}><strong>${new Date(`${date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short"})}</strong><small>${new Date(`${date}T12:00:00`).getDate()}</small></button>`).join("")}</div>`;
  }
  function renderBookingPage(equipmentId=""){
    if(equipmentId)bookingState.equipmentId=equipmentId;
    if(!bookingState.equipmentId||!equipmentById(bookingState.equipmentId))bookingState.equipmentId=store.equipment[0]?.id||"";
    const item=equipmentById(bookingState.equipmentId);
    const date=bookingState.date||today();
    const open=slots.filter(slot=>!slotUnavailable(item?.id,date,slot)).length;
    const actions=`<a href="#/student/catalogue" class="button button-quiet">← Browse catalogue</a>`;
    return `${viewHeader("Book equipment","Choose a resource, a day and an available time slot.",actions)}
      <div class="booking-layout"><section class="panel booking-form-panel"><div class="panel-heading"><div><h3>Booking details</h3><p>Requested slots are held while the lab team reviews your request.</p></div><span class="section-label">STEP 01 / 02</span></div>
      <form id="bookingRequestForm" novalidate><div class="form-grid">
        <div class="form-field full"><label for="bookingEquipment">Equipment</label><select class="form-control" id="bookingEquipment" required>${store.equipment.map(resource=>`<option value="${esc(resource.id)}" ${resource.id===bookingState.equipmentId?"selected":""}>${esc(resource.name)} · ${esc(resource.location)}</option>`).join("")}</select><small class="inline-message" id="bookingError"></small></div>
        <div class="form-field"><label for="bookingDate">Preferred date</label><input class="form-control" id="bookingDate" type="date" min="${today()}" value="${esc(date)}" required /></div>
        <div class="form-field"><label for="groupSize">Group size</label><select class="form-control" id="groupSize">${Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1} ${i===0?"person":"people"}</option>`).join("")}</select></div>
        <div class="form-field full"><label for="bookingPurpose">Purpose of use</label><textarea class="form-control" id="bookingPurpose" maxlength="240" required placeholder="What are you working on?"></textarea><small class="inline-message" id="purposeError"></small></div>
      </div>
      <div class="slot-panel"><div class="slot-panel-heading"><div><h3>Select a time slot</h3><p id="slotCount">${open} of ${slots.length} slots available on ${fmtDate(date)}</p></div><span class="section-label">STEP 02 / 02</span></div><div id="bookingWeek">${bookingWeekMarkup()}</div><div id="slotGrid" class="slot-grid"></div><small class="inline-message" id="slotError"></small></div>
      <div class="booking-form-footer"><span class="form-footnote">Submitting holds the slot until the administrator reviews it.</span><button class="button button-primary" type="submit" id="submitBookingButton" ${submittingBooking?"disabled":""}>${submittingBooking?"Submitting…":"Send booking request"} <span>→</span></button></div></form></section>
      <aside class="panel booking-summary"><div class="panel-heading"><div><h3>Request summary</h3><p>Check your selection before sending.</p></div></div><div class="booking-equipment-summary"><span class="equipment-icon">${esc(item?.icon||"▣")}</span><div><strong id="summaryEquipment">${esc(item?.name||"Choose equipment")}</strong><small>${esc(item?.location||"")}</small></div></div><div class="summary-row"><span>Date</span><strong id="summaryDate">${fmtDate(date)}</strong></div><div class="summary-row"><span>Time slot</span><strong id="summarySlot">Choose a time</strong></div><div class="summary-row"><span>Open slots</span><strong id="summaryOpen">${open} / ${slots.length}</strong></div><div class="summary-note" id="nextSlotSuggestion">Pick a slot to see your request summary. If a day is full, we’ll suggest the next available time.</div></aside></div>`;
  }
  function refreshSlotGrid(){
    if(currentRoute!=="student/book")return;
    const item=equipmentById(bookingState.equipmentId);
    const date=bookingState.date;
    const grid=byId("slotGrid");
    if(!grid)return;
    const available=[];
    grid.innerHTML=slots.map((slot,index)=>{
      const maintenance=isMaintenanceSlot(item?.id,date,slot);
      const booked=slotBooking(item?.id,date,slot);
      const past=isPastSlot(date,slot);
      const disabled=maintenance||!!booked||past;
      if(!disabled)available.push(slot);
      const state=maintenance?"Maintenance":booked?`Requested${booked.status==="approved"?"":" · pending"}`:past?"Past":"Available";
      return `<button type="button" class="slot-button ${selectedSlot===slot?"selected":""}" data-action="select-slot" data-slot="${esc(slot)}" ${disabled?"disabled":""} style="--i:${index}">${esc(slot)}<small>${esc(state)}</small></button>`;
    }).join("");
    byId("bookingWeek").innerHTML=bookingWeekMarkup();
    byId("slotCount").textContent=`${available.length} of ${slots.length} slots available on ${fmtDate(date)}`;
    byId("summaryDate").textContent=fmtDate(date);
    byId("summaryOpen").textContent=`${available.length} / ${slots.length}`;
    byId("summaryEquipment").textContent=item?.name||"Choose equipment";
    byId("nextSlotSuggestion").textContent=selectedSlot?`Selected ${selectedSlot}. Your request will be sent to the lab administrator for review.`:`${available.length?`${available.length} slots are open. Choose one to continue.`:"No slots are open on this day."} ${available.length?"":" "+(nextAvailableSlot(item?.id,date)||"Try another equipment item.")}`;
    byId("summarySlot").textContent=selectedSlot||"Choose a time";
    byId("slotError").textContent="";
  }
  function nextAvailableSlot(equipmentId,fromDate){
    for(let day=0;day<35;day++){
      const candidate=new Date(`${fromDate}T12:00:00`);candidate.setDate(candidate.getDate()+day);
      const iso=`${candidate.getFullYear()}-${String(candidate.getMonth()+1).padStart(2,"0")}-${String(candidate.getDate()).padStart(2,"0")}`;
      const free=slots.find(slot=>!slotUnavailable(equipmentId,iso,slot));
      if(free)return `Next opening: ${fmtDate(iso)}, ${free}.`;
    }
    return "No openings found in the next 35 days.";
  }
  function submitBooking(event){
    event.preventDefault();
    if(submittingBooking)return;
    const equipmentId=byId("bookingEquipment").value;
    const date=byId("bookingDate").value;
    const purpose=byId("bookingPurpose").value.trim();
    const groupSize=Number(byId("groupSize").value);
    byId("bookingError").textContent="";
    byId("purposeError").textContent="";
    byId("slotError").textContent="";
    if(!equipmentById(equipmentId)){byId("bookingError").textContent="Choose equipment from the catalogue.";return;}
    if(!date||date<today()){byId("bookingError").textContent="Choose today or a future date.";return;}
    if(!selectedSlot){byId("slotError").textContent="Choose one of the available time slots.";return;}
    if(purpose.length<5){byId("purposeError").textContent="Add a short purpose (at least 5 characters).";return;}
    if(!Number.isInteger(groupSize)||groupSize<1||groupSize>12){byId("purposeError").textContent="Choose a valid group size.";return;}
    if(slotUnavailable(equipmentId,date,selectedSlot)){
      byId("slotError").textContent=`That time has just become unavailable. ${nextAvailableSlot(equipmentId,date)}`;
      refreshSlotGrid();
      return;
    }
    submittingBooking=true;
    byId("submitBookingButton").disabled=true;
    byId("submitBookingButton").textContent="Sending request…";
    const user=currentUser();
    const booking={id:makeId("BK"),equipmentId,date,slot:selectedSlot,student:user.name,userId:user.email,purpose,groupSize,status:"pending",createdAt:timeNow()};
    store.bookings.unshift(booking);
    recordActivity(`${user.name} requested ${equipmentById(equipmentId).name} for ${fmtDate(date)}.`);
    addNotification(`Your request for ${equipmentById(equipmentId).name} was submitted.`,user.email);
    addNotification(`${user.name} requested ${equipmentById(equipmentId).name} for ${fmtDate(date)}.`,"admin@lab.edu");
    persist();
    submittingBooking=false;selectedSlot="";
    toast("Request sent. Your time slot is held while it is reviewed.");
    launchConfetti();
    routeTo("student/bookings");
  }

  // Booking lists, status review, history and CSV export.
  function renderBookingsPage(approvalOnly=false,all=false){
    const heading=approvalOnly&&!all?"Approvals":all?"All bookings":"My bookings";
    let bookings=ownBookings();
    if(approvalOnly&&!all)bookings=bookings.filter(booking=>booking.status==="pending");
    else if(bookingFilter!=="all")bookings=bookings.filter(booking=>booking.status===bookingFilter);
    bookings=bookings.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const tabs=all?["all","pending","approved","rejected","cancelled","completed"]:approvalOnly?[]:["all","pending","approved","rejected","cancelled","completed"];
    const tabMarkup=tabs.length?`<div class="filter-row">${tabs.map(filter=>`<button class="filter-chip ${bookingFilter===filter?"active":""}" data-action="booking-filter" data-filter="${filter}">${filter==="all"?"All requests":filter[0].toUpperCase()+filter.slice(1)}</button>`).join("")}</div>`:"";
    const headingAction=approvalOnly&&!all?`<span class="status-pill status-pending">${pendingBookings().length} awaiting review</span>`:"";
    const table=bookings.length?tableMarkup(bookings,session.role==="admin"):emptyState(approvalOnly?"Queue is clear":"No bookings found",approvalOnly?"New student requests will appear here.":"Try another filter or make a new booking.","◷");
    return `${viewHeader(heading,approvalOnly&&!all?"Review incoming equipment requests.":all?"Search and review every booking in the lab.":"Track requests, approvals and completed lab sessions.",headingAction)}${tabMarkup}${panel("Booking activity",`${bookings.length} ${bookings.length===1?"request":"requests"}`,table)}`;
  }
  function cancelBooking(id){
    const booking=store.bookings.find(item=>item.id===id);
    if(!booking||booking.userId!==session.email||!["pending","approved"].includes(booking.status)){toast("This booking can no longer be cancelled.","error");return;}
    booking.status="cancelled";booking.cancelledAt=timeNow();
    recordActivity(`${booking.student} cancelled ${bookingEquipmentName(booking)}.`);
    addNotification(`Your booking for ${bookingEquipmentName(booking)} on ${fmtDate(booking.date)} was cancelled.`,booking.userId);
    addNotification(`${booking.student} cancelled a booking for ${bookingEquipmentName(booking)}.`,"admin@lab.edu");
    persist();renderRoute();toast("Booking cancelled. Its time slot is available again.");
  }
  function approveBooking(id){
    const booking=store.bookings.find(item=>item.id===id);
    if(!booking||booking.status!=="pending")return;
    if(isMaintenanceSlot(booking.equipmentId,booking.date,booking.slot)||slotBooking(booking.equipmentId,booking.date,booking.slot,booking.id)){
      toast("This request conflicts with another booking or maintenance block.","error");return;
    }
    booking.status="approved";booking.reviewedAt=timeNow();
    recordActivity(`${bookingEquipmentName(booking)} was approved for ${booking.student}.`);
    addNotification(`Your request for ${bookingEquipmentName(booking)} on ${fmtDate(booking.date)} was approved.`,booking.userId);
    persist();renderRoute();toast("Booking approved.");launchConfetti();
  }
  function rejectBooking(id,reason){
    const booking=store.bookings.find(item=>item.id===id);
    if(!booking||booking.status!=="pending")return;
    booking.status="rejected";booking.reviewedAt=timeNow();booking.rejectionReason=reason;
    recordActivity(`${bookingEquipmentName(booking)} request from ${booking.student} was rejected.`);
    addNotification(`Your request for ${bookingEquipmentName(booking)} was declined. Reason: ${reason}`,booking.userId);
    persist();renderRoute();toast("Request declined and student notified.");
  }
  function renderHistoryPage(){
    let list=store.history.filter(item=>session.role==="admin"||item.userId===session.email);
    list=list.filter(item=>(historyState.status==="all"||item.status===historyState.status)&&(!historyState.from||item.date>=historyState.from)&&(!historyState.to||item.date<=historyState.to));
    const tools=`<div class="history-tools"><input id="historyFrom" class="input-control" type="date" aria-label="History from date" value="${esc(historyState.from)}" /><input id="historyTo" class="input-control" type="date" aria-label="History to date" value="${esc(historyState.to)}" /><select id="historyStatus" class="select-control"><option value="all">All statuses</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="rejected">Rejected</option></select><button class="button button-primary btn-small" data-action="export-history">Export CSV ↓</button></div>`;
    const rows=list.length?`<div class="table-wrap mobile-cards"><table class="data-table"><thead><tr><th>Equipment</th><th>Student</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>${list.sort((a,b)=>b.date.localeCompare(a.date)).map(item=>`<tr><td data-label="Equipment"><strong>${esc(item.equipmentName||bookingEquipmentName(item))}</strong></td><td data-label="Student">${esc(item.student)}</td><td data-label="Date">${fmtDate(item.date)}</td><td data-label="Time">${esc(item.slot)}</td><td data-label="Status">${statusPill(item.status)}</td></tr>`).join("")}</tbody></table></div>`:emptyState("No history for these filters","Completed, cancelled and rejected bookings appear here.","◷");
    return `${viewHeader("Usage history","A searchable record of completed and past lab activity.",tools)}${panel("Past sessions",`${list.length} records`,rows)}`;
  }
  function exportCSV(rows,filename){
    if(!rows.length){toast("There are no rows to export.","error");return;}
    const columns=["id","equipmentName","student","userId","date","slot","groupSize","status","purpose"];
    const quote=value=>`"${String(value??"").replace(/"/g,'""')}"`;
    const csv=[columns.join(","),...rows.map(row=>columns.map(column=>quote(column==="equipmentName"?row.equipmentName||bookingEquipmentName(row):row[column])).join(","))].join("\r\n");
    const blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
    toast("CSV export downloaded.");
  }

  // Notifications and reminders.
  function userNotifications(){
    return store.notifications.filter(item=>!item.userId||item.userId===session?.email);
  }
  function renderUnreadCount(){
    const badge=byId("unreadBadge");
    if(!badge||!session)return;
    const count=userNotifications().filter(item=>!item.read).length;
    badge.textContent=count>9?"9+":String(count);
    badge.classList.toggle("hidden",count===0);
  }
  function renderNotificationsPopover(){
    const list=userNotifications().slice(0,8);
    byId("notificationPopover").innerHTML=`<div class="popover-heading"><strong>Notifications</strong><span><button data-action="mark-all-read">Mark all read</button> <button data-action="clear-notifications">Clear</button></span></div><div class="notification-list">${list.length?list.map(item=>`<button class="notification-item ${item.read?"":"unread"}" data-action="read-notification" data-id="${esc(item.id)}"><span class="notification-mark"></span><span><p>${esc(item.message)}</p><time>${esc(new Date(item.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}))}</time></span></button>`).join(""):`<div class="notification-empty">You’re all caught up.</div>`}</div>`;
  }
  function renderNotificationsPage(){
    const list=userNotifications();
    const rows=list.length?`<div class="notification-page-list">${list.map(item=>`<article class="notification-page-item ${item.read?"":"unread"}"><span class="notification-mark"></span><div><p>${esc(item.message)}</p><time>${esc(new Date(item.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}))}</time></div>${item.read?statusPill("read"):`<button class="table-action" data-action="read-notification" data-id="${esc(item.id)}">Mark read</button>`}</article>`).join("")}</div>`:emptyState("Nothing new","Booking updates will be delivered here.","♧");
    return `${viewHeader("Notifications","Stay up to date with booking decisions and lab activity.",`<button class="button button-quiet" data-action="mark-all-read">Mark all read</button><button class="button button-primary btn-small" data-action="clear-notifications">Clear all</button>`)}${panel("Your inbox",`${list.filter(item=>!item.read).length} unread`,rows)}`;
  }
  function markNotificationRead(id){
    const item=store.notifications.find(notification=>notification.id===id&&(!notification.userId||notification.userId===session.email));
    if(item)item.read=true;
    persist();renderNotificationsPopover();renderUnreadCount();
    if(currentRoute.endsWith("/notifications"))renderRoute();
  }
  function maybeCreateReminders(){
    const cutoff=new Date();cutoff.setHours(cutoff.getHours()+24);
    for(const booking of upcomingBookings(ownBookings()).filter(item=>item.status==="approved")){
      const starts=new Date(`${booking.date}T${slotTo24(booking.slot)}:00`);
      if(starts>new Date()&&starts<=cutoff&&!store.reminderIds.includes(booking.id)){
        store.reminderIds.push(booking.id);
        addNotification(`Reminder: ${bookingEquipmentName(booking)} is booked for ${fmtDate(booking.date)} · ${booking.slot}.`,booking.userId);
      }
    }
  }
  function slotTo24(slot){
    const match=slot.match(/^(\d{1,2}):(\d{2})\s(AM|PM)/);
    if(!match)return "09:00";
    let hour=Number(match[1])%12;if(match[3]==="PM")hour+=12;
    return `${String(hour).padStart(2,"0")}:${match[2]}`;
  }

  // Admin overview, visual reports, maintenance, inventory and users.
  function renderAdminOverview(){
    const pending=pendingBookings().slice(0,5);
    const reviewed=store.bookings.filter(booking=>booking.status==="approved"||booking.status==="rejected").length;
    const approvalRate=reviewed?Math.round(store.bookings.filter(booking=>booking.status==="approved").length/reviewed*100):0;
    const queue=pending.length?pending.map(booking=>`<div class="queue-item"><div class="queue-icon">${esc(equipmentById(booking.equipmentId)?.icon||"▣")}</div><div class="queue-main"><strong>${esc(bookingEquipmentName(booking))}</strong><small>${esc(booking.student)} · ${fmtDate(booking.date)} · ${esc(booking.slot)}</small></div><div class="table-actions"><button class="table-action action-approve" data-action="approve" data-id="${esc(booking.id)}">Approve</button><button class="table-action action-reject" data-action="reject" data-id="${esc(booking.id)}">Decline</button></div></div>`).join(""):emptyState("All caught up","No booking requests are waiting for review.","✓");
    return `${viewHeader("Good to see you, admin.","A clear view of today’s requests and shared resources.",`<button class="button button-quiet btn-small" data-action="reset-demo">Reset demo data</button><button class="button button-primary btn-small" data-route="admin/equipment">Manage equipment →</button>`)}
      <div class="kpi-grid">${kpi("Total requests",store.bookings.length,"▤","Across all lab resources","blue")}${kpi("Awaiting approval",pendingBookings().length,"◷","Need your attention","amber")}${kpi("Approval rate",`${approvalRate}%`,"✓","Of reviewed requests","teal")}${kpi("Shared equipment",store.equipment.length,"▣","Across campus labs","violet")}</div>
      <div class="dashboard-grid"><div>${panel("Bookings this week","Daily request volume",`<div class="bar-chart">${weekBarChart()}</div><div class="chart-legend"><span><i class="legend-dot"></i> Booking requests</span><span>Last 7 days</span></div>`)}</div><div>${panel("Most-used equipment","Based on approved and completed requests",`<div class="equipment-usage-list">${usageChart()}</div>`)}</div></div>
      <div class="dashboard-grid"><div>${panel("Needs your attention",`${pendingBookings().length} pending requests`,queue,`<a class="panel-link" href="#/admin/approvals">Review all →</a>`)}</div><div>${panel("Recent lab activity","Latest changes across the workspace",`<div class="activity-feed">${store.activity.slice(0,6).map(activityItem).join("")||emptyState("No activity yet","Updates will appear here.","✳")}</div>`)}</div></div>`;
  }
  function weekBarChart(){
    const days=Array.from({length:7},(_,index)=>dateISO(index-6));
    const counts=days.map(date=>store.bookings.filter(booking=>booking.date===date).length);
    const max=Math.max(1,...counts);
    return days.map((date,index)=>`<div class="bar-item"><span class="bar-value" title="${counts[index]} requests" style="height:${Math.max(3,counts[index]/max*100)}%;--i:${index}"></span><span class="bar-label">${new Date(`${date}T12:00:00`).toLocaleDateString("en-IN",{weekday:"short"})}</span></div>`).join("");
  }
  function usageChart(){
    const counts=store.equipment.map(item=>({item,count:store.bookings.filter(booking=>booking.equipmentId===item.id&&(booking.status==="approved"||booking.status==="completed")).length})).sort((a,b)=>b.count-a.count).slice(0,5);
    const max=Math.max(1,...counts.map(row=>row.count));
    return counts.map(row=>`<div class="usage-row"><strong>${esc(row.item.name)}</strong><small>${row.count} uses</small><span class="usage-track"><span style="width:${Math.max(5,row.count/max*100)}%"></span></span></div>`).join("");
  }
  function renderReportsPage(){
    const approved=store.bookings.filter(booking=>booking.status==="approved"||booking.status==="completed").length;
    const utilization=store.equipment.length?Math.min(100,Math.round(approved/Math.max(1,store.equipment.length*4)*100)):0;
    return `${viewHeader("Lab reports","A snapshot of requests and equipment use across your labs.",`<button class="button button-primary btn-small" data-action="export-all">Export bookings ↓</button>`)}<div class="reports-kpi">${kpi("Requests this month",store.bookings.filter(booking=>booking.date.slice(0,7)===today().slice(0,7)).length,"▤","Current calendar month","blue")}${kpi("Approved / completed",approved,"✓","Successful lab sessions","teal")}${kpi("Utilization estimate",`${utilization}%`,"◷","Relative to 4 weekly slots per resource","violet")}</div><div class="chart-grid">${panel("Weekly booking activity","Requests created by session date",`<div class="bar-chart">${weekBarChart()}</div><div class="chart-legend"><span><i class="legend-dot"></i> Requests</span></div>`)}${panel("Equipment demand","Approved and completed uses",`<div class="equipment-usage-list">${usageChart()}</div>`)}</div>`;
  }
  function renderMaintenancePage(){
    const conflicts=store.bookings.filter(booking=>["pending","approved"].includes(booking.status)&&store.maintenance.some(block=>block.equipmentId===booking.equipmentId&&booking.date>=block.startDate&&booking.date<=block.endDate&&(!block.slot||block.slot===booking.slot)));
    const blockRows=store.maintenance.length?`<div class="table-wrap mobile-cards"><table class="data-table"><thead><tr><th>Equipment</th><th>Dates</th><th>Time</th><th>Reason</th><th>Action</th></tr></thead><tbody>${store.maintenance.map(block=>`<tr><td data-label="Equipment"><strong>${esc(equipmentById(block.equipmentId)?.name||"Removed equipment")}</strong></td><td data-label="Dates">${fmtDate(block.startDate)} – ${fmtDate(block.endDate)}</td><td data-label="Time">${esc(block.slot||"All day")}</td><td data-label="Reason">${esc(block.reason)}</td><td data-label="Action"><button class="table-action action-delete" data-action="remove-maintenance" data-id="${esc(block.id)}">Remove</button></td></tr>`).join("")}</tbody></table></div>`:emptyState("No maintenance planned","Add a date range to block equipment during servicing.","⚙");
    return `${viewHeader("Maintenance","Keep schedules accurate and flag bookings affected by servicing.",`<button class="button button-primary btn-small" data-action="open-maintenance">＋ Add maintenance</button>`)}
      ${conflicts.length?`<div class="notice-card conflict-notice"><span class="notice-icon">!</span><div><strong>${conflicts.length} booking${conflicts.length===1?"":"s"} affected by maintenance</strong><p>Students have been notified. Review the flagged requests and contact the lab team if a reschedule is needed.</p></div><a href="#/admin/bookings" class="panel-link">Review →</a></div>`:""}
      ${panel("Maintenance blocks",`${store.maintenance.length} scheduled`,blockRows)}`;
  }
  function renderUsersPage(){
    const users=store.users;
    const table=users.length?`<div class="table-wrap mobile-cards"><table class="data-table"><thead><tr><th>User</th><th>Department</th><th>Role</th><th>Bookings</th><th>Access</th></tr></thead><tbody>${users.map(user=>`<tr><td data-label="User"><div class="user-row"><span class="user-avatar">${esc(user.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase())}</span><span><strong>${esc(user.name)}</strong><small>${esc(user.email)}</small></span></div></td><td data-label="Department">${esc(user.department||"—")}</td><td data-label="Role"><span class="user-role">${esc(user.role)}</span></td><td data-label="Bookings">${store.bookings.filter(booking=>booking.userId===user.email).length}</td><td data-label="Access">${user.role==="admin"?statusPill("approved"):`<button class="table-action ${user.active===false?"action-approve":"action-reject"}" data-action="toggle-user" data-email="${esc(user.email)}">${user.active===false?"Enable":"Disable"}</button>`}</td></tr>`).join("")}</tbody></table></div>`:emptyState("No users found","Student accounts will appear here after they sign up.","◎");
    return `${viewHeader("Lab users","Review the local demo accounts and student access.",`<span class="status-pill status-available">${users.filter(user=>user.active!==false).length} active accounts</span>`)}${panel("Accounts",`${users.length} demo users`,table)}`;
  }
  function renderProfilePage(){
    const user=currentUser();
    return `${viewHeader("My profile","Your local demo account details.")}${panel("Account details","These details are stored in this browser.",`<form id="profileForm"><div class="form-grid"><div class="form-field"><label for="profileNameInput">Full name</label><input id="profileNameInput" class="form-control" value="${esc(user.name)}" required maxlength="60" /></div><div class="form-field"><label>Email</label><input class="form-control" value="${esc(user.email)}" disabled /></div><div class="form-field"><label for="profileRollInput">Roll number</label><input id="profileRollInput" class="form-control" value="${esc(user.roll||"")}" maxlength="24" /></div><div class="form-field"><label for="profileDepartmentInput">Department</label><select id="profileDepartmentInput" class="form-control">${["Physics","Chemistry","Biology","Electronics","Engineering","General"].map(department=>`<option ${user.department===department?"selected":""}>${department}</option>`).join("")}</select></div></div><div class="modal-footer"><button class="button button-primary" type="submit">Save profile</button></div></form>`)}`;
  }

  // Maintenance and equipment administration.
  function openMaintenanceModal(){
    openModal(`<form id="maintenanceForm"><div class="modal-header"><div><span class="section-kicker">LAB OPERATIONS</span><h2>Schedule maintenance</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><p>Equipment stays unavailable for the selected date range.</p><div class="form-grid"><div class="form-field full"><label for="maintenanceEquipment">Equipment</label><select id="maintenanceEquipment" class="form-control" required>${store.equipment.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("")}</select></div><div class="form-field"><label for="maintenanceStart">Start date</label><input id="maintenanceStart" class="form-control" type="date" min="${today()}" value="${today()}" required /></div><div class="form-field"><label for="maintenanceEnd">End date</label><input id="maintenanceEnd" class="form-control" type="date" min="${today()}" value="${today()}" required /></div><div class="form-field full"><label for="maintenanceSlot">Time</label><select id="maintenanceSlot" class="form-control"><option value="">All day</option>${slots.map(slot=>`<option>${esc(slot)}</option>`).join("")}</select></div><div class="form-field full"><label for="maintenanceReason">Reason</label><input id="maintenanceReason" class="form-control" maxlength="120" required placeholder="e.g. Routine calibration" /></div><small class="inline-message full" id="maintenanceError"></small></div><div class="modal-footer"><button type="button" class="button button-quiet" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save maintenance block</button></div></form>`);
  }
  function submitMaintenance(event){
    event.preventDefault();
    const equipmentId=byId("maintenanceEquipment").value,startDate=byId("maintenanceStart").value,endDate=byId("maintenanceEnd").value,slot=byId("maintenanceSlot").value,reason=byId("maintenanceReason").value.trim();
    const error=byId("maintenanceError");error.textContent="";
    if(!startDate||!endDate||startDate<today()||endDate<startDate){error.textContent="Choose a valid date range starting today or later.";return;}
    if(!reason){error.textContent="Add a maintenance reason.";return;}
    const block={id:makeId("MT"),equipmentId,startDate,endDate,slot,reason,createdAt:timeNow()};
    store.maintenance.push(block);
    const conflicts=store.bookings.filter(booking=>["pending","approved"].includes(booking.status)&&booking.equipmentId===equipmentId&&booking.date>=startDate&&booking.date<=endDate&&(!slot||booking.slot===slot));
    conflicts.forEach(booking=>{
      booking.conflictFlagged=true;
      addNotification(`${equipmentById(equipmentId).name} has maintenance scheduled on ${fmtDate(booking.date)}. Your booking may need to be rescheduled.`,booking.userId);
    });
    recordActivity(`${equipmentById(equipmentId).name} maintenance scheduled ${fmtDate(startDate)}–${fmtDate(endDate)}.`);
    persist();closeModal();renderRoute();
    toast(conflicts.length?`Maintenance saved; ${conflicts.length} affected student(s) notified.`:"Maintenance block saved.");
  }
  function removeMaintenance(id){
    store.maintenance=store.maintenance.filter(block=>block.id!==id);
    store.bookings.forEach(booking=>{booking.conflictFlagged=false;});
    recordActivity("A maintenance block was removed.");
    persist();renderRoute();toast("Maintenance block removed.");
  }
  function openEquipmentModal(item=null){
    const editing=!!item;
    openModal(`<form id="equipmentForm"><div class="modal-header"><div><span class="section-kicker">RESOURCE CATALOGUE</span><h2>${editing?"Edit equipment":"Add equipment"}</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><p>Keep resource details accurate for students and lab staff.</p><input id="equipmentId" type="hidden" value="${esc(item?.id||"")}" /><div class="form-grid"><div class="form-field full"><label for="equipmentName">Equipment name</label><input id="equipmentName" class="form-control" required maxlength="70" value="${esc(item?.name||"")}" placeholder="e.g. Digital microscope" /></div><div class="form-field"><label for="equipmentCategory">Department</label><select id="equipmentCategory" class="form-control">${["Physics","Chemistry","Biology","Electronics","Fabrication","Computing"].map(category=>`<option ${item?.category===category?"selected":""}>${category}</option>`).join("")}</select></div><div class="form-field"><label for="equipmentIcon">Catalogue icon</label><input id="equipmentIcon" class="form-control" maxlength="4" value="${esc(item?.icon||"▣")}" /></div><div class="form-field full"><label for="equipmentLocation">Lab and room</label><input id="equipmentLocation" class="form-control" required maxlength="80" value="${esc(item?.location||"")}" placeholder="Physics Lab · A-101" /></div><div class="form-field full"><label for="equipmentSpec">Key specifications</label><input id="equipmentSpec" class="form-control" required maxlength="100" value="${esc(item?.spec||"")}" placeholder="Measurement range, capacity or model" /></div><div class="form-field full"><label for="equipmentDescription">Short description</label><textarea id="equipmentDescription" class="form-control" maxlength="160" placeholder="What is this resource used for?">${esc(item?.description||"")}</textarea></div></div><small class="inline-message" id="equipmentError"></small><div class="modal-footer"><button type="button" class="button button-quiet" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${editing?"Save changes":"Add equipment"}</button></div></form>`);
  }
  function submitEquipment(event){
    event.preventDefault();
    const id=byId("equipmentId").value,name=byId("equipmentName").value.trim(),locationText=byId("equipmentLocation").value.trim(),spec=byId("equipmentSpec").value.trim();
    if(!name||!locationText||!spec){byId("equipmentError").textContent="Complete the name, lab location and specifications.";return;}
    const item={id:id||makeId("EQ"),name,category:byId("equipmentCategory").value,icon:byId("equipmentIcon").value.trim()||"▣",location:locationText,spec,description:byId("equipmentDescription").value.trim()||"Shared academic laboratory equipment."};
    const index=store.equipment.findIndex(resource=>resource.id===id);
    if(index>=0){store.equipment[index]=item;recordActivity(`${name} details were updated.`);}
    else{store.equipment.push(item);recordActivity(`${name} was added to the catalogue.`);}
    persist();closeModal();catalogState={...catalogState,query:"",category:"all",status:"all"};renderRoute();toast(index>=0?"Equipment details saved.":"Equipment added.");
  }
  function deleteEquipment(id){
    const item=equipmentById(id);
    if(!item)return;
    const hasActive=store.bookings.some(booking=>booking.equipmentId===id&&(booking.status==="pending"||booking.status==="approved"));
    if(hasActive){toast("This equipment has active bookings. Resolve them before removing it.","error");return;}
    store.equipment=store.equipment.filter(resource=>resource.id!==id);
    recordActivity(`${item.name} was removed from the catalogue.`);
    persist();renderRoute();toast("Equipment removed from the catalogue.");
  }
  function toggleUser(email){
    const user=userByEmail(email);
    if(!user||user.role==="admin"){toast("Administrator access cannot be changed here.","error");return;}
    user.active=user.active===false;
    persist();renderRoute();toast(`${user.name} ${user.active?"enabled":"disabled"}.`);
  }
  function resetDemoData(){
    if(!window.confirm("Reset equipment, bookings, users, notifications and preferences to the original demo data?"))return;
    store=freshData();
    persist();
    updateIdentity();
    renderRoute();
    toast("Demo data reset.");
  }
  function openModal(markup){
    closeModal();
    const backdrop=document.createElement("div");
    backdrop.className="modal-backdrop";
    backdrop.innerHTML=`<section class="app-modal" role="dialog" aria-modal="true">${markup}</section>`;
    backdrop.addEventListener("click",event=>{if(event.target===backdrop)closeModal();});
    byId("modalHost").append(backdrop);
    const first=backdrop.querySelector("input:not([type=hidden]),select,textarea,button");
    if(first)first.focus();
  }
  function closeModal(){byId("modalHost").replaceChildren();}

  // Global search and keyboard command palette.
  function ensureGlobalSuggestions(){
    const wrapper=document.querySelector(".global-search");
    if(!wrapper||byId("globalSearchSuggestions"))return;
    const suggestions=document.createElement("div");
    suggestions.className="global-search-suggestions hidden";
    suggestions.id="globalSearchSuggestions";
    wrapper.append(suggestions);
  }
  function updateGlobalSuggestions(query){
    ensureGlobalSuggestions();
    const panel=byId("globalSearchSuggestions");
    globalMatches=query.trim()?store.equipment.filter(item=>[item.name,item.category,item.location,item.spec].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0,5):[];
    panel.innerHTML=globalMatches.map(item=>`<button type="button" data-action="global-equipment" data-id="${esc(item.id)}"><span class="equipment-icon">${esc(item.icon)}</span><span><strong>${esc(item.name)}</strong><small>${esc(item.location)}</small></span><span>↗</span></button>`).join("")||`<p>${query.trim()?"No matching equipment.":"Start typing to search resources."}</p>`;
    panel.classList.toggle("hidden",!query.trim());
  }
  function commandOptions(query=""){
    const pages=(session.role==="admin"?adminNav:studentNav).map(([route,label,icon])=>({label,meta:"Page",icon,route:`${session.role}/${route}`}));
    const equipment=store.equipment.map(item=>({label:item.name,meta:item.category,icon:item.icon,route:`${session.role==="admin"?"admin":"student"}/${session.role==="admin"?"equipment":"catalogue"}`,equipmentId:item.id}));
    const q=query.toLowerCase();
    return [...pages,...equipment].filter(item=>!q||`${item.label} ${item.meta}`.toLowerCase().includes(q)).slice(0,14);
  }
  function renderCommandResults(query=""){
    commandItems=commandOptions(query);commandIndex=0;
    const pages=commandItems.filter(item=>item.meta==="Page");
    const equipment=commandItems.filter(item=>item.meta!=="Page");
    byId("commandResults").innerHTML=commandItems.length?`${pages.length?`<div class="command-group-label">Navigate</div>${pages.map((item,index)=>commandRow(item,index)).join("")}`:""}${equipment.length?`<div class="command-group-label">Equipment</div>${equipment.map((item,index)=>commandRow(item,pages.length+index)).join("")}`:""}`:`<div class="command-empty">No matches found.</div>`;
    updateCommandActive();
  }
  function commandRow(item,index){
    return `<button class="command-item ${index===commandIndex?"active":""}" data-action="command-select" data-index="${index}"><span>${esc(item.icon)}</span>${esc(item.label)}<small>${esc(item.meta)}</small></button>`;
  }
  function updateCommandActive(){
    document.querySelectorAll(".command-item").forEach((item,index)=>item.classList.toggle("active",index===commandIndex));
  }
  function openCommand(){
    if(!session)return;
    renderCommandResults("");
    byId("commandDialog").showModal();
    byId("commandSearch").value="";
    byId("commandSearch").focus();
  }
  function chooseCommand(index){
    const item=commandItems[index];
    if(!item)return;
    if(item.equipmentId){catalogState.query="";routeTo(`${item.route}?equipment=${encodeURIComponent(item.equipmentId)}`);}
    else routeTo(item.route);
    byId("commandDialog").close();
  }
  function openCatalogEquipment(id){
    if(session.role==="student"){bookingState.equipmentId=id;selectedSlot="";routeTo(`student/book?equipment=${encodeURIComponent(id)}`);}
    else {catalogState.query="";routeTo("admin/equipment");window.setTimeout(()=>openEquipmentModal(equipmentById(id)),0);}
  }

  // Small UI helpers and delegated events keep dynamic views interactive.
  function observeReveals(){
    const elements=document.querySelectorAll("#landingView .reveal:not(.is-visible)");
    if(!("IntersectionObserver" in window)){elements.forEach(element=>element.classList.add("is-visible"));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}});
    },{threshold:.12});
    elements.forEach(element=>observer.observe(element));
  }
  function showCountUps(){
    document.querySelectorAll("[data-count]").forEach(node=>{
      const end=Number(node.dataset.count)||0;const start=performance.now();const duration=700;
      const step=now=>{
        const progress=Math.min(1,(now-start)/duration);
        node.textContent=String(Math.round(end*(1-Math.pow(1-progress,3))));
        if(progress<1)requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function globalClick(event){
    const route=event.target.closest("[data-route]");
    if(route){event.preventDefault();routeTo(route.dataset.route);closePopovers();return;}
    const authOpen=event.target.closest("[data-auth-open]");
    if(authOpen){openAuth(authOpen.dataset.authOpen,authOpen.dataset.authOpen==="signup"?"student":"student");return;}
    const roleTab=event.target.closest("[data-auth-role]");
    if(roleTab){authRole=roleTab.dataset.authRole;if(authRole==="admin"&&authMode==="signup")authMode="login";updateAuthInterface();return;}
    const action=event.target.closest("[data-action]");
    if(!action)return;
    const id=action.dataset.id;
    switch(action.dataset.action){
      case "logout":logout();break;
      case "reset-demo":resetDemoData();break;
      case "close-auth":byId("authDialog").close();break;
      case "password":{
        const input=byId("authPassword");const show=input.type==="password";input.type=show?"text":"password";action.textContent=show?"Hide":"Show";action.setAttribute("aria-label",show?"Hide password":"Show password");break;
      }
      case "auth-mode":authMode=action.dataset.mode;updateAuthInterface();break;
      case "layout":catalogState.layout=action.dataset.layout;document.querySelectorAll(".view-switch button").forEach(button=>button.classList.toggle("active",button===action));byId("catalogGrid").classList.toggle("list-mode",catalogState.layout==="list");break;
      case "book-equipment":openCatalogEquipment(id);break;
      case "global-equipment":byId("globalSearch").value="";byId("globalSearchSuggestions").classList.add("hidden");openCatalogEquipment(id);break;
      case "booking-filter":bookingFilter=action.dataset.filter;renderRoute();break;
      case "choose-date":bookingState.date=action.dataset.date;selectedSlot="";refreshSlotGrid();break;
      case "select-slot":selectedSlot=action.dataset.slot;refreshSlotGrid();break;
      case "approve":approveBooking(id);break;
      case "reject":openRejectModal(id);break;
      case "cancel-booking":cancelBooking(id);break;
      case "open-maintenance":openMaintenanceModal();break;
      case "remove-maintenance":removeMaintenance(id);break;
      case "add-equipment":openEquipmentModal();break;
      case "edit-equipment":openEquipmentModal(equipmentById(id));break;
      case "delete-equipment":deleteEquipment(id);break;
      case "toggle-user":toggleUser(action.dataset.email);break;
      case "export-history":exportCSV(filteredHistory(),"labreserve-usage-history.csv");break;
      case "export-all":exportCSV(store.bookings,"labreserve-bookings.csv");break;
      case "read-notification":markNotificationRead(id);break;
      case "mark-all-read":store.notifications.forEach(item=>{if(!item.userId||item.userId===session.email)item.read=true;});persist();renderNotificationsPopover();renderUnreadCount();if(currentRoute.endsWith("/notifications"))renderRoute();break;
      case "clear-notifications":store.notifications=store.notifications.filter(item=>item.userId&&item.userId!==session.email);persist();renderNotificationsPopover();renderUnreadCount();if(currentRoute.endsWith("/notifications"))renderRoute();toast("Notifications cleared.");break;
      case "theme":toggleTheme();break;
      case "command":openCommand();break;
      case "command-select":chooseCommand(Number(action.dataset.index));break;
      case "close-modal":closeModal();break;
    }
  }
  function openRejectModal(id){
    const booking=store.bookings.find(item=>item.id===id);
    if(!booking)return;
    openModal(`<form id="rejectForm"><input type="hidden" id="rejectBookingId" value="${esc(id)}" /><div class="modal-header"><div><span class="section-kicker">REQUEST REVIEW</span><h2>Decline this request?</h2></div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><p>${esc(booking.student)} · ${esc(bookingEquipmentName(booking))} · ${fmtDate(booking.date)}</p><div class="form-field"><label for="rejectReason">Reason for declining</label><textarea class="form-control" id="rejectReason" maxlength="180" required placeholder="Share a brief reason so the student can plan another slot."></textarea></div><small class="inline-message" id="rejectError"></small><div class="modal-footer"><button type="button" class="button button-quiet" data-action="close-modal">Keep request</button><button type="submit" class="button button-primary">Send decision</button></div></form>`);
  }
  function filteredHistory(){
    return store.history.filter(item=>(session.role==="admin"||item.userId===session.email)&&(historyState.status==="all"||item.status===historyState.status)&&(!historyState.from||item.date>=historyState.from)&&(!historyState.to||item.date<=historyState.to));
  }
  function closePopovers(){
    byId("accountPopover").classList.add("hidden");
    byId("notificationPopover").classList.add("hidden");
    byId("accountTrigger").setAttribute("aria-expanded","false");
    byId("notificationTrigger").setAttribute("aria-expanded","false");
    byId("globalSearchSuggestions")?.classList.add("hidden");
  }
  function toggleTheme(){
    store.settings.theme=store.settings.theme==="dark"?"light":"dark";
    document.body.classList.add("theme-transition");
    document.body.classList.toggle("dark-mode",store.settings.theme==="dark");
    byId("themeToggle").textContent=store.settings.theme==="dark"?"Switch to light mode":"Switch to dark mode";
    persist();
    window.setTimeout(()=>document.body.classList.remove("theme-transition"),350);
  }
  function submitProfile(event){
    event.preventDefault();
    const user=currentUser();const name=byId("profileNameInput").value.trim();
    if(name.length<2){toast("Enter a name with at least two characters.","error");return;}
    user.name=name;user.roll=byId("profileRollInput").value.trim();user.department=byId("profileDepartmentInput").value;
    session.name=name;
    if(localStorage.getItem(SESSION_KEY))localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
    persist();updateIdentity();toast("Profile saved.");
  }
  function handleSubmit(event){
    if(event.target.id==="authForm"){handleAuthSubmit(event);return;}
    if(event.target.id==="bookingRequestForm"){submitBooking(event);return;}
    if(event.target.id==="maintenanceForm"){submitMaintenance(event);return;}
    if(event.target.id==="equipmentForm"){submitEquipment(event);return;}
    if(event.target.id==="rejectForm"){event.preventDefault();const reason=byId("rejectReason").value.trim();if(reason.length<4){byId("rejectError").textContent="Add a short reason (at least 4 characters).";return;}const id=byId("rejectBookingId").value;closeModal();rejectBooking(id,reason);return;}
    if(event.target.id==="profileForm")submitProfile(event);
  }
  function handleInput(event){
    if(event.target.id==="catalogSearch"){catalogState.query=event.target.value;refreshCatalogCards();}
    if(event.target.id==="globalSearch"){
      if(session?.role==="student"||session?.role==="admin")updateGlobalSuggestions(event.target.value);
    }
    if(event.target.id==="bookingPurpose")byId("purposeError").textContent="";
  }
  function handleChange(event){
    if(event.target.id==="categoryFilter"){catalogState.category=event.target.value;refreshCatalogCards();}
    if(event.target.id==="statusFilter"){catalogState.status=event.target.value;refreshCatalogCards();}
    if(event.target.id==="sortFilter"){catalogState.sort=event.target.value;refreshCatalogCards();}
    if(event.target.id==="bookingEquipment"){bookingState.equipmentId=event.target.value;selectedSlot="";refreshSlotGrid();}
    if(event.target.id==="bookingDate"){
      if(event.target.value<today()){event.target.value=today();byId("bookingError").textContent="Choose today or a future date.";return;}
      bookingState.date=event.target.value;selectedSlot="";refreshSlotGrid();
    }
    if(event.target.id==="historyFrom"){historyState.from=event.target.value;renderRoute();}
    if(event.target.id==="historyTo"){historyState.to=event.target.value;renderRoute();}
    if(event.target.id==="historyStatus"){historyState.status=event.target.value;renderRoute();}
    if(event.target.id==="maintenanceStart")byId("maintenanceEnd").min=event.target.value;
  }
  function handleKeydown(event){
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();openCommand();return;}
    if(event.key==="Escape"){
      closePopovers();
      closeModal();
      if(byId("commandDialog").open)byId("commandDialog").close();
      if(byId("authDialog").open)byId("authDialog").close();
      closeSidebar();
    }
    if(byId("commandDialog").open){
      if(event.key==="ArrowDown"){event.preventDefault();commandIndex=Math.min(commandIndex+1,commandItems.length-1);updateCommandActive();}
      if(event.key==="ArrowUp"){event.preventDefault();commandIndex=Math.max(commandIndex-1,0);updateCommandActive();}
      if(event.key==="Enter"&&commandItems.length){event.preventDefault();chooseCommand(commandIndex);}
    }
    const modal=byId("modalHost").querySelector('[role="dialog"]');
    if(modal&&event.key==="Tab"){
      const focusable=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')];
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
  function setNavigationOpen(open){
    const mobile=window.innerWidth<=820;
    const sidebar=byId("sidebar");
    if(mobile){
      sidebar.classList.toggle("open",open);
      byId("appShell").classList.remove("sidebar-collapsed");
      byId("sidebarBackdrop").classList.toggle("is-visible",open);
    }else{
      sidebar.classList.remove("open");
      byId("appShell").classList.toggle("sidebar-collapsed",!open);
      byId("sidebarBackdrop").classList.remove("is-visible");
    }
    sidebar.inert=!open;
    byId("menuToggle").setAttribute("aria-expanded",String(open));
    byId("menuToggle").setAttribute("aria-label",open?"Close workspace navigation":"Open workspace navigation");
  }
  function closeSidebar(){
    setNavigationOpen(false);
  }
  function togglePopover(which){
    const isAccount=which==="account";
    const panel=byId(isAccount?"accountPopover":"notificationPopover");
    const other=byId(isAccount?"notificationPopover":"accountPopover");
    other.classList.add("hidden");
    panel.classList.toggle("hidden");
    byId(isAccount?"accountTrigger":"notificationTrigger").setAttribute("aria-expanded",String(!panel.classList.contains("hidden")));
  }
  function updateGlobalSearch(){
    const input=byId("globalSearch");
    if(!input.value.trim())return;
    catalogState.query=input.value.trim();
    byId("globalSearchSuggestions").classList.add("hidden");
    input.value="";
    routeTo(session.role==="admin"?"admin/equipment":"student/catalogue");
  }
  function init(){
    session=readSession();
    byId("signupToggle").addEventListener("click",()=>{authMode=authMode==="signup"?"login":"signup";updateAuthInterface();});
    byId("globalSearch").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();updateGlobalSearch();}});
    byId("globalSearch").addEventListener("focus",()=>byId("globalSearch").classList.add("search-open"));
    byId("menuToggle").addEventListener("click",()=>{
      const open=window.innerWidth>820
        ?byId("appShell").classList.contains("sidebar-collapsed")
        :!byId("sidebar").classList.contains("open");
      setNavigationOpen(open);
    });
    byId("sidebarBackdrop").addEventListener("click",closeSidebar);
    byId("notificationTrigger").addEventListener("click",()=>togglePopover("notifications"));
    byId("accountTrigger").addEventListener("click",()=>togglePopover("account"));
    byId("commandSearch").addEventListener("input",event=>renderCommandResults(event.target.value));
    byId("authDialog").addEventListener("click",event=>{if(event.target===byId("authDialog"))byId("authDialog").close();});
    document.addEventListener("click",globalClick);
    document.addEventListener("submit",handleSubmit);
    document.addEventListener("input",handleInput);
    document.addEventListener("change",handleChange);
    document.addEventListener("keydown",handleKeydown);
    document.addEventListener("click",event=>{
      const rippleTarget=event.target.closest(".button");
      if(!rippleTarget||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
      const rect=rippleTarget.getBoundingClientRect();
      const ripple=document.createElement("i");ripple.className="button-ripple";
      ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;
      rippleTarget.append(ripple);window.setTimeout(()=>ripple.remove(),650);
    });
    document.addEventListener("click",event=>{
      if(!event.target.closest(".topbar-popover-wrap")&&!event.target.closest(".account-popover")&&!event.target.closest(".notification-popover"))closePopovers();
      if(!event.target.closest(".global-search")&&!event.target.closest(".global-search-suggestions"))byId("globalSearch").classList.remove("search-open");
    });
    window.addEventListener("hashchange",()=>{
      if(!session){showLanding();return;}
      const route=parseRoute().path;
      if(!route||!route.startsWith(`${session.role}/`)){routeTo(roleHome(session.role),true);return;}
      showWorkspace();
      updateIdentity();
      renderRoute();
    });
    window.addEventListener("resize",()=>{
      const mobile=window.innerWidth<=820;
      if(mobile===isMobileViewport)return;
      isMobileViewport=mobile;
      setNavigationOpen(!mobile);
    });
    if(store.settings.theme==="dark")document.body.classList.add("dark-mode");
    observeReveals();showCountUps();
    window.setTimeout(()=>byId("pageSplash")?.remove(),1500);
    if(session){
      const route=parseRoute().path;
      if(!route||!route.startsWith(`${session.role}/`))history.replaceState(null,"",`#/${roleHome(session.role)}`);
      showWorkspace();updateIdentity();renderRoute();
    }else{
      showLanding();
      if(location.hash.startsWith("#/"))location.hash="#home";
    }
  }
  init();
})();
