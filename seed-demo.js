/* ── DADOS DE DEMONSTRAÇÃO ──
   Produtos de exemplo (com imagens embutidas) só para visualizar o layout.
   Quando o Supabase tiver produtos reais cadastrados, a vitrine usa o banco
   e ignora automaticamente estes exemplos. */
const _img = id => (window.DEMO_IMGS && window.DEMO_IMGS[id]) || '';
window.DEMO_PRODUTOS = [
  // ── PERFUMARIA ──
  { id:'d1', nome:'Eau de Parfum Âmbar Noir 100ml', categoria:'Perfumaria', preco:289.90, estoque:3, resumo:'100ml • Eau de Parfum', destaque:true,
    descricao:'Fragrância amadeirada e marcante. Fixação de até 12h.', imagem_url:_img('d1') },
  { id:'d2', nome:'Perfume Floral Blanc 75ml', categoria:'Perfumaria', preco:199.90, estoque:5, resumo:'75ml • Floral', destaque:false,
    descricao:'Notas florais suaves para o dia a dia.', imagem_url:_img('d2') },
  { id:'d3', nome:'Parfum Intense Gold Edition', categoria:'Perfumaria', preco:349.00, estoque:1, resumo:'100ml • Edição limitada', destaque:false,
    descricao:'Edição limitada. Frasco dourado com aroma oriental.', imagem_url:_img('d3') },

  // ── ELETRÔNICOS ──
  { id:'d4', nome:'Notebook Ultrafino 16GB / SSD 512GB', categoria:'Eletrônicos', preco:3299.00, estoque:2, resumo:'15.6" • 16GB RAM', destaque:true,
    descricao:'Tela 15.6", processador rápido, ideal para trabalho e estudo.', imagem_url:_img('d4') },
  { id:'d5', nome:'SSD NVMe 1TB Alta Velocidade', categoria:'Eletrônicos', preco:459.90, estoque:8, resumo:'1TB • NVMe', destaque:false,
    descricao:'Leitura até 3500MB/s. Acelere seu computador.', imagem_url:_img('d5') },
  { id:'d6', nome:'Memória RAM 16GB DDR4', categoria:'Eletrônicos', preco:219.90, estoque:6, resumo:'16GB • DDR4', destaque:false,
    descricao:'Mais desempenho para jogos e multitarefa.', imagem_url:_img('d6') },
  { id:'d7', nome:'Fone Bluetooth com Cancelamento de Ruído', categoria:'Eletrônicos', preco:389.00, estoque:0, resumo:'Bluetooth 5.0', destaque:false,
    descricao:'Som imersivo e bateria de longa duração.', imagem_url:_img('d7') },

  // ── DOMÉSTICOS ──
  { id:'d8', nome:'Cafeteira Elétrica Premium', categoria:'Domésticos', preco:279.90, estoque:4, resumo:'1.5L • 800W', destaque:true,
    descricao:'Café fresquinho com um toque. Design moderno.', imagem_url:_img('d8') },
  { id:'d9', nome:'Jogo de Panelas Antiaderente 5 peças', categoria:'Domésticos', preco:329.00, estoque:3, resumo:'5 peças', destaque:false,
    descricao:'Cozinha prática e sem grudar. Fácil de limpar.', imagem_url:_img('d9') },
  { id:'d10', nome:'Liquidificador 1200W', categoria:'Domésticos', preco:189.90, estoque:7, resumo:'1200W', destaque:false,
    descricao:'Potência para vitaminas, sopas e muito mais.', imagem_url:_img('d10') },

  // ── BELEZA & CUIDADOS ──
  { id:'d11', nome:'Kit Skincare Hidratação Facial', categoria:'Beleza & Cuidados', preco:159.90, estoque:5, resumo:'3 itens', destaque:false,
    descricao:'Rotina completa para pele radiante.', imagem_url:_img('d11') },
  { id:'d12', nome:'Batom Matte Longa Duração', categoria:'Beleza & Cuidados', preco:49.90, estoque:12, resumo:'Matte • 4g', destaque:false,
    descricao:'Cor intensa que dura o dia todo.', imagem_url:_img('d12') }
];
