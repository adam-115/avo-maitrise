import json

with open(r'C:\Users\lenovo\.gemini\antigravity-ide\brain\2b420879-4acf-4cb3-951b-2db6f4285518\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    last_user_input = None
    for line in f:
        if '"type":"USER_INPUT"' in line:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                last_user_input = data
                
if last_user_input:
    with open(r'd:\avo-maitrise\user_input.txt', 'w', encoding='utf-8') as out:
        out.write(last_user_input['content'])
