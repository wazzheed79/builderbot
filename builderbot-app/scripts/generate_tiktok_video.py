"""
Generate Vertical 9:16 (1080x1920) Video for TikTok / Reels / Shorts
Combines the 5 authentic audio clips with animated visual scenes.
"""

import os
import subprocess
import math
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1080
HEIGHT = 1920
FPS = 30

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
AUDIO_DIR = r"C:\Users\wazzh\builderbot\builderbot-app\public\audio\walkthrough"
OUTPUT_DIR = r"C:\Users\wazzh\builderbot\builderbot-app\public"
OUTPUT_MP4 = os.path.join(OUTPUT_DIR, "chuffed-quotes-tiktok-demo.mp4")
ARTIFACT_MP4 = r"C:\Users\wazzh\.gemini\antigravity\brain\9898c287-093f-405c-9b01-63f5f4e64d8c\chuffed-quotes-tiktok.mp4"
DOWNLOADS_MP4 = r"C:\Users\wazzh\Downloads\chuffed-quotes-tiktok.mp4"

# Scene timings matching the audio clips
SCENE_DURATIONS = [6.89, 8.76, 5.52, 5.16, 5.42]
TOTAL_DURATION = sum(SCENE_DURATIONS)

# Fonts
WIN_DIR = os.environ.get("WINDIR", r"C:\Windows")
FONT_BOLD_PATH = os.path.join(WIN_DIR, "Fonts", "segoeuib.ttf")
FONT_REG_PATH = os.path.join(WIN_DIR, "Fonts", "segoeui.ttf")
if not os.path.exists(FONT_BOLD_PATH):
    FONT_BOLD_PATH = os.path.join(WIN_DIR, "Fonts", "arialbd.ttf")
    FONT_REG_PATH = os.path.join(WIN_DIR, "Fonts", "arial.ttf")

font_hook_title = ImageFont.truetype(FONT_BOLD_PATH, 54)
font_hook_sub = ImageFont.truetype(FONT_BOLD_PATH, 38)
font_card_title = ImageFont.truetype(FONT_BOLD_PATH, 42)
font_card_sub = ImageFont.truetype(FONT_REG_PATH, 28)
font_body = ImageFont.truetype(FONT_REG_PATH, 32)
font_bold = ImageFont.truetype(FONT_BOLD_PATH, 34)
font_subtitle = ImageFont.truetype(FONT_BOLD_PATH, 36)
font_badge = ImageFont.truetype(FONT_BOLD_PATH, 26)
font_cta = ImageFont.truetype(FONT_BOLD_PATH, 40)

