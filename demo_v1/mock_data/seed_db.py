import json
import os
import random
import datetime
import bcrypt
import pymysql

# Reference current date: 2026-09-20
CURRENT_TIME = datetime.datetime(2026, 9, 20, 10, 50, 0)
CURRENT_DATE = CURRENT_TIME.date()

# Pre-hashed password for 'password123'
DEFAULT_RAW_PASSWORD = 'password123'
DEFAULT_BCRYPT_PASSWORD = bcrypt.hashpw(DEFAULT_RAW_PASSWORD.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

# Thai First names and Last names pools for realistic mock generation
FIRST_NAMES = [
    "สมชาย", "วิชัย", "ธนพล", "กิตติพงษ์", "ประเสริฐ", "ณัฐวุฒิ", "สุรชัย", "เกรียงศักดิ์",
    "อนุชา", "ธีระพงษ์", "ปรีชา", "ชาญชัย", "วรวุฒิ", "พงษ์ศักดิ์", "ศิริชัย", "อดุลย์",
    "สมศักดิ์", "นฤเบศร์", "ภานุพงศ์", "ชัชวาล", "ศักดิ์ดา", "ยุทธนา", "เอกพล", "ธวัชชัย",
    "ศุภชัย", "พิชิต", "อัครเดช", "สกล", "ทินกร", "วีรยุทธ", "ชวลิต", "ดนัย",
    "กฤษณะ", "เฉลิมพล", "สุเมธ", "ไชยา", "อานนท์", "สุริยา", "นที", "ชัยพร",
    "ภานุวัฒน์", "วาริช", "ปฏิวัติ", "เจษฎา", "ธีรศักดิ์", "สหรัฐ", "พงศ์พิพัฒน์", "รณชัย",
    "พัทธดนย์", "ธนาคาร", "อภิสิทธิ์", "วสันต์", "มานพ", "สันติ", "ชเนษฎ์", "บุญส่ง"
]

LAST_NAMES = [
    "ทองดี", "สุขเกษม", "ใจกล้า", "รักไทย", "คงมั่น", "วงศ์สว่าง", "เจริญสุข", "สมบูรณ์",
    "รัตนมณี", "ชื่นบาน", "แสงธรรม", "เกียรติสกุล", "ศรีสมร", "ชัยชนะ", "จันทร์โอสถ", "มั่งคั่ง",
    "มิ่งขวัญ", "พิทักษ์ธรรม", "คุ้มภัย", "ศิริวัฒน์", "วงศ์สุวรรณ", "กุลเจริญ", "บุญเรือง", "อินทร์แก้ว",
    "พานิชย์กุล", "ประสิทธิ์โชค", "บุญเกิด", "ยอดดอย", "คำปัน", "วงค์ชัย", "สุขเจริญ", "แก้วมณี",
    "ศรีวิชัย", "เทพพิทักษ์", "บุญประเสริฐ", "เลิศชัย", "สุวรรณศรี", "นพคุณ", "รุ่งเรือง", "ชูจิตต์"
]

LOCATIONS_CHIANG_MAI = [
    ("ศูนย์การค้าเซ็นทรัลพลาซา เชียงใหม่ แอร์พอร์ต", "18.7698", "98.9754"),
    ("ศูนย์การประชุมและแสดงสินค้านานาชาติ เชียงใหม่ (CMECC)", "18.8267", "98.9612"),
    ("มหาวิทยาลัยเชียงใหม่ อาคารหอประชุมใหญ่", "18.7952", "98.9528"),
    ("มหาวิทยาลัยแม่โจ้ อาคารศูนย์กีฬาเฉลิมพระเกียรติ", "18.8955", "99.0116"),
    ("วัน นิมมาน (One Nimman) เชียงใหม่", "18.8001", "98.9682"),
    ("เชียงใหม่ ซาฟารี ยามค่ำคืน (Night Safari)", "18.7431", "98.9174"),
    ("สวนเฉลิมพระเกียรติ 80 พรรษา เชียงใหม่", "18.8315", "98.9634"),
    ("กาดสวนแก้ว เชียงใหม่", "18.7963", "98.9772"),
    ("โรงแรมแชงกรี-ลา เชียงใหม่ หอประชุมแกรนด์บอลรูม", "18.7803", "99.0019"),
    ("สนามกีฬาสมโภชเชียงใหม่ 700 ปี", "18.8378", "98.9593"),
    ("หอประชุมมหาวิทยาลัยพายัพ เขตแม่คาว", "18.7944", "99.0289"),
    ("ลานคนเมือง ตลาดจริงใจ มาร์เก็ต เชียงใหม่", "18.8062", "99.0011"),
    ("ศูนย์การค้าเมญ่า เชียงใหม่", "18.8021", "98.9673"),
    ("โครงการนิมมานพรอมเมนาดา สแควร์", "18.7628", "99.0345"),
    ("ห้างสรรพสินค้าโรบินสัน เชียงใหม่ แอร์พอร์ต", "18.7705", "98.9760"),
    ("ศูนย์ราชการจังหวัดเชียงใหม่ ลานกิจกรรม", "18.8392", "98.9715"),
    ("อนุสาวรีย์สามกษัตริย์ ลานกิจกรรมกลางแจ้ง", "18.7904", "98.9875"),
    ("ตลาดวโรรส (กาดหลวง) บริเวณรอบตลาด", "18.7901", "99.0006"),
    ("เชียงใหม่ ฮอลล์ ศูนย์การประชุม", "18.7692", "98.9749"),
    ("ประตูท่าแพ ลานจัดกิจกรรมวัฒนธรรม", "18.7877", "98.9931")
]

EVENT_TITLES = [
    ("มหกรรมดนตรีฤดูหนาว Lanna Music Fest 2026", "คอนเสิร์ตรวมศิลปินระดับประเทศ คาดผู้ร่วมงานกว่า 5,000 คน"),
    ("Chiang Mai IT & Tech Expo 2026", "งานแสดงสินค้าและนวัตกรรมเทคโนโลยีภาคเหนือ"),
    ("งานเกษตรแม่โจ้ ฟื้นฟูวิถีธรรมชาติ 2026", "งานแสดงนิทรรศการและจำหน่ายสินค้าทางการเกษตร"),
    ("เทศกาลอาหารและวัฒนธรรมล้านนานานาชาติ", "เทศกาลรวบรวมอาหารพื้นเมืองและสตรีทฟู้ดกว่า 100 บูธ"),
    ("CMU Book Fair มหกรรมหนังสือนานาชาติ", "งานจัดแสดงหนังสือและเสวนาวิชาการระดับมหาวิทยาลัย"),
    ("การแข่งขันวิ่งมาราธอน Chiang Mai City Run 2026", "การแข่งขันวิ่งมาราธอนผ่านจุดสำคัญรอบคูเมืองเชียงใหม่"),
    ("Motor Expo Chiang Mai 2026", "มหกรรมยานยนต์และอุปกรณ์ตกแต่งรถยนต์แห่งภาคเหนือ"),
    ("เทศกาลกาแฟและชาภาคเหนือ (Craft Coffee Fest)", "รวมผู้ประกอบการกาแฟดอยและชาพรีเมียมจากทั่วภาคเหนือ"),
    ("Northern Art & Craft Fair 2026", "มหกรรมจัดแสดงผลงานศิลปะ หัตถกรรม และดีไซน์ร่วมสมัย"),
    ("Chiang Mai eSports Championship 2026", "การแข่งขันอีสปอร์ตระดับเยาวชนและชิงแชมป์ภาคเหนือ"),
    ("คอนเสิร์ตการกุศลเพื่อลมหายใจเชียงใหม่", "เวทีคอนเสิร์ตระดมทุนสนับสนุนการอนุรักษ์ป่าไม้และสิ่งแวดล้อม"),
    ("มหกรรมสินค้า OTOP พรีเมียมล้านนา", "งานจำหน่ายสินค้าหนึ่งตำบลหนึ่งผลิตภัณฑ์ระดับ 5 ดาว"),
    ("เทศกาลภาพยนตร์สั้นและแอนิเมชันเชียงใหม่", "การฉายภาพยนตร์สั้นระดับนานาชาติและการเสวนาผู้กำกับ"),
    ("Chiang Mai Pet Expo งานเพื่อสัตว์เลี้ยงแสนรัก", "งานรวมสินค้าและบริการสำหรับสัตว์เลี้ยงและการประกวดสุนัข"),
    ("งานนิทรรศการภาพถ่าย มนต์เสน่ห์ล้านนา", "จัดแสดงภาพถ่ายประวัติศาสตร์และวิถีชีวิตชาวเหนือ"),
    ("งานประกวดวงโยธวาทิตระดับภาคเหนือ", "การประชันฝีมือดนตรีของเยาวชนจาก 8 จังหวัดภาคเหนือ"),
    ("Chiang Mai Wedding & Jewelry Fair", "งานแสดงชุดแต่งงาน เวดดิ้งสตูดิโอ และอัญมณีล้ำค่า"),
    ("เทศกาลโคมไฟล้านนาและประเพณีผางประทีป", "การแสดงศิลปวัฒนธรรมการจุดผางประทีปและปล่อยโคมสวยงาม"),
    ("มหกรรมการศึกษานานาชาติ Study Abroad Expo", "แนะแนวศึกษาต่อต่างประเทศจากสถาบันการศึกษาชั้นนำทั่วโลก"),
    ("งานฟุตบอลประเพณีสานสัมพันธ์เยาวชนภาคเหนือ", "การแข่งขันฟุตบอลกระชับมิตรของสถาบันอุดมศึกษาภาคเหนือ")
]

TOOLS_POOL = ["วิทยุสื่อสาร", "กระบองไฟจราจร", "ไฟฉายแรงสูง", "ชุดปฐมพยาบาล", "เครื่องสแกนโลหะ", "เสื้อสะท้อนแสง", "นกหวีด", "แผงกั้นจราจร"]

def generate_full_dataset():
    data = {
        "admins": [],
        "companies": [],
        "headguards": [],
        "guards": [],
        "events": [],
        "shifts": [],
        "assignments": [],
        "reports": []
    }

    # 1. Generate 3 Admins
    admin_specs = [
        ("admin_samart", "สามารถ", "คุ้มภัย", "0819928371", "เชียงใหม่", "หัวหน้าผู้ดูแลระบบรักษาความปลอดภัย"),
        ("admin_anchalee", "อัญชลี", "รักษ์แดน", "0828839201", "เชียงใหม่", "ผู้ดูแลระบบการจัดการฐานข้อมูลและสิทธิ์"),
        ("admin_kittisak", "กิตติศักดิ์", "พิทักษ์ไทย", "0837748291", "เชียงใหม่", "ผู้ดูแลระบบปฏิบัติการและการตรวจสอบ")
    ]
    for username, fname, lname, phone, addr, detail in admin_specs:
        data["admins"].append({
            "username": username,
            "password": DEFAULT_RAW_PASSWORD,
            "password_hash": DEFAULT_BCRYPT_PASSWORD,
            "first_name": fname,
            "last_name": lname,
            "phone": phone,
            "address": addr,
            "user_detail": detail,
            "start_date": "2026-08-01 09:00:00",
            "quit_date": None,
            "profile_img": "profile_admin.jpg"
        })

    # 2. Generate 5 Companies
    company_specs = [
        ("company_siamgroup", "บริษัท สยาม ซีเคียวริตี้ กรุ๊ป จำกัด", "0812345001", "123 ถ.ซุปเปอร์ไฮเวย์ อ.เมือง จ.เชียงใหม่", "บริการรักษาความปลอดภัยครบวงจรมาตรฐานสากล", "admin_samart"),
        ("company_cmguard", "บริษัท เชียงใหม่การ์ด โปรเทคชั่น จำกัด", "0812345002", "45/2 ถ.นิมมานเหมินท์ อ.เมือง จ.เชียงใหม่", "เชี่ยวชาญการดูแลงานอีเวนต์และคอนเสิร์ตขนาดใหญ่", "admin_samart"),
        ("company_lannasec", "บริษัท ล้านนา ซีเคียวริตี้ เซอร์วิส จำกัด", "0812345003", "88 หมู่ 3 ต.ช้างเผือก อ.เมือง จ.เชียงใหม่", "ผู้ให้บริการรปภ.และระบบรักษาความปลอดภัยระดับพรีเมียม", "admin_anchalee"),
        ("company_eagleeye", "บริษัท อีเกิ้ล อาย ซีเคียวริตี้ จำกัด", "0812345004", "102 ถ.มหิดล ต.ป่าแดด อ.เมือง จ.เชียงใหม่", "ทีมงานมืออาชีพพร้อมเทคโนโลยีตรวจจับความปลอดภัยล้ำสมัย", "admin_anchalee"),
        ("company_apexsafety", "บริษัท เอเปกซ์ เซฟตี้ เซอร์วิส จำกัด", "0812345005", "67/1 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่", "บริการรักษาความปลอดภัยระดับ VIP และงานกิจกรรมพิเศษ", "admin_kittisak")
    ]

    for username, comp_name, phone, addr, detail, admin_ref in company_specs:
        data["companies"].append({
            "username": username,
            "password": DEFAULT_RAW_PASSWORD,
            "password_hash": DEFAULT_BCRYPT_PASSWORD,
            "company_name": comp_name,
            "first_name": comp_name,
            "last_name": "-",
            "phone": phone,
            "address": addr,
            "user_detail": detail,
            "start_date": "2026-08-05 08:00:00",
            "quit_date": None,
            "profile_img": "default_company.png",
            "admin_name": admin_ref
        })

    # 3. Generate 25 Headguards (5 per company)
    # Each Headguard has 20 Guards with active status (quit_date = None)
    headguard_counter = 1
    guard_counter = 1

    for c_idx, comp in enumerate(data["companies"]):
        comp_name = comp["company_name"]
        comp_code = comp["username"].replace("company_", "")

        for h_idx in range(1, 6):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            hg_name = f"{fname} {lname}"
            hg_username = f"hg_{comp_code}_{h_idx:02d}"
            hg_phone = f"089{headguard_counter:07d}"[:10]
            headguard_counter += 1

            hg_obj = {
                "username": hg_username,
                "password": DEFAULT_RAW_PASSWORD,
                "password_hash": DEFAULT_BCRYPT_PASSWORD,
                "first_name": fname,
                "last_name": lname,
                "full_name": hg_name,
                "phone": hg_phone,
                "address": "เชียงใหม่ ประเทศไทย",
                "user_detail": f"หัวหน้าชุดปฏิบัติการ รปภ. ประจำ {comp_name}",
                "start_date": "2026-08-10 08:00:00",
                "quit_date": None, # Active
                "profile_img": "default_headguard.png",
                "company_name": comp_name,
                "performance_score": round(random.uniform(85.0, 99.0), 1),
                "company_username": comp["username"]
            }
            data["headguards"].append(hg_obj)

            # 4. Generate 20 active Guards for this Headguard
            for g_idx in range(1, 21):
                g_fname = random.choice(FIRST_NAMES)
                g_lname = random.choice(LAST_NAMES)
                g_username = f"gd_{comp_code}_h{h_idx}_{g_idx:02d}"
                g_phone = f"085{guard_counter:07d}"[:10]
                guard_counter += 1

                g_obj = {
                    "username": g_username,
                    "password": DEFAULT_RAW_PASSWORD,
                    "password_hash": DEFAULT_BCRYPT_PASSWORD,
                    "first_name": g_fname,
                    "last_name": g_lname,
                    "phone": g_phone,
                    "address": "เชียงใหม่ ประเทศไทย",
                    "user_detail": "เจ้าหน้าที่รักษาความปลอดภัย ผ่านการฝึกอบรมมาตรฐาน",
                    "start_date": "2026-08-12 08:00:00",
                    "quit_date": None, # Active status
                    "profile_img": "default_guard.png",
                    "company_name": comp_name,
                    "head_name": hg_name,
                    "headguard_username": hg_username,
                    "performance_score": round(random.uniform(75.0, 98.0), 1)
                }
                data["guards"].append(g_obj)

    # 5. Generate 20 Events
    # Distribution: 10 ONGOING (active - most), 4 PENDING, 4 COMPLETED, 2 CANCELLED
    # Period centered around current time (Sept 2026)
    event_statuses = (
        ["ONGOING"] * 10 +
        ["PENDING"] * 4 +
        ["COMPLETED"] * 4 +
        ["CANCELLED"] * 2
    )
    # Shuffle or order logically
    # Let's order them so ONGOING is prominent
    for ev_idx, (title, detail) in enumerate(EVENT_TITLES):
        status = event_statuses[ev_idx]
        loc_name, lat, lng = LOCATIONS_CHIANG_MAI[ev_idx]
        comp = data["companies"][ev_idx % len(data["companies"])]

        if status == "ONGOING":
            # Running across 2026-09-20
            start_d = CURRENT_DATE - datetime.timedelta(days=random.randint(2, 6))
            end_d = CURRENT_DATE + datetime.timedelta(days=random.randint(3, 8))
        elif status == "PENDING":
            # Upcoming late Sept / Oct
            start_d = CURRENT_DATE + datetime.timedelta(days=random.randint(3, 10))
            end_d = start_d + datetime.timedelta(days=random.randint(2, 5))
        elif status == "COMPLETED":
            # Finished recently
            end_d = CURRENT_DATE - datetime.timedelta(days=random.randint(3, 12))
            start_d = end_d - datetime.timedelta(days=random.randint(2, 5))
        else: # CANCELLED
            start_d = CURRENT_DATE - datetime.timedelta(days=4)
            end_d = CURRENT_DATE - datetime.timedelta(days=1)

        req_guards = random.choice([10, 15, 20, 25, 30])
        req_tools = random.sample(TOOLS_POOL, random.randint(2, 4))
        prov_tools = random.sample(TOOLS_POOL, random.randint(2, 3))

        event_obj = {
            "event_key": f"EVT_{ev_idx+1:02d}",
            "event_name": title,
            "event_detail": detail,
            "contractor": f"ผู้จัดงาน {title.split()[0]}",
            "contact": f"08{random.randint(10000000, 99999999)}",
            "location": loc_name,
            "latitude": lat,
            "longitude": lng,
            "start_date": str(start_d),
            "end_date": str(end_d),
            "status": status,
            "required_guards": req_guards,
            "event_img": "default.png",
            "company_username": comp["username"],
            "required_tools": req_tools,
            "provided_tools": prov_tools,
            "shifts": []
        }

        # Find headguards belonging to this company to lead shifts
        comp_hgs = [hg for hg in data["headguards"] if hg["company_username"] == comp["username"]]
        chosen_hg = comp_hgs[ev_idx % len(comp_hgs)]

        # Create 1-2 shifts for this event
        shift_date_str = str(start_d)
        s_time1 = f"{shift_date_str} 08:00:00.000000"
        e_time1 = f"{shift_date_str} 16:00:00.000000"
        s_date1 = f"{shift_date_str} 00:00:00.000000"

        shift1 = {
            "shift_key": f"SHIFT_{ev_idx+1:02d}_1",
            "shift_date": s_date1,
            "start_time": s_time1,
            "end_time": e_time1,
            "maximum_guards": req_guards // 2 if req_guards > 10 else req_guards,
            "headguard_username": chosen_hg["username"]
        }
        event_obj["shifts"].append(shift1)
        data["shifts"].append(shift1)

        if req_guards >= 15:
            s_time2 = f"{shift_date_str} 16:00:00.000000"
            e_time2 = f"{shift_date_str} 23:59:00.000000"
            shift2 = {
                "shift_key": f"SHIFT_{ev_idx+1:02d}_2",
                "shift_date": s_date1,
                "start_time": s_time2,
                "end_time": e_time2,
                "maximum_guards": req_guards // 2,
                "headguard_username": chosen_hg["username"]
            }
            event_obj["shifts"].append(shift2)
            data["shifts"].append(shift2)

        data["events"].append(event_obj)

    # 6. Generate 30 Assignments
    # Statuses: RESERVE (applied/waitlisted) and ASSIGNED (confirmed/working)
    # Linked to guards and shifts
    assignment_descriptions = [
        "ตรวจคัดกรองบุคคลและตรวจวัดสัมภาระ ประตู 1",
        "ดูแลความสงบเรียบร้อยบริเวณเวทีกลางและ backstage",
        "รักษาความปลอดภัยและจัดการการจราจร ลานจอดรถ VIP",
        "ตรวจตราความปลอดภัยทางหนีไฟและอุปกรณ์ดับเพลิง",
        "ประจำจุดประชาสัมพันธ์และรับแจ้งเหตุฉุกเฉิน",
        "เดินตรวจตราความปลอดภัยรอบอาคารจัดงาน โซน A",
        "ดูแลความปลอดภัยจุดลงทะเบียนและซุ้มจำหน่ายบัตร",
        "ควบคุมการเข้า-ออกพื้นที่ควบคุมเฉพาะเจ้าหน้าที่",
        "ลาดตระเวนสอดส่องและป้องกันการโจรกรรมทรัพย์สิน",
        "รอการมอบหมายจุดปฏิบัติการจากหัวหน้าชุด"
    ]

    # Select active shifts (from ONGOING events) first
    active_shifts = [s for e in data["events"] if e["status"] == "ONGOING" for s in e["shifts"]]
    all_shifts = [s for e in data["events"] for s in e["shifts"]]

    # Pick 30 distinct guards from the first 100 guards to assign
    sampled_guards = random.sample(data["guards"][:200], 30)

    for a_idx in range(30):
        # 15 ASSIGNED, 15 RESERVE
        status = "ASSIGNED" if a_idx < 15 else "RESERVE"
        guard = sampled_guards[a_idx]
        shift = active_shifts[a_idx % len(active_shifts)]
        desc = random.choice(assignment_descriptions)
        req_dt = CURRENT_TIME - datetime.timedelta(hours=random.randint(1, 48))

        assignment_obj = {
            "assignment_key": f"ASGN_{a_idx+1:02d}",
            "assignment_status": status,
            "description": desc if status == "ASSIGNED" else "รอการตอบรับและมอบหมายจุดปฏิบัติการ",
            "latitude": "18.8955",
            "longitude": "99.0116",
            "request_date": req_dt.strftime("%Y-%m-%d %H:%M:%S.000000"),
            "guard_username": guard["username"],
            "shift_key": shift["shift_key"],
            "headguard_username": shift["headguard_username"]
        }
        data["assignments"].append(assignment_obj)

    # 7. Generate 30 Reports
    report_types_normal = [
        ("ตรวจตราปกติ", "ตรวจตราพื้นที่รอบบริเวณเรียบร้อยดี ไม่พบสิ่งผิดปกติหรือเหตุการณ์น่าสงสัย"),
        ("ตรวจความพร้อมอุปกรณ์", "ตรวจสอบอุปกรณ์ดับเพลิง ทางหนีไฟ และระบบไฟฟ้าส่องสว่าง ใช้งานได้ปกติ"),
        ("ส่งมอบเวรปฏิบัติหน้าที่", "ส่งมอบผลการปฏิบัติงานและอุปกรณ์ประจำจุดให้กะถัดไปเรียบร้อยแล้ว"),
        ("สรุปยอดผู้เข้างานช่วงเช้า", "การจราจรทางเข้าคล่องตัว ยอดผู้เข้างานประมาณ 800 คน เหตุการณ์ปกติ")
    ]

    report_types_incident = [
        ("พบสิ่งกีดขวางทางหนีไฟ", "พบป้ายโฆษณาและสิ่งของวางขวางบริเวณประตูทางออกฉุกเฉิน แจ้งผู้จัดงานเคลื่อนย้ายแล้ว"),
        ("ทรัพย์สินสูญหาย/พบของตกหล่น", "พบกระเป๋าสตางค์ตกหล่นบริเวณที่นั่งแถว C ได้นำส่งศูนย์ประสานงานเพื่อตามหาเจ้าของ"),
        ("ผู้มาร่วมงานต้องการปฐมพยาบาล", "มีผู้เข้างานเป็นลมเนื่องจากอากาศร้อน ได้ประสานทีมแพทย์กู้ชีพเข้าปฐมพยาบาลเบื้องต้นแล้ว"),
        ("บุคคลไม่พกบัตรเข้าพื้นที่หวงห้าม", "พบบุคคลพยายามเข้าไปยังพื้นที่ backstage โดยไม่มีบัตร ได้เชิญออกไปยังโซนทั่วไปเรียบร้อย"),
        ("ระบบไฟฟ้าส่องสว่างขัดข้อง", "ไฟส่องสว่างลานจอดรถฝั่งทิศตะวันออกดับ 2 จุด ได้ประสานฝ่ายอาคารสถานที่เข้าแก้ไขด่วน"),
        ("อุบัติเหตุเฉี่ยวชนลานจอดรถ", "รถยนต์เฉี่ยวชนกันเล็กน้อยบริเวณทางออกลานจอดรถ เจ้าหน้าที่ช่วยอำนวยความสะดวกและไกล่เกลี่ยเรียบร้อย")
    ]

    for r_idx in range(30):
        is_normal = (r_idx < 18) # 18 normal, 12 incident reports
        if is_normal:
            rtype, rdesc = random.choice(report_types_normal)
            img = "report_normal.jpg"
        else:
            rtype, rdesc = random.choice(report_types_incident)
            img = f"incident_{random.randint(1, 4)}.jpg"

        assigned_entry = data["assignments"][r_idx]
        rep_time = CURRENT_TIME - datetime.timedelta(minutes=random.randint(10, 720))

        report_obj = {
            "report_key": f"REP_{r_idx+1:02d}",
            "is_normal": is_normal,
            "report_type": rtype,
            "report_desc": rdesc,
            "report_img": img,
            "report_time": rep_time.strftime("%Y-%m-%d %H:%M:%S.000000"),
            "guard_username": assigned_entry["guard_username"],
            "shift_key": assigned_entry["shift_key"]
        }
        data["reports"].append(report_obj)

    return data

def run_seed():
    print("=== Generating Seed Dataset ===")
    dataset = generate_full_dataset()

    os.makedirs("d:/workspace/FinalProject/demo_v1/mock_data", exist_ok=True)
    json_path = "d:/workspace/FinalProject/demo_v1/mock_data/seed_data.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Saved complete JSON dataset to {json_path}")
    print(f"Summary:")
    print(f"- Admins: {len(dataset['admins'])}")
    print(f"- Companies: {len(dataset['companies'])}")
    print(f"- Headguards: {len(dataset['headguards'])}")
    print(f"- Guards: {len(dataset['guards'])}")
    print(f"- Events: {len(dataset['events'])}")
    print(f"- Shifts: {len(dataset['shifts'])}")
    print(f"- Assignments: {len(dataset['assignments'])}")
    print(f"- Reports: {len(dataset['reports'])}")

    print("\n=== Connecting to MySQL sgm_db on port 3307 ===")
    conn = pymysql.connect(
        host='localhost',
        port=3307,
        user='root',
        password='1234',
        database='sgm_db',
        charset='utf8mb4',
        autocommit=False
    )

    try:
        with conn.cursor() as cur:
            # 1. Insert Admins
            admin_id_map = {}
            for adm in dataset["admins"]:
                # Check if username exists
                cur.execute("SELECT users_id FROM users WHERE username = %s", (adm["username"],))
                row = cur.fetchone()
                if row:
                    u_id = row[0]
                    print(f"Admin {adm['username']} already exists (id: {u_id})")
                else:
                    cur.execute("""
                        INSERT INTO users (address, first_name, last_name, password, phone, profile_img, quit_date, start_date, user_detail, username)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (adm["address"], adm["first_name"], adm["last_name"], adm["password_hash"], adm["phone"],
                          adm["profile_img"], adm["quit_date"], adm["start_date"], adm["user_detail"], adm["username"]))
                    u_id = cur.lastrowid
                    cur.execute("INSERT IGNORE INTO admin (users_id) VALUES (%s)", (u_id,))
                admin_id_map[adm["username"]] = u_id

            # 2. Insert Companies
            comp_id_map = {}
            for comp in dataset["companies"]:
                cur.execute("SELECT users_id FROM users WHERE username = %s", (comp["username"],))
                row = cur.fetchone()
                if row:
                    u_id = row[0]
                    print(f"Company {comp['username']} already exists (id: {u_id})")
                else:
                    cur.execute("""
                        INSERT INTO users (address, first_name, last_name, password, phone, profile_img, quit_date, start_date, user_detail, username)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (comp["address"], comp["first_name"], comp["last_name"], comp["password_hash"], comp["phone"],
                          comp["profile_img"], comp["quit_date"], comp["start_date"], comp["user_detail"], comp["username"]))
                    u_id = cur.lastrowid
                    cur.execute("""
                        INSERT IGNORE INTO company (users_id, company_name, admin_name)
                        VALUES (%s, %s, %s)
                    """, (u_id, comp["company_name"], comp["admin_name"]))
                comp_id_map[comp["username"]] = u_id

            # 3. Insert Headguards
            hg_id_map = {}
            for hg in dataset["headguards"]:
                cur.execute("SELECT users_id FROM users WHERE username = %s", (hg["username"],))
                row = cur.fetchone()
                if row:
                    u_id = row[0]
                else:
                    cur.execute("""
                        INSERT INTO users (address, first_name, last_name, password, phone, profile_img, quit_date, start_date, user_detail, username)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (hg["address"], hg["first_name"], hg["last_name"], hg["password_hash"], hg["phone"],
                          hg["profile_img"], hg["quit_date"], hg["start_date"], hg["user_detail"], hg["username"]))
                    u_id = cur.lastrowid
                    cur.execute("""
                        INSERT IGNORE INTO staff (users_id, performance_score)
                        VALUES (%s, %s)
                    """, (u_id, hg["performance_score"]))
                    cur.execute("""
                        INSERT IGNORE INTO head_guard (users_id, company_name)
                        VALUES (%s, %s)
                    """, (u_id, hg["company_name"]))
                hg_id_map[hg["username"]] = u_id

            print(f"Successfully inserted/verified {len(hg_id_map)} HeadGuards")

            # 4. Insert Guards
            guard_id_map = {}
            for g in dataset["guards"]:
                cur.execute("SELECT users_id FROM users WHERE username = %s", (g["username"],))
                row = cur.fetchone()
                if row:
                    u_id = row[0]
                else:
                    cur.execute("""
                        INSERT INTO users (address, first_name, last_name, password, phone, profile_img, quit_date, start_date, user_detail, username)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (g["address"], g["first_name"], g["last_name"], g["password_hash"], g["phone"],
                          g["profile_img"], g["quit_date"], g["start_date"], g["user_detail"], g["username"]))
                    u_id = cur.lastrowid
                    cur.execute("""
                        INSERT IGNORE INTO staff (users_id, performance_score)
                        VALUES (%s, %s)
                    """, (u_id, g["performance_score"]))
                    cur.execute("""
                        INSERT IGNORE INTO guards (users_id, company_name, head_name)
                        VALUES (%s, %s, %s)
                    """, (u_id, g["company_name"], g["head_name"]))
                guard_id_map[g["username"]] = u_id

            print(f"Successfully inserted/verified {len(guard_id_map)} Guards")

            # 5. Insert Events, Tools, and Shifts
            event_id_map = {}
            shift_id_map = {}
            for ev in dataset["events"]:
                comp_u_id = comp_id_map.get(ev["company_username"])
                cur.execute("""
                    INSERT INTO events (event_name, location, latitude, longitude, contractor, contact,
                                       event_detail, start_date, end_date, status, required_guards, event_img, company_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (ev["event_name"], ev["location"], ev["latitude"], ev["longitude"], ev["contractor"], ev["contact"],
                      ev["event_detail"], ev["start_date"], ev["end_date"], ev["status"], ev["required_guards"],
                      ev["event_img"], comp_u_id))
                e_id = cur.lastrowid
                event_id_map[ev["event_key"]] = e_id

                # Tools
                for tool in ev["required_tools"]:
                    cur.execute("INSERT IGNORE INTO events_required_tools (event_id, required_tools) VALUES (%s, %s)", (e_id, tool))
                for tool in ev["provided_tools"]:
                    cur.execute("INSERT IGNORE INTO events_provided_tools (event_id, provided_tools) VALUES (%s, %s)", (e_id, tool))

                # Shifts
                for sh in ev["shifts"]:
                    hg_u_id = hg_id_map.get(sh["headguard_username"])
                    cur.execute("""
                        INSERT INTO shift_time (end_time, maximum_guards, shift_date, start_time, event_id, head_guard_id, headguard_id, head_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (sh["end_time"], sh["maximum_guards"], sh["shift_date"], sh["start_time"], e_id, hg_u_id, hg_u_id, hg_u_id))
                    s_id = cur.lastrowid
                    shift_id_map[sh["shift_key"]] = s_id

            print(f"Successfully inserted {len(event_id_map)} Events and {len(shift_id_map)} Shifts")

            # 6. Insert Assignments
            asgn_count = 0
            for asgn in dataset["assignments"]:
                g_u_id = guard_id_map.get(asgn["guard_username"])
                s_id = shift_id_map.get(asgn["shift_key"])
                hg_u_id = hg_id_map.get(asgn["headguard_username"])

                cur.execute("""
                    INSERT INTO assignment (assignment_status, description, latitude, longitude, request_date, guard_id, head_id, shift_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (asgn["assignment_status"], asgn["description"], asgn["latitude"], asgn["longitude"],
                      asgn["request_date"], g_u_id, hg_u_id, s_id))
                asgn_count += 1

            print(f"Successfully inserted {asgn_count} Assignments")

            # 7. Insert Reports
            rep_count = 0
            for rep in dataset["reports"]:
                g_u_id = guard_id_map.get(rep["guard_username"])
                s_id = shift_id_map.get(rep["shift_key"])
                is_norm_bit = 1 if rep["is_normal"] else 0

                cur.execute("""
                    INSERT INTO report (is_normal, report_desc, report_img, report_time, report_type, shift_id, guard_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (is_norm_bit, rep["report_desc"], rep["report_img"], rep["report_time"], rep["report_type"], s_id, g_u_id))
                rep_count += 1

            print(f"Successfully inserted {rep_count} Reports")

        conn.commit()
        print("\nAll records committed successfully to sgm_db!")

    except Exception as e:
        conn.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_seed()

