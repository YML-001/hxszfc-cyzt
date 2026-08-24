import urllib.request
try:
    r = urllib.request.urlopen('http://127.0.0.1:8123/index.html', timeout=5)
    print(r.status, len(r.read()))
except Exception as e:
    print('ERR', type(e).__name__, e)
