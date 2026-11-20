from pathlib import Path
import urllib.request
url = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/dist/umd/supabase.js'
with urllib.request.urlopen(url, timeout=30) as response:
    data = response.read()
    if len(data) < 50000:
        raise RuntimeError('Unexpected SDK download')
    folder = Path(__file__).parent / 'vendor'
    folder.mkdir(exist_ok=True)
    (folder / 'supabase-2.49.8.js').write_bytes(data)
    print('Saved pinned Supabase SDK locally:', len(data), 'bytes')
