/* ── Painel da lojista ── */
const { SUPABASE_URL, SUPABASE_ANON } = window.VITRINE_CONFIG;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
const $ = id => document.getElementById(id);
const fmtBRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const onlyNums = s => String(s||'').replace(/\D/g,'');

const st = { user:null, loja:null, produtos:[] };

/* ── AUTH GUARD ── */
async function boot(){
  const { data:{session} } = await sb.auth.getSession();
  if(!session){ location.replace('login.html'); return; }
  st.user = session.user;
  await Promise.all([carregarLoja(), carregarProdutos()]);
}
sb.auth.onAuthStateChange((e,s)=>{ if(!s) location.replace('login.html'); });

$('sair').onclick = async ()=>{ await sb.auth.signOut(); location.replace('login.html'); };

/* ── TABS ── */
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $('sec-prod').classList.toggle('show', t.dataset.tab==='prod');
    $('sec-loja').classList.toggle('show', t.dataset.tab==='loja');
  };
});

/* ── LOJA ── */
async function carregarLoja(){
  const { data } = await sb.from('loja').select('*').eq('owner_id', st.user.id).maybeSingle();
  st.loja = data || null;
  if(st.loja){
    $('hd-nome').textContent = st.loja.nome_loja;
    $('l-nome').value = st.loja.nome_loja || '';
    $('l-wpp').value  = st.loja.whatsapp || '';
    $('l-desc').value = st.loja.descricao || '';
    $('l-cor').value  = st.loja.cor_tema || '#b5651d';
  }
}

$('salvar-loja').onclick = async ()=>{
  const fb=(m,t='')=>{ $('fb-loja').textContent=m; $('fb-loja').className='fb '+t; };
  const payload = {
    owner_id: st.user.id,
    nome_loja: $('l-nome').value.trim() || 'Minha Loja',
    whatsapp: onlyNums($('l-wpp').value),
    descricao: $('l-desc').value.trim(),
    cor_tema: $('l-cor').value
  };
  if(payload.whatsapp.length < 12){ fb('WhatsApp inválido. Use DDI+DDD+número, só dígitos (ex.: 5562999999999).','error'); return; }
  $('salvar-loja').disabled=true; fb('Salvando…');
  let error;
  if(st.loja){ ({error} = await sb.from('loja').update(payload).eq('id', st.loja.id)); }
  else { ({error} = await sb.from('loja').insert(payload)); }
  $('salvar-loja').disabled=false;
  if(error){ fb('Erro: '+error.message,'error'); return; }
  fb('✓ Dados salvos!','success');
  await carregarLoja();
};

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
        <td><b>${esc(p.nome)}</b></td>
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

/* ── MODAL ── */
let arquivoFoto = null;
function abrirModal(id){
  arquivoFoto = null;
  $('fb-prod').textContent='';
  $('p-file').value='';
  $('p-prev').style.display='none';
  const p = id ? st.produtos.find(x=>x.id===id) : null;
  $('modal-titulo').textContent = p ? 'Editar produto' : 'Novo produto';
  $('p-id').value     = p?.id || '';
  $('p-nome').value   = p?.nome || '';
  $('p-preco').value  = p?.preco ?? '';
  $('p-estoque').value= p?.estoque ?? 1;
  $('p-cat').value    = p?.categoria || '';
  $('p-desc').value   = p?.descricao || '';
  $('p-ativo').checked    = p ? p.ativo : true;
  $('p-destaque').checked = p ? p.destaque : false;
  if(p?.imagem_url){ $('p-prev').src=p.imagem_url; $('p-prev').style.display='block'; }
  $('ov').classList.add('show');
}
function fecharModal(){ $('ov').classList.remove('show'); }
$('novo').onclick = ()=>abrirModal(null);
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

  // upload da foto, se houver nova
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
    categoria: $('p-cat').value.trim() || 'Geral',
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

const esc = s => String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

boot();
