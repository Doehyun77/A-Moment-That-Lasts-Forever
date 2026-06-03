#!/usr/bin/env python3
"""
Seed script: Clear existing data and create 50 sample wedding events
with posts, comments (via posts), and photos for the A-Moment-That-Lasts-Forever project.
"""

import pymysql
import secrets
import random
import string
import os
import uuid
from datetime import datetime, timedelta, date

# ── Configuration ──────────────────────
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'jspbook',
    'charset': 'utf8mb4'
}
PROJECT_DIR = '/Users/choedohyeon/Downloads/project/A-Moment-That-Lasts-Forever/jspbook'
UPLOAD_DIR = os.path.join(PROJECT_DIR, 'var', 'uploads')
PHOTO_DIR = os.path.join(PROJECT_DIR, 'var', 'uploads')  # individual files go here

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Korean Data ─────────────────────────
GROOMS = [
    "김민준", "이서준", "박도윤", "최지호", "정하준", "강지석", "조민혁", "윤태민",
    "장우진", "임현수", "한상혁", "신재민", "류호진", "권도현", "황성준", "안재현",
    "송민수", "전용준", "홍승민", "오태영", "서진우", "문정혁", "배상훈", "남궁도윤",
    "조용준", "이승우", "박태현", "김동규", "정재영", "하동훈", "곽민성", "유재혁",
    "진성준", "노형욱", "마동석", "변기수", "석진호", "선우재", "소재현", "안준수",
    "양동근", "오현민", "원호영", "유상민", "윤기준", "이동민", "장호진", "전준혁",
    "정대현", "차승민"
]

BRIDES = [
    "김서연", "이지민", "박수진", "최은지", "정다은", "강미나", "조유진", "윤소희",
    "장예진", "임지영", "한미영", "신혜진", "류지은", "권민정", "황수정", "안소영",
    "송혜미", "전지현", "홍나현", "오세희", "서민지", "문채원", "배수진", "남궁수정",
    "차주연", "이보람", "박혜원", "김수정", "정혜수", "하다연", "곽지은", "유미선",
    "진수연", "노은정", "마혜진", "변서영", "석지현", "선우진", "소정민", "안수미",
    "양혜선", "오지은", "원수정", "유하나", "윤미영", "이선영", "장혜리", "전미경",
    "정수연", "차현정"
]

SURNAMES_F = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "신", "류", "권", "황", "안", "송", "전", "홍", "오", "서", "문", "배", "남궁", "차", "곽", "진", "노", "마", "변", "석", "선우", "소", "양", "원", "유", "하"]
GIVEN_F_M = ["민준", "서준", "도윤", "지호", "하준", "지석", "민혁", "태민", "우진", "현수", "상혁", "재민", "호진", "도현", "성준", "재현", "민수", "용준", "승민", "태영", "진우", "정혁", "상훈", "도윤", "용준", "승우", "태현", "동규", "재영", "동훈"]
GIVEN_F_F = ["서연", "지민", "수진", "은지", "다은", "미나", "유진", "소희", "예진", "지영", "미영", "혜진", "지은", "민정", "수정", "소영", "혜미", "지현", "나현", "세희", "민지", "채원", "수진", "수정", "주연", "보람", "혜원", "수정", "혜수", "다연"]

def random_groom_name():
    return random.choice(SURNAMES_F) + random.choice(GIVEN_F_M)

def random_bride_name():
    return random.choice(SURNAMES_F) + random.choice(GIVEN_F_F)

GUEST_NAMES = [
    "김영희", "이철수", "박민호", "최수미", "정대호", "강미영", "조성민", "윤지현",
    "장영철", "임혜진", "한상민", "신지혜", "류재호", "권혜수", "황인호", "안미영",
    "송재민", "전혜진", "홍영수", "오미정", "서재호", "문수진", "배철민", "차미영",
    "곽영준", "유혜진", "하재민", "진수미", "노영호", "마혜영", "변재수", "석지영",
    "소영민", "양수진", "원재호", "유미영", "하영호", "진수민", "노혜정", "마영미",
    "윤재호", "이미영", "정영수", "강혜진", "조재민", "최미정", "박영호", "김수진"
]

