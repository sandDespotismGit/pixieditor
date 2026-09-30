import html
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus

import requests

RSS_URLS = [
    "https://rssexport.rbc.ru/rbcnews/news/30/full.rss",
    "https://lenta.ru/rss/news",
]

FALLBACK_NEWS = [
    {
        "title": "Новости временно обновляются",
        "heading": "Новости временно обновляются",
        "description": "Информация появится автоматически после обновления источника.",
        "category": "Новости",
        "time": "",
        "image": "",
        "qr_code": "",
    }
]


def _text(node, name):
    child = node.find(name)
    return html.unescape(child.text.strip()) if child is not None and child.text else ""


def _image_url(item):
    for child in list(item):
        tag = child.tag.lower()
        if tag.endswith("enclosure") and child.attrib.get("url"):
            return child.attrib.get("url")
        if tag.endswith("content") and child.attrib.get("url"):
            return child.attrib.get("url")
        if tag.endswith("thumbnail") and child.attrib.get("url"):
            return child.attrib.get("url")
    return ""


def get_news():
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }

    for url in RSS_URLS:
        try:
            response = requests.get(url, headers=headers, timeout=8)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            items = root.findall(".//item")[:12]
            result = []

            for item in items:
                title = _text(item, "title")
                link = _text(item, "link")
                description = _text(item, "description")
                category = _text(item, "category") or "Новости"
                published = _text(item, "pubDate")
                image = _image_url(item)

                if not title:
                    continue

                result.append(
                    {
                        "title": title,
                        "heading": title,
                        "description": description,
                        "category": category,
                        "time": published,
                        "link": link,
                        "image": image,
                        "qr_code": "",
                        "qr_url": f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={quote_plus(link)}"
                        if link
                        else "",
                    }
                )

            if result:
                return result
        except Exception as ex:
            print(f"News parse error for {url}: {ex}")

    return FALLBACK_NEWS
