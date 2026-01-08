import requests
import re
from datetime import datetime

# ==========================================
# 1. 설정
# ==========================================
HTML_FILE = "index.html"  # 당신의 메인 파일명 (만약 이름이 다르면 여기서 수정하세요)

# ==========================================
# 2. 현재 웹사이트에 적힌 '최신 회차' 알아내기
# ==========================================
def get_current_round_from_html():
    try:
        with open(HTML_FILE, "r", encoding="utf-8") as f:
            content = f.read()
            # "const LATEST_ROUND = 1205;" 같은 부분을 찾음
            match = re.search(r'const LATEST_ROUND\s*=\s*(\d+);', content)
            if match:
                return int(match.group(1))
    except Exception as e:
        print(f"⚠️ HTML 파일 읽기 실패: {e}")
    return 0

# ==========================================
# 3. 동행복권 공식 사이트에서 '다음 회차' 정보 가져오기
# ==========================================
def fetch_lotto_data(round_num):
    # 동행복권 공식 API URL
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={round_num}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        # 'returnValue'가 success면 추첨 결과가 나온 것
        if data.get("returnValue") == "success":
            return {
                "round": data["drwNo"],
                "date": data["drwNoDate"],
                "numbers": [
                    data["drwtNo1"], data["drwtNo2"], data["drwtNo3"],
                    data["drwtNo4"], data["drwtNo5"], data["drwtNo6"],
                    data["bnusNo"] # 보너스 번호
                ]
            }
    except Exception as e:
        print(f"⚠️ API 요청 실패: {e}")
    return None

# ==========================================
# 4. HTML 파일 고쳐쓰기 (수술 집도)
# ==========================================
def update_html(new_data):
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # (1) 새 데이터 준비
    new_round = new_data['round']
    raw_date = new_data['date'] # "2025-01-11" 형식
    
    # 날짜를 "2025년 1월 11일" 형식으로 예쁘게 바꿈
    dt = datetime.strptime(raw_date, "%Y-%m-%d")
    formatted_date = f"{dt.year}년 {dt.month}월 {dt.day}일"
    
    new_nums = new_data['numbers'] # [1, 2, 3, 4, 5, 6, 7]

    # (2) 내용 교체 (정규표현식 활용)
    
    # 회차 수정: const LATEST_ROUND = 1205; -> 1206;
    content = re.sub(r'const LATEST_ROUND\s*=\s*\d+;', f'const LATEST_ROUND = {new_round};', content)
    
    # 날짜 수정: const LATEST_DATE = "..."; -> "새 날짜";
    content = re.sub(r'const LATEST_DATE\s*=\s*".*?";', f'const LATEST_DATE  = "{formatted_date}";', content)
    
    # 번호 배열 추가: const PAST_WINNERS = [ 바로 뒤에 새 번호 줄 추가
    # 새 번호 줄 예시: [1, 2, 3, 4, 5, 6, 7],
    new_line = f"\n    {str(new_nums)}," 
    
    # 마커(PAST_WINNERS = [)를 찾아서 그 뒤에 새 줄을 끼워넣음
    content = re.sub(r'(const PAST_WINNERS\s*=\s*\[)', f'\g<1>{new_line}', content)

    # (3) 파일 저장
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"✅ 업데이트 성공! {new_round}회차 ({formatted_date}) 반영 완료.")

# ==========================================
# 메인 실행
# ==========================================
if __name__ == "__main__":
    # 1. 현재 우리 사이트가 몇 회차인지 확인
    current_round = get_current_round_from_html()
    print(f"ℹ️ 현재 웹사이트 회차: {current_round}회")
    
    if current_round == 0:
        print("❌ HTML 파일에서 회차 정보를 찾을 수 없습니다. (마커 확인 필요)")
        exit()

    # 2. 다음 회차(현재+1)가 발표됐는지 확인
    next_round = current_round + 1
    print(f"🔍 {next_round}회차 당첨번호 조회 중...")
    
    lotto_data = fetch_lotto_data(next_round)
    
    # 3. 결과에 따라 업데이트 수행
    if lotto_data:
        print(f"🎉 와우! {next_round}회차 결과가 나왔습니다. 업데이트를 시작합니다.")
        update_html(lotto_data)
    else:
        print(f"⏳ 아직 {next_round}회차 추첨 전이거나 발표되지 않았습니다.")
