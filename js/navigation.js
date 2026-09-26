(() => {
  const header=document.querySelector('.header'), nav=header?.querySelector('nav');
  if(!nav)return;
  const original=[...nav.querySelectorAll('a')];
  const primary=[];
  for(const [route,label] of [['calendrier','Programme'],['jeux','Jeux'],['suggestions','Participer']]){const a=original.find(a=>a.getAttribute('href').includes('/'+route+'/')||a.getAttribute('href').startsWith(route+'/'));if(a){a.textContent=label;primary.push(a);}}
  const secondaryLinks=original.filter(a=>!primary.includes(a));nav.replaceChildren(...primary,...secondaryLinks);
  const mobile=matchMedia('(max-width: 900px)'), twitch=header.querySelector('.twitch-link');
  const button=document.createElement('button');button.type='button';button.className='menu-toggle';
  nav.id='main-navigation';button.setAttribute('aria-controls',nav.id);button.setAttribute('aria-expanded','false');
  const icon=document.createElement('span');icon.className='menu-icon';icon.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent='Menu';button.append(icon,label);
  header.insertBefore(button,nav);header.classList.add('has-menu');
  const heading=document.createElement('p');heading.className='menu-heading';heading.textContent='EXPLORER';nav.prepend(heading);
  const descriptions=['Le point de départ','Les prochains lives','Ma bibliothèque','Les rendez-vous ensemble','Un peu plus sur moi','Vos idées et vos votes'];
  [...nav.querySelectorAll('a')].forEach((link,i)=>{
    link.style.setProperty('--menu-order',i);
    const title=document.createElement('span');title.className='menu-link-title';title.textContent=link.textContent;
    const small=document.createElement('span');small.className='menu-link-description';small.textContent=descriptions[i]||'';
    const arrow=document.createElement('span');arrow.className='menu-link-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    link.replaceChildren(title,small,arrow);
  });
  const more=document.createElement('details');more.className='nav-more';const summary=document.createElement('summary');summary.textContent='À explorer';more.append(summary);secondaryLinks.forEach(a=>more.append(a));nav.append(more);
  const secondary=document.createElement('p');secondary.className='menu-heading menu-secondary-heading';secondary.textContent='À EXPLORER';nav.insertBefore(secondary,more);
  const background=[...document.querySelectorAll('main,body>.footer')];
  const setBackground=open=>{document.documentElement.classList.toggle('navigation-open',open);background.forEach(n=>n.inert=open);};
  const backdrop=document.createElement('div');backdrop.className='menu-backdrop';backdrop.setAttribute('aria-hidden','true');header.before(backdrop);
  function close(focus=false){more.open=false;setBackground(false);header.classList.remove('menu-open');backdrop.classList.remove('visible');button.setAttribute('aria-expanded','false');label.textContent='Menu';if(focus)button.focus();}
  function layout(){header.classList.add('menu-reset');close();more.open=mobile.matches;if(twitch){if(mobile.matches)nav.append(twitch);else header.append(twitch);}requestAnimationFrame(()=>requestAnimationFrame(()=>header.classList.remove('menu-reset')));}
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';header.classList.toggle('menu-open',open);more.open=open;setBackground(open);backdrop.classList.toggle('visible',open);button.setAttribute('aria-expanded',String(open));label.textContent=open?'Fermer':'Menu';});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
  backdrop.addEventListener('click',()=>close(true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('menu-open'))close(true);});
  header.addEventListener('focusout',()=>{setTimeout(()=>{if(!header.contains(document.activeElement))close();},0);});
  mobile.addEventListener('change',layout);layout();
})();
