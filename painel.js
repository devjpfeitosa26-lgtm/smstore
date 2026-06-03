/* ── Painel da lojista ── */
const { SUPABASE_URL, SUPABASE_ANON } = window.VITRINE_CONFIG;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
const $ = id => document.getElementById(id);
const fmtBRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const onlyNums = s => String(s||'').replace(/\D/g,'');
const esc = s => String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const st = { user:null, loja:null, produtos:[], categorias:[] };

/* ── AUTH GUARD ── */
async function boot(){
  const { data:{session} } = await sb.auth.getSession();
  if(!session){ location.replace('login.html'); return; }
  st.user = session.user;
  await Promise.all([carregarLoja(), carregarCategorias(), carregarProdutos()]);
}
sb.auth.onAuthStateChange((e,s)=>{ if(!s) location.replace('login.html'); });
$('sair').onclick = async ()=>{ await sb.auth.signOut(); location.replace('login.html'); };

/* ── TABS ── */
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $('sec-prod').classList.toggle('show', t.dataset.tab==='prod');
    $('sec-cats').classList.toggle('show', t.dataset.tab==='cats');
    $('sec-loja').classList.toggle('show', t.dataset.tab==='loja');
  };
});

/* ── LOJA ── */
async function carregarLoja(){
  const { data } = await sb.from('loja').select('*').eq('owner_id', st.user.id).maybeSingle();
  st.loja = data || null;
  if(st.loja){
    $('hd-nome').textContent = st.loja.nome_loja;
    if(st.loja.logo_url){
      const d=$('hd-dot');
      if(d){ d.style.background='#fff'; d.style.backgroundImage=`url("${st.loja.logo_url}")`; d.style.backgroundSize='cover'; d.style.backgroundPosition='center'; }
    }
    $('l-nome').value = st.loja.nome_loja || '';
    $('l-wpp').value  = st.loja.whatsapp || '';
    $('l-desc').value = st.loja.descricao || '';
    $('l-cor').value  = st.loja.cor_tema || '#b5651d';
    if(st.loja.logo_url){ $('l-logo-prev').src=st.loja.logo_url; $('l-logo-prev').style.display='block'; $('l-logo-vazio').style.display='none'; }
  }
}

let arquivoLogo = null;
$('l-logo-file').onchange = e=>{
  arquivoLogo = e.target.files[0] || null;
  if(arquivoLogo){ $('l-logo-prev').src=URL.createObjectURL(arquivoLogo); $('l-logo-prev').style.display='block'; $('l-logo-vazio').style.display='none'; }
};

$('salvar-loja').onclick = async ()=>{
  const fb=(m,t='')=>{ $('fb-loja').textContent=m; $('fb-loja').className='fb '+t; };
  if(onlyNums($('l-wpp').value).length < 12){ fb('WhatsApp inválido. Use DDI+DDD+número, só dígitos (ex.: 5562999999999).','error'); return; }
  $('salvar-loja').disabled=true; fb('Salvando…');

  let logo_url = st.loja?.logo_url || '';
  if(arquivoLogo){
    fb('Enviando logo…');
    const ext = (arquivoLogo.name.split('.').pop()||'png').toLowerCase();
    const path = `${st.user.id}/logo-${Date.now()}.${ext}`;
    const { error:upErr } = await sb.storage.from('logos').upload(path, arquivoLogo, { upsert:true });
    if(upErr){ fb('Erro ao enviar logo: '+upErr.message,'error'); $('salvar-loja').disabled=false; return; }
    logo_url = sb.storage.from('logos').getPublicUrl(path).data.publicUrl;
  }

  const payload = {
    owner_id: st.user.id,
    nome_loja: $('l-nome').value.trim() || 'Minha Loja',
    whatsapp: onlyNums($('l-wpp').value),
    descricao: $('l-desc').value.trim(),
    cor_tema: $('l-cor').value,
    logo_url
  };
  let error;
  if(st.loja){ ({error} = await sb.from('loja').update(payload).eq('id', st.loja.id)); }
  else { ({error} = await sb.from('loja').insert(payload)); }
  $('salvar-loja').disabled=false;
  if(error){ fb('Erro: '+error.message,'error'); return; }
  arquivoLogo=null;
  fb('✓ Dados salvos!','success');
  await carregarLoja();
};

/* ── CATEGORIAS ── */
async function carregarCategorias(){
  const { data } = await sb.from('categorias').select('*').eq('owner_id', st.user.id).order('nome');
  st.categorias = data || [];
  renderCategorias();
  preencherSelectCategorias();
}

