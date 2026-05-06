# IronLung ML Scaffold

This package is a future-ready Python module for training and running private body progress photo analysis. The desktop MVP now includes a local approximate vision analyzer in TypeScript and a Python parity scaffold in `infer.py`.

## Goals

- Analyze photo consistency, pose/framing quality, and user-relative visual change.
- Avoid medical claims, attractiveness labels, shaming labels, or exact body-fat claims.
- Support approximate user-relative progress scoring only.
- Keep photos local by default.
- Make deletion and export easy.

## Secure Dataset Flow

Kaggle datasets can be used later only with user-provided credentials.

1. Install the Kaggle CLI in an isolated environment.
2. Put `kaggle.json` in the standard user config location or pass credentials through environment variables.
3. Never commit `kaggle.json`, dataset archives, or private model artifacts.
4. Document dataset license, consent assumptions, demographic coverage, and known gaps before training.

## Training Flow

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python train.py --data-dir path\\to\\datasets --output artifacts\\body-progress-model.onnx
python infer.py --image path\\to\\photo.jpg --age 30 --height 70 --weight 185 --pose front --lighting "same room"
```

The future desktop app should keep the `BodyAnalysisResult` contract: score, confidence, model version, measurements JSON, and warnings JSON. A trained model can replace the current local feature model without changing the UI storage shape.
