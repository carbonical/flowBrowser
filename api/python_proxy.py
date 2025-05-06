import requests
from urllib.parse import urlparse

def handler(request):
    url = request.args.get('url')
    if not url:
        return {"error": "URL query parameter is required"}, 400

    try:
        response = requests.get(url)
        return {
            "status": response.status_code,
            "body": response.text
        }
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to fetch data: {e}"}, 500
