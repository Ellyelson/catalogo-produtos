const KEY = "catalogo_produtos_v1";

let produtos = JSON.parse(localStorage.getItem(KEY) || "[]");
let filtro = "Todos";
let modoFavoritos = false;
let imagemAtual = "";
let produtoParaExcluir = null;
let backupPendente = null;

const $ = id => document.getElementById(id);

const salvarLocal = () => {
  localStorage.setItem(KEY, JSON.stringify(produtos));
};

const moeda = valor =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor) || 0);

const esc = (texto = "") =>
  String(texto).replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));

function toast(texto){
  $("toast").textContent = texto;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 1800);
}

function normalizarProdutos(){
  const agora = Date.now();

  produtos = produtos.map((p, i) => ({
    ...p,
    favorito: Boolean(p.favorito),
    dataCadastro: p.dataCadastro || new Date(agora - i * 1000).toISOString()
  }));

  salvarLocal();
}

function render(){
  let lista = produtos.filter(p => {
    const categoriaOk = filtro === "Todos" || p.categoria === filtro;
    const favoritoOk = !modoFavoritos || p.favorito;
    return categoriaOk && favoritoOk;
  });

  const ordenacao = $("ordenacao").value;

  if(ordenacao === "menor"){
    lista = [...lista].sort((a, b) => Number(a.valor) - Number(b.valor));
  }else if(ordenacao === "maior"){
    lista = [...lista].sort((a, b) => Number(b.valor) - Number(a.valor));
  }else if(ordenacao === "recentes"){
    lista = [...lista].sort(
      (a, b) => new Date(b.dataCadastro || 0) - new Date(a.dataCadastro || 0)
    );
  }

  $("produtos").innerHTML = lista.map(p => `
    <article class="card">
      <div class="image-box">
        ${p.imagem
          ? `<img src="${p.imagem}" alt="${esc(p.nome)}">`
          : `<div class="placeholder"></div>`}

        <button
          class="fav ${p.favorito ? "on" : ""}"
          onclick="toggleFav('${p.id}')"
          title="Favoritar"
          aria-label="Favoritar produto">
          ${p.favorito ? "♥" : "♡"}
        </button>
      </div>

      <div class="card-info">
        <div class="card-title-line">
          <h3>${esc(p.nome)}</h3>
          <span class="price">${moeda(p.valor)}</span>
        </div>

        <div class="meta">${esc(p.categoria)}</div>
        <p class="desc">${esc(p.descricao)}</p>

        <div class="card-actions">
          <a href="${esc(p.link)}" target="_blank" rel="noopener">Abrir produto</a>
          <button type="button" onclick="editarProduto('${p.id}')">Editar</button>
          <button type="button" onclick="pedirExclusao('${p.id}')">Excluir</button>
        </div>
      </div>
    </article>
  `).join("");

  $("contador").textContent =
    `${lista.length} ${lista.length === 1 ? "produto" : "produtos"}`;

  $("tituloLista").textContent =
    modoFavoritos
      ? "Favoritos"
      : filtro === "Todos"
        ? "Todos os produtos"
        : filtro;

  $("vazio").classList.toggle("hidden", lista.length > 0);
  $("favoritosBtn").classList.toggle("active", modoFavoritos);
}

function atualizarContadorDescricao(){
  $("contadorDescricao").textContent = `${$("descricao").value.length} / 1000`;
}

