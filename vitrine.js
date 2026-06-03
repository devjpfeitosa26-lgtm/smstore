/* ── Vitrine pública (com sidebar de categorias) ── */
const CFG = window.VITRINE_CONFIG || {};
const usandoSupabase = CFG.SUPABASE_URL && !CFG.SUPABASE_URL.includes('SEU-PROJETO');
const sb = usandoSupabase ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON) : null;

const fmtBRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const $ = id => document.getElementById(id);

/* ícone por categoria (combina com nomes comuns; cai no 🛍️ se não achar) */
const ICONES = {
  'domésticos':'🏠','domesticos':'🏠','casa':'🏠','eletrodomésticos':'🏠',
  'eletrônicos':'💻','eletronicos':'💻','informática':'💻',
  'perfumaria':'🌸','perfumes':'🌸',
  'beleza & cuidados':'💄','beleza':'💄','cosméticos':'💄',
  'geral':'🛍️'
};
const iconeDe = c => ICONES[(c||'').toLowerCase()] || '🛍️';

const state = { loja:null, produtos:[], filtro:'Todos', busca:'' };

async function init(){
  if (usandoSupabase){
    const { data: lojas } = await sb.from('loja').select('*').limit(1);
    state.loja = (lojas && lojas[0]) || null;
    const { data: prods } = await sb.from('produtos').select('*').eq('ativo',true)
      .order('destaque',{ascending:false}).order('criado_em',{ascending:false});
    state.produtos = prods || [];
  }
  // Fallback de demonstração: sem Supabase OU sem produtos cadastrados ainda
  if (!state.produtos.length && window.DEMO_PRODUTOS){
    state.produtos = window.DEMO_PRODUTOS;
    if (!state.loja) state.loja = { nome_loja:'Vitrine (demo)', whatsapp:'5562999999999',
      descricao:'Exemplo de catálogo — troque pelos produtos reais no painel.' };
  }
  if (!state.loja) state.loja = { nome_loja:'Vitrine', whatsapp:'5562999999999', descricao:'' };

  aplicarLoja();
  montarCategorias();
  render();
}

function aplicarLoja(){
  const l = state.loja;
  document.title = l.nome_loja;
  $('loja-nome').textContent = l.nome_loja;
  $('loja-tag').textContent = 'catálogo online';
  if (l.descricao) $('hero-sub').textContent = l.descricao;
  if (l.cor_tema) document.documentElement.style.setProperty('--terra', l.cor_tema);
  const link = `https://wa.me/${onlyNums(l.whatsapp)}?text=${encodeURIComponent(`Olá! Vi a vitrine *${l.nome_loja}* e gostaria de mais informações.`)}`;
  $('wpp-geral').href = link;
}

function montarCategorias(){
  const mapa = {};
  state.produtos.forEach(p => { const c = p.categoria||'Geral'; mapa[c]=(mapa[c]||0)+1; });
  const cats = Object.keys(mapa).sort();
  const total = state.produtos.length;

  const itens = [{nome:'Todos', n:total, emoji:'✨'}]
    .concat(cats.map(c => ({nome:c, n:mapa[c], emoji:iconeDe(c)})));

  $('cats').innerHTML = itens.map(it => `
    <button class="cat ${it.nome===state.filtro?'active':''}" data-cat="${escAttr(it.nome)}">
      <span class="emoji">${it.emoji}</span><span>${escHtml(it.nome)}</span>
      <span class="count">${it.n}</span>
    </button>`).join('');

  $('cats').querySelectorAll('.cat').forEach(b => {
    b.onclick = () => {
      state.filtro = b.dataset.cat;
      montarCategorias(); render(); fecharSidebar();
    };
  });
}

function render(){
  let lista = state.produtos;
  if (state.filtro !== 'Todos') lista = lista.filter(p => (p.categoria||'Geral') === state.filtro);
  if (state.busca){
    const q = state.busca.toLowerCase();
    lista = lista.filter(p => (p.nome+' '+(p.descricao||'')).toLowerCase().includes(q));
  }

  $('sec-titulo').textContent = state.filtro === 'Todos' ? 'Todos os produtos' : state.filtro;
  $('sec-qtd').textContent = lista.length ? `${lista.length} ${lista.length===1?'item':'itens'}` : '';

  if (!lista.length){
    $('grid').innerHTML = `<div class="empty"><div class="big">Nada por aqui ainda</div><p>Em breve novos produtos nesta categoria.</p></div>`;
    return;
  }

  $('grid').innerHTML = lista.map((p,i)=>{
    const esgotado = p.estoque <= 0;
    const escasso = !esgotado && p.estoque > 0 && p.estoque <= 3; // gatilho de escassez
    const img = p.imagem_url
      ? `<img src="${p.imagem_url}" alt="${escAttr(p.nome)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="noimg" style="display:none">sem imagem</div>`
      : `<div class="noimg">sem imagem</div>`;
    let badges = '';
    if (esgotado) badges += `<span class="badge out">Esgotado</span>`;
    else {
      if (p.destaque) badges += `<span class="badge dest">⭐ Destaque</span>`;
      if (escasso)    badges += `<span class="badge urge">🔥 ${p.estoque===1?'Última unidade':'Só '+p.estoque+' restantes'}</span>`;
    }
    return `
      <article class="card" style="animation-delay:${i*35}ms">
        <div class="thumb">${img}<div class="badges">${badges}</div></div>
        <div class="body">
          <span class="cat-tag">${escHtml(p.categoria||'Geral')}</span>
          <h4>${escHtml(p.nome)}</h4>
          <p class="desc">${escHtml(p.descricao||'')}</p>
          <div class="preco">${fmtBRL(p.preco)} ${escasso?'<small>• poucas unidades</small>':''}</div>
          <button class="buy" data-id="${p.id}" ${esgotado?'disabled':''}>
            ${esgotado ? 'Avise-me quando voltar' : '🛒 Comprar pelo WhatsApp'}
          </button>
        </div>
      </article>`;
  }).join('');

  $('grid').querySelectorAll('.buy:not(:disabled)').forEach(btn => btn.onclick = () => comprar(btn.dataset.id));
}

function comprar(id){
  const p = state.produtos.find(x => String(x.id) === String(id));
  if (!p) return;
  const l = state.loja;
  const msg =
`Olá! Tenho interesse neste produto da *${l.nome_loja}*:

🛍️ *${p.nome}*
💰 ${fmtBRL(p.preco)}
${p.categoria ? '🏷️ '+p.categoria+'\n' : ''}
Ainda está disponível?`;
  window.open(`https://wa.me/${onlyNums(l.whatsapp)}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* sidebar mobile */
const fecharSidebar = () => { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); };
$('menu-btn').onclick = () => { $('sidebar').classList.add('open'); $('scrim').classList.add('show'); };
$('scrim').onclick = fecharSidebar;

/* busca */
$('busca').addEventListener('input', e => { state.busca = e.target.value; render(); });

/* helpers */
const onlyNums = s => String(s||'').replace(/\D/g,'');
const escHtml = s => String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const escAttr = s => String(s||'').replace(/"/g,'&quot;');

init();
