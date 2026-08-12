import os
import glob
import re

agent_dir = r"c:\PinnacleAI\packages\agents\src\agents"
for fpath in glob.glob(os.path.join(agent_dir, "*_agent.py")):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'orchestrator_agent.py' in fpath or 'create_react_agent' not in content:
        continue

    # Fix PROMPT string to include {tools} and {tool_names}
    if '{tools}' not in content and '{tool_names}' in content and 'PROMPT =' in content:
        content = re.sub(r'Tools:\s*\{tool_names\}', 'Tools available:\n{tools}\n\nTool Names: {tool_names}', content)

    # Fix input_variables
    if 'input_variables=["input", "tool_names", "agent_scratchpad"]' in content:
        content = content.replace(
            'input_variables=["input", "tool_names", "agent_scratchpad"]',
            'input_variables=["input", "tools", "tool_names", "agent_scratchpad"]'
        )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed agent prompts!')
