import re
import os

models = ['userModel.js', 'notificationModel.js', 'postModel.js']

for model_file in models:
    filepath = os.path.join('models', model_file)

    if not os.path.exists(filepath):
        print(f"Skip {model_file} - not found")
        continue

    # Đọc file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace poolPromise với pool trong signature
    content = re.sub(r'async (\w+)\(poolPromise,', r'async \1(pool,', content)
    content = re.sub(r'async (\w+)\(poolPromise\)', r'async \1(pool)', content)

    # Replace await poolPromise với check connection
    content = re.sub(r'const pool = await poolPromise;', 'if (!pool.connected) await pool.connect();', content)

    # Ghi lại file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Fixed {model_file}")

print("Done!")
