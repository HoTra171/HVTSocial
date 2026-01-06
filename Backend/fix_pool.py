import re

# Đọc file
with open('models/chatModel.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace poolPromise với pool trong signature
content = re.sub(r'async (\w+)\(poolPromise,', r'async \1(pool,', content)

# Replace await poolPromise với check connection
content = re.sub(r'const pool = await poolPromise;', 'if (!pool.connected) await pool.connect();', content)

# Ghi lại file
with open('models/chatModel.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed chatModel.js")
