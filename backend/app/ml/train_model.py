import os
import json
import random
import time
import cv2
import numpy as np
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# -------------------------------------------------------------
# 1. Reproducibility & Device Configuration
# -------------------------------------------------------------
def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

set_seed(42)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# -------------------------------------------------------------
# 2. Lightweight U-Net Architecture (DoubleConv + Encoder/Decoder)
# -------------------------------------------------------------
class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class LightweightUNet(nn.Module):
    """
    Lightweight U-Net for Binary Marine Oil Spill Segmentation.
    Optimized for fast CPU/Colab training without massive memory overhead.
    """
    def __init__(self, in_channels=3, out_channels=1, features=[16, 32, 64, 128]):
        super().__init__()
        self.downs = nn.ModuleList()
        self.ups = nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        # Encoder (Downsampling)
        prev_channels = in_channels
        for feature in features:
            self.downs.append(DoubleConv(prev_channels, feature))
            prev_channels = feature

        # Bottleneck
        self.bottleneck = DoubleConv(features[-1], features[-1] * 2)

        # Decoder (Upsampling)
        for feature in reversed(features):
            self.ups.append(
                nn.ConvTranspose2d(feature * 2, feature, kernel_size=2, stride=2)
            )
            self.ups.append(DoubleConv(feature * 2, feature))

        # Final 1x1 classification layer
        self.final_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)

    def forward(self, x):
        skip_connections = []

        for down in self.downs:
            x = down(x)
            skip_connections.append(x)
            x = self.pool(x)

        x = self.bottleneck(x)
        skip_connections = skip_connections[::-1]

        for idx in range(0, len(self.ups), 2):
            x = self.ups[idx](x)
            skip = skip_connections[idx // 2]
            # Handle potential shape mismatch due to odd dimension pooling
            if x.shape != skip.shape:
                x = nn.functional.interpolate(x, size=skip.shape[2:])
            concat_x = torch.cat((skip, x), dim=1)
            x = self.ups[idx + 1](concat_x)

        return self.final_conv(x)


# -------------------------------------------------------------
# 3. Loss Functions: Combined BCE + Dice Loss
# -------------------------------------------------------------
class DiceBCELoss(nn.Module):
    def __init__(self, smooth=1e-5):
        super().__init__()
        self.bce = nn.BCEWithLogitsLoss()
        self.smooth = smooth

    def forward(self, logits, targets):
        bce_loss = self.bce(logits, targets)
        probs = torch.sigmoid(logits)
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)

        intersection = (probs_flat * targets_flat).sum()
        dice = (2.0 * intersection + self.smooth) / (probs_flat.sum() + targets_flat.sum() + self.smooth)
        dice_loss = 1.0 - dice

        return bce_loss + dice_loss


# -------------------------------------------------------------
# 4. Dataset & Augmentation
# -------------------------------------------------------------
class OilSpillDataset(Dataset):
    def __init__(self, image_paths, mask_paths, augment=False, img_size=(256, 256)):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.augment = augment
        self.img_size = img_size

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img_bgr = cv2.imread(self.image_paths[idx])
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        mask = cv2.imread(self.mask_paths[idx], cv2.IMREAD_GRAYSCALE)

        img_rgb = cv2.resize(img_rgb, self.img_size, interpolation=cv2.INTER_LINEAR)
        mask = cv2.resize(mask, self.img_size, interpolation=cv2.INTER_NEAREST)

        # Simple Useful Augmentations applied identically to image & mask
        if self.augment:
            if random.random() > 0.5:  # Horizontal flip
                img_rgb = np.fliplr(img_rgb)
                mask = np.fliplr(mask)
            if random.random() > 0.5:  # Vertical flip
                img_rgb = np.flipud(img_rgb)
                mask = np.flipud(mask)
            if random.random() > 0.5:  # 90° rotation
                k = random.choice([1, 2, 3])
                img_rgb = np.rot90(img_rgb, k)
                mask = np.rot90(mask, k)
            if random.random() > 0.5:  # Slight contrast/brightness
                factor = random.uniform(0.85, 1.15)
                img_rgb = np.clip(img_rgb.astype(np.float32) * factor, 0, 255).astype(np.uint8)

        # Normalize image to [0, 1] with ImageNet-like standardization
        img_rgb = np.ascontiguousarray(img_rgb)
        mask = np.ascontiguousarray(mask)
        img_tensor = torch.tensor(img_rgb, dtype=torch.float32).permute(2, 0, 1) / 255.0
        # Standardize
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        img_tensor = (img_tensor - mean) / std

        # Binary mask [0, 1]
        mask_binary = (mask > 127).astype(np.float32)
        mask_tensor = torch.tensor(mask_binary, dtype=torch.float32).unsqueeze(0)

        return img_tensor, mask_tensor, self.image_paths[idx]


