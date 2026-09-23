/* Site de herxing_ — JavaScript natif, sans framework ni compilation.
   Le contenu éditorial vient de public/contenu.js.
   Les jeux viennent de public/jeux.json, actualisé par la synchronisation privée. */
(() => {
  'use strict';
  const page = document.documentElement.dataset.page;
  const root = new URL(document.documentElement.dataset.root, location.href);
  const content = window.SALON_CONTENT;
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
    article.append(tile, body); return article;
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
    $('.page-heading .lead').textContent = content.site.description;
    const panels = document.querySelectorAll('.info-grid .panel');
    panels[0].querySelector('h2').textContent = content.site.name;
    panels[0].querySelector('.multiline').textContent = content.site.about || 'La présentation de la chaîne arrive bientôt. En attendant, retrouve le programme et les prochains rendez-vous.';
    const links = [...content.site.links];
    if (content.site.twitch) links.unshift({ label: 'Twitch', url: 'https://www.twitch.tv/' + content.site.twitch });
    panels[1].replaceChildren(el('p', 'ON GARDE LE CONTACT', 'eyebrow'), el('h2', 'Les liens utiles'));
    for (const item of links) { const a = el('a', undefined, 'social-row'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(el('span', item.label), el('span', '↗')); panels[1].append(a); }
    if (!links.length) panels[1].append(el('p', 'Les liens de la chaîne seront ajoutés ici.'));
  }

  let games = [], selectedPlatform = 'all';
  function renderGames() {
    const search = $('#game-search');
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const visible = games.filter(g => (selectedPlatform === 'all' || g.platform === selectedPlatform) && normalize(g.title).includes(normalize(search.value.trim())));
    const grid = $('.game-grid'); grid.replaceChildren();
    for (const game of visible) {
      const card = el('article', undefined, 'game-card'); card.dataset.game = ''; card.dataset.platform = game.platform;
      card.append(el('span', game.platform === 'steam' ? 'Steam' : 'Epic Games', 'badge'), el('h2', game.title));
      if (game.platform === 'steam' && /^\d+$/.test(game.id)) { const a = el('a', 'Voir sur Steam ↗'); a.href = 'https://store.steampowered.com/app/' + game.id + '/'; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); }
      grid.append(card);
    }
    $('#game-count').textContent = visible.length + ' jeu' + (visible.length !== 1 ? 'x' : '');
    $('#games-empty').hidden = visible.length > 0;
    $('#games-empty h2').textContent = games.length ? 'Aucun jeu ne correspond.' : 'La bibliothèque prend ses quartiers.';
    $('#games-empty p').textContent = games.length ? 'Essaie un autre titre ou une autre plateforme.' : 'Les jeux apparaîtront après la première synchronisation.';
  }
  if (page === 'jeux') {
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
      if (page === 'accueil') $('.portal .portal-footer').textContent = games.length ? games.length + ' jeux à découvrir' : 'Steam & Epic Games';
      if (page === 'jeux') {
        for (const button of document.querySelectorAll('button[data-platform]')) button.querySelector('span').textContent = button.dataset.platform === 'all' ? games.length : libraries[button.dataset.platform].games.length;
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
      <div class="cf-turnstile" data-action="suggestion" data-theme="dark" data-size="flexible"></div>
      <button class="button primary" type="submit">Envoyer mon idée ↗</button>
      <p id="form-status" role="status" aria-live="polite"></p>`;
    form.querySelector('.cf-turnstile').dataset.sitekey = config.turnstileSiteKey;
    $('.form-panel').append(form);
    const script = el('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; script.async = true; script.defer = true; document.head.append(script);
    const message = $('#message'), status = $('#form-status'), button = form.querySelector('button');
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
