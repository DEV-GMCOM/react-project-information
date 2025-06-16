# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).














# =================================================================
# 여기서부터는 내가 생성 by longjaw
##
##

#!/bin/bash

# ERP Information Module - 기존 환경 기반 설정 스크립트

echo "🚀 ERP Information Module 설정 시작..."
echo "기존 프로젝트 디렉토리를 활용하여 설정합니다."

# 경로 설정
BACKEND_DIR="/Users/gmc-mc-001/DEV/PycharmProjects/fastapi-project-for-erp-information"
FRONTEND_DIR="/Users/gmc-mc-001/DEV/WebstormProjects/react-information-test"

echo "📁 프로젝트 경로:"
echo "  백엔드: $BACKEND_DIR"
echo "  프론트엔드: $FRONTEND_DIR"

# =================================================================
# 1. 백엔드 프로젝트 구조 설정
# =================================================================

echo ""
echo "🐍 백엔드 프로젝트 설정..."

# 백엔드 디렉토리로 이동
cd "$BACKEND_DIR"

# 기본 구조 생성 (이미 있는 경우 스킵)
mkdir -p app/{routers,services,models,database,config,utils}
mkdir -p scripts
mkdir -p uploads

echo "✅ 백엔드 디렉토리 구조 생성 완료"

# main.py 생성 (기존 파일이 있다면 백업)
if [ -f "app/main.py" ]; then
echo "⚠️  기존 main.py 발견 - main.py.backup으로 백업"
cp app/main.py app/main.py.backup
fi

cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config.settings import settings
from app.database.connection import test_db_connection
from app.routers import dashboard, company, hr, project

@asynccontextmanager
async def lifespan(app: FastAPI):
# 시작 시 실행
print("🚀 ERP Information Module 서버 시작...")

    # 데이터베이스 연결 테스트
    connection_ok = await test_db_connection()
    if not connection_ok:
        print("❌ 데이터베이스 연결 실패!")
        print("💡 데이터베이스 설정을 확인하세요.")
    else:
        print("✅ 데이터베이스 연결 성공!")
    
    print("✅ 서버 준비 완료!")
    yield
    
    # 종료 시 실행
    print("🔄 서버 종료 중...")

# FastAPI 앱 생성
app = FastAPI(
title="ERP Information Module API",
description="업체정보, 인적자원, 프로젝트 관리 시스템",
version="1.0.0",
lifespan=lifespan
)