function renderCategorias(){
  if(!st.categorias.length){
    $('lista-cats').innerHTML = `<p style="color:var(--muted);font-size:.88rem">Nenhuma categoria ainda. Adicione a primeira acima.</p>`;
    return;
  }
  $('lista-cats').innerHTML = st.categorias.map(c=>`
    <div style="display:flex;align-items:center;gap:11px;padding:11px 14px;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;background:#fff">
      <span style="font-size:1.2rem">${esc(c.emoji||'🛍️')}</span>
      <b style="flex:1">${esc(c.nome)}</b>
      <button class="ic" data-delcat="${c.id}">🗑️</button>
    </div>`).join('');
  $('lista-cats').querySelectorAll('[data-delcat]').forEach(b=>b.onclick=()=>apagarCategoria(b.dataset.delcat));
}

function preencherSelectCategorias(){
  const sel = $('p-cat');
  const nomes = st.categorias.map(c=>c.nome);
  if(!nomes.length){ sel.innerHTML = `<option value="Geral">Geral</option>`; return; }
  sel.innerHTML = nomes.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
}

$('add-cat').onclick = async ()=>{
  const fb=(m,t='')=>{ $('fb-cat').textContent=m; $('fb-cat').className='fb '+t; };
  const nome = $('c-nome').value.trim();
  const emoji = $('c-emoji').value.trim() || '🛍️';
  if(!nome){ fb('Digite o nome da categoria.','error'); return; }
  $('add-cat').disabled=true; fb('Adicionando…');
  const { error } = await sb.from('categorias').insert({ owner_id:st.user.id, nome, emoji });
  $('add-cat').disabled=false;
  if(error){ fb(error.message.includes('duplicate')?'Já existe uma categoria com esse nome.':'Erro: '+error.message,'error'); return; }
  $('c-nome').value=''; $('c-emoji').value='';
  fb('✓ Categoria criada!','success');
  await carregarCategorias();
};

async function apagarCategoria(id){
  const c = st.categorias.find(x=>x.id===id);
  const emUso = st.produtos.filter(p=>p.categoria===c.nome).length;
  let msg = `Apagar a categoria "${c?.nome}"?`;
  if(emUso) msg += `\n\nAtenção: ${emUso} produto(s) usam esta categoria. Eles continuarão existindo, mas sem categoria.`;
  if(!confirm(msg)) return;
  const { error } = await sb.from('categorias').delete().eq('id', id);
  if(error){ alert('Erro ao apagar: '+error.message); return; }
  await carregarCategorias();
}

/* ── PRODUTOS ── */
async function carregarProdutos(){
  const { data } = await sb.from('produtos').select('*')
    .eq('owner_id', st.user.id).order('criado_em',{ascending:false});
  st.produtos = data || [];
  renderStats(); renderTabela();
}

function renderStats(){
  const total = st.produtos.length;
  const ativos = st.produtos.filter(p=>p.ativo).length;
  const esgotados = st.produtos.filter(p=>p.estoque<=0).length;
  const valor = st.produtos.reduce((s,p)=>s+Number(p.preco||0),0);
  $('stats').innerHTML = `
    <div class="stat"><div class="n">${total}</div><div class="t">Produtos</div></div>
    <div class="stat"><div class="n">${ativos}</div><div class="t">Visíveis</div></div>
    <div class="stat"><div class="n">${esgotados}</div><div class="t">Esgotados</div></div>
    <div class="stat"><div class="n">${fmtBRL(valor)}</div><div class="t">Valor do catálogo</div></div>`;
}

function renderTabela(){
  if(!st.produtos.length){
    $('lista').innerHTML = `<div class="empty">Nenhum produto ainda. Clique em <b>+ Novo produto</b> para começar.</div>`;
    return;
  }
  $('lista').innerHTML = `<table><thead><tr>
      <th></th><th>Produto</th><th class="col-hide">Categoria</th><th>Preço</th>
      <th class="col-hide">Estoque</th><th>Status</th><th></th>
    </tr></thead><tbody>${
      st.produtos.map(p=>`<tr>
        <td>${p.imagem_url?`<img class="pthumb" src="${p.imagem_url}">`:`<div class="pthumb"></div>`}</td>
        <td><b>${esc(p.nome)}</b>${p.resumo?`<br><span style="color:var(--muted);font-size:.78rem">${esc(p.resumo)}</span>`:''}</td>
        <td class="col-hide">${esc(p.categoria||'-')}</td>
        <td>${fmtBRL(p.preco)}</td>
        <td class="col-hide">${p.estoque}</td>
        <td><span class="pill ${p.ativo?'on':'off'}">${p.ativo?'Visível':'Oculto'}</span></td>
        <td><div class="rowbtns">
          <button class="ic" data-edit="${p.id}">✏️</button>
          <button class="ic" data-del="${p.id}">🗑️</button>
        </div></td>
      </tr>`).join('')
    }</tbody></table>`;
  $('lista').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>abrirModal(b.dataset.edit));
  $('lista').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>apagar(b.dataset.del));
}

