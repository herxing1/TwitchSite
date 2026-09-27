window.SalonDiscovery = (()=>{
 const root=new URL(document.documentElement.dataset.root,location.href);
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
 const href=(path)=>new URL(path,root).href;
 const gameUrl=name=>href('recherche/index.html?jeu='+encodeURIComponent(name));
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 function home(content,live){
  if(document.documentElement.dataset.page!=='accueil')return;
  let box=document.querySelector('#home-priority');if(!box){box=node('section',undefined,'shell home-priority');box.id='home-priority';document.querySelector('.hero').after(box);}
  const next=[...content.streams,...content.events].filter(r=>Date.parse(r.end)>Date.now()&&(!r.status||r.status==='confirmed')).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))[0];
  const poll=content.poll?.open&&Date.parse(content.poll.endsAt)>Date.now()?content.poll:null;
  const progress=(content.progress||[]).find(r=>r.status==='playing')||(content.progress||[])[0];
  const resource=(content.resources||[])[0];
  const running=live?.status==='live';box.replaceChildren();
  const aside=document.querySelector('.next-card');if(aside)aside.hidden=true;
  document.querySelectorAll('.community-teaser').forEach(e=>e.hidden=true);
  document.querySelector('.home-rendezvous')?.classList.add('home-secondary');
  if(running){box.append(node('p','EN DIRECT','eyebrow'),node('h2',live.title||'Je suis en live !'),node('p',live.game||'Rejoins-moi sur Twitch.'));}
  else if(next){box.append(node('p','LE PROCHAIN RENDEZ-VOUS','eyebrow'),node('h2',next.title),node('p',new Intl.DateTimeFormat('fr-FR',{dateStyle:'full',timeStyle:'short',timeZone:content.site.timezone}).format(new Date(next.start))+(next.game?' · '+next.game:'')));}
  else if(poll){box.append(node('p','À TOI DE CHOISIR','eyebrow'),node('h2',poll.question),node('p','Vote pour le jeu que tu veux voir au prochain live.'));}
  else{box.append(node('p','ENTRE DEUX LIVES','eyebrow'),node('h2','Retrouve le fil.'),node('p','Mes dernières parties et les références partagées en stream.'));}
  const a=node('a',running?'Rejoindre le live ↗':next?'Voir le programme ↗':poll?'Je participe au vote ↗':'Voir ma progression ↗','button primary');
  a.href=running?'https://www.twitch.tv/'+encodeURIComponent(content.site.twitch):next?href(content.events.includes(next)?'evenements/index.html':'calendrier/index.html'):poll?href('suggestions/index.html#vote'):href(progress?'progression/index.html#item-'+progress.id:resource?'reperes/index.html#item-'+resource.id:'jeux/index.html');
  if(!running&&!next&&!poll){a.textContent=progress?'Suivre ma partie ↗':resource?'Retrouver les références ↗':'Explorer les jeux ↗';box.querySelector('h2').textContent=progress?progress.game:resource?resource.title:'On joue à quoi ?';box.querySelector('p:not(.eyebrow)').textContent=progress&&!progress.spoiler?(progress.next||progress.summary||'Retrouve ma partie en cours.'):progress?'Retrouve ma progression, avec les spoilers masqués.':resource?'Une référence partagée avec la communauté.':'Parcours ma bibliothèque pour trouver une idée de prochain live.';}
  const hero=document.querySelector('.hero .button.primary');if(hero){hero.textContent=a.textContent;hero.href=a.href;if(running){hero.target='_blank';hero.rel='noopener noreferrer';}else{hero.removeAttribute('target');hero.removeAttribute('rel');}}
  homeUpdates(content);
  const heroActions=document.querySelector('.hero .actions');if(heroActions)heroActions.hidden=true;
  const availability={'reperes':!!content.resources?.length,'progression':!!content.progress?.length,'evenements':content.events.some(r=>Date.parse(r.end)>Date.now()&&r.status!=='cancelled')};
  document.querySelectorAll('.portal').forEach(portal=>{const key=Object.keys(availability).find(k=>portal.getAttribute('href').includes(k+'/'));portal.hidden=key?!availability[key]:false;});
  const discord=document.querySelector('.home-rendezvous');if(discord)document.querySelector('.explore').after(discord);

  if(running){a.target='_blank';a.rel='noopener noreferrer';}box.append(a);
  const banner=document.querySelector('.live-banner');if(banner)banner.hidden=running;
 }
 function homeUpdates(content){
  let section=document.querySelector('#home-updates');
  if(!section){section=node('section',undefined,'shell home-updates');section.id='home-updates';document.querySelector('.explore').before(section);}
  section.replaceChildren();
  const progress=[...(content.progress||[])].sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||''))).slice(0,1);
  const resources=(content.resources||[]).slice(0,2);
  if(!progress.length&&!resources.length){section.hidden=true;return;}section.hidden=false;
  section.append(node('p','LE CARNET DE LA CHAÎNE','eyebrow'),node('h2','À découvrir entre deux lives.'));
  const grid=node('div',undefined,'home-updates-grid');section.append(grid);
  for(const [kind,row] of [...progress.map(r=>['progress',r]),...resources.map(r=>['resource',r])]){
   const article=node('article');const body=node('div',undefined,'update-body');const isProgress=kind==='progress';
   if(!isProgress&&window.SALON_CONFIG?.contentUrl){
    try{if(new URL(row.url).hostname==='open.spotify.com'){
     const cover=node('img',undefined,'home-resource-cover');const endpoint=new URL('/artwork',window.SALON_CONFIG.contentUrl);endpoint.searchParams.set('id',row.id);
     cover.src=endpoint.href;cover.alt='Pochette de '+row.title;cover.width=240;cover.height=240;cover.loading='lazy';cover.referrerPolicy='no-referrer';cover.addEventListener('error',()=>cover.remove(),{once:true});article.append(cover);
    }}catch{}
   }

   body.append(node('p',isProgress?({playing:'Partie en cours',paused:'Partie en pause',finished:'Partie terminée'}[row.status]||'Ma progression'):row.category,'eyebrow'),node('h3',isProgress?row.game:row.title));
   const note=isProgress?(row.spoiler?'La suite de ma partie est à retrouver avec les spoilers masqués.':row.next||row.summary):row.note;
   if(note)body.append(node('p',note.length>150?note.slice(0,147)+'…':note));
   if(isProgress&&row.updated){const date=node('p','Mis à jour le '+new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(row.updated)),'update-date');body.append(date);}
   const link=node('a',isProgress?'Suivre la partie ↗':'Retrouver la référence ↗','text-link');link.href=href((isProgress?'progression':'reperes')+'/index.html#item-'+row.id);body.append(link);article.append(body);grid.append(article);
  }
 }
 async function render(content){
  const host=document.querySelector('#discovery');if(!host)return;
  const params=new URLSearchParams(location.search),game=params.get('jeu');
  const form=node('form',undefined,'discovery-search');form.setAttribute('role','search');const label=node('label','Chercher sur le site');const input=node('input');input.type='search';input.value=params.get('q')||game||'';input.placeholder='Un jeu, une playlist, une information…';label.append(input);const submit=node('button','Rechercher','button primary');form.append(label,submit);host.append(form);
  const status=node('p',undefined,'results-line');status.setAttribute('role','status');const results=node('div');host.append(status,results);
  let games=[],loading=true,failed=false;
  const groups=()=>[
   ['Jeux',games.map(g=>({title:g.title,game:g.title,note:g.platform==='steam'?'Steam':'Epic Games',url:game?href('jeux/index.html?q='+encodeURIComponent(g.title)):gameUrl(g.title)}))],
   ['Progression',(content.progress||[]).map(r=>({title:r.game,game:r.game,note:{playing:'En cours',paused:'En pause',finished:'Terminé'}[r.status],url:href('progression/index.html#item-'+r.id)}))],
   ['Liens et références',(content.resources||[]).map(r=>({title:r.title,game:r.game,note:[r.category,r.note].filter(Boolean).join(' · '),url:href('reperes/index.html#item-'+r.id)}))],
   ['Rendez-vous',[...content.streams.map(r=>({...r,page:'calendrier'})),...content.events.map(r=>({...r,page:'evenements'}))].map(r=>({title:r.title,game:r.game,note:r.status==='cancelled'?'Annulé':r.status==='postponed'?'Reporté':(Date.parse(r.end)<=Date.now()?'Passé · ':'')+new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeZone:content.site.timezone}).format(new Date(r.start)),url:href(r.page+'/index.html#item-'+r.id)}))],
   ['Idées retenues',(content.ideas||[]).map(r=>({title:r.title,game:'',note:r.note,url:href('suggestions/index.html#idees-retenues')}))]
  ];
  function draw(){results.replaceChildren();const q=normalize(input.value);let total=0;
   if(game){document.querySelector('.page-heading h1').textContent=game;document.querySelector('.page-heading .lead').textContent='La progression, les références et les rendez-vous associés à ce jeu.';}
   for(const [title,rows]of groups()){
    const selected=rows.filter(r=>game?normalize(r.game)===normalize(game):q&&normalize([r.title,r.game,r.note].join(' ')).includes(q));if(!selected.length)continue;total+=selected.length;
    const section=node('section',undefined,'discovery-group');section.append(node('h2',title));for(const r of selected){const a=node('a',undefined,'discovery-result');a.href=r.url;a.append(node('strong',r.title),node('span',r.note||r.game),node('span','↗'));section.append(a);}results.append(section);
   }
   status.textContent=!q&&!game?'Recherche dans les jeux, la progression, les références et les rendez-vous.':`${total} résultat${total===1?'':'s'}${loading?' · Chargement de la bibliothèque…':failed?' · Bibliothèque indisponible, résultats partiels.':''}`;
   if(!total&&(q||game)){results.append(node('p',loading?'Recherche en cours…':'Aucun contenu associé pour le moment.','empty-state'));if(!loading){const a=node('a','Parcourir les références ↗','button secondary');a.href=href('reperes/index.html');results.append(a);}}if(failed){const retry=node('button','Réessayer de charger la bibliothèque','button secondary');retry.addEventListener('click',()=>location.reload());results.append(retry);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();location.href=href('recherche/index.html?q='+encodeURIComponent(input.value.trim()));});
  if(!game)input.addEventListener('input',()=>{history.replaceState(null,'',href('recherche/index.html?q='+encodeURIComponent(input.value)));draw();});draw();
  try{const r=await fetch(href('public/jeux.json'),{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const data=await r.json();games=['steam','epic'].flatMap(platform=>(data[platform]?.games||[]).filter(g=>!g.kind||g.kind==='game').map(g=>({...g,platform})));}catch{failed=true;}finally{loading=false;draw();}
 }
 return {gameUrl,home,render};
})();