# CORS 설정
app.add_middleware(
CORSMiddleware,
allow_origins=settings.allowed_origins,
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

# 라우터 등록
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(company.router, prefix="/api/company", tags=["Company"])
app.include_router(hr.router, prefix="/api/hr", tags=["Human Resources"])
app.include_router(project.router, prefix="/api/project", tags=["Project"])

@app.get("/")
async def root():
return {
"message": "ERP Information Module API",
"status": "running",
"version": "1.0.0",
"endpoints": {
"docs": "/docs",
"redoc": "/redoc",
"health": "/health"
}
}

@app.get("/health")
async def health_check():
try:
db_ok = await test_db_connection()
return {
"status": "healthy" if db_ok else "unhealthy",
"database": "connected" if db_ok else "disconnected",
"service": "ERP Information Module"
}
except Exception as e:
return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
print("🚀 개발 서버를 시작합니다...")
print(f"📍 URL: http://{settings.host}:{settings.port}")
print(f"📖 API 문서: http://{settings.host}:{settings.port}/docs")

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
EOF

# requirements.txt 생성
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.13.1
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
psycopg2-binary==2.9.9
pandas==2.1.4
openpyxl==3.1.2
xlrd==2.0.1
EOF

# config/settings.py 생성
mkdir -p app/config
cat > app/config/settings.py << 'EOF'
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
model_config = SettingsConfigDict(
env_file=".env",
env_file_encoding="utf-8",
case_sensitive=False,
extra="ignore"
)

    # 서버 설정 (기존 ERP와 포트 구분)
    host: str = "127.0.0.1"
    port: int = 8001  # 기존 8000과 구분
    debug: bool = True
    
    # 환경 구분
    environment: str = "development"
    
    # 데이터베이스 설정
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "your_username"
    db_password: str = "your_password"
    db_name: str = "your_database"
    db_schema: str = "information_test"  # 새로운 스키마

    @property
    def allowed_origins(self) -> List[str]:
        origins_str = os.getenv("ALLOWED_ORIGINS")
        if not origins_str:
            if self.environment == "production":
                raise ValueError("ALLOWED_ORIGINS must be set for production")
            else:
                return [
                    "http://localhost:3001",  # React Information 앱
                    "http://127.0.0.1:3001",
                    "http://localhost:3000",  # 기존 React 앱과 호환
                    "http://127.0.0.1:3000"
                ]
        return [origin.strip() for origin in origins_str.split(",")]

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

settings = Settings()

# 현재 설정 출력 함수
def print_current_settings():
print("=== ERP Information Module 설정 ===")
print(f"환경: {settings.environment}")
print(f"서버: {settings.host}:{settings.port}")
print(f"데이터베이스: {settings.db_user}@{settings.db_host}:{settings.db_port}/{settings.db_name}")
print(f"스키마: {settings.db_schema}")
print(f"디버그 모드: {settings.debug}")
print(f"허용된 Origin: {settings.allowed_origins}")
print("=" * 40)
EOF

# .env.example 파일 생성
cat > .env.example << 'EOF'
# ERP Information Module 환경변수 설정

# 데이터베이스 설정 (기존 ERP 데이터베이스 사용)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_SCHEMA=information_test

# 서버 설정
HOST=127.0.0.1
PORT=8001
DEBUG=true
ENVIRONMENT=development

# CORS 설정 (React Information 앱)
ALLOWED_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
EOF

echo "📝 .env.example 파일이 생성되었습니다."
echo "💡 .env 파일을 생성하고 데이터베이스 정보를 입력하세요:"
echo "   cp .env.example .env"
echo "   nano .env"

# =================================================================
# 2. 프론트엔드 프로젝트 설정
# =================================================================

echo ""
echo "⚛️  프론트엔드 프로젝트 설정..."

# 프론트엔드 디렉토리로 이동
cd "$FRONTEND_DIR"

# React 프로젝트가 없다면 생성
if [ ! -f "package.json" ]; then
echo "📦 새로운 React 프로젝트를 생성합니다..."
npx create-react-app . --template typescript
else
echo "✅ 기존 React 프로젝트 발견"
fi

# 필요한 의존성 추가
echo "📦 필요한 npm 패키지 설치..."
npm install --save \
react-router-dom \
axios \
recharts

npm install --save-dev \
@types/react-router-dom

# .env 파일 생성
cat > .env << 'EOF'
# React Information Module 환경변수
PORT=3001
REACT_APP_API_URL=http://localhost:8001/api
REACT_APP_BASE_PATH=/information
GENERATE_SOURCEMAP=false
EOF

# package.json의 scripts 수정
echo "📝 package.json scripts 업데이트..."
npm pkg set scripts.start="PORT=3001 react-scripts start"
npm pkg set scripts.dev="PORT=3001 react-scripts start"
npm pkg set homepage="/information"

# 기본 src 구조 생성
mkdir -p src/{components/{common,dashboard,company,hr,project},pages/{company,hr,project},services,utils,styles,assets}

echo "✅ 프론트엔드 프로젝트 설정 완료"

# =================================================================
# 3. 데이터베이스 설정 스크립트 생성
# =================================================================

echo ""
echo "🗄️  데이터베이스 설정 스크립트 생성..."

cd "$BACKEND_DIR"

# 데이터베이스 초기화 스크립트 생성
cat > scripts/setup_database.py << 'EOF'
#!/usr/bin/env python3
"""
ERP Information Module 데이터베이스 초기 설정 스크립트
기존 데이터베이스에 새로운 스키마를 추가합니다.
"""
import asyncio
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.settings import settings
import asyncpg
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def setup_database():
"""데이터베이스 초기 설정"""
print("🚀 ERP Information Module 데이터베이스 설정 시작...")
print(f"📍 대상 DB: {settings.db_host}:{settings.db_port}/{settings.db_name}")
print(f"📍 스키마: {settings.db_schema}")

    try:
        # PostgreSQL 연결
        conn = await asyncpg.connect(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            database=settings.db_name
        )
        
        print("✅ 데이터베이스 연결 성공")
        
        # 1. 스키마 생성
        print("1. 스키마 생성...")
        await conn.execute(f"CREATE SCHEMA IF NOT EXISTS {settings.db_schema}")
        print(f"✅ 스키마 '{settings.db_schema}' 생성 완료")
        
        # 2. 권한 설정
        print("2. 권한 설정...")
        await conn.execute(f"GRANT ALL PRIVILEGES ON SCHEMA {settings.db_schema} TO {settings.db_user}")
        
        # 3. 테이블 생성
        print("3. 테이블 생성...")
        
        # 업체 테이블
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {settings.db_schema}.companies (
                id SERIAL PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL,
                business_number VARCHAR(50) UNIQUE,
                industry VARCHAR(100),
                address TEXT,
                phone VARCHAR(50),
                email VARCHAR(255),
                website VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 직원 테이블
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {settings.db_schema}.employees (
                id SERIAL PRIMARY KEY,
                employee_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                department VARCHAR(100),
                position VARCHAR(100),
                email VARCHAR(255),
                phone VARCHAR(50),
                hire_date DATE,
                birth_date DATE,
                address TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 프로젝트 테이블
        await conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {settings.db_schema}.projects (
                id SERIAL PRIMARY KEY,
                project_code VARCHAR(50) UNIQUE NOT NULL,
                project_name VARCHAR(255) NOT NULL,
                description TEXT,
                start_date DATE,
                end_date DATE,
                status VARCHAR(50) DEFAULT 'planning',
                budget DECIMAL(15,2),
                company_id INTEGER REFERENCES {settings.db_schema}.companies(id),
                manager_id INTEGER REFERENCES {settings.db_schema}.employees(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 4. 인덱스 생성
        print("4. 인덱스 생성...")
        indexes = [
            f"CREATE INDEX IF NOT EXISTS idx_companies_name ON {settings.db_schema}.companies(company_name)",
            f"CREATE INDEX IF NOT EXISTS idx_companies_business_number ON {settings.db_schema}.companies(business_number)",
            f"CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON {settings.db_schema}.employees(employee_id)",
            f"CREATE INDEX IF NOT EXISTS idx_employees_name ON {settings.db_schema}.employees(name)",
            f"CREATE INDEX IF NOT EXISTS idx_employees_department ON {settings.db_schema}.employees(department)",
            f"CREATE INDEX IF NOT EXISTS idx_projects_code ON {settings.db_schema}.projects(project_code)",
            f"CREATE INDEX IF NOT EXISTS idx_projects_name ON {settings.db_schema}.projects(project_name)",
            f"CREATE INDEX IF NOT EXISTS idx_projects_status ON {settings.db_schema}.projects(status)"
        ]
        
        for index_sql in indexes:
            await conn.execute(index_sql)
        
        # 5. 권한 재설정
        await conn.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {settings.db_schema} TO {settings.db_user}")
        await conn.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {settings.db_schema} TO {settings.db_user}")
        
        # 6. 샘플 데이터 삽입 (선택사항)
        print("5. 샘플 데이터 확인...")
        count = await conn.fetchval(f"SELECT COUNT(*) FROM {settings.db_schema}.companies")
        
        if count == 0:
            print("6. 샘플 데이터 삽입...")
            await insert_sample_data(conn)
        else:
            print("✅ 기존 데이터가 있어 샘플 데이터 삽입을 건너뜁니다.")
        
        await conn.close()
        print("✅ 데이터베이스 설정 완료!")
        return True
        
    except Exception as e:
        print(f"❌ 데이터베이스 설정 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

async def insert_sample_data(conn):
"""샘플 데이터 삽입"""
try:
# 샘플 업체
await conn.execute(f"""
INSERT INTO {settings.db_schema}.companies
(company_name, business_number, industry, phone, email, address) VALUES
('테크놀로지 주식회사', '123-45-67890', 'IT', '02-1234-5678', 'contact@tech.com', '서울시 강남구 테헤란로 123'),
('제조업체 코퍼레이션', '234-56-78901', '제조업', '02-2345-6789', 'info@manufacture.com', '경기도 성남시 분당구 정자동 456'),
('서비스 솔루션', '345-67-89012', '서비스업', '02-3456-7890', 'hello@service.com', '서울시 서초구 서초대로 789')
""")

        # 샘플 직원
        await conn.execute(f"""
            INSERT INTO {settings.db_schema}.employees 
            (employee_id, name, department, position, email, phone, hire_date, status) VALUES
            ('EMP001', '김철수', '개발팀', '팀장', 'kim@company.com', '010-1234-5678', '2023-01-15', 'active'),
            ('EMP002', '이영희', '마케팅팀', '대리', 'lee@company.com', '010-2345-6789', '2023-03-01', 'active'),
            ('EMP003', '박민수', '영업팀', '과장', 'park@company.com', '010-3456-7890', '2022-12-01', 'active'),
            ('EMP004', '정수연', '개발팀', '주임', 'jung@company.com', '010-4567-8901', '2023-06-15', 'active'),
            ('EMP005', '최동진', 'HR팀', '팀장', 'choi@company.com', '010-5678-9012', '2022-08-01', 'active')
        """)
        
        # 샘플 프로젝트
        await conn.execute(f"""
            INSERT INTO {settings.db_schema}.projects 
            (project_code, project_name, description, start_date, end_date, status, budget, company_id, manager_id) VALUES
            ('PRJ001', 'ERP 시스템 구축', '전사 ERP 시스템 개발 및 구축', '2024-01-01', '2024-12-31', 'active', 500000000, 1, 1),
            ('PRJ002', '마케팅 캠페인', '2024년 브랜드 마케팅 캠페인', '2024-03-01', '2024-11-30', 'active', 100000000, 2, 2),
            ('PRJ003', '품질관리 시스템', '제조 품질관리 시스템 도입', '2024-02-15', '2024-08-31', 'planning', 200000000, 2, 3),
            ('PRJ004', '고객서비스 개선', '고객 만족도 향상 프로젝트', '2024-01-15', '2024-06-30', 'completed', 50000000, 3, 5)
        """)
        
        print("✅ 샘플 데이터 삽입 완료")
        
    except Exception as e:
        print(f"⚠️  샘플 데이터 삽입 실패: {e}")

if __name__ == "__main__":
print("ERP Information Module - Database Setup")
print("=" * 50)
print(f"데이터베이스: {settings.db_host}:{settings.db_port}/{settings.db_name}")
print(f"스키마: {settings.db_schema}")
print(f"사용자: {settings.db_user}")
print("=" * 50)

    # 사용자 확인
    response = input("계속 진행하시겠습니까? (y/N): ")
    if response.lower() != 'y':
        print("설정을 취소했습니다.")
        sys.exit(0)
    
    # 데이터베이스 설정 실행
    success = asyncio.run(setup_database())
    
    if success:
        print("\n🎉 데이터베이스 설정이 완료되었습니다!")
        print("\n다음 단계:")
        print("1. 백엔드 서버 실행: python app/main.py")
        print("2. 프론트엔드 서버 실행: npm start")
        print("3. 브라우저에서 확인: http://localhost:3001/information")
    else:
        print("\n❌ 데이터베이스 설정에 실패했습니다.")
        print("로그를 확인하고 설정을 다시 확인해주세요.")
        sys.exit(1)
EOF

# 실행 권한 부여
chmod +x scripts/setup_database.py

# =================================================================
# 4. Nginx 설정 정보 출력
# =================================================================

echo ""
echo "🌐 Nginx 설정 안내..."

echo "기존 Nginx 설정에 다음 내용을 추가하세요:"

cat << 'EOF'

# ERP Information Module 설정 추가
# /etc/nginx/sites-available/default 또는 기존 설정 파일에 추가

# Information 모듈 프론트엔드 (포트 3001)
location /information {
proxy_pass http://127.0.0.1:3001;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

    # React Router 지원
    try_files $uri $uri/ /information/index.html;
}

# Information 모듈 API (포트 8001)
location /api/information {
rewrite ^/api/information/(.*) /api/$1 break;
proxy_pass http://127.0.0.1:8001;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
}

EOF

# =================================================================
# 5. 실행 가이드 출력
# =================================================================

echo ""
echo "🎉 ERP Information Module 설정 완료!"
echo ""
echo "📋 다음 단계를 진행하세요:"
echo ""
echo "1️⃣  백엔드 환경변수 설정:"
echo "   cd $BACKEND_DIR"
echo "   cp .env.example .env"
echo "   nano .env  # 데이터베이스 정보 입력"
echo ""
echo "2️⃣  가상환경 생성 및 의존성 설치:"
echo "   cd $BACKEND_DIR"
echo "   python -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo ""
echo "3️⃣  데이터베이스 초기화:"
echo "   cd $BACKEND_DIR"
echo "   python scripts/setup_database.py"
echo ""
echo "4️⃣  백엔드 서버 실행:"
echo "   cd $BACKEND_DIR"
echo "   python app/main.py"
echo ""
echo "5️⃣  프론트엔드 서버 실행 (새 터미널):"
echo "   cd $FRONTEND_DIR"
echo "   npm start"
echo ""
echo "6️⃣  확인:"
echo "   • 백엔드: http://localhost:8001"
echo "   • API 문서: http://localhost:8001/docs"
echo "   • 프론트엔드: http://localhost:3001/information"
echo ""
echo "7️⃣  Nginx 설정 (선택사항):"
echo "   위에 출력된 Nginx 설정을 기존 설정 파일에 추가"
echo ""
echo "🔧 트러블슈팅:"
echo "   • .env 파일의 데이터베이스 정보 확인"
echo "   • PostgreSQL 서비스 실행 상태 확인"
echo "   • 포트 충돌 확인 (8001, 3001)"
echo ""