/* ── MODAL PRODUTO ── */
let arquivoFoto = null;
function abrirModal(id){
  arquivoFoto = null;
  $('fb-prod').textContent='';
  $('p-file').value='';
  $('p-prev').style.display='none';
  preencherSelectCategorias();
  const p = id ? st.produtos.find(x=>x.id===id) : null;
  $('modal-titulo').textContent = p ? 'Editar produto' : 'Novo produto';
  $('p-id').value     = p?.id || '';
  $('p-nome').value   = p?.nome || '';
  $('p-preco').value  = p?.preco ?? '';
  $('p-estoque').value= p?.estoque ?? 1;
  $('p-resumo').value = p?.resumo || '';
  if(p?.categoria){
    // garante que a categoria do produto exista no select mesmo se foi removida
    if(!st.categorias.some(c=>c.nome===p.categoria)){
      const opt=document.createElement('option'); opt.value=p.categoria; opt.textContent=p.categoria+' (removida)'; $('p-cat').appendChild(opt);
    }
    $('p-cat').value = p.categoria;
  }
  $('p-desc').value   = p?.descricao || '';
  $('p-ativo').checked    = p ? p.ativo : true;
  $('p-destaque').checked = p ? p.destaque : false;
  if(p?.imagem_url){ $('p-prev').src=p.imagem_url; $('p-prev').style.display='block'; }
  $('ov').classList.add('show');
}
function fecharModal(){ $('ov').classList.remove('show'); }
$('novo').onclick = ()=>{
  if(!st.categorias.length){ alert('Crie pelo menos uma categoria antes (aba Categorias).'); return; }
  abrirModal(null);
};
$('cancelar').onclick = fecharModal;
$('ov').onclick = e=>{ if(e.target===$('ov')) fecharModal(); };

$('p-file').onchange = e=>{
  arquivoFoto = e.target.files[0] || null;
  if(arquivoFoto){ $('p-prev').src = URL.createObjectURL(arquivoFoto); $('p-prev').style.display='block'; }
};

$('salvar').onclick = async ()=>{
  const fb=(m,t='')=>{ $('fb-prod').textContent=m; $('fb-prod').className='fb '+t; };
  const nome=$('p-nome').value.trim(), preco=parseFloat($('p-preco').value);
  if(!nome){ fb('Informe o nome do produto.','error'); return; }
  if(isNaN(preco)||preco<0){ fb('Informe um preço válido.','error'); return; }

  $('salvar').disabled=true; fb('Salvando…');
  const id = $('p-id').value;
  let imagem_url = id ? (st.produtos.find(x=>x.id===id)?.imagem_url || '') : '';

  if(arquivoFoto){
    fb('Enviando foto…');
    const ext = (arquivoFoto.name.split('.').pop()||'jpg').toLowerCase();
    const path = `${st.user.id}/${Date.now()}.${ext}`;
    const { error:upErr } = await sb.storage.from('produtos').upload(path, arquivoFoto, { upsert:true });
    if(upErr){ fb('Erro ao enviar foto: '+upErr.message,'error'); $('salvar').disabled=false; return; }
    imagem_url = sb.storage.from('produtos').getPublicUrl(path).data.publicUrl;
  }

  const payload = {
    owner_id: st.user.id, nome, preco,
    estoque: parseInt($('p-estoque').value||'0',10),
    resumo: $('p-resumo').value.trim(),
    categoria: $('p-cat').value || 'Geral',
    descricao: $('p-desc').value.trim(),
    ativo: $('p-ativo').checked, destaque: $('p-destaque').checked,
    imagem_url
  };

  let error;
  if(id){ ({error} = await sb.from('produtos').update(payload).eq('id', id)); }
  else  { ({error} = await sb.from('produtos').insert(payload)); }
  $('salvar').disabled=false;
  if(error){ fb('Erro: '+error.message,'error'); return; }
  fecharModal();
  await carregarProdutos();
};

async function apagar(id){
  const p = st.produtos.find(x=>x.id===id);
  if(!confirm(`Apagar "${p?.nome}"? Esta ação não pode ser desfeita.`)) return;
  const { error } = await sb.from('produtos').delete().eq('id', id);
  if(error){ alert('Erro ao apagar: '+error.message); return; }
  await carregarProdutos();
}

boot();
