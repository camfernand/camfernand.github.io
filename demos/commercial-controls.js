"use strict";
/* Independent training simulations with fictional data only.
   Nothing is sent over the network, uploaded, saved, or connected to an ERP. */
(() => {
const $=id=>document.getElementById(id);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const status=(s,type='')=>'<div class="lab-status'+(type?' '+type:'')+'" role="status">'+esc(s)+'</div>';
const metrics=items=>'<div class="lab-metrics">'+items.map(([label,value])=>'<div class="lab-metric"><b>'+esc(value)+'</b><small>'+esc(label)+'</small></div>').join('')+'</div>';
const table=(headers,rows)=>'<div class="lab-tablewrap"><table class="lab-table"><thead><tr>'+headers.map(v=>'<th scope="col">'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function display(id,s){$(id+'-result').innerHTML=s;}

function pricing(){
 const pct=Number($('price-change').value),sc=$('price-scenario').value;
 if(!$('price-change').value.trim()||!Number.isFinite(pct)||pct<=-100||pct>500){
   display('pricing-rollout',status('Enter a pricing change between -99.99% and 500%.','danger'));return;
 }
 // Entirely invented price books and multipliers, intentionally unrelated to company pricing.
 const tiers=[['MSRP',1],['Fictional dealer tier',.8],['Fictional contract A',.87],['Fictional contract B',.74]];
 const products=[{sku:'DEMO-PANEL-101',base:400,active:true},{sku:'DEMO-BRACKET-202',base:180,active:true},{sku:'DEMO-ENDCAP-303',base:55,active:sc!=='inactive'}];
 const lines=[],issues=[],eligible=[];
 for(const p of products){
   const newBase=Math.round(p.base*(1+pct/100)*100)/100;
   if(!p.active){issues.push(p.sku+' is not active in the fictional item master');}
   for(const [book,factor] of tiers){
     let proposed=p.active?Math.round(newBase*factor*100)/100:null;
     if(sc==='missing'&&p.sku==='DEMO-BRACKET-202'&&book==='Fictional contract B'){proposed=null;issues.push(p.sku+' has no proposed Contract B price');}
     const valid=p.active&&proposed!==null;
     lines.push([p.sku,book,valid?fmt(proposed):'—',valid?'READY':'HOLD FOR REVIEW']);
     if(valid)eligible.push([p.sku,book,proposed]);
   }
 }
 const passed=lines.filter(r=>r[3]==='READY').length;
 let result=status(issues.length?'Review required: some fictional price-book lines are not ready.':'All fictional price-book lines are prepared for a reviewable upload.',issues.length?'warn':'');
 result+=metrics([['Price books',tiers.length],['Products',products.length],['Valid price lines',passed+'/'+lines.length],['Exceptions',issues.length]]);
 result+='<h3>Illustrative sales worksheet preview</h3>'+table(['Inventory item','Price book','New unit price','Status'],lines);
 result+='<h3>Operational handoff</h3><p>Finance leadership establishes the pricing direction → pricing analysis and worksheets are prepared → MSRP, dealer and customer books are updated → revised quote pricing is reviewed in the ERP.</p>';
 if(issues.length)result+='<h3>Review queue</h3>'+table(['Exception'],issues.map(x=>[x]));
 result+='<p class="fc-note">Demonstration multipliers are arbitrarily invented. The simulation does not know or reproduce company price books, discount structures, effective dates or approval policies.</p>';
 display('pricing-rollout',result);
}

function acquisition(){
 const sc=$('acq-scenario').value,stage=$('acq-step').value;
 const steps=[
   {key:'item',label:'Inventory item structure',complete:true},
   {key:'bom',label:'Production BOM coordination',complete:sc!=='bom'},
   {key:'quote',label:'Separate quote template',complete:sc!=='quote'},
   {key:'order',label:'Separate sales order template',complete:true},
   {key:'shipment',label:'Separate shipment template',complete:sc!=='shipment'},
   {key:'training',label:'Sales-team quoting training',complete:true}
 ];
 const gate={quote:['item','quote'],order:['item','quote','order','bom'],shipment:['item','quote','order','bom','shipment']};
 const incomplete=steps.filter(s=>!s.complete), blockers=steps.filter(s=>gate[stage].includes(s.key)&&!s.complete);
 const canProceed=blockers.length===0;
 let result=status(canProceed?'The selected fictional '+stage+' can proceed to staff review.':'The selected fictional '+stage+' has unmet prerequisites.',canProceed?'':'warn');
 result+=metrics([['Readiness checks',steps.filter(s=>s.complete).length+'/'+steps.length],['Workflow blockers',blockers.length],['Selected workflow',stage.toUpperCase()],['Sales training','Prepared']]);
 result+='<h3>Post-acquisition configuration checklist</h3>'+table(['Area','Status'],steps.map(s=>[s.label,s.complete?'CONFIGURED':'REQUIRES SETUP']));
 result+='<h3>Fictional '+esc(stage)+' handoff</h3>'+table(['Step','Result'],[
  ['Item ID','DEMO-ACQ-PANEL-101 (fictional)'],
  ['Transaction template',stage==='quote'?'Separate quote format':stage==='order'?'Separate sales order format':'Separate shipment format'],
  ['Readiness decision',canProceed?'Ready for human review':'Blocked: '+blockers.map(b=>b.label).join('; ')]
 ]);
 result+='<p class="fc-note">For this illustration, a quote does not require a finished production BOM; later order and shipment milestones do. These illustrative gates are not purported Acumatica rules.</p>';
 display('acquisition-flow',result);
}

const charges=[
 {id:'CARD-101',holder:'Jordan',merchant:'Shop Supply Co.',amount:120,memo:'Shop materials',gl:'Materials & supplies',sub:'Site A'},
 {id:'CARD-102',holder:'Jordan',merchant:'Travel Provider',amount:240,memo:'',gl:'Travel expense',sub:'Site A'},
 {id:'CARD-103',holder:'Casey',merchant:'Cloud Software',amount:85,memo:'Monthly software',gl:'Software expense',sub:'HQ'},
 {id:'CARD-104',holder:'Casey',merchant:'Parking Services',amount:30,memo:'Customer visit',gl:'',sub:''}
];
function ramp(){
 const sc=$('ramp-scenario').value;
 const billed=Number($('ramp-billed').value),cashback=Number($('ramp-cashback').value);
 if(!$('ramp-billed').value.trim()||!Number.isFinite(billed)||billed<0||!Number.isFinite(cashback)||cashback<0||!$('ramp-cashback').value.trim()){
   display('ramp-processor',status('Enter a nonnegative billed statement amount and cashback value to perform the independent tie-out.','danger'));return;
 }
 const rows=charges.map(r=>({...r}));
 if(sc==='complete'||sc==='split'){
   rows[1].memo='Approved travel expense';
   rows[3].gl='Parking expense';rows[3].sub='Site B';
 }
 const missingMemos=rows.filter(r=>!r.memo.trim());
 const missingCoding=rows.filter(r=>!r.gl||!r.sub);
 let invalidSplits=0;
 // Deliberately bad fictional allocation for one completed charge.
 if(sc==='split')invalidSplits=1;
 const grand=rows.reduce((sum,r)=>sum+r.amount,0);
 const variance=Math.round((grand-billed-cashback)*100)/100;
 const reconciled=Math.abs(variance)<.005;
 const ready=missingMemos.length===0&&missingCoding.length===0&&!invalidSplits&&reconciled;
 let result=status(ready?'Fictional statement reconciles; coding and memo checks are complete.':'Review required before this fictional statement is treated as fully supported.',ready?'':'warn');
 result+=metrics([['Cardholder charges',rows.length],['Charge total',fmt(grand)],['Billed + cashback',fmt(billed+cashback)],['Tie-out variance',fmt(variance)],['Missing memos',missingMemos.length],['Uncoded entries',missingCoding.length],['Invalid splits',invalidSplits]]);
 result+='<h3>1. Statement intake &amp; cardholder split</h3><p>Four fictional charges across two cardholders are in the spend population. A separate account-level cashback credit of '+esc(fmt(-cashback))+' is shown in the billed-total bridge and is not a fifth employee charge.</p>';
 result+='<h3>2–3. Memo collection and GL coding review</h3>'+table(['Cardholder','Merchant','Amount','Memo','GL / allocation'],rows.map(r=>[
   r.holder,r.merchant,fmt(r.amount),r.memo||'MISSING — follow up',
   !r.gl||!r.sub?'INCOMPLETE':(sc==='split'&&r.id==='CARD-104'?'SPLIT 15 + 10 ≠ 30':'CODED')
 ]));
 result+='<h3>4. ERP import and close support preview</h3>';
 result+=table(['Control','Result'],[
  ['Source cardholder charges',String(rows.length)+' / '+fmt(grand)],
  ['Independent statement tie-out',reconciled?'TIES TO BILLED + CASHBACK':'DIFFERENCE '+fmt(variance)],
  ['Returned-memo / coding review',missingMemos.length+missingCoding.length+invalidSplits?'OPEN EXCEPTIONS':'COMPLETE'],
  ['Consolidated workbook','Review-ready only when discrepancies are resolved'],
  ['Acumatica import','Prepared by original tool; not generated by this simulation']
 ]);
 result+='<p class="fc-note">The original v5.8 tool requires entry of the billed amount and warns on variances; an operator can explicitly confirm a mismatched export. This demo intentionally marks mismatches as needing review and never creates an upload file. Its memos and GL category names are invented.</p>';
 display('ramp-processor',result);
}
[
 ['run-price',pricing],['run-acq',acquisition],['run-ramp',ramp]
].forEach(([id,fn])=>$(id).addEventListener('click',fn));
['price-change','price-scenario'].forEach(id=>$(id).addEventListener('change',pricing));
['acq-scenario','acq-step'].forEach(id=>$(id).addEventListener('change',acquisition));
['ramp-scenario','ramp-billed','ramp-cashback'].forEach(id=>$(id).addEventListener('change',ramp));
pricing();acquisition();ramp();
})();