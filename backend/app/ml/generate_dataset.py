import json
import math
import os
import random
import cv2
import numpy as np

def generate_synthetic_dataset(output_dir="data/hackathon_dataset", num_samples=240, img_size=(256, 256), seed=42):
    random.seed(seed)
    np.random.seed(seed)

    images_dir = os.path.join(output_dir, "images")
    masks_dir = os.path.join(output_dir, "masks")
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(masks_dir, exist_ok=True)

    h, w = img_size
    metadata = []

    # 180 positive samples (spill present), 60 negative controls (clean sea / wind / lookalike)
    num_positive = int(num_samples * 0.75)
    num_negative = num_samples - num_positive

    print(f"Generating {num_samples} images ({num_positive} with spill, {num_negative} negative/clean sea)...")

    for i in range(num_samples):
        has_spill = i < num_positive
        img_name = f"sar_scene_{i+1:04d}.png"
        mask_name = f"sar_scene_{i+1:04d}_mask.png"

        # 1. Base Sea Surface Backscatter Simulation (SAR C-Band backscatter)
        # Moderate backscatter intensity with speckle noise (Rayleigh/Gamma distribution)
        base_intensity = np.random.uniform(90, 130)
        texture_scale = np.random.uniform(15, 35)

        # Perlin-like low frequency sea swell pattern
        grid_x, grid_y = np.meshgrid(np.linspace(0, 4 * np.pi, w), np.linspace(0, 4 * np.pi, h))
        angle = np.random.uniform(0, math.pi)
        rot_x = grid_x * math.cos(angle) - grid_y * math.sin(angle)
        swell = np.sin(rot_x * np.random.uniform(1.0, 3.0)) * texture_scale

        # High-frequency speckle noise
        speckle = np.random.gamma(shape=4.0, scale=3.0, size=(h, w)) - 12.0
        sea_surface = np.clip(base_intensity + swell + speckle, 20, 240).astype(np.float32)

        # 2. Binary Mask (0 = ocean, 1 = oil spill)
        mask = np.zeros((h, w), dtype=np.uint8)

        if has_spill:
            # Generate organic oil slick morphology (capillary wave dampening causes dark patches)
            num_slicks = random.choices([1, 2, 3], weights=[0.65, 0.25, 0.10])[0]
            for _ in range(num_slicks):
                cx = random.randint(int(w * 0.2), int(w * 0.8))
                cy = random.randint(int(h * 0.2), int(h * 0.8))
                radius = random.randint(int(min(h, w) * 0.12), int(min(h, w) * 0.35))

                num_points = random.randint(14, 26)
                angles = np.linspace(0, 2 * math.pi, num_points, endpoint=False)
                # Perturb radius with multi-frequency harmonics for natural fluid boundary
                r_variations = radius * (
                    0.7 + 0.3 * np.sin(angles * random.randint(2, 4)) + 0.15 * np.cos(angles * random.randint(3, 5))
                )
                r_variations += np.random.uniform(-4, 4, size=num_points)

                pts = []
                for a, r_v in zip(angles, r_variations):
                    px = int(cx + r_v * math.cos(a))
                    py = int(cy + r_v * math.sin(a))
                    pts.append([px, py])

                slick_contour = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
                cv2.drawContours(mask, [slick_contour], -1, 1, thickness=cv2.FILLED)

            # Smooth and morphologically dilate/erode to get realistic hydrodynamic edges
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.GaussianBlur(mask.astype(np.float32), (7, 7), 2.0)
            mask = (mask > 0.45).astype(np.uint8)

            # Dampen backscatter in oil slick areas (oil dampens Bragg capillary waves -> low backscatter/dark)
            damping_factor = np.random.uniform(0.20, 0.40)
            dampened_region = sea_surface * damping_factor + np.random.normal(15, 4, size=(h, w))
            sea_surface = np.where(mask == 1, dampened_region, sea_surface)
        else:
            # Look-alikes / low wind calm sea patches (negative control)
            if random.random() < 0.35:
                # Low-wind calm ocean area (darker, but diffuse and non-slick shape)
                calm_mask = np.zeros((h, w), dtype=np.float32)
                cx, cy = random.randint(30, w - 30), random.randint(30, h - 30)
                cv2.circle(calm_mask, (cx, cy), random.randint(60, 100), 1.0, -1)
                calm_mask = cv2.GaussianBlur(calm_mask, (45, 45), 20.0)
                sea_surface = sea_surface * (1.0 - 0.4 * calm_mask)

        # 3. Finalize SAR 3-Channel Image
        # Satellite SAR imagery is commonly visualized in pseudo-RGB or grayscale backscatter
        img_gray = np.clip(sea_surface, 0, 255).astype(np.uint8)
        # Create subtle false-color oceanic tint (Navy/Teal backscatter)
        b_ch = np.clip(img_gray * 1.05 + 10, 0, 255).astype(np.uint8)
        g_ch = np.clip(img_gray * 0.98 + 5, 0, 255).astype(np.uint8)
        r_ch = np.clip(img_gray * 0.88, 0, 255).astype(np.uint8)
        img_rgb = cv2.merge([b_ch, g_ch, r_ch])

        img_path = os.path.join(images_dir, img_name)
        mask_path = os.path.join(masks_dir, mask_name)

        cv2.imwrite(img_path, img_rgb)
        cv2.imwrite(mask_path, mask * 255)  # Save binary mask 0 and 255 for PNG standard

        spill_pixels = int(np.sum(mask))
        metadata.append({
            "id": i + 1,
            "image": img_name,
            "mask": mask_name,
            "has_spill": bool(has_spill),
            "spill_pixel_count": spill_pixels,
            "spill_area_ratio": round(spill_pixels / (h * w), 4)
        })

    meta_path = os.path.join(output_dir, "dataset_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Dataset generated successfully at {output_dir}: {len(metadata)} images.")

if __name__ == "__main__":
    generate_synthetic_dataset()