# Concatenate audio clips
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


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def render_frame(t, scene_idx, scene_time):
    # Background
    img = Image.new("RGB", (WIDTH, HEIGHT), (11, 15, 25))
    draw = ImageDraw.Draw(img)

    # Ambient decorative gradients
    # Top amber glow
    draw.ellipse([WIDTH // 2 - 400, -200, WIDTH // 2 + 400, 300], fill=(45, 25, 15))
    # Bottom emerald glow
    draw.ellipse([WIDTH // 2 - 450, HEIGHT - 350, WIDTH // 2 + 450, HEIGHT + 250], fill=(10, 35, 25))

    # --- TOP HOOK (Viral TikTok Style) ---
    hook_box = [60, 90, WIDTH - 60, 260]
    draw_rounded_rect(draw, hook_box, radius=32, fill=(24, 30, 48), outline=(60, 75, 110), width=3)
    
    # "POV: Quoting from the van in 30 seconds"
    draw.text((WIDTH // 2, 140), "POV: Quoting from the van in 30s", fill=(255, 215, 0), font=font_hook_title, anchor="mm")
    draw.text((WIDTH // 2, 210), "No more losing Sundays to paperwork 🚫📄", fill=(240, 245, 255), font=font_hook_sub, anchor="mm")

    # --- STEP INDICATOR PILLS (1 to 5) ---
    pill_y = 300
    pill_w = 170
    spacing = 20
    start_x = (WIDTH - (5 * pill_w + 4 * spacing)) // 2
    step_names = ["1. Speak", "2. Price", "3. Send", "4. Sign", "5. Paid"]

    for i in range(5):
        px = start_x + i * (pill_w + spacing)
        active = (i == scene_idx)
        bg = (196, 82, 42) if active else (24, 30, 46)
        border = (255, 140, 90) if active else (45, 55, 80)
        text_color = (255, 255, 255) if active else (140, 150, 175)
        draw_rounded_rect(draw, [px, pill_y, px + pill_w, pill_y + 55], radius=16, fill=bg, outline=border, width=2)
        draw.text((px + pill_w // 2, pill_y + 27), step_names[i], fill=text_color, font=font_badge, anchor="mm")

    # --- PHONE MOCKUP FRAME (CENTER) ---
    phone_box = [80, 390, WIDTH - 80, 1460]
    draw_rounded_rect(draw, phone_box, radius=48, fill=(15, 20, 35), outline=(55, 68, 100), width=4)

    # Top Phone Notch / Island
    draw_rounded_rect(draw, [WIDTH // 2 - 130, 415, WIDTH // 2 + 130, 455], radius=20, fill=(5, 8, 15))

    # App Brand Header
    draw_rounded_rect(draw, [120, 485, 185, 550], radius=16, fill=(168, 67, 34))
    draw.text((152, 517), "CQ", fill=(255, 255, 255), font=font_bold, anchor="mm")
    draw.text((205, 502), "Chuffed Quotes", fill=(255, 255, 255), font=font_card_title)
    draw.text((205, 545), "UK Trades Mobile Quoting · Beta", fill=(148, 163, 184), font=font_card_sub)

    # Dividing line
    draw.line([120, 585, WIDTH - 120, 585], fill=(35, 45, 70), width=2)

    # --- DYNAMIC SCENE CONTENT ---
    if scene_idx == 0:
        # SCENE 1: SPEAK NOTES FROM THE VAN
        draw.text((120, 620), "DRIVER'S SEAT VOICE INPUT", fill=(251, 191, 36), font=font_bold)
        draw_rounded_rect(draw, [WIDTH - 360, 610, WIDTH - 120, 660], radius=16, fill=(80, 20, 20), outline=(220, 50, 50), width=2)
        # Recording ping dot
        draw.ellipse([WIDTH - 340, 625, WIDTH - 320, 645], fill=(239, 68, 68))
        draw.text((WIDTH - 305, 635), "RECORDING", fill=(254, 202, 202), font=font_badge)

        # Animated Audio Waveform
        wave_box = [120, 690, WIDTH - 120, 880]
        draw_rounded_rect(draw, wave_box, radius=24, fill=(10, 14, 25), outline=(35, 45, 70), width=2)
        
        num_bars = 19
        bar_w = 20
        gap = 22
        wx_start = (WIDTH - (num_bars * bar_w + (num_bars - 1) * gap)) // 2
        for b in range(num_bars):
            # Dynamic wave bounce
            sine_val = math.sin(scene_time * 8 + b * 0.45)
            h = int(35 + abs(sine_val) * 110)
            bx = wx_start + b * (bar_w + gap)
            by1 = 785 - h // 2
            by2 = 785 + h // 2
            color = (251, 191, 36) if (b % 3 != 0) else (52, 211, 153)
            draw_rounded_rect(draw, [bx, by1, bx + bar_w, by2], radius=10, fill=color)

        # Transcribed text box
        draw.text((120, 920), "Transcribed in plain English (No typing):", fill=(148, 163, 184), font=font_card_sub)
        text_box = [120, 960, WIDTH - 120, 1260]
        draw_rounded_rect(draw, text_box, radius=24, fill=(10, 14, 25), outline=(50, 60, 90), width=2)
        
        lines = [
            '"En-suite shower replacement.',
            'Supply and fit thermostatic bar shower,',
            'riser rail, and chrome heated towel rail.',
            'Replace isolating valves & test.',
            '1 day on site."'
        ]
        ly = 995
        for line in lines:
            draw.text((150, ly), line, fill=(255, 255, 255), font=font_body)
            ly += 50

        draw_rounded_rect(draw, [120, 1310, WIDTH - 120, 1410], radius=20, fill=(35, 25, 15), outline=(180, 90, 40), width=2)
        draw.text((WIDTH // 2, 1360), "⚡ Takes 15 seconds from the steering wheel", fill=(255, 190, 120), font=font_bold, anchor="mm")

    elif scene_idx == 1:
        # SCENE 2: 30-SECOND UK PRICING
        draw.text((120, 620), "AUTOMATED UK TRADE PRICING", fill=(52, 211, 153), font=font_bold)
        draw.text((WIDTH - 300, 620), "Job #CQ-1042", fill=(148, 163, 184), font=font_bold)

        # Itemised Table
        table_box = [120, 680, WIDTH - 120, 1070]
        draw_rounded_rect(draw, table_box, radius=24, fill=(10, 14, 25), outline=(35, 45, 70), width=2)

        items = [
            ("Thermostatic Bar Shower Kit & Riser", "1", "£245.00"),
            ("Chrome Heated Towel Rail (1200x500)", "1", "£165.00"),
            ("Certified Plumbing Labour (8 hrs)", "8 hrs", "£440.00"),
            ("Sundries, Pipework & Isolation Valves", "1 lot", "£40.00")
        ]
        ty = 710
        for desc, qty, amt in items:
            draw.text((150, ty), desc, fill=(240, 245, 255), font=font_body)
            draw.text((WIDTH - 270, ty), amt, fill=(52, 211, 153), font=font_bold)
            draw.line([150, ty + 65, WIDTH - 150, ty + 65], fill=(25, 32, 50), width=1)
            ty += 90

        # 3 Option Packages
        draw.text((120, 1100), "CHOOSE 1 OR 3 PRICE TIERS:", fill=(148, 163, 184), font=font_card_sub)
        
        tier_w = 260
        gap = 15
        tx_start = (WIDTH - (3 * tier_w + 2 * gap)) // 2

        # Standard
        draw_rounded_rect(draw, [tx_start, 1140, tx_start + tier_w, 1340], radius=20, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        draw.text((tx_start + tier_w // 2, 1175), "STANDARD", fill=(148, 163, 184), font=font_badge, anchor="mm")
        draw.text((tx_start + tier_w // 2, 1250), "£890", fill=(255, 255, 255), font=font_card_title, anchor="mm")

        # Better (Highlight)
        tx_better = tx_start + tier_w + gap
        draw_rounded_rect(draw, [tx_better, 1130, tx_better + tier_w, 1360], radius=24, fill=(50, 28, 15), outline=(245, 158, 11), width=4)
        draw.text((tx_better + tier_w // 2, 1165), "BETTER (POPULAR)", fill=(251, 191, 36), font=font_badge, anchor="mm")
        draw.text((tx_better + tier_w // 2, 1250), "£1,020", fill=(251, 191, 36), font=font_card_title, anchor="mm")
        draw.text((tx_better + tier_w // 2, 1320), "Most Clients Pick", fill=(220, 220, 220), font=font_badge, anchor="mm")

        # Premium
        tx_prem = tx_start + (tier_w + gap) * 2
        draw_rounded_rect(draw, [tx_prem, 1140, tx_prem + tier_w, 1340], radius=20, fill=(18, 24, 40), outline=(45, 55, 80), width=2)
        draw.text((tx_prem + tier_w // 2, 1175), "PREMIUM", fill=(148, 163, 184), font=font_badge, anchor="mm")
        draw.text((tx_prem + tier_w // 2, 1250), "£1,250", fill=(255, 255, 255), font=font_card_title, anchor="mm")

        draw_rounded_rect(draw, [120, 1380, WIDTH - 120, 1435], radius=16, fill=(15, 35, 25))
        draw.text((WIDTH // 2, 1407), "✓ You check & adjust every price before sending", fill=(52, 211, 153), font=font_badge, anchor="mm")

    elif scene_idx == 2:
        # SCENE 3: WHATSAPP SEND
        draw.text((120, 620), "INSTANT WHATSAPP DISPATCH", fill=(37, 211, 102), font=font_bold)
        draw.text((WIDTH - 360, 620), "No login for client", fill=(148, 163, 184), font=font_card_sub)

        # WhatsApp Phone UI Simulation
        wa_box = [120, 680, WIDTH - 120, 1260]
        draw_rounded_rect(draw, wa_box, radius=28, fill=(11, 20, 26), outline=(30, 60, 45), width=3)

        # Header bar
        draw_rounded_rect(draw, [120, 680, WIDTH - 120, 780], radius=28, fill=(31, 44, 52))
        draw.ellipse([145, 700, 205, 760], fill=(0, 168, 132))
        draw.text((175, 730), "SJ", fill=(255, 255, 255), font=font_bold, anchor="mm")
        draw.text((225, 715), "Sarah Jenkins (Customer)", fill=(240, 245, 255), font=font_bold)
        draw.text((225, 750), "Online", fill=(37, 211, 102), font=font_card_sub)

        # Outgoing message bubble (Green WhatsApp style)
        msg_box = [200, 820, WIDTH - 145, 1180]
        draw_rounded_rect(draw, msg_box, radius=24, fill=(0, 92, 75))
        
        draw.text((230, 850), "Hi Sarah, great seeing you today!", fill=(255, 255, 255), font=font_body)
        draw.text((230, 900), "Here is your quote with 3 package options:", fill=(255, 255, 255), font=font_body)

        # Link Preview Card inside WhatsApp
        card_box = [230, 960, WIDTH - 175, 1120]
        draw_rounded_rect(draw, card_box, radius=18, fill=(2, 81, 67), outline=(40, 160, 120), width=2)
        draw.text((260, 990), "Premier Trade Services — Quote #1042", fill=(255, 255, 255), font=font_bold)
        draw.text((260, 1040), "chuffedquotes.co.uk/q/7x9k2", fill=(160, 240, 200), font=font_card_sub)
        draw_rounded_rect(draw, [WIDTH - 360, 1025, WIDTH - 200, 1085], radius=14, fill=(255, 255, 255))
        draw.text((WIDTH - 280, 1055), "View Quote", fill=(2, 81, 67), font=font_badge, anchor="mm")

        draw.text((WIDTH - 240, 1145), "10:42 AM ✓✓", fill=(140, 210, 180), font=font_badge)

        draw_rounded_rect(draw, [120, 1310, WIDTH - 120, 1410], radius=20, fill=(15, 35, 25), outline=(37, 211, 102), width=2)
        draw.text((WIDTH // 2, 1360), "⚡ Sent before you even pull out of the drive", fill=(160, 245, 190), font=font_bold, anchor="mm")

    elif scene_idx == 3:
        # SCENE 4: 1-TAP CUSTOMER SIGNATURE
        draw.text((120, 620), "CUSTOMER MOBILE SCREEN", fill=(52, 211, 153), font=font_bold)
        draw_rounded_rect(draw, [WIDTH - 320, 610, WIDTH - 120, 660], radius=16, fill=(15, 45, 30), outline=(52, 211, 153), width=2)
        draw.text((WIDTH - 220, 635), "Client View", fill=(160, 245, 190), font=font_badge, anchor="mm")

        card_box = [120, 680, WIDTH - 120, 1380]
        draw_rounded_rect(draw, card_box, radius=28, fill=(10, 14, 25), outline=(35, 45, 70), width=2)

        draw.text((160, 720), "Selected Option:", fill=(148, 163, 184), font=font_card_sub)
        draw.text((160, 765), "Better Package — £1,020.00", fill=(251, 191, 36), font=font_card_title)

        draw.line([160, 830, WIDTH - 160, 830], fill=(30, 40, 65), width=2)

        # Digital Signature Pad Simulation
        draw.text((160, 860), "CUSTOMER DIGITAL SIGNATURE", fill=(148, 163, 184), font=font_badge)
        sig_box = [160, 910, WIDTH - 160, 1140]
        draw_rounded_rect(draw, sig_box, radius=20, fill=(18, 24, 40), outline=(55, 70, 100), width=2)
        
        # Script Signature rendering
        draw.text((WIDTH // 2, 1010), "Sarah Jenkins", fill=(52, 211, 153), font=font_hook_title, anchor="mm")
        draw.text((WIDTH // 2, 1090), "Signed on Mobile · Timestamp & IP Verified", fill=(148, 163, 184), font=font_badge, anchor="mm")

        # Huge Accepted Button
        draw_rounded_rect(draw, [160, 1200, WIDTH - 160, 1320], radius=24, fill=(5, 150, 105), outline=(52, 211, 153), width=3)
        draw.text((WIDTH // 2, 1260), "✓ Quote Accepted & Locked", fill=(255, 255, 255), font=font_card_title, anchor="mm")

    elif scene_idx == 4:
        # SCENE 5: 1-CLICK INVOICE CONVERSION
        draw.text((120, 620), "1-CLICK INVOICE CONVERSION", fill=(251, 191, 36), font=font_bold)
        draw_rounded_rect(draw, [WIDTH - 300, 610, WIDTH - 120, 660], radius=16, fill=(20, 40, 30), outline=(52, 211, 153), width=2)
        draw.text((WIDTH - 210, 635), "INV-0012", fill=(52, 211, 153), font=font_bold, anchor="mm")

        inv_box = [120, 680, WIDTH - 120, 1280]
        draw_rounded_rect(draw, inv_box, radius=28, fill=(10, 14, 25), outline=(35, 45, 70), width=2)

        draw.text((160, 720), "Invoice To: Sarah Jenkins", fill=(255, 255, 255), font=font_card_title)
        draw.text((160, 775), "En-suite Shower Replacement · Due in 14 days", fill=(148, 163, 184), font=font_card_sub)

        draw.line([160, 830, WIDTH - 160, 830], fill=(30, 40, 65), width=2)

        draw.text((160, 870), "TOTAL DUE", fill=(148, 163, 184), font=font_badge)
        draw.text((160, 930), "£1,020.00", fill=(255, 255, 255), font=font_hook_title)

        # Bank Details Box
        bacs_box = [160, 1020, WIDTH - 160, 1220]
        draw_rounded_rect(draw, bacs_box, radius=20, fill=(20, 26, 45), outline=(60, 75, 110), width=2)
        draw.text((190, 1055), "BANK PAYMENT (BACS)", fill=(251, 191, 36), font=font_bold)
        draw.text((190, 1110), "Sort Code: 20-40-60", fill=(240, 245, 255), font=font_body)
        draw.text((190, 1160), "Account No: 83920194", fill=(240, 245, 255), font=font_body)
        draw_rounded_rect(draw, [WIDTH - 360, 1090, WIDTH - 190, 1170], radius=16, fill=(10, 120, 70))
        draw.text((WIDTH - 275, 1130), "Paid Direct", fill=(255, 255, 255), font=font_badge, anchor="mm")

        # Celebration callout
        draw_rounded_rect(draw, [120, 1320, WIDTH - 120, 1420], radius=20, fill=(45, 25, 15), outline=(245, 158, 11), width=2)
        draw.text((WIDTH // 2, 1370), "🎉 Paid on time. Zero Sunday paperwork.", fill=(255, 215, 0), font=font_bold, anchor="mm")

    # --- SPOKEN AUDIO SUBTITLES (BOTTOM BANNER) ---
    sub_box = [60, 1500, WIDTH - 60, 1690]
    draw_rounded_rect(draw, sub_box, radius=28, fill=(16, 22, 38), outline=(60, 75, 110), width=3)

    # Mic speaker icon
    draw.text((100, 1530), "🎙️ British Voice Narration:", fill=(251, 191, 36), font=font_badge)

    narrations = [
        '"Sat in your van after looking at the job? Tap the mic and describe the work in plain English. No typing needed."',
        '"In seconds, Chuffed Quotes turns that into a priced quote, with materials and labour, and gives you Standard, Better and Premium."',
        '"Send the quote link straight to your customer on WhatsApp, before you\'ve even pulled off the drive."',
        '"Your customer picks an option, taps Accept on their phone, and types their name to sign."',
        '"And when the job\'s done, turn the accepted quote into a proper invoice in one tap."'
    ]
    sub_text = narrations[scene_idx]
    
    # Wrap subtitle text
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

    sy = 1580
    for sline in wrapped_lines[:2]:
        draw.text((100, sy), sline, fill=(255, 255, 255), font=font_subtitle)
        sy += 48

    # --- FOOTER CTA (LINK IN BIO) ---
    cta_box = [60, 1720, WIDTH - 60, 1850]
    draw_rounded_rect(draw, cta_box, radius=28, fill=(168, 67, 34), outline=(245, 120, 70), width=3)
    draw.text((WIDTH // 2, 1765), "👉 Free in Beta for UK Trades", fill=(255, 255, 255), font=font_cta, anchor="mm")
    draw.text((WIDTH // 2, 1815), "chuffedquotes.co.uk · Link in Bio", fill=(255, 230, 210), font=font_bold, anchor="mm")

    return img


def main():
    print("Step 1: Preparing combined audio...")
    combined_audio = prepare_audio()

    print(f"Step 2: Starting ffmpeg video rendering ({WIDTH}x{HEIGHT} @ {FPS}fps)...")
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
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_MP4
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    total_frames = int(TOTAL_DURATION * FPS)
    print(f"Total duration: {TOTAL_DURATION:.2f}s -> {total_frames} frames")

    # Render frames
    frame_idx = 0
    t = 0.0
    dt = 1.0 / FPS

    cum_times = [0.0]
    for d in SCENE_DURATIONS:
        cum_times.append(cum_times[-1] + d)

    while frame_idx < total_frames:
        # Determine active scene
        scene_idx = 0
        for i in range(len(SCENE_DURATIONS)):
            if t < cum_times[i + 1]:
                scene_idx = i
                break
        else:
            scene_idx = len(SCENE_DURATIONS) - 1

        scene_time = t - cum_times[scene_idx]

        frame = render_frame(t, scene_idx, scene_time)
        proc.stdin.write(frame.tobytes())

        frame_idx += 1
        t += dt

        if frame_idx % 100 == 0 or frame_idx == total_frames:
            print(f"Rendered {frame_idx}/{total_frames} frames ({frame_idx/total_frames*100:.1f}%)")

    proc.stdin.close()
    proc.wait()

    if os.path.exists(combined_audio):
        os.remove(combined_audio)

    print(f"\n[SUCCESS] Video generated successfully: {OUTPUT_MP4}")

    # Copy to Artifact directory & Downloads
    import shutil
    try:
        shutil.copyfile(OUTPUT_MP4, ARTIFACT_MP4)
        print(f"Copied to Artifact dir: {ARTIFACT_MP4}")
    except Exception as e:
        print("Artifact copy error:", e)

    try:
        shutil.copyfile(OUTPUT_MP4, DOWNLOADS_MP4)
        print(f"Copied to Downloads folder: {DOWNLOADS_MP4}")
    except Exception as e:
        print("Downloads copy error:", e)


if __name__ == "__main__":
    main()