MESSAGES = [
    "진심으로 축하드립니다! 두 분의 앞날에 행복이 가득하길 바랍니다.",
    "아름다운 결혼식이었어요. 평생 사랑하며 행복하게 사세요!",
    "축축축❤❤❤ 두 분 너무 잘 어울려요! 결혼 진심으로 축하해요!",
    "오늘 주인공들 너무 예쁘고 멋져요 🩷 행복한 가정 꾸리세요!",
    "대학 시절부터 함께해온 두 분의 결혼을 보니 감회가 새롭네요. 축하합니다!",
    "신랑 신부님, 오늘 너무 아름다워요♥ 두 분의 앞날에 신의 축복이 있기를!",
    "항상 웃음 가득한 가정 이루세요! 결혼 축하드립니다!",
    "두 분의 만남이 너무 감동적이에요. 진심으로 축하합니다 💕",
    "회사 선배님 결혼 진심으로 축하드립니다! 행복하게 사세요!",
    "예쁜 신부님 멋진 신랑님! 평생 행복하세요 😊",
    "친구야 드디어 결혼하는구나! 너무 기쁘고 축하해! 앞날에 행복만 가득하길!",
    "두 분 인생의 새로운 시작을 진심으로 축하합니다. 사랑과 행복이 가득한 가정 이루세요!",
    "서로 아껴주고 사랑하는 두 분의 모습이 너무 보기 좋습니다. 축하해요!",
    "오늘 최고의 날! 두 분의 앞날을 응원합니다 🎉",
    "신부님 정말 아름다우세요! 신랑님 너무 멋져요! 행복한 미래를 응원합니다!",
    "함께하는 모든 날이 오늘처럼 행복하길 바랍니다. 축하드려요~",
    "멀리서나마 축하드립니다! 두 분 천생연분이에요 💖",
    "행복한 결혼 생활을 기원합니다! 두 분 정말 잘 어울려요!",
    "오늘 결혼식 정말 감동적이었어요. 두 분 영원히 행복하세요!",
    "축하합니다! 두 분의 사랑이 영원하길 바랍니다 🥰",
    "신혼여행 재미있게 다녀오세요! 결혼 축하해요!",
    "두 분의 아름다운 시작을 함께할 수 있어 영광입니다. 평생 행복하세요!",
    "동창의 결혼을 축하합니다! 우리 모두 응원할게요!",
    "가정의 달에 결혼하시는 두 분, 앞으로 더 행복한 날들만 가득하길!",
    "서로를 닮아가는 두 분이 너무 부럽습니다. 축하해요!!",
    "오늘 하루만큼은 세상에서 제일 행복한 사람들! 축하합니다 🎊",
    "두 분의 결혼을 진심으로 축복합니다. 인생의 동반자와 함께하는 모든 날이 행복하길!",
    "우리 오빠 결혼 축하해! 새언니 너무 예뻐요! 가족이 되어서 기뻐요 💕",
    "멋진 신랑 예쁜 신부! 두 분의 앞날에 행복만 가득하길 기도할게요 🙏",
    "결혼은 끝이 아니라 시작이래요. 두 분의 새로운 시작을 축하합니다!",
    "함께 걸어갈 두 분을 위해 항상 응원합니다! 축하드려요~",
    "사랑의 결실을 맺은 두 분, 앞으로도 계속 사랑하며 행복하게 사세요!",
    "너무 예쁜 신랑신부! 오늘 최고의 날이에요! 축하합니다 💝",
    "믿음으로 시작하는 가정, 하나님의 축복이 가득하길 기도합니다.",
    "고등학교 때부터 만난 두 분의 결혼을 보니 눈물이 나요. 정말 축하합니다!",
    "두 분의 미래가 항상 밝고 행복하길 바랍니다. 결혼 축하드려요!",
    "어느 때보다 아름다운 오늘! 두 분 결혼을 진심으로 축복합니다 💐",
    "선배님 결혼 축하드려요! 우리 모두 응원하고 있어요!",
    "작은 천국을 이룬 두 분! 항상 웃음이 떠나지 않는 가정 되세요!",
    "평생의 반려자를 만난 두 분께 진심으로 축복을 전합니다. 행복하세요!",
    "쪽팔리지만 눈물 난다 정말 축하한다 친구야 ❤️",
    "멀리서 마음으로 축하드립니다! 두 분 정말 천생연분!",
    "두 분의 사랑 이야기를 옆에서 지켜봐온 사람으로서 정말 감격스럽네요. 축하합니다!",
    "아름다운 동행의 시작을 축복합니다. 두 분의 앞날에 행복이 함께하기를!",
    "오늘의 감동 잊지 말고 평생 함께 행복하게 사세요! 축하해요!",
    "신랑 신부님 결혼 축하드려요! 오늘 너무 아름다운 날이에요~",
    "항상 건강하고 사랑 가득한 가정 이루세요! 축하합니다 🎉",
    "두 분의 결혼을 축하하며, 앞으로 펼쳐질 행복한 날들을 기대합니다!",
    "인생의 동반자를 만난 두 분께 진심으로 축하를 보냅니다!",
    "오늘 가장 행복한 두 분! 평생 이 행복이 이어지길 바랍니다 💕"
]

