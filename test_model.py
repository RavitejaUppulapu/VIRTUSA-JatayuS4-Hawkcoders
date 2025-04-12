from backend.ml_model import PredictiveMaintenanceModel

def test_model_training():
    # Initialize model
    model = PredictiveMaintenanceModel()
    
    # Train model
    print("Starting model training...")
    history = model.train()
    
    # Verify training history exists
    assert history is not None, "Training history should not be None"
    assert 'accuracy' in history, "Training history should contain accuracy metrics"
    assert 'val_accuracy' in history, "Training history should contain validation accuracy metrics"
    
    print("Model training completed successfully!")

if __name__ == "__main__":
    test_model_training() 