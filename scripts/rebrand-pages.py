#!/usr/bin/env python3
"""
Safely rebrand BentoPDF → VietPDF in all HTML files under src/pages/
Preserves UTF-8 encoding properly.
"""
import os
import re

pages_dir = "src/pages"
replacements = [
    # Meta tags
    ('property="og:site_name" content="BentoPDF"', 'property="og:site_name" content="VietPDF"'),
    ('content="@BentoPDF"', 'content="@VietPDF"'),
    # Title suffixes
    (' | BentoPDF</title>', ' | VietPDF</title>'),
    (' - BentoPDF</title>', ' - VietPDF</title>'),
    # Meta title/content that use pipe
    ('| BentoPDF"', '| VietPDF"'),
    # JSON-LD
    ('"name": "BentoPDF"', '"name": "VietPDF"'),
    # URL domains
    ('https://www.bentopdf.com/', 'https://www.vietpdf.com/'),
    ('https://bentopdf.com/', 'https://vietpdf.com/'),
    # Author meta
    ('<meta name="author" content="BentoPDF"', '<meta name="author" content="VietPDF"'),
    # Brand mentions in descriptions (be careful)
    ('Learn about BentoPDF', 'Learn about VietPDF'),
    ('using BentoPDF', 'using VietPDF'),
    ('on BentoPDF', 'on VietPDF'),
    ('to BentoPDF', 'to VietPDF'),
    ('of BentoPDF', 'of VietPDF'),
    ('for BentoPDF', 'for VietPDF'),
    ('Return to BentoPDF', 'Return to VietPDF'),
    ('BentoPDF is', 'VietPDF is'),
    ('BentoPDF supports', 'VietPDF supports'),
    ('BentoPDF intentionally', 'VietPDF intentionally'),
    ('complete BentoPDF', 'complete VietPDF'),
    ('BentoPDF preserves', 'VietPDF preserves'),
    ('BentoPDF and Firefox', 'VietPDF and Firefox'),
    ('BentoPDF\'s Form', 'VietPDF\'s Form'),
    ('BentoPDF\'s own', 'VietPDF\'s own'),
    # Navbar fallback
    ('{{#if brandName}}{{brandName}}{{else}}BentoPDF{{/if}}', '{{#if brandName}}{{brandName}}{{else}}VietPDF{{/if}}'),
    # Footer copyright fallback
    ('&copy; 2026 BentoPDF', '&copy; 2026 VietPDF'),
]

fixed_count = 0
for filename in os.listdir(pages_dir):
    if not filename.endswith('.html'):
        continue
    filepath = os.path.join(pages_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for old, new in replacements:
        content = content.replace(old, new)

    # Also fix JSON-LD description fields that mention BentoPDF
    content = re.sub(r'"description": "([^"]*)BentoPDF([^"]*)"', lambda m: f'"description": "{m.group(1)}VietPDF{m.group(2)}"', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fixed_count += 1
        print(f"Fixed: {filename}")

print(f"\nTotal files fixed: {fixed_count}")
