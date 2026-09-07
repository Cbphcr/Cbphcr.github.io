"""Refresh the small curated public-repository list; preserve cache on failure."""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def refresh():
    path = ROOT / '_data/github_stars.json'
    cached = json.loads(path.read_text())
    contributions = json.loads((ROOT / '_data/github_contributions.json').read_text())
    names = sorted(set(cached) | {item['repo'] for item in contributions['repositories']})
    updated = {}
    for name in names:
        # gh uses GITHUB_TOKEN in Actions; no credential is embedded in site assets.
        result = subprocess.run(['gh', 'api', f'repos/{name}'], check=True, capture_output=True, text=True)
        repo = json.loads(result.stdout)
        if repo.get('private', True):
            raise ValueError(f'Repository is no longer public: {name}')
        count = repo['stargazers_count']
        if type(count) is not int or count < 0:
            raise ValueError(f'Invalid star count: {name}')
        updated[name] = count
    # No partial update: any API error leaves the previous cache intact.
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(updated, indent=2) + '\n')
    temporary.replace(path)


if __name__ == '__main__':
    refresh()