POST_CATEGORIES = ["축하", "응원", "추억", "감동", "웃김"]

def random_guest_name():
    return random.choice(GUEST_NAMES)

def random_event_code():
    return secrets.token_hex(4)  # 8 chars

def random_date_range(months_ago=12, months_ahead=12):
    """Generate a wedding date within range: -12 months to +12 months from today"""
    today = date.today()
    start = today - timedelta(days=months_ago * 30)
    end = today + timedelta(days=months_ahead * 30)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def conn_db():
    return pymysql.connect(**DB_CONFIG)

# ── Step 1: Generate 50 Wedding Events ──
def generate_events():
    today = date.today()
    events = []
    used_codes = set()
    used_couples = set()

    # Ensure some today events (current date)
    for _ in range(6):
        while True:
            code = random_event_code()
            if code not in used_codes:
                used_codes.add(code)
                break
        while True:
            groom = random_groom_name()
            bride = random_bride_name()
            couple = (groom, bride)
            if couple not in used_couples:
                used_couples.add(couple)
                break
        wedding_date = today
        created_at = wedding_date - timedelta(days=random.randint(3, 60))
        qr_start = wedding_date - timedelta(days=random.randint(3, 7))
        qr_end = wedding_date + timedelta(days=random.randint(1, 5))
        events.append((code, groom, bride, created_at, wedding_date, qr_start, qr_end))

    # Past events (about 25)
    for _ in range(25):
        while True:
            code = random_event_code()
            if code not in used_codes:
                used_codes.add(code)
                break
        while True:
            groom = random_groom_name()
            bride = random_bride_name()
            couple = (groom, bride)
            if couple not in used_couples:
                used_couples.add(couple)
                break
        days_ago = random.randint(10, 360)
        wedding_date = today - timedelta(days=days_ago)
        created_at = wedding_date - timedelta(days=random.randint(3, 90))
        qr_start = wedding_date - timedelta(days=random.randint(3, 7))
        qr_end = wedding_date + timedelta(days=random.randint(1, 5))
        events.append((code, groom, bride, created_at, wedding_date, qr_start, qr_end))

    # Future events (about 19)
    for _ in range(19):
        while True:
            code = random_event_code()
            if code not in used_codes:
                used_codes.add(code)
                break
        while True:
            groom = random_groom_name()
            bride = random_bride_name()
            couple = (groom, bride)
            if couple not in used_couples:
                used_couples.add(couple)
                break
        days_ahead = random.randint(5, 180)
        wedding_date = today + timedelta(days=days_ahead)
        created_at = today - timedelta(days=random.randint(0, 60))
        qr_start = wedding_date - timedelta(days=random.randint(3, 7))
        qr_end = wedding_date + timedelta(days=random.randint(1, 5))
        events.append((code, groom, bride, created_at, wedding_date, qr_start, qr_end))

    return events

