/* Reference Chart Renderer
   Renders topics and concepts from REFERENCE_TOPICS into #topics
   Responsive grid, hover/focus popovers, and tap-to-toggle on mobile
*/

(async function () {
  if (!Array.isArray(window.REFERENCE_TOPICS)) {
    console.error('REFERENCE_TOPICS is missing');
    return;
  }

  const topicsRoot = document.getElementById('topics');
  if (!topicsRoot) return;

  // Utility to create element with classes and attributes
  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.attrs) {
      Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    }
    if (typeof opts.text === 'string') node.textContent = opts.text;
    children.forEach((c) => node.appendChild(c));
    return node;
  }

  // Modal infrastructure
  function buildModal() {
    const backdrop = el('div', {
      class: 'ref-modal fixed inset-0 z-50 hidden',
      attrs: { role: 'dialog', 'aria-modal': 'true' }
    });

    const overlay = el('div', { class: 'absolute inset-0 bg-slate-950/60' });

    const panelWrap = el('div', { class: 'absolute inset-0 flex items-start sm:items-center justify-center p-4 sm:p-6' });
    const panel = el('div', {
      class: 'max-w-xl w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden'
    });

    const header = el('div', { class: 'px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4' });
    const title = el('h3', { class: 'font-semibold text-lg truncate', attrs: { id: 'ref-modal-title' } });
    const closeBtn = el('button', {
      class: 'shrink-0 rounded-full p-2 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500',
      attrs: { 'aria-label': 'Close' }
    }, [el('span', { text: '✕' })]);

    const body = el('div', { class: 'px-5 py-4 space-y-3', attrs: { id: 'ref-modal-body' } });

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    panel.appendChild(body);
    panelWrap.appendChild(panel);
    backdrop.appendChild(overlay);
    backdrop.appendChild(panelWrap);

    function close() {
      backdrop.classList.add('hidden');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    // Also close when clicking the empty space around the panel (outside the dialog)
    panelWrap.addEventListener('click', (e) => {
      if (e.target === panelWrap) close();
    });

    return { root: backdrop, title, body, open: (item) => {
      title.textContent = item.title || '';
      body.innerHTML = '';
      const iconRow = el('div', { class: 'flex items-start gap-3' });
      iconRow.appendChild(el('div', { class: 'text-3xl', text: item.icon || '📘' }));
      const desc = el('div');
      const short = el('div', { class: 'text-slate-300' });
      short.textContent = item.short || '';
      const def = el('div', { class: 'text-slate-100 text-sm mt-2' });
      def.innerHTML = item.definition || '';
      desc.appendChild(short);
      desc.appendChild(def);
      iconRow.appendChild(desc);

      body.appendChild(iconRow);

      backdrop.classList.remove('hidden');
      document.addEventListener('keydown', onKey);
    }, close };
  }

  const modal = buildModal();
  document.body.appendChild(modal.root);

  // Load glossary definitions
  let GLOSSARY = {};
  try {
    const res = await fetch('js/glossary.json', { cache: 'no-cache' });
    if (res.ok) {
      GLOSSARY = await res.json();
    } else {
      console.warn('glossary.json not found or failed to load');
    }
  } catch (e) {
    console.warn('Failed to load glossary.json', e);
  }

  function createConceptCard(item) {
    const card = el('button', {
      class: 'concept-card relative group text-left w-full h-full rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800/80 focus:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-sky-500/50 p-4 transition',
      attrs: { type: 'button', 'aria-haspopup': 'dialog' }
    });

    const layout = el('div', { class: 'flex items-start gap-3' });
    const icon = el('div', { class: 'text-2xl shrink-0', text: item.icon || '📘' });
    const textWrap = el('div', { class: 'min-w-0' });
    const title = el('div', { class: 'font-medium truncate', text: item.title });
    const short = el('div', { class: 'text-sm text-slate-300 line-clamp-2', text: item.short || '' });

    textWrap.appendChild(title);
    textWrap.appendChild(short);
    layout.appendChild(icon);
    layout.appendChild(textWrap);
    card.appendChild(layout);

    // Click to open modal (prefer glossary full definition when available)
    card.addEventListener('click', () => {
      const full = (item.key && GLOSSARY[item.key]) ? GLOSSARY[item.key] : (item.definition || '');
      modal.open({ ...item, definition: full });
    });

    return card;
  }

  function createTopicSection(topic) {
    const section = el('section', { class: 'rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6' });

    const header = el('div', { class: 'mb-4 flex items-center justify-between gap-2' });
    const title = el('h2', { class: 'text-lg font-semibold', text: topic.name });
    header.appendChild(title);

    const grid = el('div', { class: 'concept-grid grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' });
    (topic.items || []).forEach((item) => grid.appendChild(createConceptCard(item)));

    section.appendChild(header);
    section.appendChild(grid);
    return section;
  }

  // Render all topics after glossary is ready
  window.REFERENCE_TOPICS.forEach((t) => topicsRoot.appendChild(createTopicSection(t)));
})();
