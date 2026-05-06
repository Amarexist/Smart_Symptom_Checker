import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix
import joblib
from train_model import generate_dataset

clf = joblib.load('models/symptom_classifier.joblib')
mlb = joblib.load('models/label_binarizer.joblib')

X, y_raw, _ = generate_dataset(n_samples=2000)
y_true_single = [labels[0] for labels in y_raw]

probs = clf.predict_proba(X)
y_pred_indices = np.argmax(probs, axis=1)
y_pred_single = [mlb.classes_[i] for i in y_pred_indices]

from collections import Counter
top_12_classes = [c for c, _ in Counter(y_true_single).most_common(12)]

filtered_indices = [i for i, label in enumerate(y_true_single) if label in top_12_classes]
y_true_filtered = [y_true_single[i] for i in filtered_indices]
y_pred_filtered = [y_pred_single[i] if y_pred_single[i] in top_12_classes else 'Other' for i in filtered_indices]

classes_for_matrix = top_12_classes + ['Other']
cm = confusion_matrix(y_true_filtered, y_pred_filtered, labels=classes_for_matrix)

plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes_for_matrix, yticklabels=classes_for_matrix)
plt.title('Random Forest Confusion Matrix (Top 12 Synthesized Conditions)')
plt.ylabel('True Condition')
plt.xlabel('Predicted Condition')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('/Users/amarnath/.gemini/antigravity/brain/5a160832-f634-4f29-bd94-e9c5046f4274/artifacts/confusion_matrix.png')
print("Done")
