import codecs

def remove_css_range(path, start, end, label):
    with codecs.open(path, 'r', 'utf-8-sig') as f:
        lines = f.readlines()
    print(f'{label}: {len(lines)} lines, removing {start}-{end}')
    lines = lines[:start] + lines[end:]
    result = ''.join(lines).rstrip('\n')
    with codecs.open(path, 'w', 'utf-8-sig') as f:
        f.write(result)
    print(f'  -> {len(result)} chars')

# resonator.css: lines 163-219 (0-indexed): tutorial-overlay section through tutorial-btn-ghost:hover
remove_css_range(r'C:\Users\c\.openclaw\workspace\reg-codex\icox\resonator.css', 163, 219, 'resonator.css')

# matrix.css: lines 208-222 (0-indexed): tutorial-box through tutorial-btn.skip
remove_css_range(r'C:\Users\c\.openclaw\workspace\reg-codex\icox\matrix.css', 208, 222, 'matrix.css')

print('Done')
