from pathlib import Path
import re, json, urllib.request, urllib.error
s = (Path(__file__).parent / 'config.js').read_text(encoding='utf-8')
url = re.search(r"url:\s*['\"]([^'\"]+)", s).group(1).rstrip('/')
key = re.search(r"publishableKey:\s*['\"]([^'\"]+)", s).group(1)
request = urllib.request.Request(url + '/auth/v1/settings', headers={'apikey': key})
try:
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.load(response)
        print(json.dumps({'reachable': True, 'emailProviderEnabled': data.get('external', {}).get('email')}))
except urllib.error.HTTPError as error:
    print(json.dumps({'reachable': True, 'httpStatus': error.code}))
except urllib.error.URLError as error:
    print(json.dumps({'reachable': False, 'reason': str(error.reason)}))
