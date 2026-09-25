/* Site de herxing_ — JavaScript natif, sans framework ni compilation.
   Le contenu éditorial vient de public/contenu.js.
   Les jeux viennent de public/jeux.json, actualisé par la synchronisation privée. */
(async () => {
  'use strict';
  const page = document.documentElement.dataset.page;
  const root = new URL(document.documentElement.dataset.root, location.href);
  let content = window.SALON_CONTENT;
  const config = window.SALON_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const href = path => new URL(path, root).href;
  const el = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  function notice(message) {
    let box = $('#data-notice');
    if (!box) { box = el('p', '', 'shell data-notice'); box.id = 'data-notice'; box.setAttribute('role', 'status'); $('main').prepend(box); }
    box.textContent = message;
  }
  if (SalonData.safeUrl(config.contentUrl)) {
    try {
      const response = await fetch(config.contentUrl, {cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw Error();
      const data = await response.json(); SalonData.validateContent(data.content);
      content = data.content;
    } catch { notice('La mise à jour du contenu est indisponible. Cette copie de secours peut ne pas refléter les derniers horaires.'); }
  }
  try { SalonData.validateContent(content); }
  catch { notice('Le fichier de contenu ne peut pas être lu. Réexporte-le avec l’éditeur puis recharge la page.'); return; }
  const zone = content.site.timezone;
  const date = (value, options = {}) => new Intl.DateTimeFormat('fr-FR', { timeZone: zone, day: 'numeric', month: 'long', year: 'numeric', ...options }).format(new Date(value));
  const time = value => date(value, { day: undefined, month: undefined, year: undefined, hour: '2-digit', minute: '2-digit' });
  const sorted = rows => [...rows].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  function appointment(item, kind = 'Stream') {
    const article = el('article', undefined, 'appointment');
    article.dataset.appointment = ''; article.dataset.start = item.start; article.dataset.end = item.end;
    const tile = el('div', undefined, 'date-tile');
    tile.append(el('span', date(item.start, { day: undefined, month: 'short', year: undefined }).replace('.', '')), el('strong', date(item.start, { month: undefined, year: undefined, day: '2-digit' })));
    const body = el('div', undefined, 'appointment-body');
    body.append(el('span', kind + (item.game ? ' / ' + item.game : ''), 'eyebrow'), el('h3', item.title));
    const when = el('p');
    const start = el('time', date(item.start, { weekday: 'long' }) + ' · ' + time(item.start)); start.dateTime = item.start;
    const end = el('time', (date(item.start) !== date(item.end) ? date(item.end) + ' · ' : '') + time(item.end)); end.dateTime = item.end;
    when.append(start, document.createTextNode(' — '), end); body.append(when);
    if (item.description) body.append(el('p', item.description, 'multiline'));
    article.append(tile, body);
    if (typeof item.gameImage === 'string') {
      try {
        const localCategory = item.gameImage === 'images/just-chatting.jpg';
        const u = new URL(localCategory ? href(item.gameImage) : item.gameImage);
        if (localCategory || (u.protocol === 'https:' && ['cdn1.epicgames.com','cdn2.unrealengine.com','cdn.akamai.steamstatic.com'].includes(u.hostname) && !u.username && !u.password && !u.search && !u.hash)) {
          const image = el('img', undefined, 'appointment-art'); image.src = u.href; image.alt = ''; image.loading = 'lazy'; image.width = localCategory ? 285 : 460; image.height = localCategory ? 380 : 215; if(localCategory) image.style.objectFit = 'contain'; image.addEventListener('error', () => image.remove(), {once:true}); article.append(image);
        }
      } catch {}
    }
    return article;
  }

  // Informations communes aux pages. Toutes les valeurs personnelles sont du texte.
  const titles = { accueil: 'Accueil', calendrier: 'Calendrier', jeux: 'Jeux', evenements: 'Événements', informations: 'Informations', suggestions: 'Suggestions', '404': 'Page introuvable' };
  document.title = (titles[page] || 'Accueil') + ' — ' + content.site.name;
  $('meta[name="description"]').content = content.site.description;
  const brand = $('.brand');
  const mark = brand.querySelector('.brand-mark').cloneNode(true);
  brand.replaceChildren(mark, document.createTextNode(content.site.name));
  brand.setAttribute('aria-label', content.site.name + ', accueil');
  $('.footer-brand').replaceChildren(document.createTextNode(content.site.name), el('span', 'À très vite, en live.'));
  $('.footer > div > span').textContent = 'Les horaires sont affichés en ' + zone + '.';
  document.querySelectorAll('a[href^="https://www.twitch.tv/"]').forEach(link => {
    link.hidden = !content.site.twitch;
    if (content.site.twitch) link.href = 'https://www.twitch.tv/' + content.site.twitch;
  });

  function renderSchedule() {
    const isEvents = page === 'evenements';
    const upcoming = $(isEvents ? '#events-upcoming' : '#upcoming');
    const past = $(isEvents ? '#events-past' : '#past');
    const rows = sorted(content[isEvents ? 'events' : 'streams']);
    upcoming.replaceChildren(); past.replaceChildren();
    for (const row of rows) (Date.parse(row.end) > Date.now() ? upcoming : past).append(appointment(row, isEvents ? 'Événement' : 'Stream'));
    $(isEvents ? '#events-empty' : '#schedule-empty').hidden = upcoming.children.length > 0;
    $(isEvents ? '#events-past-wrap' : '#past-wrap').hidden = past.children.length === 0;
    if (!isEvents) $('.page-heading .lead').textContent = 'Choisis ton prochain rendez-vous. Les horaires sont indiqués en ' + zone + '.';
  }

  function renderHome() {
    $('.hero h1').textContent = content.site.tagline;
    $('.hero .lead').textContent = content.site.description;
    const next = sorted(content.streams).find(row => Date.parse(row.end) > Date.now());
    $('#next-stream').replaceChildren();
    if (next) $('#next-stream').append(appointment(next));
    $('#next-empty').hidden = !!next;
    $('#home-events')?.remove();
    const upcoming = sorted(content.events).filter(row => Date.parse(row.end) > Date.now()).slice(0, 3);
    if (upcoming.length) {
      const section = el('section', undefined, 'shell section-block'); section.id = 'home-events';
      const heading = el('div', undefined, 'section-heading');
      const link = el('a', 'Tous les événements ↗', 'text-link'); link.href = href('evenements/index.html');
      heading.append(el('h2', 'Les prochains rendez-vous spéciaux'), link); section.append(heading);
      upcoming.forEach(row => section.append(appointment(row, 'Événement'))); $('main').append(section);
    }
  }

  if (page === 'accueil') { renderHome(); setInterval(renderHome, 60000); }
  if (page === 'calendrier' || page === 'evenements') { renderSchedule(); setInterval(renderSchedule, 60000); }
  if (page === 'informations') {
    const moodButton = $('#mood-button');
    const moodPortrait = $('.mood-portrait');
    const excuses = ['J’avais un plan. Puis j’ai lancé le jeu.', 'C’était pour montrer au chat ce qu’il ne faut pas faire.', 'Le talent charge encore…', 'On appelle ça une stratégie expérimentale.'];
    let excuseIndex = 0;
    moodButton.hidden = false;
    moodButton.addEventListener('click', () => {
      excuseIndex = (excuseIndex + 1) % excuses.length;
      $('#mood-quote').textContent = excuses[excuseIndex];
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        moodPortrait.getAnimations().forEach(animation => animation.cancel());
        moodPortrait.animate([{transform:'rotate(0)'},{transform:'rotate(-3deg)',offset:.3},{transform:'rotate(2deg)',offset:.65},{transform:'rotate(0)'}], {duration:450,easing:'ease-out'});
      }
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { moodPortrait.classList.add('mood-arrived'); observer.disconnect(); }
      }, {threshold:.25});
      observer.observe(moodPortrait);
    }
    $('.page-heading .lead').textContent = 'Un peu de moi, beaucoup de jeux… et le matériel derrière les lives.';
    const panels = document.querySelectorAll('.info-grid .panel');
    panels[0].querySelector('h2').textContent = 'Moi et ma chaîne';
    panels[0].querySelector('.multiline').textContent = content.site.about || 'La présentation de la chaîne arrive bientôt. En attendant, retrouve le programme et les prochains rendez-vous.';
    const links = [...content.site.links];
    if (content.site.twitch) links.unshift({ label: 'Twitch', url: 'https://www.twitch.tv/' + content.site.twitch });
    panels[1].replaceChildren(el('p', 'ON GARDE LE CONTACT', 'eyebrow'), el('h2', 'Les liens utiles'));
    for (const item of links) { const a = el('a', undefined, 'social-row'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(el('span', item.label), el('span', '↗')); panels[1].append(a); }
    if (!links.length) panels[1].append(el('p', 'Les liens de la chaîne seront ajoutés ici.'));
    for (const item of [{label:'Le programme des lives',url:'calendrier/index.html'}, {label:'Ma bibliothèque de jeux',url:'jeux/index.html'}, {label:'Proposer une idée',url:'suggestions/index.html'}]) {
      const a = el('a', undefined, 'social-row'); a.href = href(item.url); a.append(el('span', item.label), el('span','↗')); panels[1].append(a);
    }
    const setup = $('#setup-list');
    for (const item of content.site.setup || []) {
      const row = el('div', undefined, 'setup-item'); row.append(el('dt',item.label),el('dd',item.value)); setup.append(row);
    }
    $('#setup-panel').hidden = !(content.site.setup || []).length;
  }

  let games = [], selectedPlatform = 'all';
  function renderGames() {
    const search = $('#game-search');
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const matches = (values, selected) => !selected || (selected === 'unknown' ? !values?.length : values?.includes(selected));
    const visible = games.filter(g => (selectedPlatform === 'all' || g.platform === selectedPlatform) && normalize(g.title).includes(normalize(search.value.trim())) && matches(g.genres, $('#game-genre').value) && matches(g.modes, $('#game-mode').value));
    visible.sort((a, b) => a.title.localeCompare(b.title, 'fr') * ($('#game-sort').value === 'desc' ? -1 : 1));
    const grid = $('.game-grid'); grid.replaceChildren();
    for (const game of visible) {
      const card = el('article', undefined, 'game-card'); card.dataset.game = ''; card.dataset.platform = game.platform;
      const artwork = el('div', undefined, 'game-artwork');
      artwork.setAttribute('aria-hidden', 'true');
      artwork.append(el('span', game.title.slice(0, 2).toUpperCase(), 'game-monogram'));
      let imageUrl = '';
      if (game.platform === 'steam' && /^\d+$/.test(game.id)) imageUrl = 'https://cdn.akamai.steamstatic.com/steam/apps/' + game.id + '/header.jpg';
      if (game.platform === 'epic' && typeof game.image === 'string') {
        try { const url = new URL(game.image); if (url.protocol === 'https:' && ['cdn1.epicgames.com', 'cdn2.unrealengine.com'].includes(url.hostname) && !url.username && !url.password && !url.search && !url.hash) imageUrl = url.href; } catch {}
      }
      if (imageUrl) {
        const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => image.remove(), { once: true });
        image.src = imageUrl; artwork.append(image);
      }
      card.append(artwork);
      card.append(el('span', game.platform === 'steam' ? 'Steam' : 'Epic Games', 'badge'), el('h2', game.title));
      card.append(el('p', game.genres?.length ? game.genres.join(' · ') : 'Genre non renseigné', 'game-genres'));
      if (game.platform === 'steam' && /^\d+$/.test(game.id)) { const a = el('a', 'Voir sur Steam ↗'); a.href = 'https://store.steampowered.com/app/' + game.id + '/'; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); }
      grid.append(card);
    }
    $('#game-count').textContent = visible.length + ' jeu' + (visible.length !== 1 ? 'x' : '');
    $('#games-empty').hidden = visible.length > 0;
    $('#games-empty h2').textContent = games.length ? 'Aucun jeu ne correspond.' : 'La bibliothèque prend ses quartiers.';
    $('#games-empty p').textContent = games.length ? 'Essaie un autre titre ou une autre plateforme.' : 'Les jeux apparaîtront après la première synchronisation.';
  }
  if (page === 'jeux') {
    for (const id of ['game-genre', 'game-mode', 'game-sort']) $('#' + id).addEventListener('change', renderGames);
    $('#reset-games').addEventListener('click', () => {
      $('#game-search').value = ''; $('#game-genre').value = ''; $('#game-mode').value = ''; $('#game-sort').value = 'asc';
      document.querySelector('button[data-platform="all"]').click();
    });
    $('#game-search').addEventListener('input', renderGames);
    document.querySelectorAll('button[data-platform]').forEach(button => button.addEventListener('click', () => {
      selectedPlatform = button.dataset.platform;
      document.querySelectorAll('button[data-platform]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
      renderGames();
    }));
  }
  async function loadGames() {
    // File opening works for pages and editorial content; fetch needs HTTP for JSON.
    if (location.protocol === 'file:') {
      if (page === 'jeux') notice('Aperçu depuis un fichier : consulte le site publié ou lance l’aperçu local pour charger les bibliothèques synchronisées.');
      return;
    }
    try {
      const response = await fetch(href('public/jeux.json'), { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error();
      const libraries = await response.json(); SalonData.validateLibraries(libraries);
      games = ['steam', 'epic'].flatMap(platform => libraries[platform].games.map(game => ({ ...game, platform }))).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
      const unclassified = games.filter(g => !g.kind || g.kind === 'unknown').length;
      games = games.filter(g => g.kind === 'game');
      if (page === 'accueil') $('.portal .portal-footer').textContent = games.length ? games.length + ' jeux à découvrir' : 'Steam & Epic Games';
      if (page === 'jeux') {
        $('#catalog-note').textContent = 'Jeux uniquement : logiciels, plugins et extensions exclus.' + (unclassified ? ' ' + unclassified + ' titres en attente de classification sont masqués. Les informations se complètent lors des synchronisations.' : '') + ' Les genres et modes non fournis restent « Non renseigné ».';
        for (const [id, field] of [['game-genre', 'genres'], ['game-mode', 'modes']]) {
          const values = [...new Set(games.flatMap(g => g[field] || []))].sort((a, b) => a.localeCompare(b, 'fr'));
          for (const value of values) { const option = el('option', value); option.value = value; $('#' + id).append(option); }
        }
        for (const button of document.querySelectorAll('button[data-platform]')) button.querySelector('span').textContent = button.dataset.platform === 'all' ? games.length : games.filter(g => g.platform === button.dataset.platform).length;
        const notes = $('.sync-note'); notes.replaceChildren();
        for (const platform of ['steam', 'epic']) notes.append(el('p', (platform === 'steam' ? 'Steam' : 'Epic Games') + ' · ' + (libraries[platform].updatedAt ? 'Dernière mise à jour : ' + date(libraries[platform].updatedAt, { hour: '2-digit', minute: '2-digit' }) : 'Pas encore synchronisé')));
        renderGames();
      }
    } catch { if (page === 'jeux') notice('La bibliothèque est temporairement indisponible. Recharge la page dans un instant.'); }
  }
  if (page === 'accueil' || page === 'jeux') loadGames();

  // Le formulaire appelle uniquement le relais public ; le jeton du bot reste sur Cloudflare.
  if (page === 'suggestions' && SalonData.safeUrl(config.suggestionsUrl) && config.turnstileSiteKey) {
    $('.form-unavailable')?.remove();
    const form = el('form'); form.id = 'suggestion-form';
    // Template constant. Les données de visiteurs sont lues en texte et jamais injectées en HTML.
    form.innerHTML = `
      <label for="pseudo">Ton pseudo <span class="optional">facultatif</span></label>
      <input id="pseudo" name="pseudo" maxlength="60" autocomplete="nickname" placeholder="Comment t’appelles-tu ?">
      <label for="message">Ton idée</label>
      <textarea id="message" name="message" rows="6" minlength="10" maxlength="1500" required placeholder="Raconte ton idée…" aria-describedby="message-help"></textarea>
      <div class="field-note"><span id="message-help">10 à 1 500 caractères.</span><span id="character-count">0 / 1 500</span></div>
      <div class="honeypot" aria-hidden="true"><label for="website">Ne pas remplir</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
      <p class="privacy-note" id="suggestion-privacy">Je reçois ton idée et ton pseudo facultatif en privé sur Discord pour préparer mes lives, sur la base de mon intérêt légitime à échanger avec ma communauté. Je prévois de les conserver six mois maximum et je dois les supprimer manuellement. Évite toute donnée sensible ou concernant une autre personne. Pour tes droits : <a href="mailto:herxingapp@gmail.com">herxingapp@gmail.com</a>. <a href="${href('confidentialite/index.html')}">Données, destinataires et droits</a>.</p>
      <div id="antibot-activation">
        <p class="privacy-note">Pour envoyer ici, active le contrôle antibot Cloudflare Turnstile. Il analyse ton adresse IP et des signaux du navigateur pour bloquer les robots et améliorer sa détection. Tu peux aussi envoyer ton idée par e-mail sans activer ce contrôle. <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Informations de Cloudflare</a>.</p>
        <div class="privacy-actions"><button class="button secondary" id="activate-antibot" type="button">Activer la vérification</button><a class="button secondary" href="mailto:herxingapp@gmail.com">Utiliser l’e-mail</a></div>
      </div>
      <div class="cf-turnstile" data-action="suggestion" data-theme="dark" data-size="flexible"></div>
      <button class="button primary" type="submit">Envoyer mon idée ↗</button>
      <p id="form-status" role="status" aria-live="polite"></p>`;
    form.querySelector('.cf-turnstile').dataset.sitekey = config.turnstileSiteKey;
    $('.form-panel').append(form);
    form.setAttribute('aria-describedby', 'suggestion-privacy');
    const message = $('#message'), status = $('#form-status'), button = form.querySelector('button[type="submit"]');
    const activation = $('#activate-antibot');
    activation.addEventListener('click', () => {
      activation.disabled = true;
      status.textContent = 'Chargement de la protection antibot…';
      const script = el('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; script.async = true; script.defer = true;
      script.addEventListener('load', () => { activation.textContent = 'Vérification activée'; status.textContent = 'Termine la vérification avant d’envoyer ton idée.'; });
      script.addEventListener('error', () => { script.remove(); activation.disabled = false; status.textContent = 'La protection ne peut pas se charger. Réessaie ou utilise le contact par e-mail.'; });
      document.head.append(script);
    });
    message.addEventListener('input', () => $('#character-count').textContent = message.value.length + ' / 1 500');
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (!form.reportValidity() || button.disabled) return;
      const data = new FormData(form), token = data.get('cf-turnstile-response');
      if (!token) { status.textContent = 'Termine la vérification antibot avant l’envoi.'; return; }
      button.disabled = true; status.textContent = 'Envoi en cours…';
      try {
        const response = await fetch(config.suggestionsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pseudo: data.get('pseudo'), message: data.get('message'), token, website: data.get('website') }), signal: AbortSignal.timeout(20000) });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(result.error || 'Envoi impossible pour le moment.');
        status.textContent = 'Merci ! Ton idée a bien été transmise.'; form.reset(); $('#character-count').textContent = '0 / 1 500';
      } catch (error) {
        status.textContent = error.name === 'TypeError' || error.name === 'TimeoutError' ? 'La réception n’a pas pu être confirmée. Ton texte est conservé ; vérifie ta connexion avant de réessayer.' : error.message;
      } finally { button.disabled = false; window.turnstile?.reset(); }
    });
  }
})();
