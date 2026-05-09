# Training Intelligence

IronLung now has a shared training intelligence layer in `packages/core/src/training-intelligence.ts`.

This is intentionally not a deep-learning system yet. It implements the first three layers that are more useful for a local-first personal training app:

1. Deterministic analyst report
2. Statistical forecasting
3. Personal recommendation ranking

## Deterministic Analyst

The deterministic report wraps existing analytics into a concise status model:

- readiness score
- focus signal
- best improvement
- weak point
- recovery concern
- positive signals
- warning signals

Inputs come from the rule-based analytics engine: fatigue flags, weak points, balance score, active days, volume changes, and recommendations.

No model call is required. This keeps the output explainable and reproducible.

## Statistical Forecasting

Forecasts currently include:

- next-session estimated 1RM per exercise
- weekly volume forecast
- PR likelihood score
- plateau risk score
- fatigue risk score

Methods are deliberately simple:

- linear trend over recent exercise/session values
- moving average fallback when sample size is low
- rule scores for PR likelihood, plateau risk, and fatigue risk

Each forecast returns:

- value
- optional lower/upper bounds
- confidence score
- sample size
- method
- detail text

These forecasts are approximate training signals, not guarantees.

## Recommendation Engine

Recommendations are generated from:

- training goal
- forecasts
- weak points
- fatigue risks
- volume trajectory
- plateau candidates

Supported goal behavior:

- Strength: prioritizes estimated 1RM, top-set quality, PR likelihood, and plateau review.
- Hypertrophy: prioritizes weekly volume, muscle balance, and gradual progression.
- Lean bulk: prioritizes progressive overload, consistency, and volume trend.
- Cutting: prioritizes strength retention, fatigue management, and consistency.
- Powerbuilding: balances strength forecasts and hypertrophy volume signals.
- General fitness: stays conservative and simple.

Every recommendation includes evidence and a suggested action. The engine does not create premade workout plans.

## Future Deep Learning Boundary

If deep learning is added later, it should plug in behind the same interfaces rather than replace deterministic analytics:

- local inference only by default
- no cloud requirement
- no account requirement
- no medical claims
- no body-fat claims
- no attractiveness/body-shaming score

For workout analytics, a trained model should only be promoted if it beats the current explainable forecasts on held-out personal data.
