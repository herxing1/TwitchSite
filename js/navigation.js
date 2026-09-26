(() => {
  const header=document.querySelector('.header'), nav=header?.querySelector('nav');
  if(!nav)return;
  const button=document.createElement('button');button.type='button';button.className='menu-toggle';
  nav.id='main-navigation';button.setAttribute('aria-controls',nav.id);button.setAttribute('aria-expanded','false');
  const icon=document.createElement('span');icon.className='menu-icon';icon.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent='Menu';button.append(icon,label);
  header.insertBefore(button,nav);header.classList.add('has-menu');
  function close(focus=false){header.classList.remove('menu-open');button.setAttribute('aria-expanded','false');label.textContent='Menu';if(focus)button.focus();}
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';header.classList.toggle('menu-open',open);button.setAttribute('aria-expanded',String(open));label.textContent=open?'Fermer':'Menu';});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('menu-open'))close(true);});
  document.addEventListener('click',event=>{if(!header.contains(event.target))close();});
  matchMedia('(max-width: 900px)').addEventListener('change',()=>close());
})();
