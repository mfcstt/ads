"""
Scraper - Lar Plásticos (larplasticos.com.br/produtos/)
Extrai todos os links de produtos e imagens.

Dependências:
    pip install requests beautifulsoup4 lxml

Uso:
    python scraper_larplasticos.py

Saída:
    - produtos.csv   → lista de produtos com URL e imagem
    - imagens/       → pasta com todas as imagens baixadas
"""

import csv
import os
import time
import re
import urllib.request
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Instale as dependências: pip install requests beautifulsoup4 lxml")
    exit(1)

BASE_URL = "https://www.larplasticos.com.br"
PRODUTOS_URL = "https://www.larplasticos.com.br/produtos/"
OUTPUT_CSV = "produtos.csv"
OUTPUT_DIR = "imagens"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9",
}

# Categorias conhecidas (do menu do site)
CATEGORIAS = [
    "/produtos/bituqueira/",
    "/produtos/caixas-plasticas/",
    "/produtos/carrinhos-coletores-de-lixo/",
    "/produtos/carros-cuba/",
    "/produtos/cestos-de-lixo/",
    "/produtos/containers-de-lixo/",
    "/produtos/estrados-de-plastico/",
    "/produtos/lixeira-papeleira-50l/",
    "/produtos/lixeiras-basculantes/",
    "/produtos/lixeiras-com-pedal/",
    "/produtos/lixeiras-para-coleta-seletiva-50l/",
    "/produtos/lixeiras-para-coleta-seletiva-60l/",
    "/produtos/moveis-plasticos/",
    "/produtos/pallet-plastico/",
    "/produtos/pallets-de-contencao/",
    "/produtos/pisos-de-plastico/",
    "/produtos/vasos-de-polietileno/",
]


def get_soup(url, session, retries=3):
    for i in range(retries):
        try:
            resp = session.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "lxml")
        except Exception as e:
            print(f"  ⚠ Tentativa {i+1} falhou para {url}: {e}")
            time.sleep(2)
    return None


def extrair_links_categoria(soup, url_categoria):
    """Extrai todos os links de produto de uma página de categoria."""
    links = set()
    if not soup:
        return links

    # Links com padrão /produtos/CATEGORIA/PRODUTO/
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full = urljoin(BASE_URL, href)
        # Filtra links que parecem ser de produto (mais de 2 segmentos após /produtos/)
        path = urlparse(full).path
        partes = [p for p in path.split("/") if p]
        if (
            "produtos" in partes
            and len(partes) >= 3
            and full.startswith(BASE_URL)
            and not full.endswith("/produtos/")
        ):
            links.add(full)

    return links


def extrair_imagem_produto(soup, url_produto):
    """Extrai a URL da imagem principal de uma página de produto."""
    if not soup:
        return ""

    # Tenta og:image primeiro
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"]

    # Tenta imagem no conteúdo principal
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if src and (
            "produto" in src.lower()
            or "uploads" in src.lower()
            or "wp-content" in src.lower()
        ):
            return urljoin(url_produto, src)

    # Fallback: primeira imagem com tamanho razoável
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        if src and not src.endswith((".gif", ".svg")) and "logo" not in src.lower():
            return urljoin(url_produto, src)

    return ""


def nome_arquivo_imagem(url_img, indice):
    """Gera um nome de arquivo seguro para a imagem."""
    path = urlparse(url_img).path
    nome = os.path.basename(path)
    # Remove query strings e caracteres inválidos
    nome = re.sub(r"[^\w.\-]", "_", nome)
    if not nome or nome == "_":
        nome = f"produto_{indice}.jpg"
    return nome


def baixar_imagem(url_img, pasta, nome_arquivo, session):
    """Baixa a imagem e salva na pasta."""
    destino = os.path.join(pasta, nome_arquivo)
    if os.path.exists(destino):
        return destino
    try:
        resp = session.get(url_img, headers=HEADERS, timeout=15, stream=True)
        resp.raise_for_status()
        with open(destino, "wb") as f:
            for chunk in resp.iter_content(1024):
                f.write(chunk)
        return destino
    except Exception as e:
        print(f"    ✗ Erro ao baixar imagem {url_img}: {e}")
        return ""


def nome_produto(soup):
    """Extrai o nome do produto da página."""
    # Tenta h1
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(strip=True)
    # Tenta og:title
    og = soup.find("meta", property="og:title")
    if og:
        return og.get("content", "").strip()
    # Tenta title
    title = soup.find("title")
    if title:
        return title.get_text(strip=True).split("|")[0].strip()
    return ""


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    session = requests.Session()

    todos_produtos = {}  # url → dados

    print("=" * 60)
    print("🔍 Scraper Lar Plásticos")
    print("=" * 60)

    # 1. Página principal de produtos — pode listar categorias adicionais
    print(f"\n📄 Acessando página principal: {PRODUTOS_URL}")
    soup_principal = get_soup(PRODUTOS_URL, session)

    # Coleta URLs de categoria da página principal
    urls_categoria = set(BASE_URL + c for c in CATEGORIAS)
    if soup_principal:
        for a in soup_principal.find_all("a", href=True):
            href = a["href"]
            full = urljoin(BASE_URL, href)
            if "/produtos/" in full and full.startswith(BASE_URL):
                path_parts = [p for p in urlparse(full).path.split("/") if p]
                if len(path_parts) == 2 and path_parts[0] == "produtos":
                    urls_categoria.add(full.rstrip("/") + "/")

    print(f"   {len(urls_categoria)} categorias encontradas")

    # 2. Percorre cada categoria e coleta links de produto
    todos_links = set()
    for url_cat in sorted(urls_categoria):
        print(f"\n📂 Categoria: {url_cat}")
        soup_cat = get_soup(url_cat, session)
        links = extrair_links_categoria(soup_cat, url_cat)
        print(f"   {len(links)} produto(s) encontrado(s)")
        todos_links.update(links)
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"✅ Total de links únicos: {len(todos_links)}")
    print(f"{'='*60}")

    # 3. Acessa cada produto e extrai nome e imagem
    produtos = []
    for i, url_prod in enumerate(sorted(todos_links), start=1):
        print(f"[{i:03d}/{len(todos_links):03d}] {url_prod}")
        soup_prod = get_soup(url_prod, session)
        nome = nome_produto(soup_prod) if soup_prod else ""
        url_img = extrair_imagem_produto(soup_prod, url_prod) if soup_prod else ""

        # Baixa imagem
        arquivo_img = ""
        if url_img:
            nome_arq = nome_arquivo_imagem(url_img, i)
            arquivo_img = baixar_imagem(url_img, OUTPUT_DIR, nome_arq, session)
            print(f"         🖼  {nome_arq}")

        produtos.append({
            "indice": i,
            "nome": nome,
            "url_produto": url_prod,
            "url_imagem": url_img,
            "arquivo_imagem": arquivo_img,
        })
        time.sleep(0.5)

    # 4. Salva CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        campos = ["indice", "nome", "url_produto", "url_imagem", "arquivo_imagem"]
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(produtos)

    print(f"\n{'='*60}")
    print(f"✅ Concluído!")
    print(f"   📊 CSV salvo em: {OUTPUT_CSV}")
    print(f"   🖼  Imagens salvas em: {OUTPUT_DIR}/")
    print(f"   Total de produtos: {len(produtos)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()