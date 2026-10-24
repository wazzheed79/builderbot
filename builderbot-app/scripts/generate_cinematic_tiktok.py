"""
Generate Cinematic TikTok Video from AI Photorealistic Scenes & Voiceover
Applies smooth Ken Burns camera motion, sleek UI card overlays, and dynamic subtitles.
"""

import os
import subprocess
import math
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1080
HEIGHT = 1920
FPS = 30

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SCENES_DIR = r"C:\Users\wazzh\builderbot\builderbot-app\public\scenes"
AUDIO_DIR = r"C:\Users\wazzh\builderbot\builderbot-app\public\audio\walkthrough"
OUTPUT_DIR = r"C:\Users\wazzh\builderbot\builderbot-app\public"
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "chuffed-quotes-cinematic-tiktok.mp4")
DOWNLOADS_MP4 = r"C:\Users\wazzh\Downloads\chuffed-quotes-cinematic-tiktok.mp4"
ARTIFACT_MP4 = r"C:\Users\wazzh\.gemini\antigravity\brain\9898c287-093f-405c-9b01-63f5f4e64d8c\chuffed-quotes-cinematic-tiktok.mp4"

SCENE_DURATIONS = [6.89, 8.76, 5.52, 5.16, 5.42]
TOTAL_DURATION = sum(SCENE_DURATIONS)

# Fonts
WIN_DIR = os.environ.get("WINDIR", r"C:\Windows")
FONT_BOLD_PATH = os.path.join(WIN_DIR, "Fonts", "segoeuib.ttf")
FONT_REG_PATH = os.path.join(WIN_DIR, "Fonts", "segoeui.ttf")
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = os.path.join(WIN_DIR, "Fonts", "arialbd.ttf")
    FONT_REG_PATH = os.path.join(WIN_DIR, "Fonts", "arial.ttf")

font_hook_title = ImageFont.truetype(FONT_BOLD_PATH, 52)
font_hook_sub = ImageFont.truetype(FONT_BOLD_PATH, 36)
font_card_title = ImageFont.truetype(FONT_BOLD_PATH, 38)
font_card_sub = ImageFont.truetype(FONT_REG_PATH, 26)
font_body = ImageFont.truetype(FONT_REG_PATH, 30)
font_bold = ImageFont.truetype(FONT_BOLD_PATH, 32)
font_subtitle = ImageFont.truetype(FONT_BOLD_PATH, 36)
font_badge = ImageFont.truetype(FONT_BOLD_PATH, 24)
font_cta = ImageFont.truetype(FONT_BOLD_PATH, 38)
font_huge = ImageFont.truetype(FONT_BOLD_PATH, 60)

# Pre-load base photographic scene images
base_imgs = [
    Image.open(os.path.join(SCENES_DIR, f"scene-{i}.jpg")).convert("RGB")
    for i in range(1, 5)
]

