"""
Real model adapter for trained deep learning models (PyTorch Lightweight U-Net).
Seamlessly connects to `models/oil_spill_demo_best.pth` and executes real neural network inference.
"""
from __future__ import annotations
import os
import logging
from typing import Optional

from app.ml.detection.base import DetectionModel, DetectionOutput
from app.ml.inference import OilSpillInference

logger = logging.getLogger(__name__)


class RealModelAdapter(DetectionModel):
    """
    Adapter for the trained Lightweight U-Net oil spill segmentation model.
    Loads models/oil_spill_demo_best.pth and executes real deep-learning inference.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.getenv("OIL_SPILL_MODEL_PATH", "models/oil_spill_demo_best.pth")
        self._inference = OilSpillInference.get_instance()

    def is_available(self) -> bool:
        return self._inference.is_available()

    def predict(
        self,
        image_bytes: bytes,
        filename: str,
        latitude: float,
        longitude: float,
        demo_preset: Optional[str] = None,
    ) -> DetectionOutput:
        if not self.is_available():
            raise RuntimeError("Real model weights are not loaded from models/oil_spill_demo_best.pth. Run training first.")

        # If image_bytes is empty or preset fallback, resolve preset file if available
        if (not image_bytes or image_bytes == (demo_preset or "").encode("utf-8")) and demo_preset:
            preset_path = os.path.join("frontend", "public", "demo_images", f"{demo_preset}.png")
            if os.path.exists(preset_path):
                with open(preset_path, "rb") as f:
                    image_bytes = f.read()

        # Run real deep learning inference
        res = self._inference.predict_oil_spill(
            image_input=image_bytes,
            latitude=latitude,
            longitude=longitude,
        )

        return DetectionOutput(
            detected=res["detected"],
            confidence=res["confidence"],
            spill_area_km2=res["spill_area_km2"],
            geometry_geojson=res["geometry_geojson"],
            mask_base64=res["mask_base64"],
            model_name=f"{res['model_architecture']} ({res['model_version']})",
            processing_time_ms=res["processing_time_ms"],
            potential_false_positive=res["potential_false_positive"],
            is_demo_model=res["is_demo_model"],
            details=res["details"],
        )
