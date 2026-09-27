from services.code_runner import run_user_code

test_script = """import json
counts = {"00": 512, "11": 512}
probs = {"00": 0.5, "11": 0.5}
print(json.dumps({"counts": counts, "probabilities": probs, "num_qubits": 2}))
"""

res = run_user_code(test_script)
print("SUCCESS:", res.counts, res.probabilities)