def prepare_audio():
    concat_txt = os.path.join(OUTPUT_DIR, "audio_concat.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for i in range(1, 6):
            clip = os.path.join(AUDIO_DIR, f"step-{i}.mp3").replace("\\", "/")
            f.write(f"file '{clip}'\n")

    combined_audio = os.path.join(OUTPUT_DIR, "combined_audio.wav")
    cmd = [
        FFMPEG, "-y", "-f", "concat", "-safe", "0",
        "-i", concat_txt, "-c:a", "pcm_s16le", combined_audio
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(concat_txt):
        os.remove(concat_txt)
    return combined_audio


def get_ken_burns_bg(raw_img, progress, zoom_start=1.0, zoom_end=1.14, pan_y=0):
    """Smooth Ken Burns zoom and pan crop."""
    orig_w, orig_h = raw_img.size
    scale = zoom_start + (zoom_end - zoom_start) * progress
    
    # Target crop aspect ratio matches 1080x1920
    target_ratio = WIDTH / HEIGHT
    
    crop_h = orig_h / scale
    crop_w = crop_h * target_ratio
    if crop_w > orig_w:
        crop_w = orig_w
        crop_h = crop_w / target_ratio
        
    x1 = (orig_w - crop_w) / 2
    y1 = (orig_h - crop_h) / 2 + (pan_y * (orig_h - crop_h) * (progress - 0.5))
    x2 = x1 + crop_w
    y2 = y1 + crop_h
    
    cropped = raw_img.crop((int(x1), int(y1), int(x2), int(y2)))
    resized = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
    return resized


def draw_text_with_outline(draw, pos, text, font, fill=(255, 255, 255), outline_color=(0, 0, 0), outline_width=3, anchor="la"):
    x, y = pos
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color, anchor=anchor)
    draw.text((x, y), text, font=font, fill=fill, anchor=anchor)


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def render_cinematic_frame(t, scene_idx, scene_time, scene_dur):
    progress = scene_time / scene_dur

    # 1. Base Picture Selection with Ken Burns
    if scene_idx == 0:
        base_pic = base_imgs[0] # Van driver seat POV
        bg = get_ken_burns_bg(base_pic, progress, zoom_start=1.0, zoom_end=1.12, pan_y=0.1)
    elif scene_idx == 1:
        base_pic = base_imgs[1] # Hands with phone in van
        bg = get_ken_burns_bg(base_pic, progress, zoom_start=1.02, zoom_end=1.15, pan_y=-0.1)
    elif scene_idx == 2:
        base_pic = base_imgs[2] # Homeowner in kitchen
        bg = get_ken_burns_bg(base_pic, progress, zoom_start=1.0, zoom_end=1.12, pan_y=0.05)
    elif scene_idx == 3:
        base_pic = base_imgs[2] # Homeowner closer inspection / signing
        bg = get_ken_burns_bg(base_pic, progress, zoom_start=1.12, zoom_end=1.22, pan_y=-0.05)
    else: # scene_idx == 4
        base_pic = base_imgs[3] # Pub fireplace with pint
        bg = get_ken_burns_bg(base_pic, progress, zoom_start=1.0, zoom_end=1.14, pan_y=0.08)

    # 2. Add subtle dark gradient scrim so overlays & subtitles pop with high contrast
    scrim = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    scrim_draw = ImageDraw.Draw(scrim)
    # Top scrim
    scrim_draw.rectangle([0, 0, WIDTH, 360], fill=(0, 0, 0, 155))
    # Bottom scrim
    scrim_draw.rectangle([0, HEIGHT - 480, WIDTH, HEIGHT], fill=(0, 0, 0, 185))
    
    bg = Image.alpha_composite(bg.convert("RGBA"), scrim).convert("RGB")
    draw = ImageDraw.Draw(bg)

    # --- TOP HOOK BANNER ---
    hook_box = [60, 80, WIDTH - 60, 240]
    draw_rounded_rect(draw, hook_box, radius=28, fill=(15, 20, 35, 235), outline=(245, 158, 11), width=3)
    draw.text((WIDTH // 2, 125), "POV: Quoting from the van in 30s", fill=(255, 215, 0), font=font_hook_title, anchor="mm")
    draw.text((WIDTH // 2, 190), "No more losing Sundays to paperwork 🚫📄", fill=(240, 245, 255), font=font_hook_sub, anchor="mm")

    # --- STEP BADGE ---
    step_titles = [
        "1. Speak Your Notes",
        "2. 30s Trade Pricing",
        "3. WhatsApp Delivery",
        "4. Client Signs in 1 Tap",
        "5. Paid & Invoiced"
    ]
    step_box = [WIDTH // 2 - 200, 260, WIDTH // 2 + 200, 315]
    draw_rounded_rect(draw, step_box, radius=18, fill=(196, 82, 42), outline=(255, 140, 90), width=2)
    draw.text((WIDTH // 2, 287), step_titles[scene_idx], fill=(255, 255, 255), font=font_badge, anchor="mm")

    # --- CENTER REALISTIC UI CARDS OVERLAY ---
    if scene_idx == 0:
        # Scene 1: Voice recording pulsing waveform
        card_box = [90, 880, WIDTH - 90, 1380]
        draw_rounded_rect(draw, card_box, radius=32, fill=(10, 15, 28), outline=(60, 75, 110), width=3)
        
        draw.text((130, 920), "DRIVER'S SEAT VOICE INPUT", fill=(251, 191, 36), font=font_bold)
        
        # Red recording badge
        draw_rounded_rect(draw, [WIDTH - 360, 910, WIDTH - 130, 960], radius=14, fill=(90, 20, 20), outline=(239, 68, 68), width=2)
        draw.ellipse([WIDTH - 340, 925, WIDTH - 320, 945], fill=(239, 68, 68))
        draw.text((WIDTH - 305, 935), "RECORDING", fill=(254, 202, 202), font=font_badge)

        # Pulsing waveform
        num_bars = 17
        bar_w = 22
        gap = 20
        wx_start = (WIDTH - (num_bars * bar_w + (num_bars - 1) * gap)) // 2
        for b in range(num_bars):
            sine_val = math.sin(scene_time * 9 + b * 0.5)
            h = int(30 + abs(sine_val) * 95)
            bx = wx_start + b * (bar_w + gap)
            by1 = 1060 - h // 2
            by2 = 1060 + h // 2
            color = (251, 191, 36) if (b % 3 != 0) else (52, 211, 153)
            draw_rounded_rect(draw, [bx, by1, bx + bar_w, by2], radius=8, fill=color)

        # Transcribed text preview
        draw_rounded_rect(draw, [130, 1150, WIDTH - 130, 1340], radius=20, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        draw.text((160, 1175), '"En-suite shower replacement.', fill=(255, 255, 255), font=font_body)
        draw.text((160, 1225), 'Supply & fit bar shower, towel rail.', fill=(255, 255, 255), font=font_body)
        draw.text((160, 1275), '1 day labour on site."', fill=(52, 211, 153), font=font_bold)

    elif scene_idx == 1:
        # Scene 2: 3 package cards (Standard, Better, Premium)
        card_box = [80, 800, WIDTH - 80, 1420]
        draw_rounded_rect(draw, card_box, radius=32, fill=(10, 15, 28), outline=(60, 75, 110), width=3)
        
        draw.text((WIDTH // 2, 845), "INSTANT 3-PACKAGE QUOTE", fill=(52, 211, 153), font=font_bold, anchor="mm")
        draw.text((WIDTH // 2, 885), "Stops clients from haggling discounts", fill=(148, 163, 184), font=font_card_sub, anchor="mm")

        # 3 Packages
        tier_w = 270
        gap = 15
        tx_start = (WIDTH - (3 * tier_w + 2 * gap)) // 2

        # Standard
        draw_rounded_rect(draw, [tx_start, 930, tx_start + tier_w, 1280], radius=24, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        draw.text((tx_start + tier_w // 2, 975), "STANDARD", fill=(148, 163, 184), font=font_badge, anchor="mm")
        draw.text((tx_start + tier_w // 2, 1080), "£890", fill=(255, 255, 255), font=font_card_title, anchor="mm")
        draw.text((tx_start + tier_w // 2, 1190), "Basic Kit", fill=(148, 163, 184), font=font_badge, anchor="mm")

        # Better (Highlight / Popular)
        tx_better = tx_start + tier_w + gap
        draw_rounded_rect(draw, [tx_better, 915, tx_better + tier_w, 1310], radius=28, fill=(50, 28, 15), outline=(245, 158, 11), width=4)
        draw.text((tx_better + tier_w // 2, 960), "BETTER (POP)", fill=(251, 191, 36), font=font_badge, anchor="mm")
        draw.text((tx_better + tier_w // 2, 1070), "£1,020", fill=(251, 191, 36), font=font_hook_title, anchor="mm")
        draw.text((tx_better + tier_w // 2, 1180), "Chrome Towel Rail", fill=(240, 245, 255), font=font_badge, anchor="mm")
        draw.text((tx_better + tier_w // 2, 1240), "★ 70% Pick This", fill=(52, 211, 153), font=font_badge, anchor="mm")

        # Premium
        tx_prem = tx_start + (tier_w + gap) * 2
        draw_rounded_rect(draw, [tx_prem, 930, tx_prem + tier_w, 1280], radius=24, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        draw.text((tx_prem + tier_w // 2, 975), "PREMIUM", fill=(148, 163, 184), font=font_badge, anchor="mm")
        draw.text((tx_prem + tier_w // 2, 1080), "£1,250", fill=(255, 255, 255), font=font_card_title, anchor="mm")
        draw.text((tx_prem + tier_w // 2, 1190), "Top Thermostatic", fill=(148, 163, 184), font=font_badge, anchor="mm")

        draw_rounded_rect(draw, [120, 1340, WIDTH - 120, 1395], radius=16, fill=(15, 35, 25))
        draw.text((WIDTH // 2, 1367), "✓ Calculated with UK trade merchant prices", fill=(52, 211, 153), font=font_badge, anchor="mm")

    elif scene_idx == 2:
        # Scene 3: WhatsApp Dispatch bubble over kitchen picture
        wa_box = [100, 780, WIDTH - 100, 1380]
        draw_rounded_rect(draw, wa_box, radius=32, fill=(11, 20, 26), outline=(37, 211, 102), width=3)
        
        # WhatsApp Chat bar
        draw_rounded_rect(draw, [100, 780, WIDTH - 100, 880], radius=32, fill=(31, 44, 52))
        draw.ellipse([135, 800, 195, 860], fill=(0, 168, 132))
        draw.text((165, 830), "SJ", fill=(255, 255, 255), font=font_bold, anchor="mm")
        draw.text((220, 815), "Sarah Jenkins (Customer)", fill=(240, 245, 255), font=font_bold)
        draw.text((220, 850), "WhatsApp Delivery · No login needed", fill=(37, 211, 102), font=font_card_sub)

        # Outgoing message
        msg_box = [180, 920, WIDTH - 130, 1260]
        draw_rounded_rect(draw, msg_box, radius=24, fill=(0, 92, 75))
        draw.text((210, 950), "Hi Sarah, great seeing you today!", fill=(255, 255, 255), font=font_body)
        draw.text((210, 995), "Here is your quote with 3 package options:", fill=(255, 255, 255), font=font_body)

        # Card preview
        card_box = [210, 1050, WIDTH - 160, 1210]
        draw_rounded_rect(draw, card_box, radius=18, fill=(2, 81, 67), outline=(40, 160, 120), width=2)
        draw.text((240, 1080), "Premier Trade Services", fill=(255, 255, 255), font=font_bold)
        draw.text((240, 1125), "chuffedquotes.co.uk/q/7x9k2", fill=(160, 240, 200), font=font_card_sub)
        draw_rounded_rect(draw, [WIDTH - 360, 1110, WIDTH - 190, 1170], radius=12, fill=(255, 255, 255))
        draw.text((WIDTH - 275, 1140), "View Quote", fill=(2, 81, 67), font=font_badge, anchor="mm")

        draw.text((WIDTH - 240, 1225), "10:42 AM ✓✓", fill=(140, 210, 180), font=font_badge)

        draw_rounded_rect(draw, [100, 1300, WIDTH - 100, 1360], radius=16, fill=(15, 35, 25))
        draw.text((WIDTH // 2, 1330), "⚡ Sent before you even pull out of the drive", fill=(52, 211, 153), font=font_badge, anchor="mm")

    elif scene_idx == 3:
        # Scene 4: Customer Signs in 1 Tap
        card_box = [100, 800, WIDTH - 100, 1380]
        draw_rounded_rect(draw, card_box, radius=32, fill=(10, 15, 28), outline=(52, 211, 153), width=3)

        draw.text((150, 840), "CUSTOMER MOBILE SCREEN", fill=(148, 163, 184), font=font_badge)
        draw.text((150, 885), "Better Package Chosen — £1,020.00", fill=(251, 191, 36), font=font_card_title)

        draw.line([150, 945, WIDTH - 150, 945], fill=(35, 45, 70), width=2)

        # Digital Signature Pad
        sig_box = [150, 975, WIDTH - 150, 1180]
        draw_rounded_rect(draw, sig_box, radius=20, fill=(18, 24, 40), outline=(55, 70, 100), width=2)
        draw.text((WIDTH // 2, 1060), "Sarah Jenkins", fill=(52, 211, 153), font=font_huge, anchor="mm")
        draw.text((WIDTH // 2, 1140), "Signed on Mobile · Timestamp & IP Verified", fill=(148, 163, 184), font=font_badge, anchor="mm")

        # Huge Accepted button
        draw_rounded_rect(draw, [150, 1220, WIDTH - 150, 1340], radius=24, fill=(5, 150, 105), outline=(52, 211, 153), width=3)
        draw.text((WIDTH // 2, 1280), "✓ Quote Accepted & Locked", fill=(255, 255, 255), font=font_card_title, anchor="mm")

    elif scene_idx == 4:
        # Scene 5: Pub Fireplace / Sunday Freedom
        card_box = [100, 820, WIDTH - 100, 1380]
        draw_rounded_rect(draw, card_box, radius=32, fill=(10, 15, 28), outline=(245, 158, 11), width=3)

        draw.text((WIDTH // 2, 870), "INVOICE PAID · SUNDAY FREEDOM", fill=(251, 191, 36), font=font_bold, anchor="mm")

        inv_box = [140, 920, WIDTH - 140, 1180]
        draw_rounded_rect(draw, inv_box, radius=20, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        
        draw.text((170, 955), "Invoice INV-0012 to Sarah Jenkins", fill=(240, 245, 255), font=font_body)
        draw.text((170, 1010), "Total Paid: £1,020.00", fill=(52, 211, 153), font=font_card_title)
        draw.text((170, 1080), "Direct BACS to Sort: 20-40-60", fill=(148, 163, 184), font=font_card_sub)
        draw.text((170, 1120), "Account: 83920194 · Paid in Full", fill=(148, 163, 184), font=font_card_sub)

        # Huge Freedom statement
        draw_rounded_rect(draw, [140, 1220, WIDTH - 140, 1340], radius=24, fill=(168, 67, 34), outline=(245, 158, 11), width=3)
        draw.text((WIDTH // 2, 1280), "🍺 Sundays are for the pub. Not paperwork.", fill=(255, 255, 255), font=font_bold, anchor="mm")

    # --- SPOKEN AUDIO SUBTITLES (BOTTOM BANNER) ---
    sub_box = [60, 1490, WIDTH - 60, 1690]
    draw_rounded_rect(draw, sub_box, radius=28, fill=(10, 15, 28), outline=(60, 75, 110), width=3)

    draw.text((100, 1525), "🎙️ Spoken British Voiceover:", fill=(251, 191, 36), font=font_badge)

    narrations = [
        '"Sat in your van after looking at the job? Tap the mic and describe the work in plain English. No typing needed."',
        '"In seconds, Chuffed Quotes turns that into a priced quote, with materials and labour, and gives you Standard, Better and Premium."',
        '"Send the quote link straight to your customer on WhatsApp, before you\'ve even pulled off the drive."',
        '"Your customer picks an option, taps Accept on their phone, and types their name to sign."',
        '"And when the job\'s done, turn the accepted quote into a proper invoice in one tap."'
    ]
    sub_text = narrations[scene_idx]
    
    words = sub_text.split()
    wrapped_lines = []
    cur_line = []
    for w in words:
        test = " ".join(cur_line + [w])
        if len(test) > 42:
            wrapped_lines.append(" ".join(cur_line))
            cur_line = [w]
        else:
            cur_line.append(w)
    if cur_line:
        wrapped_lines.append(" ".join(cur_line))

    sy = 1575
    for sline in wrapped_lines[:2]:
        draw_text_with_outline(draw, (100, sy), sline, font_subtitle, fill=(255, 255, 255), outline_color=(0, 0, 0), outline_width=2)
        sy += 50

    # --- FOOTER CTA (LINK IN BIO) ---
    cta_box = [60, 1720, WIDTH - 60, 1850]
    draw_rounded_rect(draw, cta_box, radius=28, fill=(168, 67, 34), outline=(245, 120, 70), width=3)
    draw.text((WIDTH // 2, 1765), "👉 Free in Beta for UK Trades", fill=(255, 255, 255), font=font_cta, anchor="mm")
    draw.text((WIDTH // 2, 1815), "chuffedquotes.co.uk · Link in Bio", fill=(255, 230, 210), font=font_bold, anchor="mm")

    return bg


def main():
    print("Step 1: Preparing combined audio...")
    combined_audio = prepare_audio()

    print(f"Step 2: Starting cinematic video rendering ({WIDTH}x{HEIGHT} @ {FPS}fps)...")
    ffmpeg_cmd = [
        FFMPEG, "-y",
        "-f", "rawvideo",
        "-pix_fmt", "rgb24",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-r", str(FPS),
        "-i", "-",  # Video from stdin
        "-i", combined_audio,  # Audio file
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_MP4
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    total_frames = int(TOTAL_DURATION * FPS)
    print(f"Total duration: {TOTAL_DURATION:.2f}s -> {total_frames} frames")

    cum_times = [0.0]
    for d in SCENE_DURATIONS:
        cum_times.append(cum_times[-1] + d)

    frame_idx = 0
    t = 0.0
    dt = 1.0 / FPS

    while frame_idx < total_frames:
        scene_idx = 0
        for i in range(len(SCENE_DURATIONS)):
            if t < cum_times[i + 1]:
                scene_idx = i
                break
        else:
            scene_idx = len(SCENE_DURATIONS) - 1

        scene_time = t - cum_times[scene_idx]
        scene_dur = SCENE_DURATIONS[scene_idx]

        frame = render_cinematic_frame(t, scene_idx, scene_time, scene_dur)
        proc.stdin.write(frame.tobytes())

        frame_idx += 1
        t += dt

        if frame_idx % 100 == 0 or frame_idx == total_frames:
            print(f"Rendered {frame_idx}/{total_frames} frames ({frame_idx/total_frames*100:.1f}%)")

    proc.stdin.close()
    proc.wait()

    if os.path.exists(combined_audio):
        os.remove(combined_audio)

    print(f"\n[SUCCESS] Cinematic Video generated successfully: {OUTPUT_MP4}")

    # Copy to Downloads and Artifact directory
    import shutil
    try:
        shutil.copyfile(OUTPUT_MP4, DOWNLOADS_MP4)
        print(f"Copied to Downloads folder: {DOWNLOADS_MP4}")
    except Exception as e:
        print("Downloads copy error:", e)

    try:
        shutil.copyfile(OUTPUT_MP4, ARTIFACT_MP4)
        print(f"Copied to Artifact dir: {ARTIFACT_MP4}")
    except Exception as e:
        print("Artifact copy error:", e)


if __name__ == "__main__":
    main()
