window.SalonNotebook={render(content){
  const host=document.querySelector('#notebook');if(!host)return;
  const resources=document.documentElement.dataset.page==='reperes',rows=resources?(content.resources||[]):(content.progress||[]);
  const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const statuses={playing:'En cours',paused:'En pause',finished:'Terminé'};
  const toolbar=node('div',undefined,'notebook-tools');const searchLabel=node('label','Rechercher');const search=node('input');search.type='search';search.placeholder=resources?'Un jeu, un morceau, une info…':'Un jeu…';searchLabel.append(search);
  const filterLabel=node('label',resources?'Catégorie':'Statut');const filter=node('select');const all=node('option','Tout afficher');all.value='';filter.append(all);
  const choices=resources?[...new Set(rows.map(r=>r.category))].sort((a,b)=>a.localeCompare(b,'fr')):Object.keys(statuses);
  choices.forEach(value=>{const o=node('option',resources?value:statuses[value]);o.value=value;filter.append(o);});filterLabel.append(filter);toolbar.append(searchLabel,filterLabel);
  let game;
  if(resources){const label=node('label','Jeu associé');game=node('select');const all=node('option','Tous les jeux');all.value='';game.append(all);[...new Set(rows.map(r=>r.game).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')).forEach(title=>{const o=node('option',title);o.value=title;game.append(o);});label.append(game);toolbar.append(label);}
  const reset=node('button','Réinitialiser','button secondary');reset.type='button';toolbar.append(reset);
  const count=node('p',undefined,'results-line');count.setAttribute('role','status');const list=node('div',undefined,'notebook-list');if(rows.length>4){host.append(toolbar);}else if(rows.length>1){const more=node('details',undefined,'notebook-filter-toggle');more.append(node('summary','Rechercher ou filtrer'),toolbar);host.append(more);}host.append(count,list);
  const link=(url,title)=>{try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)return null;const a=node('a',title+' ↗','notebook-link');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a;}catch{return null;}};
  function draw(){list.replaceChildren();
    const q=normal(search.value);const found=rows.filter(r=> (!filter.value||(resources?r.category:r.status)===filter.value)&&(!game?.value||r.game===game.value)&&normal(resources?[r.title,r.category,r.game,r.note].join(' '):r.game).includes(q));
    count.textContent=`${found.length} ${resources?'ressource'+(found.length===1?'':'s'):'jeu'+(found.length===1?'':'x')}`;
    if(!found.length){list.append(node('p',rows.length?'Aucun résultat avec ces filtres.':resources?'Je partagerai ici les liens et références évoqués en live.':'Je publierai ici ma progression et les objectifs des prochaines parties.','empty-state'));const help=node('a',rows.length?'Réinitialiser les filtres':'Proposer une idée ↗','button secondary');help.href=rows.length?'#notebook':'../suggestions/index.html';if(rows.length)help.addEventListener('click',e=>{e.preventDefault();reset.click();});list.append(help);return;}
    for(const r of found){const article=node('article',undefined,'notebook-entry');article.id='item-'+r.id;article.append(node('p',resources?[r.category,r.game].filter(Boolean).join(' / '):statuses[r.status],'eyebrow'),node('h2',resources?r.title:r.game));
      if(resources){
        if(window.SALON_CONFIG?.contentUrl){
          try{const source=new URL(r.url);if(source.hostname==='open.spotify.com'){
            const cover=node('img',undefined,'playlist-cover');const endpoint=new URL('/artwork',window.SALON_CONFIG.contentUrl);endpoint.searchParams.set('id',r.id);cover.src=endpoint.href;cover.alt='Pochette de '+r.title;cover.width=300;cover.height=300;cover.loading='lazy';cover.referrerPolicy='no-referrer';cover.addEventListener('error',()=>cover.remove(),{once:true});article.prepend(cover);
          }}catch{}
        }
        if(r.note)article.append(node('p',r.note,'multiline'));const a=link(r.url,{playlist:'Écouter la playlist',track:'Écouter le morceau',link:'Ouvrir le lien'}[r.kind]||'Ouvrir le lien');if(a){article.append(a);const report=node('a','Signaler un lien cassé','report-link');const target=new URL('../suggestions/index.html',location.href);target.searchParams.set('report',a.href);target.searchParams.set('title',resources?r.title:r.game);target.hash='signalement';report.href=target.href;article.append(report);}}
      else{if(r.updated){const when=node('time','Mis à jour le '+new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeZone:'UTC'}).format(new Date(r.updated)));when.dateTime=r.updated;article.append(when);}
        const body=node(r.spoiler?'details':'div',undefined,'progress-summary');if(r.spoiler)body.append(node('summary','Afficher ma progression — spoilers possibles'));
        if(r.summary)body.append(node('h3','Où j’en suis'),node('p',r.summary,'multiline'));if(r.next)body.append(node('h3','La prochaine étape'),node('p',r.next,'multiline'));article.append(body);const a=link(r.url,'Voir le replay');if(a){article.append(a);const report=node('a','Signaler un lien cassé','report-link');const target=new URL('../suggestions/index.html',location.href);target.searchParams.set('report',a.href);target.searchParams.set('title',resources?r.title:r.game);target.hash='signalement';report.href=target.href;article.append(report);}
      }if(r.game&&window.SalonDiscovery){const related=node('a','Tout sur '+r.game+' ↗','related-game');related.href=SalonDiscovery.gameUrl(r.game);article.append(related);}list.append(article);
    }
  }
  search.addEventListener('input',draw);filter.addEventListener('change',draw);game?.addEventListener('change',draw);reset.addEventListener('click',()=>{search.value='';filter.value='';if(game)game.value='';draw();search.focus();});draw();if(location.hash.startsWith('#item-'))requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
}};