# ── Step 2: Insert into DB ─────────────
def insert_data(events, has_photos=False):
    conn = conn_db()
    cur = conn.cursor()
    
    try:
        # Insert events
        sql_event = """INSERT INTO wedding_event 
            (event_code, groom_name, bride_name, created_at, wedding_date, qr_start_date, qr_end_date, deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        
        event_ids = []
        for ev in events:
            code, groom, bride, created, wedding, qrs, qre = ev
            cur.execute(sql_event, (code, groom, bride, created, wedding, qrs, qre, False))
            event_ids.append((cur.lastrowid, code, groom, bride, wedding))
        
        conn.commit()
        print(f"✅ Inserted {len(event_ids)} wedding events")

        # Insert posts for ~20 events
        sql_post = """INSERT INTO post 
            (event_id, guest_name, side, category, message, owner_session_id, likes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
        
        post_ids = []
        events_with_posts = random.sample(event_ids, min(20, len(event_ids)))
        
        for eid, ecode, groom, bride, wdate in events_with_posts:
            num_posts = random.randint(2, 6)
            for _ in range(num_posts):
                guest = random_guest_name()
                side = random.choice(["신랑", "신부"])
                cat = random.choice(POST_CATEGORIES)
                msg = random.choice(MESSAGES)
                likes = random.randint(0, 35)
                created = datetime.combine(wdate, datetime.min.time()) - timedelta(hours=random.randint(1, 72))
                session_id = str(uuid.uuid4())
                cur.execute(sql_post, (eid, guest, side, cat, msg, session_id, likes, created))
                post_ids.append((cur.lastrowid, ecode))
        
        conn.commit()
        print(f"✅ Inserted {len(post_ids)} posts across {len(events_with_posts)} events")

        # Insert photos for ~8 events (each with 1-3 photos)
        sql_photo = """INSERT INTO photo 
            (post_id, file_name, file_path, uploaded_at)
            VALUES (%s, %s, %s, %s)"""
        
        photo_records = []
        events_with_photos = random.sample(events_with_posts, min(8, len(events_with_posts)))
        
        # Get post_ids that belong to selected events
        post_ids_by_event = {}
        for pid, ecode in post_ids:
            post_ids_by_event.setdefault(ecode, []).append(pid)
        
        photo_index = 0
        for eid, ecode, groom, bride, wdate in events_with_photos:
            if ecode not in post_ids_by_event:
                continue
            available_posts = post_ids_by_event[ecode]
            num_photos_per_event = random.randint(1, 3)
            
            # Create event upload dir
            event_dir = os.path.join(UPLOAD_DIR, ecode)
            os.makedirs(event_dir, exist_ok=True)
            
            for _ in range(num_photos_per_event):
                pid = random.choice(available_posts)
                photo_index += 1
                file_id = str(uuid.uuid4())
                file_name = f"post_{file_id}.jpg"
                uploaded_at = datetime.combine(wdate, datetime.min.time()) - timedelta(hours=random.randint(1, 12))
                
                # For photo files, we'll use placeholder or download actual images
                # Using placeholder creation for now; real images downloaded separately
                
                photo_records.append((pid, file_name, ecode, uploaded_at, event_dir, file_id))
                cur.execute(sql_photo, (pid, file_name, os.path.join(ecode, file_name), uploaded_at))
        
        conn.commit()
        print(f"✅ Inserted {len(photo_records)} photo records")
        
        return event_ids, post_ids, photo_records
    
    finally:
        cur.close()
        conn.close()


# ── Run (DB only—photos downloaded separately) ──
if __name__ == "__main__":
    print("🚀 Generating 50 wedding events...")
    events = generate_events()
    
    print(f"📊 Events breakdown:")
    today = date.today()
    today_count = sum(1 for e in events if e[4] == today)
    past_count = sum(1 for e in events if e[4] < today)
    future_count = sum(1 for e in events if e[4] > today)
    print(f"   오늘: {today_count}, 지난: {past_count}, 예정: {future_count}")
    
    print("\n📝 Inserting into database...")
    event_ids, post_ids, photo_records = insert_data(events)
    
    print(f"\n{'='*50}")
    print(f"✅ DB SEED COMPLETE!")
    print(f"   Weddings: {len(event_ids)}")
    print(f"   Posts: {len(post_ids)}")
    print(f"   Photo records: {len(photo_records)}")
    print(f"")
    print(f"   📸 Run download_photos.sh next to fetch actual images")
    print(f"{'='*50}")
    
    # Output photo info for download script
    import json
    photo_info = []
    for pid, fname, ecode, uploaded, event_dir, file_id in photo_records:
        photo_info.append({
            'pid': pid,
            'fname': fname,
            'ecode': ecode,
            'dir': event_dir,
            'file_id': file_id
        })
    with open('/tmp/photo_manifest.json', 'w') as f:
        json.dump(photo_info, f, indent=2)
    print(f"📋 Photo manifest written to /tmp/photo_manifest.json")
