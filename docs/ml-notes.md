# ML Notes

The Progress Photo Index is intentionally framed as a private, experimental progress metric.

It must not be:

- an attractiveness score
- a medical diagnosis
- a body-fat guarantee
- a shaming or ranking tool

The MVP local model returns a 0-100 approximate Progress Photo Index, confidence, model version, measurements JSON, and warnings. It uses local image quality features plus capture context such as age, height, weight, pose, lighting, and pump tag. A trained model should preserve this interface so the app does not need UI or data model rewrites.

Future model work should prioritize:

- pose consistency
- photo framing and lighting quality
- segmentation quality checks
- user-relative visual change over time
- clear uncertainty and limitation messaging
- bias evaluation before release

Approximate body composition/progress bands may be displayed only as user-relative context. They are not exact body-fat percentages and must not be framed as medical outputs.
