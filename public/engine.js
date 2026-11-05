"use strict";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const P={places:['the market','the school compound','a thick forest','the hospital','the lake shore','a busy town','a farm in the hills'],names:['Kato','Nambi','Okello','Atim','Mukasa','Namata','Odongo'],acts:['went to the market to buy sugar','played football with friends','washed clothes at the well','climbed a mango tree','slept under a tree all day','sold tomatoes by the road'],titles:['The Big Market Day','A Night at the Lake','The Magic Drum','The Clever Hen','Football Champions'],lessons:['We should never ask anyone for help','Sleeping all day is the best way to learn','We should keep our problems secret','Only grown-ups can solve problems'],times:['one sunny morning','late at night','during the rainy season','on market day','long, long ago']};
const storyHTML=s=>s?'<div class="card story"><h3>Read the story first</h3>'+s.split(/\n\s*\n/).map(p=>'<p>'+esc(p.trim())+'</p>').join('')+'</div>':'';
const $=s=>document.querySelector(s);
function mc(sec,text,ans,pool,n){const d=shuf([...new Set(pool.filter(x=>x&&x.toLowerCase()!==ans.toLowerCase()))]).slice(0,n-1);return{sec,type:'mc',text,ans,opts:shuf([ans,...d]),marks:1}}
function gen(){
 const title=$('#t').value.trim(),place=$('#p').value.trim(),time=$('#tm').value.trim(),lv=parseInt($('#lv').value.slice(2));
 const chars=$('#ch').value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const i=l.indexOf(':');return i<0?{n:l,a:''}:{n:l.slice(0,i).trim(),a:l.slice(i+1).trim()}});
 const E=$('#ev').value.split('\n').map(l=>l.trim()).filter(Boolean).slice(0,6),sum=$('#sm').value.trim(),les=$('#ls').value.trim();
 if(!title||!place||!chars.length||E.length<2||!sum)return null;
 const T=lv<=2?0:lv<=4?1:lv===5?2:3,n=T===0?3:4,names=chars.map(c=>c.n),Q=[];
 Q.push(mc('Title','What is the title of the story?',title,P.titles,n));
 Q.push(mc('Setting','Where did the story take place?',place,P.places,n));
 if(time)Q.push(mc('Setting','When did the story happen?',time,P.times,n));
 Q.push(mc('Characters','Who is the main character in the story?',names[0],[...names.slice(1),...P.names],n));
 if(names.length>=2)Q.push(mc('Characters','Which of these is NOT a character in the story?',shuf(P.names.filter(x=>!names.includes(x)))[0],names,n));
 const wa=chars.filter(c=>c.a);
 wa.slice(0,4).forEach(c=>Q.push(mc('Activities','What did '+c.n+' do in the story?',c.a,[...wa.filter(x=>x!==c).map(x=>x.a),...P.acts],n)));
 wa.slice(0,2).forEach(c=>Q.push(mc('Activities','Who '+c.a+'?',c.n,[...names.filter(x=>x!==c.n),...P.names],n)));
 Q.push(mc('Plot','Which event happened FIRST in the story?',E[0],E.slice(1),n));
 Q.push(mc('Plot','Which event happened LAST in the story?',E[E.length-1],E.slice(0,-1),n));
 [...new Set([0,Math.floor((E.length-2)/2),E.length-2])].filter(i=>i>=0&&i<E.length-1).forEach(i=>Q.push(mc('Plot','What happened right after: “'+E[i]+'”?',E[i+1],E.filter((_,k)=>k!==i+1),n)));
 const OE=T===0?E.slice(0,4):E,L=E.length,M=Math.floor(L/2);
 Q.push({sec:'Plot',type:'order',items:shuf(OE.map((e,k)=>({e,n:k+1}))),count:OE.length,marks:OE.length});
 if(T>=2&&L>=3){Q.push(mc('Plot','Which event happened in the MIDDLE of the story?',E[M],[E[0],E[L-1],...E.filter((_,k)=>k!==M)],n));
  [L-1,M].filter((v,k,a)=>v>0&&a.indexOf(v)===k).forEach(i=>Q.push(mc('Plot','What happened just BEFORE: “'+E[i]+'”?',E[i-1],E.filter((_,k)=>k!==i-1),n)))}
 const cm=T===3?2:1,hq=x=>{x.marks=cm;Q.push(x)};
 if(T>=2&&wa.length>=2){const c=wa[0],o=wa[1];hq(mc('Challenge','Which sentence about the story is TRUE?',c.n+' '+c.a+'.',[o.n+' '+c.a+'.',c.n+' '+o.a+'.',o.n+' '+P.acts[0]+'.',names[0]+' '+P.acts[1]+'.'],n))}
 if(T>=2)hq(mc('Challenge','Which of these did NOT happen in the story?',names[0]+' '+P.acts[2],E,n));
 if(T>=3&&L>=4)hq(mc('Challenge','Which event happened AFTER “'+E[1]+'” but BEFORE “'+E[3]+'”?',E[2],E.filter((_,k)=>k!==2),n));
 const words=sum.split(/\s+/),max=T===0?3:T===1?5:T===2?6:8,cand=[];
 words.forEach((w,i)=>{const m=w.match(/^([^\p{L}]*)([\p{L}’'\-]+)(.*)$/u);if(!m)return;const c=m[2];if(c.length>2&&((/^\p{Lu}/u.test(c)&&i>0&&!/[.!?]$/.test(words[i-1]))||c.length>=7))cand.push(i)});
 const step=Math.max(1,Math.floor(cand.length/max)),blank=cand.filter((_,k)=>k%step===0).slice(0,max);
 const ans=blank.map(i=>words[i].match(/^([^\p{L}]*)([\p{L}’'\-]+)/u)[2]);
 if(blank.length)Q.push({sec:'Summary',type:'cloze',words,blank,ans,marks:blank.length});
 if(les)Q.push(mc('Summary','What lesson does the story teach?',les,P.lessons,n));
 if(T>=1&&les){const sit=shuf(['has lost a pencil','is stuck on a hard sum','has a problem at home','has quarrelled with a friend'])[0];Q.push(mc('Apply','A pupil '+sit+'. Which advice from our story would help most?',les,P.lessons,n))}
 if(T>=2&&L>=3){const i=1+Math.floor(Math.random()*(L-2)),cx=mc('Challenge','Which event led to this: “'+E[i+1]+'”?',E[i],E.filter((_,k)=>k!==i),n);cx.marks=cm;Q.push(cx)}
 if(T>=2&&wa.length>=2){const c=wa[0],o=wa[1];hq(mc('Challenge','Which sentence shows how '+c.n+' and '+o.n+' were DIFFERENT?',c.n+' '+c.a+', but '+o.n+' '+o.a+'.',[c.n+' '+o.a+', but '+o.n+' '+c.a+'.',c.n+' and '+o.n+' both '+c.a+'.',c.n+' and '+o.n+' both '+o.a+'.'],n))}
 const ev1=(txt,m)=>({sec:'Evaluate',type:'write',text:txt,need:2,kw:['because','so that','since'],hint:', and give a reason using the word “because”',marks:m});
 if(T>=2&&wa.length)Q.push(ev1('Do you think it was right that '+wa[0].n+' '+wa[0].a+'? Write 2 sentences and give your reason using “because”.',2));
 if(T>=3&&names.length>1)Q.push(ev1('Which character do you think was the most helpful in the story? Write 2 sentences and explain why.',2));
 const kw=[...names,...place.split(/\s+/).filter(w=>w.length>4)];
 Q.push({sec:'Writing',type:'write',text:T===0?'Write 2 sentences about '+names[0]+' in the story.':T===1?'Write at least 2 sentences about what happened in the story.':T===2?'Write at least 3 sentences to tell the story in your own words.':'Write a NEW ending for the story in at least 3 sentences. Use the names of the characters.',need:T<2?2:3,kw,marks:T===3?3:2});
 const BL=['Remember','Understand','Apply','Analyze','Evaluate','Create'],MAP={Title:'Remember',Setting:'Remember',Characters:'Remember',Activities:'Remember',Summary:'Understand',Challenge:'Analyze',Writing:'Create'};
 Q.forEach(q=>{if(q.sec==='Plot')q.sec=/FIRST|LAST/.test(q.text||'')?'Remember':'Understand';else if(q.type==='cloze')q.sec='Apply';else q.sec=MAP[q.sec]||q.sec});
 Q.sort((a,b)=>BL.indexOf(a.sec)-BL.indexOf(b.sec));
 return{title,level:$('#lv').value+' · '+['Easy','Medium','Hard','Difficult'][T],story:$('#sty').value.trim()||compose(chars,E,place,time,les),Q,total:Q.reduce((s,q)=>s+q.marks,0)};
}
function qHTML(q,i,t){
 let h='<div class="q"><div><b>'+(i+1)+'.</b> ';
 if(q.type==='mc'){h+=esc(q.text)+' <span class="mk">('+q.marks+(q.marks>1?' marks':' mark')+')</span></div>';
  q.opts.forEach((o,k)=>{h+='<label class="op'+(!t&&o===q.ans?' ok':'')+'">'+(t?'<input type="radio" name="q'+i+'" value="'+esc(o)+'">':'<span class="bx"></span>')+'ABCD'[k]+'. '+esc(o)+'</label>'})}
 else if(q.type==='cloze'){h+='Read the summary and fill in the missing words. <span class="mk">('+q.marks+' marks)</span></div><p class="cl">';
  q.words.forEach((w,k)=>{const b=q.blank.indexOf(k);if(b<0){h+=esc(w)+' ';return}
   const m=w.match(/^([^\p{L}]*)([\p{L}’'\-]+)(.*)$/u);
   h+=esc(m[1])+(t?'<input type="text" class="bl" data-b="'+b+'" size="'+(m[2].length+2)+'" autocomplete="off">':'<span class="ln k">'+esc(m[2])+'</span>')+esc(m[3])+' '});h+='</p>'}
 else if(q.type==='write'){h+=esc(q.text)+' <span class="mk">('+q.marks+' marks)</span></div>'+(t?'<textarea class="wr" rows="5" placeholder="Write here…"></textarea>':'<div class="op">'+'<div style="border-bottom:1.5px solid var(--mut);height:1.9em"></div>'.repeat(5)+'</div>')}
 else{h+='Number the events from 1 to '+q.count+' to show the order they happened. <span class="mk">('+q.marks+' marks)</span></div>';
  q.items.forEach((it,k)=>{h+='<div class="op">'+(t?'<select class="ordsel"><option value="">?</option>'+Array.from({length:q.count},(_,j)=>'<option>'+(j+1)+'</option>').join('')+'</select>':'<span class="bx k">'+it.n+'</span>')+esc(it.e)+'</div>'})}
 return h+'</div>';
}
function list(Q,t){let last='',h='',L=0;Q.forEach((q,i)=>{if(q.sec!==last){h+='<h3>Section '+'ABCDEFGHIJ'[L++]+': '+q.sec+(({Remember:'recall facts',Understand:'explain and put in order',Apply:'use what you learnt',Analyze:'find reasons and compare',Evaluate:'give your opinion and a reason',Create:'write your own ideas'})[q.sec]?' <span class="hint">('+({Remember:'recall facts',Understand:'explain and put in order',Apply:'use what you learnt',Analyze:'find reasons and compare',Evaluate:'give your opinion and a reason',Create:'write your own ideas'})[q.sec]+')</span>':'')+'</h3>';last=q.sec}h+=qHTML(q,i,t)});return h}
function collect(box,Q){return[...box.querySelectorAll('.q')].map((el,i)=>{const q=Q[i];
 if(q.type==='mc'){const c=el.querySelector('input:checked');return c?c.value:''}
 if(q.type==='cloze')return[...el.querySelectorAll('input.bl')].map(x=>x.value.trim());
 if(q.type==='write')return el.querySelector('textarea').value;
 return[...el.querySelectorAll('select')].map(x=>x.value)})}
function fill(box,Q,A){box.querySelectorAll('.q').forEach((el,i)=>{const q=Q[i],a=A[i]||(q.type==='mc'?'':[]);
 if(q.type==='mc')el.querySelectorAll('input').forEach(x=>{if(x.value===a)x.checked=true});
 else if(q.type==='cloze')el.querySelectorAll('input.bl').forEach((x,b)=>x.value=a[b]||'');
 else if(q.type==='write')el.querySelector('textarea').value=typeof a==='string'?a:'';
 else el.querySelectorAll('select').forEach((x,k)=>x.value=a[k]||'')})}
function grade(box,Q){
 const els=box.querySelectorAll('.q'),by={};let got=0;
 Q.forEach((q,i)=>{const el=els[i];let s=0,fb='';
  if(q.type==='mc'){const c=el.querySelector('input:checked');s=c&&c.value===q.ans?q.marks:0;if(!s)fb='Correct answer: '+q.ans}
  else if(q.type==='cloze'){el.querySelectorAll('input.bl').forEach((x,b)=>{if(x.value.trim().toLowerCase()===q.ans[b].toLowerCase())s++});if(s<q.marks)fb='Missing words: '+q.ans.join(', ')}
  else if(q.type==='write'){const w=el.querySelector('textarea').value.trim(),sn=w.split(/[.!?]+/).filter(x=>x.trim().split(/\s+/).length>=3).length,wc=w?w.split(/\s+/).length:0,hit=q.kw.some(k=>w.toLowerCase().includes(k.toLowerCase()));
   s=(sn>=q.need?1:0)+(hit?1:0)+(q.marks>2&&wc>=25?1:0);
   if(s<q.marks)fb='Aim for at least '+q.need+' full sentences about the story'+(hit?'':q.hint||', using a name or place from it')+(q.marks>2?', with about 25 words or more':'')+'.'}
  else{el.querySelectorAll('select').forEach((x,k)=>{if(+x.value===q.items[k].n)s++});if(s<q.marks)fb='Correct order: '+q.items.slice().sort((a,b)=>a.n-b.n).map(x=>x.n+'. '+x.e).join(' | ')}
  got+=s;(by[q.sec]=by[q.sec]||{g:0,m:0}).g+=s;by[q.sec].m+=q.marks;
  el.classList.add(s===q.marks?'right':'wrong');
  if(fb){const d=document.createElement('div');d.className='fb';d.textContent=fb;el.appendChild(d)}});
 box.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=true);
 return{got,by};
}
function resHTML(name,title,got,total,by){
 const pc=Math.round(got/total*100),note=pc>=80?'Excellent reading. The story was understood very well.':pc>=60?'Good work. A little more practice on the weaker sections will help.':pc>=40?'Fair effort. Reread the story and talk about the sections marked Revise.':'Needs support. Reread the story aloud together.';
 let h='<div class="card"><h2>'+esc(title)+'</h2><div class="score"><div class="big">'+got+'/'+total+'</div><div><b>'+esc(name)+'</b>: '+pc+'%<br>'+note+'</div></div><h3>By section</h3>';
 Object.keys(by).forEach(k=>{const v=by[k],p=Math.round(v.g/v.m*100);h+='<div class="sec"><span>'+k+'</span><span>'+v.g+'/'+v.m+' · '+(p>=70?'Strong':'Revise')+'</span></div><div class="bar"><i style="width:'+p+'%"></i></div>'});
 return h+'</div>';
}
const sentence=s=>{s=String(s||'').trim().replace(/[.!?]+$/,'');return s?s[0].toUpperCase()+s.slice(1)+'.':''};
function compose(chars,E,place,time,les){
 const k=Math.ceil(E.length/2),nm=chars.map(c=>c.n),who=nm.length>1?nm.slice(0,-1).join(', ')+' and '+nm[nm.length-1]:nm[0];
 const p1=[sentence((time||'One day')+', '+who+(nm.length>1?' were in ':' was in ')+place),...E.slice(0,k).map(sentence)].join(' ');
 const p2=[...E.slice(k).map(sentence),les?sentence('This story teaches us that '+les[0].toLowerCase()+les.slice(1)):''].filter(Boolean).join(' ');
 return p1+'\n\n'+p2;
}
function localFill(force){
 const t=$('#t').value.trim(),lv=parseInt($('#lv').value.slice(2)),pk=a=>a[Math.floor(Math.random()*a.length)];
 const skip=/^(the|a|an|and|of|in|on|at|to|with|for|story|tale)$/i,w=t.split(/\s+/).map(x=>x.replace(/[^\p{L}’'\-]/gu,'')).filter(Boolean),f=w[0]||'';
 const pos=/(’|')s$/.test(f),nameFirst=/^\p{Lu}/u.test(f)&&!skip.test(f)&&(pos||/^(and|goes|finds|meets|visits|helps|learns|saves|wins|plays|the)$/i.test(w[1]||''));
 const main=nameFirst?f.replace(/(’|')s$/,''):pk(P.names);
 const thing=w.filter((x,i)=>!(nameFirst&&i===0)&&!skip.test(x)).join(' ').toLowerCase()||'surprise';
 const pl=P.names.filter(x=>x!==main),h=pk(pl),el=pk(['Mzee ','Mama '])+pk(pl.filter(x=>x!==h));
 const place=pk(['a village near the river','a small village in the hills','a busy school compound','a market town']),time=pk(['one sunny morning','one rainy afternoon','one market day']);
 const chars=[main+': noticed a problem with the '+thing+' and asked for help',h+': listened and agreed to help '+main,el+': gave good advice and joined them'];
 const E=[main+' noticed a problem with the '+thing,main+' asked '+h+' to help','They talked about the problem and made a plan',el+' gave them good advice and joined them','Together they solved the problem and '+main+' thanked everyone'];
 if(lv<=2)E.splice(2,1);if(lv>=5)E.push('They felt proud and went home happy');
 const les='We should ask for help and say thank you';
 const sum=main+' had a problem with the '+thing+'. '+main+' asked '+h+' for help. '+el+' gave good advice and they made a plan together. In the end the problem was solved and everyone was happy.';
 const set=(id,v)=>{if(v&&(force||!$('#'+id).value.trim()))$('#'+id).value=v};
 set('p',place);set('tm',time);set('ch',chars.join('\n'));set('ev',E.join('\n'));set('sm',sum);set('ls',les);
 set('sty',compose(chars.map(l=>({n:l.split(':')[0]})),E,place,time,les));
}