# -------------------------------------------------------------
# 5. Metrics Computation (Dice, IoU, Precision, Recall)
# -------------------------------------------------------------
def calculate_metrics(pred_probs, targets, threshold=0.5):
    preds = (pred_probs > threshold).float()
    preds_flat = preds.view(-1)
    targets_flat = targets.view(-1)

    tp = (preds_flat * targets_flat).sum().item()
    fp = (preds_flat * (1 - targets_flat)).sum().item()
    fn = ((1 - preds_flat) * targets_flat).sum().item()
    tn = ((1 - preds_flat) * (1 - targets_flat)).sum().item()

    smooth = 1e-5
    dice = (2.0 * tp + smooth) / (2.0 * tp + fp + fn + smooth)
    iou = (tp + smooth) / (tp + fp + fn + smooth)
    precision = (tp + smooth) / (tp + fp + smooth)
    recall = (tp + smooth) / (tp + fn + smooth)
    accuracy = (tp + tn) / (tp + tn + fp + fn)

    return {
        "dice": dice,
        "iou": iou,
        "precision": precision,
        "recall": recall,
        "accuracy": accuracy,
    }


# -------------------------------------------------------------
# 6. Full Training & Evaluation Pipeline
# -------------------------------------------------------------
def run_training():
    dataset_dir = "data/hackathon_dataset"
    images_dir = os.path.join(dataset_dir, "images")
    masks_dir = os.path.join(dataset_dir, "masks")

    all_images = sorted([os.path.join(images_dir, f) for f in os.listdir(images_dir) if f.endswith(".png")])
    all_masks = sorted([os.path.join(masks_dir, f) for f in os.listdir(masks_dir) if f.endswith(".png")])

    total_count = len(all_images)
    print(f"Total dataset loaded: {total_count} images.")

    # 70% Train, 15% Val, 15% Test Split
    indices = list(range(total_count))
    random.shuffle(indices)

    train_idx = indices[: int(total_count * 0.70)]
    val_idx = indices[int(total_count * 0.70) : int(total_count * 0.85)]
    test_idx = indices[int(total_count * 0.85) :]

    train_imgs = [all_images[i] for i in train_idx]
    train_masks = [all_masks[i] for i in train_idx]

    val_imgs = [all_images[i] for i in val_idx]
    val_masks = [all_masks[i] for i in val_idx]

    test_imgs = [all_images[i] for i in test_idx]
    test_masks = [all_masks[i] for i in test_idx]

    print(f"Data Split -> Train: {len(train_imgs)}, Val: {len(val_imgs)}, Test: {len(test_imgs)}")

    train_dataset = OilSpillDataset(train_imgs, train_masks, augment=True)
    val_dataset = OilSpillDataset(val_imgs, val_masks, augment=False)
    test_dataset = OilSpillDataset(test_imgs, test_masks, augment=False)

    batch_size = 8
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    model = LightweightUNet(in_channels=3, out_channels=1, features=[16, 32, 64, 128]).to(DEVICE)
    criterion = DiceBCELoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=3)

    epochs = 15
    best_val_loss = float("inf")
    history = {"train_loss": [], "val_loss": [], "val_dice": [], "val_iou": []}

    print(f"\nStarting model training on {DEVICE} for {epochs} epochs...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for images, masks, _ in train_loader:
            images = images.to(DEVICE)
            masks = masks.to(DEVICE)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)

        train_loss /= len(train_dataset)

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_dices = []
        val_ious = []

        with torch.no_grad():
            for images, masks, _ in val_loader:
                images = images.to(DEVICE)
                masks = masks.to(DEVICE)

                logits = model(images)
                loss = criterion(logits, masks)
                val_loss += loss.item() * images.size(0)

                probs = torch.sigmoid(logits)
                m = calculate_metrics(probs, masks)
                val_dices.append(m["dice"])
                val_ious.append(m["iou"])

        val_loss /= len(val_dataset)
        avg_val_dice = float(np.mean(val_dices))
        avg_val_iou = float(np.mean(val_ious))
        scheduler.step(val_loss)

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_dice"].append(avg_val_dice)
        history["val_iou"].append(avg_val_iou)

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f} | "
            f"Val Dice: {avg_val_dice:.4f} | "
            f"Val IoU: {avg_val_iou:.4f}"
        )

        # Save Best Model Checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            os.makedirs("models", exist_ok=True)
            torch.save(model.state_dict(), "models/oil_spill_demo_best.pth")

    train_duration = round(time.time() - start_time, 2)
    print(f"\nTraining completed in {train_duration}s. Best Val Loss: {best_val_loss:.4f}")

    # -------------------------------------------------------------
    # 7. Final Test Set Evaluation
    # -------------------------------------------------------------
    print("\nEvaluating best checkpoint on unseen TEST split...")
    model.load_state_dict(torch.load("models/oil_spill_demo_best.pth", map_location=DEVICE))
    model.eval()

    test_metrics = []
    sample_visuals = []

    with torch.no_grad():
        for i, (image, mask, path) in enumerate(test_loader):
            image = image.to(DEVICE)
            mask = mask.to(DEVICE)

            logits = model(image)
            probs = torch.sigmoid(logits)

            metrics = calculate_metrics(probs, mask)
            test_metrics.append(metrics)

            if len(sample_visuals) < 8:
                sample_visuals.append({
                    "orig_path": path[0],
                    "gt_mask": mask.cpu().squeeze().numpy(),
                    "pred_prob": probs.cpu().squeeze().numpy(),
                })

    test_results = {
        "Dice": round(float(np.mean([m["dice"] for m in test_metrics])), 4),
        "IoU": round(float(np.mean([m["iou"] for m in test_metrics])), 4),
        "Precision": round(float(np.mean([m["precision"] for m in test_metrics])), 4),
        "Recall": round(float(np.mean([m["recall"] for m in test_metrics])), 4),
        "Accuracy": round(float(np.mean([m["accuracy"] for m in test_metrics])), 4),
    }

    print("Test Set Benchmark Results:")
    for k, v in test_results.items():
        print(f"  - {k}: {v * 100:.2f}%" if k != "IoU" else f"  - {k}: {v:.4f}")

    # -------------------------------------------------------------
    # 8. Save Configuration JSON
    # -------------------------------------------------------------
    config = {
        "model_version": "oil_spill_demo_v1",
        "model_architecture": "LightweightUNet",
        "in_channels": 3,
        "out_channels": 1,
        "features": [16, 32, 64, 128],
        "image_size": [256, 256],
        "classes": {0: "Background / Ocean", 1: "Oil Spill"},
        "preprocessing": {
            "resize": [256, 256],
            "normalization": "ImageNet",
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "threshold": 0.50,
        "training_epochs": epochs,
        "best_val_loss": round(best_val_loss, 4),
        "test_metrics": test_results,
        "dataset_split": {
            "total_images": total_count,
            "train": len(train_imgs),
            "val": len(val_imgs),
            "test": len(test_imgs)
        },
        "model_notice": "Prototype ML model trained on hackathon demonstration SAR dataset."
    }

    with open("models/model_config.json", "w") as f:
        json.dump(config, f, indent=2)

    # -------------------------------------------------------------
    # 9. Generate Visual Results & Training Curve
    # -------------------------------------------------------------
    os.makedirs("results", exist_ok=True)
    os.makedirs("results/predictions", exist_ok=True)

    # Training Curve Plot
    plt.figure(figsize=(10, 4.5), dpi=150)
    plt.subplot(1, 2, 1)
    plt.plot(range(1, epochs + 1), history["train_loss"], label="Train Loss", marker="o", color="#1268B3")
    plt.plot(range(1, epochs + 1), history["val_loss"], label="Val Loss", marker="s", color="#EF4444")
    plt.title("Training & Validation Loss (BCE + Dice)")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(range(1, epochs + 1), history["val_dice"], label="Val Dice Score", marker="^", color="#10B981")
    plt.plot(range(1, epochs + 1), history["val_iou"], label="Val IoU Score", marker="d", color="#8B5CF6")
    plt.title("Validation Segmentation Metrics")
    plt.xlabel("Epoch")
    plt.ylabel("Score")
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.legend()

    plt.tight_layout()
    plt.savefig("results/training_curve.png")
    plt.close()
    print("Saved training curve to results/training_curve.png")

    # Generate 5-8 Side-by-Side Visual Predictions: [Original -> Ground Truth -> AI Prediction -> Overlay]
    for idx, vis in enumerate(sample_visuals):
        orig_bgr = cv2.imread(vis["orig_path"])
        orig_rgb = cv2.cvtColor(orig_bgr, cv2.COLOR_BGR2RGB)
        orig_rgb = cv2.resize(orig_rgb, (256, 256))

        gt_mask = (vis["gt_mask"] > 0.5).astype(np.uint8)
        pred_mask = (vis["pred_prob"] > 0.5).astype(np.uint8)

        # Create Glowing Neon Crimson Overlay on Original Image
        overlay = orig_rgb.copy()
        # Red mask overlay for oil spill
        red_tint = np.zeros_like(orig_rgb)
        red_tint[:, :] = [239, 68, 68]  # Tailwind red-500
        # Blend overlay where prediction is 1
        mask_3d = np.repeat(pred_mask[:, :, np.newaxis], 3, axis=2)
        blended = cv2.addWeighted(overlay, 0.65, red_tint, 0.35, 0)
        final_overlay = np.where(mask_3d == 1, blended, overlay)

        # Draw contour border on overlay
        contours, _ = cv2.findContours(pred_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(final_overlay, contours, -1, (255, 100, 100), 2)

        # Plot 4-panel comparison
        fig, axes = plt.subplots(1, 4, figsize=(14, 3.8), dpi=150)
        axes[0].imshow(orig_rgb)
        axes[0].set_title("Original SAR Image", fontsize=10, fontweight="bold")
        axes[0].axis("off")

        axes[1].imshow(gt_mask, cmap="Blues")
        axes[1].set_title("Ground Truth Mask", fontsize=10, fontweight="bold")
        axes[1].axis("off")

        axes[2].imshow(vis["pred_prob"], cmap="magma")
        axes[2].set_title("AI Probability Map", fontsize=10, fontweight="bold")
        axes[2].axis("off")

        axes[3].imshow(final_overlay)
        spill_detected = bool(np.sum(pred_mask) > 50)
        status_txt = "Spill Detected" if spill_detected else "Clean Ocean"
        axes[3].set_title(f"Overlay ({status_txt})", fontsize=10, fontweight="bold", color="#B91C1C" if spill_detected else "#047857")
        axes[3].axis("off")

        plt.suptitle(f"Sample #{idx+1}: AI Oil Spill Semantic Segmentation", fontsize=11, fontweight="bold")
        plt.tight_layout()
        pred_file = f"results/predictions/prediction_sample_{idx+1:02d}.png"
        plt.savefig(pred_file)
        plt.close()

    print(f"Saved {len(sample_visuals)} visual comparison examples to results/predictions/")

if __name__ == "__main__":
    run_training()
