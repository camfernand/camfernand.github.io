"use strict";
/* Independent illustrative controls, using fictional records only.
   No network calls, document uploads, storage, ERP imports or bank files. */
(() => {
const $=id=>document.getElementById(id);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const USD=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
const money=n=>USD.format(n);
const num=id=>Number($(id).value);
const day=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?Date.UTC(+m[1],+m[2]-1,+m[3])/86400000:NaN};
const metric=items=>'<div class="lab-metrics">'+items.map(([label,value])=>'<div class="lab-metric"><b>'+esc(value)+'</b><small>'+esc(label)+'</small></div>').join("")+'</div>';
const status=(message,type="")=>'<div class="lab-status'+(type?" "+type:"")+'" role="status">'+esc(message)+'</div>';
const tbl=(headers,rows)=>'<div class="lab-tablewrap"><table class="lab-table"><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
const show=(id,s)=>$(id+"-result").innerHTML=s;
const validMoney=(arr)=>arr.every(n=>Number.isFinite(n)&&n>=0);

function exposure(){
 const [limit,orders,ar,credit,reported]=["ex-limit","ex-orders","ex-invoices","ex-credits","ex-reported"].map(num);
 if(!validMoney([limit,orders,ar,credit])||!Number.isFinite(reported)){
   show("credit-exposure",status("Enter valid nonnegative amounts and an ERP control balance.","danger"));return;
 }
 const netAr=ar-credit,exposure=orders+netAr,remaining=limit-exposure,util=limit>0?exposure/limit*100:null,tie=netAr-reported;
 let out=status((Math.abs(tie)>.005?"AR source tie-out needs review. ":"AR source tie-out passes. ")+(limit<=0?"Enter approved limit to assess availability.":remaining<0?"Net exposure exceeds the approved limit.":"Exposure is within the entered limit."),Math.abs(tie)>.005||remaining<0?"warn":"");
 out+=metric([["Net open AR",money(netAr)],["Net exposure",money(exposure)],["Available credit",limit>0?money(remaining):"—"],["Utilization",util==null?"—":util.toFixed(1)+"%"],["AR tie-out",money(tie)]]);
 out+="<h3>Exposure bridge</h3>"+tbl(["Component","Amount"],[["Open sales orders",money(orders)],["Unpaid AR invoices",money(ar)],["Less: unapplied customer credits",money(-credit)],["Net credit exposure",money(exposure)],["Approved credit limit",money(limit)]]);
 show("credit-exposure",out);
}

const creditCustomers=[
 {name:"Cedar Fabrication",apps:[{amount:4000,late:0},{amount:2500,late:12},{amount:700,late:8}]},
 {name:"Harbor Machine",apps:[{amount:2500,late:24},{amount:1800,late:36},{amount:800,late:15}]},
 {name:"Maple Components",apps:[{amount:1500,late:-8},{amount:2300,late:3},{amount:400,late:1}]}
];
function creditReview(){
 const sc=$("cr-scenario").value,floor=$("cr-floor").checked;
 const customers=creditCustomers.map(c=>({name:c.name,apps:c.apps.map(p=>({...p}))}));
 if(sc==="late"){customers[0].apps[0].late=65;customers[1].apps[1].late=75;customers[2].apps[0].late=30;}
 if(sc==="early"){for(const c of customers)for(const p of c.apps)p.late-=35;}
 const scores=customers.map(c=>{
  const total=c.apps.reduce((n,p)=>n+p.amount,0);
  const weighted=c.apps.reduce((n,p)=>n+p.amount*(floor?Math.max(0,p.late):p.late),0)/total;
  const tier=weighted<=5?"LOW":weighted<=15?"MODERATE":weighted<=30?"ELEVATED":"HIGH";
  const lateDollars=c.apps.filter(p=>p.late>0).reduce((n,p)=>n+p.amount,0);
  return {name:c.name,total,n:c.apps.length,weighted,tier,lateDollars};
 });
 const high=scores.filter(s=>s.tier==="HIGH").length;
 let out=status(high?high+" fictional customer(s) require high-risk review.":"Scoring complete; apply documented context before decisions.",high?"warn":"");
 out+=metric([["Customers",scores.length],["Paid applications",scores.reduce((n,s)=>n+s.n,0)],["High tier",high],["Elevated tier",scores.filter(s=>s.tier==="ELEVATED").length]]);
 out+="<h3>Explainable customer scores</h3>"+tbl(["Customer","Applied dollars","$-weighted days late","Dollars late","Tier"],scores.map(s=>[s.name,money(s.total),s.weighted.toFixed(1)+" d",money(s.lateDollars),s.tier]));
 out+='<p class="fc-note">Tier rules: LOW ≤ 5, MODERATE ≤ 15, ELEVATED ≤ 30, HIGH &gt; 30 weighted days late. This preview omits the real tool’s source-cleaning, join-fanout detection, historical trend and exception methodology.</p>';
 show("credit-review",out);
}

const invoiceRows=[
 {location:"East Branch",inv:"INV-1101",due:"2026-09-11",bal:1650},
 {location:"East Branch",inv:"INV-1104",due:"2026-11-05",bal:890},
 {location:"West Branch",inv:"INV-1205",due:"2026-11-30",bal:2150},
 {location:"West Branch",inv:"INV-1210",due:"2026-08-22",bal:3250},
 {location:"North Branch",inv:"INV-1300",due:"2026-10-27",bal:0}
];
function statementPackager(){
 const as=day($("sp-date").value);
 if(!Number.isFinite(as)){show("statement-packager",status("Choose a valid as-of date.","danger"));return;}
 const past=$("sp-past").checked,excludeZero=$("sp-zero").checked;
 const records=invoiceRows.map(r=>({...r,late:Math.floor(as-day(r.due))})).filter(r=>(!past||r.late>0)&&(!excludeZero||r.bal!==0));
 const total=records.reduce((n,r)=>n+r.bal,0),loc={};for(const r of records)loc[r.location]=(loc[r.location]||0)+r.bal;
 let out=status("Invoice register prepared from fictional multi-location data.");
 out+=metric([["Invoices shown",records.length],["Displayed balance",money(total)],["Locations",Object.keys(loc).length],["Past due only",past?"Yes":"No"]]);
 out+="<h3>Consolidated invoice register</h3>"+tbl(["Location","Invoice","Due","Open balance","Days overdue"],records.map(r=>[r.location,r.inv,r.due,money(r.bal),r.late>0?r.late:"Current"]));
 out+="<h3>Location summary</h3>"+tbl(["Location","Displayed balance"],Object.keys(loc).sort().map(n=>[n,money(loc[n])]));
 out+='<p class="fc-note">This filtered register is not necessarily the full source balance. The production process includes source-workbook total checks before distribution.</p>';
 show("statement-packager",out);
}

const accrualRows=[
 {po:"PO-101",source:"Unbilled receipt",age:8,value:6600,action:"Normal timing — monitor"},
 {po:"PO-102",source:"Unbilled receipt",age:47,value:4200,action:"Locate invoice / receiving follow-up"},
 {po:"PO-103",source:"Unbilled receipt",age:121,value:3500,action:"Over 90 days — investigate"},
 {po:"PO-104",source:"Partially billed receipt",age:35,value:1500,action:"Confirm remaining vendor billing"},
 {po:"PO-105",source:"Receipt and return wash",age:6,value:0,action:"Confirm zero-net pair"}
];
function accrualMonitor(){
 const gl=num("am-gl"),control=num("am-source"),detail=accrualRows.reduce((n,r)=>n+r.value,0);
 if(!Number.isFinite(gl)||!Number.isFinite(control)){show("accrual-monitor",status("Provide both reconciliation control values.","danger"));return;}
 const diff=detail-gl,sourceDiff=detail-control,aged=accrualRows.filter(r=>r.value>0&&r.age>90);
 let out=status(Math.abs(diff)>.005||Math.abs(sourceDiff)>.005?"Reconciliation difference: investigate before close.":"Accrual detail agrees with the entered GL and source controls.",Math.abs(diff)>.005||Math.abs(sourceDiff)>.005?"warn":"");
 out+=metric([["Accrued detail",money(detail)],["GL difference",money(diff)],["Report difference",money(sourceDiff)],["Over 90 days",aged.length]]);
 out+="<h3>Receipt and billing review</h3>"+tbl(["PO","Scenario","Age","Outstanding amount","Suggested follow-up"],accrualRows.map(r=>[r.po,r.source,r.age+" d",money(r.value),r.action]));
 out+='<p class="fc-note">The illustrative categories do not replace matching original receipts, returns and bills. Account sign-off remains with accounting.</p>';
 show("accrual-monitor",out);
}

function inventory(){
 const [val,gl,transit,transitGl]=["it-val","it-gl","it-transit","it-transit-gl"].map(num);
 if(!validMoney([val,gl,transit,transitGl])){show("inventory-trueup",status("Enter valid nonnegative amounts.","danger"));return;}
 const adj=val-gl,transitTie=transit-transitGl,flag=Math.abs(transitTie)>.005;
 let out=status(flag?"In-transit control is out of balance. Hold the proposed entry pending investigation.":"In-transit tie-out agrees; review the valuation-to-GL adjustment before posting.",flag?"warn":"");
 out+=metric([["Valuation in scope",money(val)],["Inventory GL",money(gl)],["Potential adjustment",money(adj)],["In-transit difference",money(transitTie)]]);
 out+="<h3>Proposed inventory reconciliation</h3>"+tbl(["Check","Amount","Status"],[["Valuation minus in-scope GL",money(adj),Math.abs(adj)<.005?"IN BALANCE":"REVIEW ADJUSTMENT"],["Excluded in-transit vs in-transit GL",money(transitTie),flag?"EXCEPTION":"TIES"]]);
 const explanation=adj>0?"Would debit inventory and credit the offset account; account selection and posting require review.":adj<0?"Would credit inventory and debit the offset account; account selection and posting require review.":"No inventory adjustment indicated by the values entered.";
 out+='<p class="fc-note">'+esc(explanation)+' This example does not infer COGS or auto-create a journal entry.</p>';
 show("inventory-trueup",out);
}

const baseChecks=[
 {date:"2026-11-16",number:"0001201",vendor:"Cedar Industrial",amount:1260.50,status:"Closed"},
 {date:"2026-11-16",number:"0001202",vendor:"Maple Components",amount:380.00,status:"Closed"},
 {date:"2026-11-17",number:"0001203",vendor:"Harbor Equipment",amount:975.25,status:"Closed"},
 {date:"2026-11-17",number:"0001204",vendor:"Oak Machinery",amount:225.00,status:"Open"},
 {date:"2026-11-16",number:"0001205",vendor:"Northshore Materials",amount:112.30,status:"Voided"}
];
function positivePay(){
 const sc=$("pp-scenario").value;
 const src=baseChecks.map(r=>({...r}));
 if(sc==="dupe")src.push({...src[0],vendor:"Second Supplier",amount:44});
 if(sc==="invalid")src[1].amount=0;
 if(sc==="void")src.push({date:"2026-11-16",number:"0001205",vendor:"Northshore Materials",amount:112.30,status:"Closed"});
 const voids=new Set(src.filter(r=>r.status==="Voided").map(r=>r.number));
 const eligible=src.filter(r=>r.status==="Closed"&&!voids.has(r.number));
 const byNo=new Map();for(const row of eligible)byNo.set(row.number,(byNo.get(row.number)||0)+1);
 const duplicates=[...byNo].filter(([k,v])=>v>1).map(([k])=>k);
 const invalid=eligible.filter(r=>!Number.isFinite(r.amount)||r.amount<=0||!r.number||!r.vendor||!Number.isFinite(day(r.date)));
 const blocked=duplicates.length>0||invalid.length>0;
 const counts=eligible.length,amt=eligible.reduce((n,r)=>n+r.amount,0);
 let out=status(blocked?"Pre-upload validation FAILED. No bank-file preview is approved.":"Source-to-output check passed for eligible fictional checks.",blocked?"danger":"");
 out+=metric([["Source rows",src.length],["Eligible checks",counts],["Eligible total",money(amt)],["Voided numbers excluded",voids.size],["Blocking errors",duplicates.length+invalid.length]]);
 if(blocked){
   out+="<h3>Blocking exceptions</h3>"+tbl(["Control","Result"],[
     ...duplicates.map(n=>["Duplicate active check number",n]),
     ...invalid.map(n=>["Invalid required field / check amount",n.number])
   ]);
 }else{
  const grouped={};for(const r of eligible)(grouped[r.date]=grouped[r.date]||[]).push(r);
  out+="<h3>Illustrative bank-file batches</h3>"+tbl(["Check date","Eligible checks","Total"],Object.keys(grouped).sort().map(date=>[date,grouped[date].length,money(grouped[date].reduce((n,r)=>n+r.amount,0))]));
  out+="<h3>Bank-record preview (not an upload file)</h3>"+tbl(["Check date","Check number","Payee","Amount"],eligible.map(r=>[r.date,r.number,r.vendor,money(r.amount)]));
 }
 out+='<p class="fc-note">Only CLOSED checks without any matching VOIDED number are eligible. This display is not the bank CSV layout, and nothing is transmitted to a bank.</p>';
 show("positive-pay",out);
}
const bind=[
 ["ex-run",exposure],["cr-run",creditReview],["sp-run",statementPackager],
 ["am-run",accrualMonitor],["it-run",inventory],["pp-run",positivePay]
];
for(const [id,fn] of bind)$(id).addEventListener("click",fn);
exposure();creditReview();statementPackager();accrualMonitor();inventory();positivePay();
})();