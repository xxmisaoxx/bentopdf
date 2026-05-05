import os
import re
import glob

ROOT = r'D:\Vietpdf\bentopdf'

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    content = content.replace('https://www.vietpdf.com', 'https://vietpdf.com')
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    files = [os.path.join(ROOT, 'index.html')]
    files += glob.glob(os.path.join(ROOT, 'src', 'pages', '*.html'))
    files.append(os.path.join(ROOT, 'public', 'robots.txt'))
    
    changed = 0
    for path in files:
        if process_file(path):
            changed += 1
            print(f'Updated: {os.path.relpath(path, ROOT)}')
    
    js_files = glob.glob(os.path.join(ROOT, 'src', 'js', '**', '*.ts'), recursive=True)
    for path in js_files:
        if process_file(path):
            changed += 1
            print(f'Updated: {os.path.relpath(path, ROOT)}')
    
    mjs_files = glob.glob(os.path.join(ROOT, 'scripts', '*.mjs'), recursive=True)
    for path in mjs_files:
        if process_file(path):
            changed += 1
            print(f'Updated: {os.path.relpath(path, ROOT)}')
    
    print(f'\nTotal files updated: {changed}')

if __name__ == '__main__':
    main()