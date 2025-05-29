
import axios from 'axios';
import https from 'https';

export async function onRequest(context) {
  const { request } = context;
  const urlObj = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, User-Agent, Referer",
      },
    });
  }

  const targetUrl = urlObj.searchParams.get("url");
  if (!targetUrl) {
    return new Response("Missing `url` query parameter.", { status: 400 });
  }

  const decodedUrl = decodeURIComponent(targetUrl);
  console.log(`Proxying: ${decodedUrl}`);

  try {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(decodedUrl);
    const isBinary = /\.(woff2?|ttf|eot|otf|ico)$/i.test(decodedUrl);
    const isJson = /\.json$/i.test(decodedUrl);
    const isJs = /\.js$/i.test(decodedUrl);

    const proxyRes = await fetch(decodedUrl, {
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
        "Accept": "*/*",
      },
      redirect: "follow",
    });

    const contentType = proxyRes.headers.get("content-type") || "application/octet-stream";
    const headers = new Headers(proxyRes.headers);

    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Content-Type", contentType);
    headers.delete("content-security-policy");
    headers.delete("content-security-policy-report-only");
    headers.delete("x-frame-options");

    let body;

    if (isImage || isBinary) {
      body = await proxyRes.arrayBuffer();
      return new Response(body, {
        status: proxyRes.status,
        headers,
      });
    }

    if (isJson) {
      body = await proxyRes.text();
      return new Response(body, {
        status: proxyRes.status,
        headers,
      });
    }

    body = await proxyRes.text();

    const baseUrl = new URL(decodedUrl);

    if (!isJs && contentType.includes("text/html")) {
      body = body
        .replace(/(src|href|srcset|poster)=["']([^"']+)["']/gi, (match, attr, link) => {
          try {
            if (link.startsWith("data:") || link.startsWith("mailto:") || link.startsWith("javascript:")) return match;
            const absoluteUrl = new URL(link, baseUrl).toString();
            const proxied = `/index.js?url=${encodeURIComponent(absoluteUrl)}`;
            return `${attr}="${proxied}"`;
          } catch {
            return match;
          }
        })
        .replace('loading="lazy"', 'loading="eager"')
        .replace(/<\/body>/i, `
          <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
          <script>eruda.init();</script>
        </body>`)
        .replace(/url\(["']?(?!data:|http|\/\/)([^"')]+)["']?\)/gi, (match, rel) => {
          const abs = new URL(rel, baseUrl).toString();
          return `url('/index.js?url=${encodeURIComponent(abs)}')`;
        })
        .replace(/<iframe\s+[^>]*src=["'](.*?)["'][^>]*>/gi, (match, src) => {
          try {
            const absolute = new URL(src, baseUrl).toString();
            return match.replace(src, `/index.js?url=${encodeURIComponent(absolute)}`);
          } catch {
            return match;
          }
        })
        .replace(/<\/body>/i, `
          <script>
            (() => {
              const form = document.getElementById('tsf');
              if (form) {
                const parent = form.parentNode;
                const children = Array.from(form.childNodes);
                children.forEach(child => parent.insertBefore(child, form));
                parent.removeChild(form);
              }
            })();
            setInterval(() => {
              const el = document.getElementsByClassName('SDkEP')[0];
              if (el && el.style.width !== '670px') {
                el.style.width = '670px';
              }
            }, 10);
          </script>
        </body>`)
        .replace(/<\/body>/i, `
          <script>
            document.addEventListener('DOMContentLoaded', () => {
              const input = document.querySelector('input[name="q"], textarea[name="q"]');
              if (input) {
                input.addEventListener('keypress', e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = input.value;
                    const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                    window.location.href = '/index.js?url=' + encodeURIComponent(searchUrl);
                  }
                });
              }
            });
          </script>
        </body>`);
    }

    return new Response(body, {
      status: proxyRes.status,
      headers,
    });

  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(`<h1>Proxy Error</h1><p>${err.message}</p>`, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
