import os
import re
import glob

ROOT = r'D:\Vietpdf\bentopdf'

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Replace bentopdf.com with vietpdf.com everywhere
    content = content.replace('https://www.bentopdf.com', 'https://www.vietpdf.com')

    # 2. Replace og:image content URLs
    content = re.sub(
        r'(<meta[^>]+property="og:image"[^>]+content=")https://www\.vietpdf\.com/images/[^"]+\.png("[^>]*>)',
        r'\1https://www.vietpdf.com/images/og-image.jpg\2',
        content
    )
    # Also handle content before property
    content = re.sub(
        r'(<meta[^>]+content=")https://www\.vietpdf\.com/images/[^"]+\.png("[^>]+property="og:image"[^>]*>)',
        r'\1https://www.vietpdf.com/images/og-image.jpg\2',
        content
    )

    # 3. Replace twitter:image content URLs
    content = re.sub(
        r'(<meta[^>]+name="twitter:image"[^>]+content=")https://www\.vietpdf\.com/images/[^"]+\.png("[^>]*>)',
        r'\1https://www.vietpdf.com/images/og-image.jpg\2',
        content
    )
    content = re.sub(
        r'(<meta[^>]+content=")https://www\.vietpdf\.com/images/[^"]+\.png("[^>]+name="twitter:image"[^>]*>)',
        r'\1https://www.vietpdf.com/images/og-image.jpg\2',
        content
    )

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    files = [os.path.join(ROOT, 'index.html')]
    files += glob.glob(os.path.join(ROOT, 'src', 'pages', '*.html'))

    changed = 0
    for path in files:
        if process_file(path):
            changed += 1
            print(f'Updated: {os.path.relpath(path, ROOT)}')
    print(f'\nTotal files updated: {changed}')

if __name__ == '__main__':
    main()
