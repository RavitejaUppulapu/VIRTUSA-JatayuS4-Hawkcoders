import os
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from preprocessing import DataPreprocessor
from model import PredictiveMaintenanceModel
import matplotlib.pyplot as plt
import seaborn as sns

def plot_training_history(history):
    """Plot training history"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Training Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    
    # Plot loss
    ax2.plot(history.history['loss'], label='Training Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.close()

def plot_confusion_matrix(conf_matrix):
    """Plot confusion matrix"""
    plt.figure(figsize=(8, 6))
    sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues')
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig('confusion_matrix.png')
    plt.close()

def analyze_feature_importance(model, feature_names):
    """Analyze feature importance using a simple gradient-based method"""
    # Create a sample sequence
    sample_sequence = np.random.normal(size=(1, model.sequence_length, model.n_features))
    
    # Calculate gradients
    with tf.GradientTape() as tape:
        inputs = tf.convert_to_tensor(sample_sequence, dtype=tf.float32)
        tape.watch(inputs)
        predictions = model.model(inputs)
    
    gradients = tape.gradient(predictions, inputs)
    importance_scores = np.abs(gradients).mean(axis=(0, 1))
    
    # Plot feature importance
    plt.figure(figsize=(10, 6))
    plt.bar(feature_names, importance_scores)
    plt.title('Feature Importance Analysis')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('feature_importance.png')
    plt.close()

def main():
    # Initialize preprocessor
    preprocessor = DataPreprocessor()
    
    # Load and preprocess data
    print("Loading and preprocessing data...")
    data = preprocessor.load_and_preprocess('data/raw/combined_data.csv')
    
    # Create sequences for LSTM
    print("Creating sequences...")
    sequences, labels = preprocessor.create_sequences(data)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        sequences, labels, test_size=0.2, random_state=42
    )
    
    # Initialize and train model
    print("Training model...")
    model = PredictiveMaintenanceModel(
        sequence_length=preprocessor.sequence_length,
        n_features=X_train.shape[2]
    )
    
    history = model.train(X_train, y_train, epochs=50)
    
    # Evaluate model
    print("Evaluating model...")
    metrics = model.evaluate(X_test, y_test)
    
    # Print metrics
    print("\nModel Performance Metrics:")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1 Score: {metrics['f1_score']:.4f}")
    print("\nClassification Report:")
    print(metrics['classification_report'])
    
    # Create visualizations
    print("Creating visualizations...")
    plot_training_history(history)
    plot_confusion_matrix(metrics['confusion_matrix'])
    
    # Analyze feature importance
    feature_names = [
        'sensor_value',
        'hour',
        'day_of_week',
        'month',
        'device_id',
        'component_type',
        'sensor_type',
        'location'
    ]
    analyze_feature_importance(model, feature_names)
    
    # Save model
    print("Saving model...")
    model.save_model('models')
    
    print("Training complete! Model and visualizations have been saved.")

if __name__ == "__main__":
    main() 