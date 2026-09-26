/* Public participation. Text is rendered without HTML; no private suggestion is fetched. */
window.SalonCommunity = {render(content,config) {
  const page=document.documentElement.dataset.page;
  if(!['accueil','suggestions'].includes(page))return;
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  if(page==='accueil'){
    if(!content.poll)return;
    const box=make('section',undefined,'shell community-teaser');
    box.append(make('p','LE PROCHAIN JEU, ON LE CHOISIT ENSEMBLE','eyebrow'),make('h2',content.poll.question));
    const a=make('a','Voir le vote et les résultats ↗','button secondary');a.href='suggestions/index.html#vote';box.append(a);
    document.querySelector('main').append(box);return;
  }
  const section=make('section',undefined,'community-section');section.id='vote';
  section.append(make('p','À TOI DE JOUER','eyebrow'),make('h2','Le prochain jeu, on le choisit ensemble.'));
  const panel=make('div',undefined,'community-poll');
  const status=make('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  section.append(panel,status);
  document.querySelector('.suggestions-grid').before(section);
  const ideas=make('section',undefined,'community-section');ideas.id='idees-retenues';
  ideas.append(make('h2','Vos idées, la suite.'),make('p','Je partage ici les idées que je retiens et leur avancement. Les messages envoyés restent privés.'));
  const grid=make('div',undefined,'community-ideas');
  const labels={retained:'Retenue',planned:'Prévue',done:'Réalisée'};
  for(const idea of content.ideas||[]){if(!labels[idea.status])continue;const card=make('article',undefined,'community-idea');card.append(make('span',labels[idea.status],'badge'),make('h3',idea.title),make('p',idea.note,'multiline'));grid.append(card);}
  if(!grid.children.length)grid.append(make('p','Je n’ai pas encore publié d’idée retenue. Tu peux déjà m’en proposer une ci-dessous.'));
  ideas.append(grid);section.after(ideas);
  if(!config.contentUrl){panel.append(make('p','Les votes seront disponibles une fois le service connecté.'));return;}
  const endpoint=path=>new URL(path,config.contentUrl).href;
  const key='herxing-current-vote';
  function saved(){try{const v=JSON.parse(localStorage.getItem(key));if(v?.expires>Date.now())return v;localStorage.removeItem(key);}catch{}return null;}
  async function refresh(){
    const response=await fetch(endpoint('/community'),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Le vote est momentanément indisponible.');
    const {poll,totals}=await response.json();panel.replaceChildren();
    if(!poll){panel.append(make('p','Je prépare le prochain vote. Repasse bientôt !'));return;}
    panel.append(make('h3',poll.question));
    const closed=!poll.open||Date.parse(poll.endsAt)<=Date.now();
    panel.append(make('p',(closed?'Vote terminé · ':'Fin du vote · ')+new Intl.DateTimeFormat('fr-FR',{dateStyle:'full',timeStyle:'short',timeZone:content.site.timezone}).format(new Date(poll.endsAt))+' ('+content.site.timezone+')'));
    const counts=new Map(totals.map(t=>[t.option_id,Number(t.count)||0]));
    const total=poll.options.reduce((sum,o)=>sum+(counts.get(o.id)||0),0);
    const form=make('form');const choices=make('fieldset');choices.append(make('legend','Mon choix'));
    const voted=saved()?.pollId===poll.id&&saved()?.submitted;
    for(const option of poll.options){
      const count=counts.get(option.id)||0;const label=make('label',undefined,'poll-choice');
      const radio=make('input');radio.type='radio';radio.name='choice';radio.value=option.id;radio.required=true;radio.disabled=closed||voted;
      const body=make('span');body.append(make('strong',option.label),make('span',`${count} vote${count===1?'':'s'} · ${total?Math.round(count/total*100):0} %`));
      const bar=make('progress');bar.max=total||1;bar.value=count;bar.setAttribute('aria-label',option.label+' : '+count+' votes');body.append(bar);label.append(radio,body);choices.append(label);
    }
    form.append(choices,make('p',`${total} vote${total===1?'':'s'} au total. Un vote par navigateur : changer d’appareil ou effacer son stockage peut permettre de revoter. Ce résultat reste indicatif.`,'poll-help'));
    const button=make('button',voted?'Mon vote est enregistré':closed?'Vote terminé':'Je vote','button primary');button.type='submit';button.disabled=closed||voted;form.append(button);
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(button.disabled||!form.reportValidity())return;
      button.disabled=true;status.textContent='Enregistrement du vote…';
      try{
        let receipt=saved();if(receipt?.pollId!==poll.id)receipt={pollId:poll.id,id:crypto.randomUUID(),expires:Date.parse(poll.endsAt)+30*86400000,submitted:false};
        try{localStorage.setItem(key,JSON.stringify(receipt));}catch{throw Error('Autorise le stockage de ce site dans ton navigateur pour mémoriser ton vote.');}
        const response=await fetch(endpoint('/vote'),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({pollId:poll.id,optionId:new FormData(form).get('choice'),voter:receipt.id}),signal:AbortSignal.timeout(10000)});
        const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Le vote n’a pas pu être enregistré.');
        receipt.submitted=true;try{localStorage.setItem(key,JSON.stringify(receipt));}catch{}
        status.textContent='Merci, ton vote est enregistré !';
        try{await refresh();}catch{button.textContent='Mon vote est enregistré';status.textContent='Ton vote est enregistré. Recharge la page pour actualiser les résultats.';}
      }catch(error){status.textContent=error.name==='TimeoutError'||error.name==='TypeError'?'La réception n’a pas pu être confirmée. Réessaie : le même identifiant évite de compter deux fois ton vote.':error.message;button.disabled=false;}
    });
    const privacy=make('a','Comment mon vote est mémorisé');privacy.href='../confidentialite/index.html#votes';
    const reload=make('button','Actualiser les résultats','button secondary');reload.type='button';reload.addEventListener('click',async()=>{reload.disabled=true;try{await refresh();status.textContent='Résultats actualisés.';}catch(e){status.textContent=e.message;reload.disabled=false;}});
    panel.append(form,reload,privacy);
  }
  panel.append(make('p','Chargement du vote…'));
  refresh().catch(()=>{panel.replaceChildren(make('p','Le vote est momentanément indisponible. Recharge la page dans un instant.'));});
}};