function abrirModal(limpar = true){
  if(limpar){
    $("produtoForm").reset();
    $("editId").value = "";
    imagemAtual = "";
    $("previewWrap").classList.add("hidden");
    $("formTitle").textContent = "Cadastrar produto";
    $("salvar").textContent = "Cadastrar";
    $("link").value = "https://www.";
    $("link").classList.remove("link-error");
    atualizarContadorDescricao();
  }

  $("modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function fecharModal(){
  $("modal").classList.add("hidden");
  document.body.style.overflow = "";
}

function linkValido(valor){
  try{
    const url = new URL(valor);
    const host = url.hostname;

    return (
      url.protocol === "https:" &&
      host &&
      host.includes(".") &&
      host !== "www."
    );
  }catch{
    return false;
  }
}

window.toggleFav = function(id){
  const produto = produtos.find(p => p.id === id);
  if(!produto) return;

  produto.favorito = !produto.favorito;
  salvarLocal();
  render();
};

window.pedirExclusao = function(id){
  produtoParaExcluir = id;
  $("deleteModal").classList.remove("hidden");
};

function fecharDeleteModal(){
  produtoParaExcluir = null;
  $("deleteModal").classList.add("hidden");
}

window.editarProduto = function(id){
  const p = produtos.find(item => item.id === id);
  if(!p) return;

  abrirModal(false);

  $("editId").value = p.id;
  $("nome").value = p.nome;
  $("valor").value = String(p.valor).replace(".", ",");
  $("categoria").value = p.categoria;
  $("descricao").value = p.descricao;
  $("link").value = p.link || "https://www.";
  $("link").classList.remove("link-error");

  imagemAtual = p.imagem || "";

  if(imagemAtual){
    $("preview").src = imagemAtual;
    $("previewWrap").classList.remove("hidden");
  }else{
    $("previewWrap").classList.add("hidden");
  }

  $("formTitle").textContent = "Editar produto";
  $("salvar").textContent = "Salvar alterações";
  atualizarContadorDescricao();
};

$("imagem").addEventListener("change", e => {
  const arquivo = e.target.files[0];
  if(!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = () => {
    imagemAtual = leitor.result;
    $("preview").src = imagemAtual;
    $("previewWrap").classList.remove("hidden");
  };

  leitor.readAsDataURL(arquivo);
});

$("descricao").addEventListener("input", atualizarContadorDescricao);

$("link").addEventListener("input", () => {
  $("link").classList.remove("link-error");
});

$("produtoForm").addEventListener("submit", e => {
  e.preventDefault();

  let valorTexto = $("valor").value.trim();

  if(valorTexto.includes(",")){
    valorTexto = valorTexto.replace(/\./g, "").replace(",", ".");
  }

  const valor = Number(valorTexto);
  const link = $("link").value.trim();

  if(!Number.isFinite(valor) || valor < 0){
    toast("Informe um preço válido");
    return;
  }

  if(!linkValido(link)){
    $("link").classList.add("link-error");
    toast("Complete o link do produto");
    $("link").focus();
    return;
  }

  const id = $("editId").value;
  const antigo = produtos.find(p => p.id === id);

  const produto = {
    id: id || crypto.randomUUID(),
    nome: $("nome").value.trim(),
    valor,
    categoria: $("categoria").value,
    descricao: $("descricao").value.trim(),
    link,
    imagem: imagemAtual,
    favorito: antigo?.favorito || false,
    dataCadastro: antigo?.dataCadastro || new Date().toISOString()
  };

  if(id){
    produtos = produtos.map(p => p.id === id ? produto : p);
  }else{
    produtos.unshift(produto);
  }

  salvarLocal();
  fecharModal();
  render();
  toast(id ? "Produto atualizado" : "Produto cadastrado");
});

document.querySelectorAll("#categorias button").forEach(btn => {
  btn.addEventListener("click", () => {
    filtro = btn.dataset.cat;
    modoFavoritos = false;

    document.querySelectorAll("#categorias button").forEach(item =>
      item.classList.toggle("active", item === btn)
    );

    render();
  });
});

$("ordenacao").addEventListener("change", render);

$("favoritosBtn").addEventListener("click", () => {
  modoFavoritos = !modoFavoritos;
  render();
});

$("cadastroBtn").addEventListener("click", () => abrirModal(true));
$("fecharModal").addEventListener("click", fecharModal);
$("modalBackdrop").addEventListener("click", fecharModal);
$("cancelar").addEventListener("click", fecharModal);

/* EXCLUSÃO */
$("cancelDelete").addEventListener("click", fecharDeleteModal);
$("deleteBackdrop").addEventListener("click", fecharDeleteModal);

$("confirmDelete").addEventListener("click", () => {
  if(!produtoParaExcluir) return;

  produtos = produtos.filter(p => p.id !== produtoParaExcluir);
  salvarLocal();
  fecharDeleteModal();
  render();
  toast("Produto excluído");
});

/* BACKUP */
const backupBtn = $("backupBtn");
const backupDropdown = $("backupDropdown");

function fecharMenuBackup(){
  backupDropdown.classList.add("hidden");
  backupBtn.setAttribute("aria-expanded", "false");
}

backupBtn.addEventListener("click", e => {
  e.stopPropagation();

  const vaiAbrir = backupDropdown.classList.contains("hidden");
  backupDropdown.classList.toggle("hidden");
  backupBtn.setAttribute("aria-expanded", String(vaiAbrir));
});

backupDropdown.addEventListener("click", e => {
  e.stopPropagation();
});

document.addEventListener("click", fecharMenuBackup);

$("exportarTopo").addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify(produtos, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `backup-catalogo-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 500);
  fecharMenuBackup();
  toast("Backup exportado");
});

function fecharImportModal(){
  backupPendente = null;
  $("importModal").classList.add("hidden");
}

$("importarTopo").addEventListener("change", e => {
  const arquivo = e.target.files[0];
  if(!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = () => {
    try{
      const dados = JSON.parse(leitor.result);

      if(!Array.isArray(dados)){
        throw new Error("Formato inválido");
      }

      const validos = dados.every(item =>
        item &&
        typeof item === "object" &&
        typeof item.nome === "string" &&
        "valor" in item &&
        typeof item.categoria === "string"
      );

      if(!validos){
        throw new Error("Dados inválidos");
      }

      backupPendente = dados.map((p, i) => ({
        ...p,
        favorito: Boolean(p.favorito),
        dataCadastro: p.dataCadastro || new Date(Date.now() - i * 1000).toISOString()
      }));

      $("importResumo").textContent =
        `O arquivo contém ${backupPendente.length} ${backupPendente.length === 1 ? "produto" : "produtos"}.`;

      $("importModal").classList.remove("hidden");
      fecharMenuBackup();
    }catch{
      toast("Arquivo de backup inválido");
    }

    e.target.value = "";
  };

  leitor.readAsText(arquivo);
});

$("cancelImport").addEventListener("click", fecharImportModal);
$("importBackdrop").addEventListener("click", fecharImportModal);

$("confirmImport").addEventListener("click", () => {
  if(!backupPendente) return;

  produtos = backupPendente;
  salvarLocal();
  fecharImportModal();
  render();
  toast("Backup importado");
});

document.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    fecharMenuBackup();

    if(!$("modal").classList.contains("hidden")){
      fecharModal();
    }

    if(!$("deleteModal").classList.contains("hidden")){
      fecharDeleteModal();
    }

    if(!$("importModal").classList.contains("hidden")){
      fecharImportModal();
    }
  }
});

normalizarProdutos();
atualizarContadorDescricao();
render();
