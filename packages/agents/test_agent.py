import asyncio
import json
import traceback

async def main():
    try:
        from src.agents.normalization_agent import run_normalization
        res = await run_normalization('alphatech_saas', '2025-01')
        with open('test_out.json', 'w') as f:
            json.dump({"status": "success", "data": res}, f, indent=2)
    except Exception as e:
        with open('test_out.json', 'w') as f:
            json.dump({"status": "error", "message": str(e), "traceback": traceback.format_exc()}, f, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
